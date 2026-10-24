import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import { normalizePhone } from '../lib/phone'
import { getDistrict, getLastRequest, getPhone, setDistrictPref, setLastRequest, setPhonePref } from '../lib/recent'
import type { Cat } from '../lib/constants'
import { btnPrimary, inputCls } from '../lib/ui'
import DistrictChip from '../components/DistrictChip'

// "Call me back": service + district + phone number. No account, almost no typing.
export default function RequestPage() {
  const { slug } = useParams()
  const { t, catName } = useI18n()
  const { session } = useAuth()
  const [cats, setCats] = useState<Cat[] | null>(null)
  const [district, setDistrict] = useState(getDistrict)
  const [phone, setPhone] = useState(getPhone)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'form' | 'sending' | 'done' | 'cancelled'>('form')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name').then(({ data }) => setCats((data ?? []) as Cat[])) }, [])
  useEffect(() => { // signed-in customers: reuse the phone saved in their account
    if (phone || !session) return
    supabase.from('profile_private').select('phone_number').eq('user_id', session.user.id).maybeSingle().then(({ data }) => { if (data?.phone_number) setPhone(data.phone_number) })
  }, [session, phone])

  if (!cats) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  const cat = cats.find(c => c.slug === slug)

  if (!cat) return <div className="space-y-6"><h1 className="text-4xl font-bold tracking-tight">{t('rq.cta')}</h1>
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">{cats.map(c => { const Icon = iconFor(c.icon_name); return (
      <li key={c.id}><Link to={`/request/${c.slug}`} className="flex flex-col items-center gap-2 text-center transition-transform duration-150 active:scale-90">
        <span className="app-icon grid size-[4.75rem] place-items-center"><Icon size={36} strokeWidth={1.75} aria-hidden /></span>
        <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{catName(c.slug, c.name)}</span></Link></li>) })}</ul></div>

  const Icon = iconFor(cat.icon_name)
  async function submit(e: FormEvent) {
    e.preventDefault(); setErr(null)
    const n = normalizePhone(phone)
    if (!district) return setErr(t('rq.pick'))
    if (!n) return setErr(t('rq.bad'))
    setState('sending')
    const { data, error } = await supabase.rpc('create_quick_request', { p_category: cat!.id, p_district: district, p_phone: n, p_note: note })
    if (error) { setState('form'); return setErr(t('rq.fail')) }
    setPhonePref(n); setDistrictPref(district)
    const r = data as { id: string; token: string }; setLastRequest({ id: r.id, token: r.token }); setState('done')
  }
  async function cancel() {
    const r = getLastRequest(); if (r) await supabase.rpc('close_quick_request', { p_id: r.id, p_token: r.token })
    setLastRequest(null); setState('cancelled')
  }

  if (state === 'done' || state === 'cancelled') return (
    <div className="pop max-w-md space-y-5 pt-6 text-center sm:text-left">
      <CheckCircle2 size={64} className={`mx-auto sm:mx-0 ${state === 'done' ? 'text-success' : 'text-muted'}`} aria-hidden />
      <h1 role="status" className="text-4xl font-bold tracking-tight">{state === 'done' ? t('rq.done') : t('rq.cancelled')}</h1>
      {state === 'done' && <><p className="text-lg text-muted">{t('rq.done2')}</p>
        <button onClick={cancel} className="min-h-12 rounded-full border border-line bg-white px-5 font-semibold active:scale-[0.97]">{t('rq.cancel')}</button></>}
      <div><Link to="/" className="inline-flex min-h-12 items-center font-semibold text-brand">{t('nav.home')}</Link></div></div>)

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3"><span className="app-icon grid size-14 shrink-0 place-items-center"><Icon size={30} aria-hidden /></span>
        <div><p className="text-muted">{catName(cat.slug, cat.name)}</p><h1 className="text-3xl font-bold leading-tight tracking-tight">{t('rq.title')}</h1></div></div>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <DistrictChip required value={district} onChange={setDistrict} />
        <label className="block text-sm font-medium">{t('rq.phone')}
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0771234567…" className={`${inputCls} !min-h-14 text-xl font-semibold`} /></label>
        <label className="block text-sm font-medium">{t('rq.note')}
          <input name="note" autoComplete="off" maxLength={200} value={note} onChange={e => setNote(e.target.value)} className={`${inputCls} !min-h-12`} /></label>
        {err && <p role="alert" className="pop text-error">{err}</p>}
        <button disabled={state === 'sending'} className={`${btnPrimary} !min-h-14 w-full text-lg`}>{state === 'sending' ? '…' : t('rq.send')}</button>
        <p className="text-sm text-muted">{t('rq.consent')}</p>
      </form>
    </div>)
}
