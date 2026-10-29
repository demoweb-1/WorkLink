import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { DISTRICTS } from '../lib/constants'
import { IS_WORKER_APP, WORKER_PATH } from '../lib/app'
import { normalizePhone } from '../lib/phone'
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'

export default function Account() {
  const { session, profile, refreshProfile, signOut } = useAuth()
  const { t } = useI18n()
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  useEffect(() => { if (session) supabase.from('profile_private').select('phone_number').eq('user_id', session.user.id).maybeSingle().then(({ data }) => setPhone(data?.phone_number ?? '')) }, [session])
  if (!profile) return <p className="text-muted">Loading…</p>
  async function setDistrict(district: string | null) {
    setMsg(null); setErr(null)
    const { error } = await supabase.from('profiles').update({ district }).eq('id', session!.user.id)
    if (error) setErr('Could not save your changes. Try again.'); else { setMsg('District saved.'); await refreshProfile() }
  }
  async function savePhone() {
    const n = normalizePhone(phone); if (!n) return setErr(t('rq.bad'))
    setErr(null); const { error } = await supabase.from('profile_private').upsert({ user_id: session!.user.id, phone_number: n }, { onConflict: 'user_id' })
    if (error) setErr('Could not save your phone number.'); else { setPhone(n); setMsg('Phone number saved.') }
  }
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">{profile.display_name}</h1>
      <section className={`${cardCls} space-y-4 p-5`}>
        <label className={labelCls}>{t('find.where')}<select value={profile.district ?? ''} onChange={e => setDistrict(e.target.value || null)} className={inputCls}>
          <option value="">Not set</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></label>
        {!IS_WORKER_APP && <>
          <label className={labelCls}>{t('rq.phone')}<input name="phone" autoComplete="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0771234567…" className={inputCls} /></label>
          <button onClick={savePhone} className={btnSecondary}>Save phone number</button></>}
      </section>
      {IS_WORKER_APP
        ? <section className={`${cardCls} flex flex-wrap gap-3 p-5`}>
            <Link to="/my-services" className={btnPrimary}>{t('nav.services')}</Link>
            <Link to={`/workers/${session!.user.id}`} className={btnSecondary}>Preview my public profile</Link></section>
        : <a href={WORKER_PATH} className="flex min-h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 font-medium active:bg-subtle">{t('home.joinw')}<span aria-hidden>&rsaquo;</span></a>}
      {err && <p role="alert" className="pop text-error">{err}</p>}{msg && <p role="status" className="pop text-success">{msg}</p>}
      <button onClick={signOut} className={btnSecondary}>Sign out</button>
    </div>)
}
