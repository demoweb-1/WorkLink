import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown, MapPin, MessageCircle, Phone, Star } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { recordContact } from '../lib/contacted'
import { supabase } from '../lib/supabase'
import { priceText, type Listing } from '../lib/constants'
import { btnSecondary, cardCls } from '../lib/ui'

type Review = { id: string; rating: number; comment: string | null; created_at: string; source: string; reviewer: { display_name: string } | null }
type P = { display_name: string; district: string | null; public_bio: string | null; is_worker: boolean }

export default function WorkerProfile() {
  const { id } = useParams()
  const { session } = useAuth()
  const { t } = useI18n()
  const [contact, setContact] = useState<{ phone: string; whatsapp: boolean } | null>(null)
  const [p, setP] = useState<P | null | undefined>(undefined)
  const [svcs, setSvcs] = useState<(Listing & { category_id: string })[]>([])
  const [open, setOpen] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!id) return
    ;(async () => {
      const a = await supabase.from('profiles').select('display_name,district,public_bio,is_worker').eq('id', id).maybeSingle()
      if (a.error) return setError('Could not load this profile. Check your connection and try again.')
      setP(a.data as P | null)
      const b = await supabase.from('worker_services').select('id,worker_id,category_id,service_title,description,indicative_price,price_type,service_areas,years_experience,service_categories(name,slug,icon_name)').eq('worker_id', id).eq('is_active', true)
      setSvcs((b.data ?? []) as unknown as (Listing & { category_id: string })[])
      const c = await supabase.from('reviews').select('id,rating,comment,created_at,source,reviewer:profiles!reviewer_id(display_name)').eq('reviewee_id', id).order('created_at', { ascending: false }).limit(50)
      setReviews((c.data ?? []) as unknown as Review[])
      const d = await supabase.from('worker_contacts').select('phone,whatsapp').eq('worker_id', id).maybeSingle()
      setContact(d.data as { phone: string; whatsapp: boolean } | null)
    })()
  }, [id])
  if (error) return <p role="alert" className="text-error">{error}</p>
  if (p === undefined) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  if (!p || !p.is_worker) return <div><h1 className="text-3xl font-bold">Profile not found</h1><p className="mt-2 text-muted">This worker may no longer be available. <Link className="text-brand underline" to="/workers">Back to workers</Link></p></div>
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0
  return (
    <div className="space-y-8">
      <Link to="/workers" className="inline-flex min-h-11 items-center text-brand">&lsaquo; Workers</Link>
      <header className="flex items-center gap-4">
        <div aria-hidden className="grid size-20 place-items-center rounded-full bg-brand-soft text-3xl font-bold text-brand">{p.display_name.charAt(0).toUpperCase()}</div>
        <div><h1 className="text-3xl font-bold tracking-tight">{p.display_name}</h1>
          {p.district && <p className="inline-flex items-center gap-1 text-muted"><MapPin size={16} aria-hidden />{p.district}</p>}
          <p className="mt-1 text-sm">{reviews.length ? <span className="inline-flex items-center gap-1 font-medium"><Star size={16} className="fill-current" aria-hidden />{avg.toFixed(1)} <span className="font-normal text-muted">({reviews.length} review{reviews.length > 1 ? 's' : ''})</span></span> : <span className="text-muted">No reviews yet</span>}</p></div>
      </header>
      {contact && <div className="flex gap-2">
        <a href={`tel:${contact.phone}`} onClick={() => recordContact({ worker_id: id!, name: p.display_name, service: svcs[0]?.service_title ?? '' }, session?.user.id, 'call')} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-lg font-semibold text-white active:scale-[0.97]"><Phone size={22} aria-hidden />{t('btn.call')}</a>
        {contact.whatsapp && <a href={`https://wa.me/${contact.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" onClick={() => recordContact({ worker_id: id!, name: p.display_name, service: svcs[0]?.service_title ?? '' }, session?.user.id, 'whatsapp')} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white text-lg font-semibold active:scale-[0.97]"><MessageCircle size={22} aria-hidden />{t('btn.whatsapp')}</a>}</div>}
      {p.public_bio && <p className="max-w-prose">{p.public_bio}</p>}
      <section aria-labelledby="s"><h2 id="s" className="text-xl font-bold">Services</h2>
        {svcs.length === 0 ? <p className="mt-3 text-muted">This worker has no active services right now.</p> :
          <ul className="mt-3 grid items-start gap-3 md:grid-cols-2">{svcs.map(s => { const isOpen = open === s.id; return (
            <li key={s.id} className={`${cardCls} overflow-hidden`}>
              <button type="button" aria-expanded={isOpen} aria-controls={`svc-${s.id}`} onClick={() => setOpen(isOpen ? null : s.id)}
                className="flex min-h-20 w-full items-center justify-between gap-3 p-4 text-left transition-colors duration-150 active:bg-subtle">
                <span className="min-w-0"><span className="block text-sm text-muted">{s.service_categories?.name}</span>
                  <span className="block font-semibold">{s.service_title}</span>
                  <span className="mt-1 block font-semibold text-brand">{priceText(s.indicative_price, s.price_type)}</span></span>
                <ChevronDown size={22} aria-hidden className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /></button>
              {isOpen && <div id={`svc-${s.id}`} className="pop space-y-3 border-t border-line p-4">
                {s.description && <p className="text-muted">{s.description}</p>}
                {s.service_areas.length > 0 && <p className="text-sm"><span className="text-muted">Serves </span>{s.service_areas.join(', ')}</p>}
                {s.years_experience != null && <p className="text-sm"><span className="text-muted">Experience </span>{s.years_experience} years</p>}
                {contact ? <div className="flex gap-2">
                  <a href={`tel:${contact.phone}`} onClick={() => recordContact({ worker_id: id!, name: p.display_name, service: s.service_title }, session?.user.id, 'call')} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand font-semibold text-white active:scale-[0.97]"><Phone size={20} aria-hidden />{t('btn.call')}</a>
                  {contact.whatsapp && <a href={`https://wa.me/${contact.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" onClick={() => recordContact({ worker_id: id!, name: p.display_name, service: s.service_title }, session?.user.id, 'whatsapp')} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white font-semibold active:scale-[0.97]"><MessageCircle size={20} aria-hidden />{t('btn.whatsapp')}</a>}</div>
                  : <p className="text-sm text-muted">This worker has not added a phone number yet.</p>}
                <Link to={`/request/${s.service_categories?.slug ?? ''}`} className={`${btnSecondary} w-full`}>{t('rq.cta')}</Link>
              </div>}</li>) })}</ul>}
      </section>
      <section aria-labelledby="r"><h2 id="r" className="text-xl font-bold">Reviews</h2>
        {reviews.length === 0 ? <p className="mt-3 text-muted">No reviews yet. Reviews appear only after a completed job.</p> :
          <ul className="mt-3 space-y-3">{reviews.map(r => (<li key={r.id} className={`${cardCls} p-4`}>
            <p className="font-medium">{r.reviewer?.display_name ?? 'Customer'} <span className="font-normal text-muted">· {r.rating} out of 5{r.source === 'booking' ? ' · Booked in WorkLink' : ' · Contacted via WorkLink'}</span></p>
            {r.comment && <p className="mt-1 text-muted">{r.comment}</p>}</li>))}</ul>}
      </section>
    </div>)
}
