import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { getMyRequests, removeMyRequest } from '../lib/recent'
import { lkr } from '../lib/constants'
import { cardCls } from '../lib/ui'

type Reply = { worker_id: string; name: string; price: number | null; phone: string | null; whatsapp: boolean }
type Status = { id: string; token: string; status: string; district: string; category: string; slug: string; note: string | null; responses: Reply[] }
const big = 'inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full text-lg font-semibold active:scale-[0.97]'

export default function MyRequests() {
  const { t, catName } = useI18n()
  const [items, setItems] = useState<Status[] | null>(null)
  const load = useCallback(async () => {
    const mine = getMyRequests()
    const res = await Promise.all(mine.map(async m => { const { data } = await supabase.rpc('get_request_status', { p_id: m.id, p_token: m.token }); return data ? { ...(data as Omit<Status, 'id' | 'token'>), id: m.id, token: m.token } : null }))
    setItems(res.filter((x): x is Status => Boolean(x)))
  }, [])
  useEffect(() => { load(); const i = setInterval(load, 30_000); const v = () => { if (document.visibilityState === 'visible') load() }; document.addEventListener('visibilitychange', v); return () => { clearInterval(i); document.removeEventListener('visibilitychange', v) } }, [load])
  async function cancel(r: Status) { await supabase.rpc('close_quick_request', { p_id: r.id, p_token: r.token }); removeMyRequest(r.id); load() }
  return (
    <div className="max-w-2xl"><h1 className="text-4xl font-bold tracking-tight">{t('nav.my')}</h1>
      <div className="mt-6 space-y-4" aria-live="polite">
        {!items && <div className="h-40 animate-pulse rounded-2xl bg-subtle" />}
        {items?.length === 0 && <div className="rounded-2xl bg-subtle p-5"><p className="text-lg">{t('my.none')}</p><Link to="/" className="mt-2 inline-flex min-h-11 items-center font-semibold text-brand">{t('nav.home')}</Link></div>}
        {items?.map(r => (
          <article key={r.id} className={`${cardCls} pop p-4`}>
            <p className="text-lg font-semibold">{catName(r.slug, r.category)} <span className="font-normal text-muted">· {r.district}</span></p>
            {r.note && <p className="mt-1 text-muted">{r.note}</p>}
            {r.status === 'closed' ? <p className="mt-3 text-muted">{t('rq.cancelled')}</p>
              : r.responses.length === 0 ? <p className="mt-3 font-medium">{t('my.wait')}</p>
              : <ul className="mt-3 space-y-3">{r.responses.map(w => (
                <li key={w.worker_id} className="rounded-2xl bg-subtle p-3"><p className="font-semibold">{w.name}{w.price ? <span className="font-normal"> · {t('my.price')} {lkr(Number(w.price))}</span> : null}</p>
                  {w.phone && <div className="mt-2 flex gap-2"><a href={`tel:${w.phone}`} className={`${big} bg-action text-on-action`}><Phone size={22} aria-hidden />{t('btn.call')}</a>
                    {w.whatsapp && <a href={`https://wa.me/${w.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className={`${big} border border-line bg-white`}><MessageCircle size={22} aria-hidden />{t('btn.whatsapp')}</a>}</div>}</li>))}</ul>}
            {r.status === 'open' && <button onClick={() => cancel(r)} className="mt-3 min-h-11 text-sm font-semibold text-muted">{t('my.cancel')}</button>}
          </article>))}
      </div></div>)
}
