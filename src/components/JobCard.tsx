import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { budgetText, fmtDate, type Job } from '../lib/jobs'
import { cardCls } from '../lib/ui'
import StatusBadge from './StatusBadge'

export default function JobCard({ j, i = 0, extra }: { j: Job; i?: number; extra?: string }) {
  return (
    <Link to={`/jobs/${j.id}`} style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }} className={`${cardCls} pop block p-4 transition duration-150 hover:border-brand/40 active:scale-[0.99]`}>
      <div className="flex items-start justify-between gap-3"><p className="font-semibold">{j.title}</p><StatusBadge status={j.status} /></div>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{j.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="rounded-full bg-subtle px-2.5 py-0.5 font-medium">{j.service_categories?.name}</span>
        <span className="inline-flex items-center gap-1 text-muted"><MapPin size={14} aria-hidden />{j.district}</span>
        <span className="text-muted">Posted {fmtDate(j.created_at)}</span>
      </div>
      <p className="mt-3 font-semibold">{budgetText(j)}</p>
      {extra && <p className="mt-1 text-sm text-brand">{extra}</p>}
    </Link>)
}
