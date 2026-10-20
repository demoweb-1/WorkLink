import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { priceText, type Listing } from '../lib/constants'
import { cardCls } from '../lib/ui'

export default function ServiceCard({ l }: { l: Listing }) {
  const name = l.profiles?.display_name ?? 'Worker'
  return (
    <Link to={`/workers/${l.worker_id}`} className={`${cardCls} block p-4 transition duration-150 hover:border-brand/40 active:scale-[0.99]`}>
      <div className="flex items-start gap-3">
        <div aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand">{name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-muted">{l.service_title}</p>
        </div>
      </div>
      {l.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{l.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="rounded-full bg-subtle px-2.5 py-0.5 font-medium">{l.service_categories?.name}</span>
        {l.service_areas.length > 0 && <span className="inline-flex items-center gap-1 text-muted"><MapPin size={14} aria-hidden />{l.service_areas.slice(0, 2).join(', ')}{l.service_areas.length > 2 ? ` +${l.service_areas.length - 2}` : ''}</span>}
      </div>
      <p className="mt-3 font-semibold">{priceText(l.indicative_price, l.price_type)}</p>
    </Link>)
}
