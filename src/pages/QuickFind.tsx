import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageCircle, Phone, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { DISTRICTS, lkr } from '../lib/constants'
import { iconFor } from '../lib/icons'
import { btnSecondary, cardCls } from '../lib/ui'
import DistrictChip from '../components/DistrictChip'
import { recordContact } from '../lib/contacted'
import { getDistrict, pushRecent, setDistrictPref } from '../lib/recent'

type Contact = { phone: string; whatsapp: boolean }
type Row = {
  id: string; worker_id: string; service_title: string; indicative_price: number | null; price_type: string
  profiles: { display_name: string; worker_contacts: Contact | Contact[] | null } | null
  service_categories: { name: string; slug: string; icon_name: string | null } | null
}
type Worker = { row: Row; contact: Contact | null; avg: number; n: number }
const SELECT = 'id,worker_id,service_title,indicative_price,price_type,profiles!inner(display_name,worker_contacts(phone,whatsapp)),service_categories!inner(name,slug,icon_name)'
const big = 'inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-semibold transition duration-150 active:scale-[0.97]'


export default function QuickFind() {
  const { slug } = useParams()
  const { profile, session } = useAuth()
  const { t, catName } = useI18n()
  const [district, setDistrict] = useState(getDistrict)
  const [list, setList] = useState<Worker[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState<{ name: string; icon: string | null } | null>(null)
  useEffect(() => { if (!district && profile?.district) setDistrict(profile.district) }, [profile, district])

  useEffect(() => {
    let stale = false; setList(null); setError(null)
    ;(async () => {
      let q = supabase.from('worker_services').select(SELECT).eq('is_active', true).eq('service_categories.slug', slug!)
      if (district) q = q.contains('service_areas', [district])
      const { data, error } = await q.order('created_at', { ascending: false }).limit(30)
      if (stale) return
      if (error) return setError('Could not load workers. Check your connection and try again.')
      const rows = (data ?? []) as unknown as Row[]
      if (rows[0]?.service_categories) setTitle({ name: rows[0].service_categories.name, icon: rows[0].service_categories.icon_name })
      const seen = new Set<string>(); const uniq = rows.filter(r => !seen.has(r.worker_id) && seen.add(r.worker_id))
      const ids = uniq.map(r => r.worker_id)
      const rv = ids.length ? await supabase.from('reviews').select('reviewee_id,rating').in('reviewee_id', ids) : { data: [] }
      if (stale) return
      const stats: Record<string, { s: number; n: number }> = {}
      for (const x of (rv.data ?? []) as { reviewee_id: string; rating: number }[]) { const c = stats[x.reviewee_id] ?? { s: 0, n: 0 }; stats[x.reviewee_id] = { s: c.s + x.rating, n: c.n + 1 } }
      const out: Worker[] = uniq.map(r => {
        const wc = r.profiles?.worker_contacts; const contact = Array.isArray(wc) ? (wc[0] ?? null) : (wc ?? null)
        const st = stats[r.worker_id]; return { row: r, contact, avg: st ? st.s / st.n : 0, n: st?.n ?? 0 }
      })
      out.sort((a, b) => Number(Boolean(b.contact)) - Number(Boolean(a.contact)) || b.avg - a.avg)
      setList(out)
    })()
    return () => { stale = true }
  }, [slug, district])

  function pick(d: string) { setDistrict(d); setDistrictPref(d) }
  useEffect(() => { if (slug) pushRecent(slug) }, [slug])
  const Icon = iconFor(title?.icon ?? null)
  const name = catName(slug!, title?.name ?? '')

  return (
    <div className="max-w-2xl">
      <Link to="/" className="inline-flex min-h-11 items-center text-brand">&lsaquo; {t('find.back')}</Link>
      <h1 className="mt-2 flex items-center gap-3 text-4xl font-bold tracking-tight"><span className="app-icon grid size-12 shrink-0 place-items-center"><Icon size={26} aria-hidden /></span>{name}</h1>
      <div className="mt-5"><DistrictChip value={district} onChange={pick} /></div>

      <div className="mt-6 space-y-4" aria-live="polite">
        {error && <p role="alert" className="text-error">{error}</p>}
        {!error && !list && [0, 1, 2].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-subtle" />)}
        {list?.length === 0 && <p className="rounded-2xl bg-subtle p-5 text-lg">{t('find.none')}</p>}
        {list?.map(({ row, contact, avg, n }, i) => (
          <article key={row.id} style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }} className={`${cardCls} pop p-4`}>
            <Link to={`/workers/${row.worker_id}`} className="flex items-center gap-3">
              <span aria-hidden className="grid size-14 shrink-0 place-items-center rounded-full bg-brand-soft text-2xl font-bold text-brand">{row.profiles?.display_name.charAt(0).toUpperCase()}</span>
              <span className="min-w-0"><span className="block truncate text-lg font-semibold">{row.profiles?.display_name}</span>
                <span className="block truncate text-muted">{row.service_title}</span></span></Link>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 text-base">
              <span className="font-semibold">{row.indicative_price != null && row.price_type !== 'contact' ? `${t('price.from')} ${lkr(Number(row.indicative_price))}` : t('price.contact')}</span>
              {n > 0 ? <span className="inline-flex items-center gap-1"><Star size={16} className="fill-current" aria-hidden />{avg.toFixed(1)} <span className="text-muted">({n})</span></span> : <span className="text-muted">{t('find.new')}</span>}</p>
            <div className="mt-4 flex gap-2">
              {contact ? <>
                <a href={`tel:${contact.phone}`} onClick={() => recordContact({ worker_id: row.worker_id, name: row.profiles?.display_name ?? '', service: row.service_title }, session?.user.id, 'call')} className={`${big} bg-brand text-white active:bg-brand-dark`}><Phone size={22} aria-hidden />{t('btn.call')}</a>
                {contact.whatsapp && <a href={`https://wa.me/${contact.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" onClick={() => recordContact({ worker_id: row.worker_id, name: row.profiles?.display_name ?? '', service: row.service_title }, session?.user.id, 'whatsapp')} className={`${big} border border-line bg-white`}><MessageCircle size={22} aria-hidden />{t('btn.whatsapp')}</a>}
              </> : <Link to={`/workers/${row.worker_id}`} className={`${btnSecondary} !min-h-14 w-full text-lg`}>{t('btn.profile')}</Link>}
            </div>
          </article>))}
      </div>
    </div>)
}
