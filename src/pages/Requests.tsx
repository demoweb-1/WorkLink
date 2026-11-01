import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import { btnPrimary, btnSecondary, cardCls, inputCls } from '../lib/ui'
import AlertsCard from '../components/AlertsCard'

type Req = { id: string; district: string; location: string | null; photo_path: string | null; voice_path: string | null; note: string | null; created_at: string; service_categories: { name: string; slug: string; icon_name: string | null } | null }
const ago = (iso: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d` }
const big = 'inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-semibold active:scale-[0.97]'

// Worker view: requests that match this worker's services and districts. Say yes or no; the customer's number appears only after yes.
export default function Requests() {
  const { session } = useAuth()
  const { t, catName } = useI18n()
  const [items, setItems] = useState<Req[] | null>(null)
  const [mine, setMine] = useState<Record<string, string>>({})
  const [media, setMedia] = useState<Record<string, string>>({})
  const [phones, setPhones] = useState<Record<string, string>>({})
  const [price, setPrice] = useState<Record<string, string>>({})
  const [hasService, setHasService] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    const [r, s, m] = await Promise.all([
      supabase.from('quick_requests').select('id,district,location,photo_path,voice_path,note,created_at,service_categories(name,slug,icon_name)').eq('status', 'open').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(30),
      supabase.from('worker_services').select('id', { count: 'exact', head: true }).eq('worker_id', session!.user.id).eq('is_active', true),
      supabase.from('request_responses').select('request_id,response')])
    if (r.error) return setError('Could not load requests. Check your connection and try again.')
    setError(null); setItems((r.data ?? []) as unknown as Req[]); setHasService((s.count ?? 0) > 0)
    const rows = (r.data ?? []) as unknown as Req[]
    const paths = rows.flatMap(q => [q.photo_path, q.voice_path]).filter((x): x is string => Boolean(x))
    if (paths.length) { const { data: signed } = await supabase.storage.from('request-media').createSignedUrls(paths, 3600); setMedia(Object.fromEntries((signed ?? []).filter(x => x.path && x.signedUrl).map(x => [x.path as string, x.signedUrl as string]))) }
    setMine(Object.fromEntries(((m.data ?? []) as { request_id: string; response: string }[]).map(x => [x.request_id, x.response])))
  }, [session])
  useEffect(() => {
    load(); const id = setInterval(load, 60_000)
    const vis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [load])
  async function respond(id: string, response: 'accept' | 'decline') {
    const p = Number(price[id]); const { error } = await supabase.rpc('respond_to_request', { p_request_id: id, p_response: response, p_price: response === 'accept' && p > 0 ? p : null })
    if (error) setError('Could not send your answer. The request may be closed.'); else load()
  }
  async function reveal(id: string) { const { data } = await supabase.rpc('request_contact', { p_request_id: id }); if (data) setPhones(p => ({ ...p, [id]: data as string })) }
  const visible = (items ?? []).filter(q => mine[q.id] !== 'decline')
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold tracking-tight">{t('wr.title')}</h1>
      <div className="mt-4"><AlertsCard /></div>
      <div className="mt-6 space-y-4" aria-live="polite">
        {error && <p role="alert" className="text-error">{error}</p>}
        {!error && !items && [0, 1].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl bg-subtle" />)}
        {items && !hasService && <div className={`${cardCls} p-5`}><p className="text-lg">{t('wr.setup')}</p><Link to="/my-services" className={`${btnPrimary} mt-4`}>{t('wr.setupbtn')}</Link></div>}
        {items && hasService && visible.length === 0 && <p className="rounded-2xl bg-subtle p-5 text-lg">{t('wr.none')}</p>}
        {visible.map((q, i) => { const Icon = iconFor(q.service_categories?.icon_name ?? null); const yes = mine[q.id] === 'accept'; const phone = phones[q.id]; return (
          <article key={q.id} style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }} className={`${cardCls} pop p-4`}>
            <div className="flex items-center gap-3"><span className="app-icon grid size-12 shrink-0 place-items-center"><Icon size={24} aria-hidden /></span>
              <div className="min-w-0"><p className="text-lg font-semibold">{catName(q.service_categories?.slug ?? '', q.service_categories?.name ?? '')}</p>
                <p className="text-muted">{[q.location, q.district].filter(Boolean).join(', ')} · {ago(q.created_at)} {t('wr.ago')}</p></div></div>
            {q.note && <p className="mt-3 text-lg">{q.note}</p>}
            {q.photo_path && media[q.photo_path] && <a href={media[q.photo_path]} target="_blank" rel="noopener noreferrer" aria-label={t('wr.photo')}><img src={media[q.photo_path]} alt="" loading="lazy" className="mt-3 max-h-56 w-full rounded-2xl object-cover" /></a>}
            {q.voice_path && media[q.voice_path] && <audio controls src={media[q.voice_path]} className="mt-3 w-full" />}
            {!yes ? <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium">{t('wr.price')}<input inputMode="numeric" name="price" autoComplete="off" value={price[q.id] ?? ''} onChange={e => setPrice(p => ({ ...p, [q.id]: e.target.value }))} className={`${inputCls} !min-h-12`} /></label>
              <div className="flex gap-2"><button onClick={() => respond(q.id, 'accept')} className={`${big} bg-action text-on-action`}>{t('wr.yes')}</button>
                <button onClick={() => respond(q.id, 'decline')} className={`${big} border border-line bg-white`}>{t('wr.no')}</button></div></div>
              : <div className="mt-4 space-y-3"><p role="status" className="font-semibold text-success">{t('wr.said')}</p>
                {phone ? <div className="flex gap-2"><a href={`tel:${phone}`} className={`${big} bg-action text-on-action`}><Phone size={22} aria-hidden />{t('btn.call')}</a>
                  <a href={`https://wa.me/${phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className={`${big} border border-line bg-white`}><MessageCircle size={22} aria-hidden />{t('btn.whatsapp')}</a></div>
                  : <button onClick={() => reveal(q.id)} className={`${btnSecondary} !min-h-14 w-full text-lg`}>{t('wr.show')}</button>}</div>}
          </article>) })}
      </div>
    </div>)
}
