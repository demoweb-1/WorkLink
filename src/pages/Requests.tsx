import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import { btnPrimary, cardCls } from '../lib/ui'
import AlertsCard from '../components/AlertsCard'

type Req = { id: string; district: string; phone: string; note: string | null; created_at: string; service_categories: { name: string; slug: string; icon_name: string | null } | null }
const ago = (iso: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d` }

// Worker view: open "call me back" requests for the services and districts this worker covers (enforced by the database).
export default function Requests() {
  const { session } = useAuth()
  const { t, catName } = useI18n()
  const [items, setItems] = useState<Req[] | null>(null)
  const [hasService, setHasService] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      supabase.from('quick_requests').select('id,district,phone,note,created_at,service_categories(name,slug,icon_name)').eq('status', 'open').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(30),
      supabase.from('worker_services').select('id', { count: 'exact', head: true }).eq('worker_id', session!.user.id).eq('is_active', true)])
    if (r.error) return setError('Could not load requests. Check your connection and try again.')
    setError(null); setItems((r.data ?? []) as unknown as Req[]); setHasService((s.count ?? 0) > 0)
  }, [session])
  useEffect(() => {
    load(); const id = setInterval(load, 60_000)
    const vis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis) }
  }, [load])
  return (
    <div className="max-w-2xl">
      <h1 className="text-4xl font-bold tracking-tight">{t('wr.title')}</h1>
      <div className="mt-4"><AlertsCard /></div>
      <div className="mt-6 space-y-4" aria-live="polite">
        {error && <p role="alert" className="text-error">{error}</p>}
        {!error && !items && [0, 1].map(i => <div key={i} className="h-44 animate-pulse rounded-2xl bg-subtle" />)}
        {items && !hasService && <div className={`${cardCls} p-5`}><p className="text-lg">{t('wr.setup')}</p><Link to="/my-services" className={`${btnPrimary} mt-4`}>{t('wr.setupbtn')}</Link></div>}
        {items && hasService && items.length === 0 && <p className="rounded-2xl bg-subtle p-5 text-lg">{t('wr.none')}</p>}
        {items?.map((q, i) => { const Icon = iconFor(q.service_categories?.icon_name ?? null); return (
          <article key={q.id} style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }} className={`${cardCls} pop p-4`}>
            <div className="flex items-center gap-3"><span className="app-icon grid size-12 shrink-0 place-items-center"><Icon size={24} aria-hidden /></span>
              <div className="min-w-0"><p className="text-lg font-semibold">{catName(q.service_categories?.slug ?? '', q.service_categories?.name ?? '')}</p>
                <p className="text-muted">{q.district} · {ago(q.created_at)} {t('wr.ago')}</p></div></div>
            {q.note && <p className="mt-3">{q.note}</p>}
            <div className="mt-4 flex gap-2">
              <a href={`tel:${q.phone}`} className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-action text-lg font-semibold text-on-action active:scale-[0.97]"><Phone size={22} aria-hidden />{t('btn.call')}</a>
              <a href={`https://wa.me/${q.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-white text-lg font-semibold active:scale-[0.97]"><MessageCircle size={22} aria-hidden />{t('btn.whatsapp')}</a></div>
          </article>) })}
      </div>
    </div>)
}
