import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Droplets, Sparkles, Hammer, PaintRoller, HardHat, Wrench, Sprout, Truck, Briefcase, ChevronRight, type LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LISTING_SELECT, type Cat, type Listing } from '../lib/constants'
import { btnPrimary, btnSecondary, cardCls } from '../lib/ui'
import ServiceCard from '../components/ServiceCard'

const ICONS: Record<string, LucideIcon> = { zap: Zap, droplets: Droplets, sparkles: Sparkles, hammer: Hammer, 'paint-roller': PaintRoller, 'hard-hat': HardHat, wrench: Wrench, sprout: Sprout, truck: Truck }

export default function Landing() {
  const [cats, setCats] = useState<Cat[] | null>(null)
  const [latest, setLatest] = useState<Listing[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name')
      .then(({ data, error }) => error ? setError('Could not load services. Check your connection and try again.') : setCats(data as Cat[]))
    supabase.from('worker_services').select(LISTING_SELECT).eq('is_active', true).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setLatest((data ?? []) as unknown as Listing[]))
  }, [])
  return (
    <div className="space-y-16">
      <section className="max-w-2xl pt-4 sm:pt-10">
        <h1 className="rise text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">Find the right person for the job.</h1>
        <p className="rise rise-2 mt-5 max-w-xl text-lg text-muted">Discover skilled local professionals, compare their prices and read honest reviews from real customers.</p>
        <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
          <Link to="/workers" className={btnPrimary}>Find a worker</Link>
          <Link to="/jobs/new" className={btnSecondary}>Post a job</Link>
        </div>
      </section>

      <section aria-labelledby="svc">
        <h2 id="svc" className="text-2xl font-bold tracking-tight">Browse by service</h2>
        {error && <p role="alert" className="mt-4 text-error">{error}</p>}
        {!error && !cats && <div className="mt-4 h-64 animate-pulse rounded-2xl bg-subtle" />}
        {cats && <ul className={`${cardCls} mt-4 divide-y divide-line overflow-hidden sm:columns-2 sm:divide-y-0`}>
          {cats.map(c => { const Icon = ICONS[c.icon_name ?? ''] ?? Briefcase; return (
            <li key={c.id} className="break-inside-avoid border-line sm:border-b">
              <Link to={`/workers?category=${c.slug}`} className="flex min-h-14 items-center gap-3 px-4 hover:bg-subtle active:bg-subtle">
                <Icon size={22} strokeWidth={1.75} className="text-brand" aria-hidden /><span className="flex-1 font-medium">{c.name}</span><ChevronRight size={18} className="text-muted" aria-hidden />
              </Link></li>) })}
        </ul>}
      </section>

      <section aria-labelledby="latest">
        <h2 id="latest" className="text-2xl font-bold tracking-tight">Newly listed workers</h2>
        {latest === null && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-subtle" />}
        {latest?.length === 0 && <div className={`${cardCls} mt-4 p-6`}><p className="font-semibold">No workers have listed services yet.</p>
          <p className="mt-1 text-muted">Be one of the first. Create an account, switch on worker mode and add your first service.</p>
          <Link to="/signup" className={`${btnPrimary} mt-4`}>Create an account</Link></div>}
        {latest && latest.length > 0 && <div className="mt-4 grid gap-3 md:grid-cols-3">{latest.map((l, i) => <ServiceCard key={l.id} l={l} i={i} />)}</div>}
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {['Search by service and district, or post a job describing what you need.', 'Compare profiles, prices and offers. Only genuine reviews are ever shown.', 'Choose a worker, agree the details and pay them directly.'].map((t, i) => (
            <li key={i} className={`${cardCls} p-5`}><span className="text-sm font-semibold text-brand">Step {i + 1}</span><p className="mt-1">{t}</p></li>))}
        </ol>
      </section>
    </div>)
}
