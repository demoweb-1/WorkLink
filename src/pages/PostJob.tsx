import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DISTRICTS, type Cat } from '../lib/constants'
import { budgetText } from '../lib/jobs'
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'

type V = { category: string; title: string; description: string; district: string; area: string; btype: string; min: string; max: string; date: string; address: string }
const empty: V = { category: '', title: '', description: '', district: '', area: '', btype: 'negotiable', min: '', max: '', date: '', address: '' }

export default function PostJob() {
  const { session } = useAuth()
  const [cats, setCats] = useState<Cat[]>([])
  const [params] = useSearchParams()
  const [v, setV] = useState<V>({ ...empty, category: params.get('category') ?? '' })
  const [step, setStep] = useState<'form' | 'review' | 'done'>('form')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [newId, setNewId] = useState<string | null>(null)
  useEffect(() => { supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name').then(({ data }) => setCats((data ?? []) as Cat[])) }, [])
  const set = (k: keyof V) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV(p => ({ ...p, [k]: e.target.value }))
  const money = { min: Number(v.min), max: Number(v.max) }

  function validate(): string | null {
    if (!v.category) return 'Choose a service category.'
    if (v.title.trim().length < 5) return 'Enter a job title of at least 5 characters.'
    if (v.description.trim().length < 20) return 'Describe the job in at least 20 characters so workers can quote accurately.'
    if (!v.district) return 'Choose the district where the work is needed.'
    if (v.btype !== 'negotiable' && !(money.min > 0)) return 'Enter a budget greater than zero.'
    if (v.btype === 'range' && !(money.max >= money.min)) return 'The maximum budget must be at least the minimum.'
    return null
  }
  function toReview(e: FormEvent) { e.preventDefault(); const m = validate(); if (m) return setErr(m); setErr(null); setStep('review'); window.scrollTo(0, 0) }
  async function publish() {
    setBusy(true); setErr(null)
    const min = v.btype === 'negotiable' ? null : money.min
    const max = v.btype === 'fixed' ? money.min : v.btype === 'range' ? money.max : null
    const { data, error } = await supabase.from('jobs').insert({
      customer_id: session!.user.id, category_id: v.category, title: v.title.trim(), description: v.description.trim(), district: v.district,
      approximate_location: v.area.trim() || null, budget_type: v.btype, budget_min: min, budget_max: max, preferred_date: v.date || null, status: 'open',
    }).select('id').single()
    if (error || !data) { setBusy(false); return setErr('Could not publish your job. Please try again.') }
    if (v.address.trim()) await supabase.from('job_private').insert({ job_id: data.id, address_details: v.address.trim() })
    setBusy(false); setNewId(data.id); setStep('done')
  }

  if (step === 'done') return <div className="max-w-xl pop"><h1 className="text-4xl font-bold tracking-tight">Your job is live</h1>
    <p className="mt-3 text-muted">Workers can now see it and send you offers. You will find the offers on the job page.</p>
    <div className="mt-6 flex flex-wrap gap-3"><Link to={`/jobs/${newId}`} className={btnPrimary}>View my job</Link><Link to="/jobs?tab=mine" className={btnSecondary}>All my jobs</Link></div></div>

  if (step === 'review') {
    const cat = cats.find(c => c.id === v.category)?.name
    return <div className="max-w-xl pop"><h1 className="text-4xl font-bold tracking-tight">Review your job</h1>
      <dl className={`${cardCls} mt-6 divide-y divide-line`}>
        {[['Service', cat], ['Title', v.title], ['Description', v.description], ['District', v.district], ['Area', v.area || 'Not given'], ['Budget', budgetText({ budget_type: v.btype, budget_min: v.btype === 'negotiable' ? null : money.min, budget_max: v.btype === 'fixed' ? money.min : money.max })], ['Preferred date', v.date || 'Flexible']].map(([k, val]) =>
          <div key={k} className="p-4"><dt className="text-sm text-muted">{k}</dt><dd className="mt-0.5 whitespace-pre-line">{val}</dd></div>)}
      </dl>
      <p className="mt-4 text-sm text-muted">Workers see only the district and area. Your exact address is shared only with the worker you choose.</p>
      {err && <p role="alert" className="mt-4 text-error">{err}</p>}
      <div className="mt-6 flex flex-wrap gap-3"><button onClick={publish} disabled={busy} className={btnPrimary}>{busy ? 'Publishing…' : 'Publish job'}</button><button onClick={() => setStep('form')} disabled={busy} className={btnSecondary}>Edit</button></div></div>
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-4xl font-bold tracking-tight">Post a job</h1>
      <p className="mt-2 text-muted">Describe what you need. Workers send offers and you choose.</p>
      <form onSubmit={toReview} className={`${cardCls} mt-6 space-y-4 p-5`} noValidate>
        <label className={labelCls}>Service<select value={v.category} onChange={set('category')} className={inputCls}><option value="" disabled>Choose a service</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className={labelCls}>Job title<input value={v.title} onChange={set('title')} maxLength={120} placeholder="Fix leaking kitchen tap…" className={inputCls} /></label>
        <label className={labelCls}>Description<textarea value={v.description} onChange={set('description')} maxLength={3000} rows={5} placeholder="What needs doing, any materials, and how urgent it is." className={`${inputCls} py-2`} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>District<select value={v.district} onChange={set('district')} className={inputCls}><option value="" disabled>Choose a district</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></label>
          <label className={labelCls}>Area or town (optional)<input value={v.area} onChange={set('area')} maxLength={80} placeholder="Nugegoda…" className={inputCls} /></label>
        </div>
        <label className={labelCls}>Budget<select value={v.btype} onChange={set('btype')} className={inputCls}><option value="negotiable">Negotiable</option><option value="fixed">Fixed amount</option><option value="range">Range</option></select></label>
        {v.btype !== 'negotiable' && <div className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>{v.btype === 'range' ? 'Minimum (Rs.)' : 'Amount (Rs.)'}<input value={v.min} onChange={set('min')} type="number" inputMode="numeric" min={1} className={inputCls} /></label>
          {v.btype === 'range' && <label className={labelCls}>Maximum (Rs.)<input value={v.max} onChange={set('max')} type="number" inputMode="numeric" min={1} className={inputCls} /></label>}</div>}
        <label className={labelCls}>Preferred date (optional)<input value={v.date} onChange={set('date')} type="date" min={new Date().toISOString().slice(0, 10)} className={inputCls} /></label>
        <label className={labelCls}>Exact address (optional, shared only with the worker you choose)<textarea value={v.address} onChange={set('address')} maxLength={300} rows={2} className={`${inputCls} py-2`} /></label>
        {err && <p role="alert" className="pop text-error">{err}</p>}
        <button className={btnPrimary}>Review</button>
      </form>
    </div>)
}
