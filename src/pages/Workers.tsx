import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DISTRICTS, LISTING_SELECT, type Cat, type Listing } from '../lib/constants'
import { btnSecondary, inputCls, labelCls } from '../lib/ui'
import ServiceCard from '../components/ServiceCard'

const PAGE = 12

export default function Workers() {
  const [params, setParams] = useSearchParams()
  const cat = params.get('category') ?? ''
  const district = params.get('district') ?? ''
  const [q, setQ] = useState(params.get('q') ?? '')
  const [cats, setCats] = useState<Cat[]>([])
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [more, setMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function fetchPage(from: number) {
    let r = supabase.from('worker_services').select(LISTING_SELECT).eq('is_active', true)
    if (cat) r = r.eq('service_categories.slug', cat)
    if (district) r = r.contains('service_areas', [district])
    const term = q.replace(/[,()%*]/g, ' ').trim()
    if (term) r = r.or(`service_title.ilike.%${term}%,description.ilike.%${term}%`)
    return r.order('created_at', { ascending: false }).range(from, from + PAGE - 1)
  }
  useEffect(() => { supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name').then(({ data }) => setCats((data ?? []) as Cat[])) }, [])
  useEffect(() => {
    let stale = false
    setLoading(true); setError(null)
    const t = setTimeout(async () => {   // debounce typing
      const { data, error } = await fetchPage(0)
      if (stale) return
      setLoading(false)
      if (error) return setError('Could not load workers. Check your connection and try again.')
      setItems((data ?? []) as unknown as Listing[]); setMore((data?.length ?? 0) === PAGE)
    }, 300)
    return () => { stale = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, district])
  async function loadMore() {
    const { data, error } = await fetchPage(items.length)
    if (error) return setError('Could not load more workers.')
    setItems(p => [...p, ...((data ?? []) as unknown as Listing[])]); setMore((data?.length ?? 0) === PAGE)
  }
  function setParam(k: string, v: string) { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n, { replace: true }) }
  const filtered = Boolean(q || cat || district)

  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight">Find a worker</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <label className={`${labelCls} sm:col-span-3`}>Search
          <span className="relative block"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 mt-[3px] -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Electrician, cleaning, painting" className={`${inputCls} pl-10`} /></span></label>
        <label className={labelCls}>Service<select value={cat} onChange={e => setParam('category', e.target.value)} className={inputCls}>
          <option value="">All services</option>{cats.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></label>
        <label className={labelCls}>District<select value={district} onChange={e => setParam('district', e.target.value)} className={inputCls}>
          <option value="">All districts</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select></label>
        {filtered && <div className="flex items-end"><button onClick={() => { setQ(''); setParams({}, { replace: true }) }} className={`${btnSecondary} w-full`}>Clear filters</button></div>}
      </div>

      <div className="mt-6" aria-live="polite">
        {error && <p role="alert" className="text-error">{error}</p>}
        {loading && <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl bg-subtle" />)}</div>}
        {!loading && !error && items.length === 0 && <p className="text-muted">{filtered ? 'No workers match these filters. Try another service or district.' : 'No workers have listed services yet. Check back soon.'}</p>}
        {!loading && items.length > 0 && <div className="grid gap-3 md:grid-cols-2">{items.map((l, i) => <ServiceCard key={l.id} l={l} i={i % PAGE} />)}</div>}
        {!loading && more && <div className="mt-6 text-center"><button onClick={loadMore} className={btnSecondary}>Load more</button></div>}
      </div>
    </div>)
}
