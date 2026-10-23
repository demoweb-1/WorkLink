import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { lkr } from '../lib/constants'
import { JOB_SELECT, budgetText, fmtDate, type Job } from '../lib/jobs'
import { btnDanger, btnPrimary, btnSecondary, cardCls, inputCls, labelCls } from '../lib/ui'
import StatusBadge from '../components/StatusBadge'

type OfferRow = { id: string; worker_id: string; proposed_price: number; message: string; proposed_start_date: string | null; estimated_duration: string | null; status: string; created_at: string; worker: { display_name: string; district: string | null } | null }
const OFFER_SELECT = 'id,worker_id,proposed_price,message,proposed_start_date,estimated_duration,status,created_at,worker:profiles!worker_id(display_name,district)'

export default function JobDetail() {
  const { id } = useParams()
  const { session, profile } = useAuth()
  const nav = useNavigate()
  const uid = session!.user.id
  const [job, setJob] = useState<Job | null | undefined>(undefined)
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [ratings, setRatings] = useState<Record<string, { avg: number; n: number }>>({})
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null); const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const j = await supabase.from('jobs').select(JOB_SELECT).eq('id', id!).maybeSingle()
    if (j.error) return setErr('Could not load this job. Check your connection and try again.')
    const jobRow = j.data as unknown as Job | null
    setJob(jobRow)
    if (!jobRow) return
    const o = await supabase.from('offers').select(OFFER_SELECT).eq('job_id', jobRow.id).order('created_at', { ascending: true })
    const list = (o.data ?? []) as unknown as OfferRow[]
    setOffers(list)
    if (jobRow.customer_id === uid && list.length) {
      const r = await supabase.from('reviews').select('reviewee_id,rating').in('reviewee_id', list.map(x => x.worker_id))
      const m: Record<string, { avg: number; n: number }> = {}
      for (const x of (r.data ?? []) as { reviewee_id: string; rating: number }[]) { const c = m[x.reviewee_id] ?? { avg: 0, n: 0 }; m[x.reviewee_id] = { avg: (c.avg * c.n + x.rating) / (c.n + 1), n: c.n + 1 } }
      setRatings(m)
    }
    if (jobRow.status === 'accepted' || jobRow.status === 'closed') { const b = await supabase.from('bookings').select('id').eq('job_id', jobRow.id).maybeSingle(); setBookingId(b.data?.id ?? null) }
  }, [id, uid])
  useEffect(() => { load() }, [load])

  if (err && job === undefined) return <p role="alert" className="text-error">{err}</p>
  if (job === undefined) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  if (job === null) return <div><h1 className="text-3xl font-bold">Job not available</h1><p className="mt-2 text-muted">It may have been filled or removed. <Link className="text-brand underline" to="/jobs">Back to jobs</Link></p></div>
  const owner = job.customer_id === uid

  async function accept(o: OfferRow) {
    if (!window.confirm(`Accept ${o.worker?.display_name ?? 'this worker'}'s offer of ${lkr(Number(o.proposed_price))}? Other offers will be declined.`)) return
    setBusy(true); setErr(null)
    const { data, error } = await supabase.rpc('accept_offer', { p_offer_id: o.id })
    setBusy(false)
    if (error) { setErr('This offer could not be accepted. The job may no longer be open.'); return load() }
    nav(`/bookings/${data as string}`)
  }
  async function cancelJob() {
    if (!window.confirm('Cancel this job? Workers will no longer be able to send offers.')) return
    const { error } = await supabase.from('jobs').update({ status: 'cancelled' }).eq('id', job!.id)
    if (error) setErr('Could not cancel the job.'); else { setMsg('Job cancelled.'); load() }
  }
  const mine = offers.find(o => o.worker_id === uid)
  const cheapest = offers.filter(o => o.status === 'pending').reduce<number | null>((m, o) => m == null || Number(o.proposed_price) < m ? Number(o.proposed_price) : m, null)

  return (
    <div className="space-y-8">
      <Link to="/jobs" className="inline-flex min-h-11 items-center text-brand">&lsaquo; Jobs</Link>
      <header><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight">{job.title}</h1><StatusBadge status={job.status} /></div>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-muted"><span>{job.service_categories?.name}</span><span className="inline-flex items-center gap-1"><MapPin size={16} aria-hidden />{[job.approximate_location, job.district].filter(Boolean).join(', ')}</span><span>Posted {fmtDate(job.created_at)}</span></p></header>
      <section className={`${cardCls} p-5`}><p className="whitespace-pre-line">{job.description}</p>
        <p className="mt-4 font-semibold">{budgetText(job)}</p>{job.preferred_date && <p className="text-sm text-muted">Preferred date: {fmtDate(job.preferred_date)}</p>}</section>
      {err && <p role="alert" className="pop text-error">{err}</p>}{msg && <p role="status" className="pop text-success">{msg}</p>}

      {owner ? <>
        {bookingId && <Link to={`/bookings/${bookingId}`} className={btnPrimary}>Open booking</Link>}
        <section aria-labelledby="offs"><h2 id="offs" className="text-xl font-bold">Offers ({offers.length})</h2>
          {offers.length === 0 ? <p className="mt-3 text-muted">No offers yet. You can review your job details or wait for workers to respond.</p> :
            <ul className="mt-3 space-y-3">{offers.map(o => { const r = ratings[o.worker_id]; return (
              <li key={o.id} className={`${cardCls} pop p-4 ${o.status === 'accepted' ? 'border-success ring-1 ring-success' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-2"><div>
                  <Link to={`/workers/${o.worker_id}`} className="font-semibold text-brand">{o.worker?.display_name ?? 'Worker'}</Link>
                  <p className="text-sm text-muted">{o.worker?.district}{r ? <> · <Star size={13} className="inline fill-current align-[-1px]" aria-hidden /> {r.avg.toFixed(1)} ({r.n})</> : ' · No reviews yet'}</p></div>
                  <StatusBadge status={o.status} /></div>
                <p className="mt-3 text-2xl font-bold">{lkr(Number(o.proposed_price))} {o.status === 'pending' && Number(o.proposed_price) === cheapest && offers.filter(x => x.status === 'pending').length > 1 && <span className="ml-1 align-middle text-xs font-semibold text-success">Lowest price</span>}</p>
                <p className="mt-2 whitespace-pre-line text-muted">{o.message}</p>
                <p className="mt-2 text-sm text-muted">{[o.proposed_start_date && `Can start ${fmtDate(o.proposed_start_date)}`, o.estimated_duration && `Takes about ${o.estimated_duration}`].filter(Boolean).join(' · ')}</p>
                {job.status === 'open' && o.status === 'pending' && <button disabled={busy} onClick={() => accept(o)} className={`${btnPrimary} mt-4`}>Accept this offer</button>}</li>) })}</ul>}
        </section>
        {job.status === 'open' && <button onClick={cancelJob} className={btnDanger}>Cancel job</button>}
      </> : <WorkerPanel job={job} mine={mine} canOffer={Boolean(profile?.is_worker)} reload={load} bookingId={bookingId} />}
    </div>)
}

function WorkerPanel({ job, mine, canOffer, reload, bookingId }: { job: Job; mine?: OfferRow; canOffer: boolean; reload: () => void; bookingId: string | null }) {
  const { session } = useAuth()
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false)
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null)
    const f = new FormData(e.currentTarget); const price = Number(f.get('price')); const message = String(f.get('message')).trim()
    if (!(price > 0)) return setErr('Enter your price in rupees.')
    if (message.length < 10) return setErr('Write a short message of at least 10 characters about how you would do the job.')
    setBusy(true)
    const { error } = await supabase.from('offers').insert({ job_id: job.id, worker_id: session!.user.id, proposed_price: price, message,
      proposed_start_date: String(f.get('start')) || null, estimated_duration: String(f.get('duration')).trim() || null })
    setBusy(false)
    if (error) return setErr(error.code === '23505' ? 'You have already sent an offer for this job.' : 'Could not send your offer. The job may no longer be open.')
    reload()
  }
  async function withdraw() {
    if (!window.confirm('Withdraw your offer? You will not be able to send another offer for this job.')) return
    const { error } = await supabase.from('offers').update({ status: 'withdrawn' }).eq('id', mine!.id)
    if (error) setErr('Could not withdraw your offer.'); else reload()
  }
  if (mine) return <section className={`${cardCls} p-5`}><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Your offer</h2><StatusBadge status={mine.status} /></div>
    <p className="mt-2 text-2xl font-bold">{lkr(Number(mine.proposed_price))}</p><p className="mt-2 whitespace-pre-line text-muted">{mine.message}</p>
    {err && <p role="alert" className="mt-3 text-error">{err}</p>}
    {mine.status === 'pending' && <button onClick={withdraw} className={`${btnDanger} mt-4`}>Withdraw offer</button>}
    {mine.status === 'accepted' && bookingId && <Link to={`/bookings/${bookingId}`} className={`${btnPrimary} mt-4`}>Open booking</Link>}</section>
  if (!canOffer) return <p className="rounded-2xl bg-subtle p-4 text-muted">Turn on worker mode in your <Link className="text-brand underline" to="/account">account</Link> to send offers.</p>
  if (job.status !== 'open') return <p className="text-muted">This job is no longer accepting offers.</p>
  return <section aria-labelledby="mk"><h2 id="mk" className="text-xl font-bold">Send an offer</h2>
    <form onSubmit={submit} className={`${cardCls} mt-3 space-y-4 p-5`} noValidate>
      <label className={labelCls}>Your price (Rs.)<input name="price" type="number" inputMode="numeric" min={1} className={inputCls} /></label>
      <label className={labelCls}>Message<textarea name="message" rows={4} maxLength={1000} placeholder="How you would do the job and why you are a good fit." className={`${inputCls} py-2`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>Earliest start (optional)<input name="start" type="date" min={new Date().toISOString().slice(0, 10)} className={inputCls} /></label>
        <label className={labelCls}>Time needed (optional)<input name="duration" maxLength={60} placeholder="2 days" className={inputCls} /></label></div>
      <p className="text-sm text-muted">Payment is arranged directly with the customer.</p>
      {err && <p role="alert" className="pop text-error">{err}</p>}
      <button disabled={busy} className={btnPrimary}>{busy ? 'Sending…' : 'Send offer'}</button></form></section>
}
void btnSecondary
