import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { DISTRICTS, lkr, type Cat } from '../lib/constants'
import { JOB_SELECT, fmtDate, type Job } from '../lib/jobs'
import { btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'
import JobCard from '../components/JobCard'
import StatusBadge from '../components/StatusBadge'

const PAGE = 12
type Tab = 'browse' | 'mine' | 'offers'

export default function JobsHub() {
  const { profile } = useAuth()
  const [params, setParams] = useSearchParams()
  if (!profile) return <p className="text-muted">Loading…</p>
  const tabs: { id: Tab; label: string }[] = [...(profile.is_worker ? [{ id: 'browse' as Tab, label: 'Find jobs' }] : []), { id: 'mine', label: 'My jobs' }, ...(profile.is_worker ? [{ id: 'offers' as Tab, label: 'My offers' }] : [])]
  const want = params.get('tab') as Tab | null
  const tab = tabs.find(t => t.id === want)?.id ?? tabs[0].id
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-4xl font-bold tracking-tight">Jobs</h1><Link to="/jobs/new" className={btnPrimary}>Post a job</Link></div>
      {tabs.length > 1 && <div role="group" aria-label="Jobs views" className="mt-5 inline-flex rounded-full bg-subtle p-1">
        {tabs.map(t => <button key={t.id} aria-pressed={t.id === tab} onClick={() => setParams({ tab: t.id }, { replace: true })}
          className={`min-h-10 rounded-full px-4 text-sm font-semibold transition active:scale-95 ${t.id === tab ? 'bg-white shadow-sm' : 'text-muted'}`}>{t.label}</button>)}</div>}
      <div className="mt-6">{tab === 'browse' ? <Browse /> : tab === 'offers' ? <MyOffers /> : <Mine />}</div>
    </div>)
}

function Browse() {
  const { session } = useAuth()
  const [cats, setCats] = useState<Cat[]>([]); const [cat, setCat] = useState(''); const [district, setDistrict] = useState('')
  const [items, setItems] = useState<Job[]>([]); const [loading, setLoading] = useState(true); const [more, setMore] = useState(false); const [error, setError] = useState<string | null>(null)
  const page = (from: number) => {
    let r = supabase.from('jobs').select(`${JOB_SELECT}`).eq('status', 'open').neq('customer_id', session!.user.id)
    if (cat) r = r.eq('category_id', cat)
    if (district) r = r.eq('district', district)
    return r.order('created_at', { ascending: false }).range(from, from + PAGE - 1)
  }
  useEffect(() => { supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name').then(({ data }) => setCats((data ?? []) as Cat[])) }, [])
  useEffect(() => {
    let stale = false; setLoading(true); setError(null)
    page(0).then(({ data, error }) => { if (stale) return; setLoading(false); if (error) return setError('Could not load jobs. Check your connection and try again.'); setItems((data ?? []) as unknown as Job[]); setMore((data?.length ?? 0) === PAGE) })
    return () => { stale = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, district])
  async function loadMore() { const { data } = await page(items.length); setItems(p => [...p, ...((data ?? []) as unknown as Job[])]); setMore((data?.length ?? 0) === PAGE) }
  return <div>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className={labelCls}>Service<select value={cat} onChange={e => setCat(e.target.value)} className={inputCls}><option value="">All services</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className={labelCls}>District<select value={district} onChange={e => setDistrict(e.target.value)} className={inputCls}><option value="">All districts</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></label>
      {(cat || district) && <div className="flex items-end"><button onClick={() => { setCat(''); setDistrict('') }} className={`${btnSecondary} w-full`}>Clear filters</button></div>}
    </div>
    <div className="mt-6" aria-live="polite">
      {error && <p role="alert" className="text-error">{error}</p>}
      {loading && <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-subtle" />)}</div>}
      {!loading && !error && items.length === 0 && <p className="text-muted">No jobs available right now. Check back soon or explore another district.</p>}
      {!loading && items.length > 0 && <div className="grid gap-3 md:grid-cols-2">{items.map((j, i) => <JobCard key={j.id} j={j} i={i % PAGE} />)}</div>}
      {!loading && more && <div className="mt-6 text-center"><button onClick={loadMore} className={btnSecondary}>Load more</button></div>}
    </div></div>
}

function Mine() {
  const { session } = useAuth()
  const [items, setItems] = useState<(Job & { offers: { count: number }[] })[] | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('jobs').select(`${JOB_SELECT},offers(count)`).eq('customer_id', session!.user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => error ? setError('Could not load your jobs.') : setItems((data ?? []) as unknown as (Job & { offers: { count: number }[] })[]))
  }, [session])
  if (error) return <p role="alert" className="text-error">{error}</p>
  if (!items) return <div className="h-40 animate-pulse rounded-2xl bg-subtle" />
  if (items.length === 0) return <div className={`${cardCls} p-6`}><p className="font-semibold">You have not posted a job yet.</p><p className="mt-1 text-muted">Describe what you need and workers will send offers.</p><Link to="/jobs/new" className={`${btnPrimary} mt-4`}>Post a job</Link></div>
  return <div className="grid gap-3 md:grid-cols-2">{items.map((j, i) => { const n = j.offers?.[0]?.count ?? 0
    return <JobCard key={j.id} j={j} i={i} extra={j.status === 'open' ? (n ? `${n} offer${n > 1 ? 's' : ''} received` : 'No offers yet') : undefined} /> })}</div>
}

type MyOffer = { id: string; proposed_price: number; status: string; created_at: string; jobs: { id: string; title: string; district: string; status: string } | null }
function MyOffers() {
  const { session } = useAuth()
  const [items, setItems] = useState<MyOffer[] | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('offers').select('id,proposed_price,status,created_at,jobs(id,title,district,status)').eq('worker_id', session!.user.id).order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => error ? setError('Could not load your offers.') : setItems((data ?? []) as unknown as MyOffer[]))
  }, [session])
  if (error) return <p role="alert" className="text-error">{error}</p>
  if (!items) return <div className="h-40 animate-pulse rounded-2xl bg-subtle" />
  if (items.length === 0) return <p className="text-muted">You have not sent any offers yet. Open the Find jobs tab to see jobs you can quote on.</p>
  return <ul className="grid gap-3 md:grid-cols-2">{items.map(o => (
    <li key={o.id} className={`${cardCls} p-4`}><div className="flex items-start justify-between gap-3"><p className="font-semibold">{o.jobs?.title ?? 'Job no longer available'}</p><StatusBadge status={o.status} /></div>
      <p className="mt-1 text-sm text-muted">{o.jobs?.district} · Sent {fmtDate(o.created_at)}</p><p className="mt-2 font-semibold">Your price {lkr(Number(o.proposed_price))}</p>
      {o.jobs && <Link to={`/jobs/${o.jobs.id}`} className="mt-2 inline-flex min-h-11 items-center text-brand">View job</Link>}</li>))}</ul>
}
