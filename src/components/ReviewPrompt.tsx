import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { getContacted, removeContacted, snoozeContacted, type Contacted } from '../lib/contacted'
import { btnPrimary, btnSecondary } from '../lib/ui'

// Asks "Did you hire X?" after someone returns from calling a worker.
export default function ReviewPrompt() {
  const { session } = useAuth()
  const { t } = useI18n()
  const [entry, setEntry] = useState<Contacted | null>(null)
  const [step, setStep] = useState<'ask' | 'rate' | 'done'>('ask')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const check = useCallback(() => {
    const now = Date.now()
    const e = getContacted().find(x => now - x.at > 20_000 && (!x.snooze || x.snooze < now))
    setEntry(prev => prev ?? e ?? null)
  }, [])
  useEffect(() => {
    check()
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis); window.addEventListener('focus', check)
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', check) }
  }, [check])

  if (!entry) return null
  const close = () => { setEntry(null); setStep('ask'); setRating(0); setComment(''); setErr(null) }
  async function submit() {
    if (!session || !entry) return
    if (rating < 1) return setErr('Tap a star to rate.')
    setBusy(true); setErr(null)
    await supabase.from('contact_clicks').upsert({ customer_id: session.user.id, worker_id: entry.worker_id }, { onConflict: 'customer_id,worker_id' })
    const { error } = await supabase.from('reviews').insert({ reviewer_id: session.user.id, reviewee_id: entry.worker_id, rating, comment: comment.trim() || null, source: 'contact' })
    setBusy(false)
    if (error && error.code !== '23505') return setErr('Could not send your rating. Please try again.')
    removeContacted(entry.worker_id); setStep('done'); setTimeout(close, 1800)
  }

  return (
    <div role="dialog" aria-label={t('rv.q').replace('{name}', entry.name)} className="pop fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-40 mx-auto max-w-md rounded-3xl border border-line bg-white p-5 shadow-[0_20px_50px_-12px_rgba(15,23,42,.35)] md:bottom-6">
      {step === 'done' ? <p role="status" className="py-2 text-center text-lg font-semibold">{t('rv.thanks')}</p> : <>
        <p className="text-lg font-bold leading-tight">{t('rv.q').replace('{name}', entry.name)}</p>
        <p className="mt-0.5 text-sm text-muted">{entry.service}</p>
        {step === 'ask' && <div className="mt-4 flex gap-2">
          <button onClick={() => setStep('rate')} className={`${btnPrimary} flex-1`}>{t('rv.yes')}</button>
          <button onClick={() => { snoozeContacted(entry.worker_id, 86_400_000); close() }} className={`${btnSecondary} flex-1`}>{t('rv.later')}</button>
          <button onClick={() => { removeContacted(entry.worker_id); close() }} className={`${btnSecondary} px-4`}>{t('rv.no')}</button></div>}
        {step === 'rate' && (session ? <div className="mt-4 space-y-3">
          <div role="group" aria-label={t('rv.tap')} className="flex justify-between">{[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" aria-pressed={rating === n} aria-label={`${n} / 5`} onClick={() => setRating(n)} className="grid size-12 place-items-center rounded-full transition active:scale-90">
              <Star size={32} strokeWidth={1.6} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted'} aria-hidden /></button>))}</div>
          <input name="comment" autoComplete="off" maxLength={300} value={comment} onChange={e => setComment(e.target.value)} placeholder={t('rv.comment')} className="min-h-11 w-full rounded-xl border border-line px-3.5 text-base" />
          {err && <p role="alert" className="text-sm text-error">{err}</p>}
          <button disabled={busy} onClick={submit} className={`${btnPrimary} w-full`}>{busy ? '…' : t('rv.send')}</button></div>
          : <Link to="/signin" className={`${btnPrimary} mt-4 w-full`}>{t('rv.signin')}</Link>)}
      </>}
    </div>)
}
