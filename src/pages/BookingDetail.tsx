import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { lkr } from '../lib/constants'
import { fmtDate } from '../lib/jobs'
import { btnDanger, btnPrimary, cardCls, inputCls, labelCls } from '../lib/ui'
import StatusBadge from '../components/StatusBadge'

type B = { id: string; job_id: string; customer_id: string; worker_id: string; agreed_price: number; agreed_scope: string | null; status: string; created_at: string; completed_at: string | null; cancelled_at: string | null
  jobs: { title: string; description: string; district: string; approximate_location: string | null } | null
  customer: { display_name: string } | null; worker: { display_name: string } | null }

export default function BookingDetail() {
  const { id } = useParams()
  const { session } = useAuth()
  const uid = session!.user.id
  const [b, setB] = useState<B | null | undefined>(undefined)
  const [address, setAddress] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null | undefined>(undefined)
  const [review, setReview] = useState<{ rating: number } | null | undefined>(undefined)
  const [rating, setRating] = useState(0)
  const [err, setErr] = useState<string | null>(null); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await supabase.from('bookings').select('id,job_id,customer_id,worker_id,agreed_price,agreed_scope,status,created_at,completed_at,cancelled_at,jobs(title,description,district,approximate_location),customer:profiles!customer_id(display_name),worker:profiles!worker_id(display_name)').eq('id', id!).maybeSingle()
    if (r.error) return setErr('Could not load this booking. Check your connection and try again.')
    const row = r.data as unknown as B | null
    setB(row)
    if (!row) return
    if (row.worker_id === uid && row.status !== 'cancelled') { const a = await supabase.from('job_private').select('address_details').eq('job_id', row.job_id).maybeSingle(); setAddress(a.data?.address_details ?? null) }
    if (row.status === 'completed') { const v = await supabase.from('reviews').select('rating').eq('booking_id', row.id).eq('reviewer_id', uid).maybeSingle(); setReview(v.data as { rating: number } | null) }
  }, [id, uid])
  useEffect(() => { load() }, [load])

  if (err && b === undefined) return <p role="alert" className="text-error">{err}</p>
  if (b === undefined) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  if (b === null) return <div><h1 className="text-3xl font-bold">Booking not found</h1><p className="mt-2"><Link className="text-brand underline" to="/bookings">Back to bookings</Link></p></div>
  const isCustomer = b.customer_id === uid
  const other = isCustomer ? b.worker : b.customer

  async function setStatus(status: string, confirm?: string) {
    if (confirm && !window.confirm(confirm)) return
    setBusy(true); setErr(null); setMsg(null)
    const { error } = await supabase.rpc('set_booking_status', { p_booking_id: b!.id, p_status: status })
    setBusy(false)
    if (error) setErr('That change is not allowed right now.'); else { setMsg('Booking updated.'); load() }
  }
  async function showContact() {
    const { data, error } = await supabase.rpc('get_booking_contact', { p_booking_id: b!.id })
    setPhone(error ? null : (data as string | null))
    if (error) setErr('Contact details are unavailable. The database update 0002_contact.sql may not have been run yet.')
  }
  async function submitReview(e: FormEvent) {
    e.preventDefault(); setErr(null)
    if (rating < 1) return setErr('Choose a rating from 1 to 5.')
    const comment = String(new FormData(e.currentTarget as HTMLFormElement).get('comment')).trim()
    const { error } = await supabase.from('reviews').insert({ booking_id: b!.id, reviewer_id: uid, reviewee_id: isCustomer ? b!.worker_id : b!.customer_id, rating, comment: comment || null })
    if (error) return setErr(error.code === '23505' ? 'You have already reviewed this booking.' : 'Could not save your review.')
    setMsg('Thank you. Your review has been saved.'); load()
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link to="/bookings" className="inline-flex min-h-11 items-center text-brand">&lsaquo; Bookings</Link>
      <header className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight">{b.jobs?.title ?? 'Booking'}</h1><StatusBadge status={b.status} /></header>
      <section className={`${cardCls} divide-y divide-line`}>
        <div className="p-4"><p className="text-sm text-muted">{isCustomer ? 'Worker' : 'Customer'}</p><p className="font-semibold">{other?.display_name ?? 'User'}</p></div>
        <div className="p-4"><p className="text-sm text-muted">Agreed price</p><p className="text-2xl font-bold">{lkr(Number(b.agreed_price))}</p></div>
        <div className="p-4"><p className="text-sm text-muted">Work</p><p className="whitespace-pre-line">{b.jobs?.description}</p><p className="mt-1 text-sm text-muted">{[b.jobs?.approximate_location, b.jobs?.district].filter(Boolean).join(', ')}</p></div>
        {address && <div className="p-4"><p className="text-sm text-muted">Exact address (only you can see this)</p><p className="whitespace-pre-line">{address}</p></div>}
        <div className="p-4"><p className="text-sm text-muted">History</p><p>Booked {fmtDate(b.created_at)}</p>{b.completed_at && <p>Completed {fmtDate(b.completed_at)}</p>}{b.cancelled_at && <p>Cancelled {fmtDate(b.cancelled_at)}</p>}</div>
      </section>

      {(b.status === 'accepted' || b.status === 'in_progress') && <section className={`${cardCls} p-5`}><h2 className="font-semibold">Contact {other?.display_name}</h2>
        {phone === undefined ? <button onClick={showContact} className={`${btnPrimary} mt-3`}>Show phone number</button>
          : phone ? <a href={`tel:${phone}`} className="mt-2 inline-flex min-h-11 items-center text-xl font-bold text-brand">{phone}</a>
          : <p className="mt-2 text-muted">They have not added a phone number yet. Please ask them to add one in their account.</p>}</section>}

      <div className="flex flex-wrap gap-3">
        {!isCustomer && b.status === 'accepted' && <button disabled={busy} onClick={() => setStatus('in_progress')} className={btnPrimary}>Start job</button>}
        {isCustomer && b.status === 'in_progress' && <button disabled={busy} onClick={() => setStatus('completed', 'Mark this job as complete? Please confirm only after the work is done.')} className={btnPrimary}>Mark as complete</button>}
        {(b.status === 'accepted' || b.status === 'in_progress') && <button disabled={busy} onClick={() => setStatus('cancelled', 'Cancel this booking?')} className={btnDanger}>Cancel booking</button>}
      </div>
      {!isCustomer && b.status === 'in_progress' && <p className="text-sm text-muted">The customer marks the job complete once the work is done.</p>}
      {err && <p role="alert" className="pop text-error">{err}</p>}{msg && <p role="status" className="pop text-success">{msg}</p>}

      {b.status === 'completed' && review !== undefined && (review ? <p className="rounded-2xl bg-subtle p-4">You rated this booking {review.rating} out of 5.</p> :
        <form onSubmit={submitReview} className={`${cardCls} space-y-4 p-5`}><h2 className="font-semibold">Review {other?.display_name}</h2>
          <div role="group" aria-label="Rating" className="flex gap-2">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-pressed={rating === n} aria-label={`${n} out of 5`} onClick={() => setRating(n)}
            className={`size-11 rounded-full border text-lg font-semibold transition active:scale-95 ${rating === n ? 'border-brand bg-brand text-white' : 'border-line bg-white'}`}>{n}</button>)}</div>
          <label className={labelCls}>Comment (optional)<textarea name="comment" rows={3} maxLength={1000} className={`${inputCls} py-2`} /></label>
          <button className={btnPrimary}>Submit review</button></form>)}
      <p className="rounded-2xl bg-subtle p-4 text-sm text-muted">Payment is arranged directly between the customer and the worker. The app does not collect or guarantee payment.</p>
    </div>)
}
