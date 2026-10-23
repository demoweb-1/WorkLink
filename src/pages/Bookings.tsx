import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { lkr } from '../lib/constants'
import { fmtDate } from '../lib/jobs'
import { cardCls } from '../lib/ui'
import StatusBadge from '../components/StatusBadge'

type Row = { id: string; agreed_price: number; status: string; created_at: string; customer_id: string; jobs: { title: string; district: string } | null }
export default function Bookings() {
  const { session } = useAuth()
  const uid = session!.user.id
  const [items, setItems] = useState<Row[] | null>(null); const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('bookings').select('id,agreed_price,status,created_at,customer_id,jobs(title,district)').or(`customer_id.eq.${uid},worker_id.eq.${uid}`).order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => error ? setError('Could not load your bookings.') : setItems((data ?? []) as unknown as Row[]))
  }, [uid])
  return <div><h1 className="text-4xl font-bold tracking-tight">Bookings</h1>
    <div className="mt-6">{error && <p role="alert" className="text-error">{error}</p>}
      {!error && !items && <div className="h-40 animate-pulse rounded-2xl bg-subtle" />}
      {items?.length === 0 && <p className="text-muted">No bookings yet. A booking is created when a customer accepts an offer.</p>}
      {items && items.length > 0 && <ul className="grid gap-3 md:grid-cols-2">{items.map((b, i) => (
        <li key={b.id}><Link to={`/bookings/${b.id}`} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} className={`${cardCls} pop block p-4 transition hover:border-brand/40 active:scale-[0.99]`}>
          <div className="flex items-start justify-between gap-3"><p className="font-semibold">{b.jobs?.title ?? 'Job'}</p><StatusBadge status={b.status} /></div>
          <p className="mt-1 text-sm text-muted">{b.jobs?.district} · You are the {b.customer_id === uid ? 'customer' : 'worker'} · {fmtDate(b.created_at)}</p>
          <p className="mt-2 font-semibold">{lkr(Number(b.agreed_price))}</p></Link></li>))}</ul>}</div></div>
}
