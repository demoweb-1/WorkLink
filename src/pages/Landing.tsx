import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import type { Cat } from '../lib/constants'
import { cardCls } from '../lib/ui'

export default function Landing() {
  const { t, catName } = useI18n()
  const [cats, setCats] = useState<Cat[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name')
      .then(({ data, error }) => error ? setError('Could not load services. Check your connection and try again.') : setCats(data as Cat[]))
  }, [])
  return (
    <div className="space-y-8">
      <section className="pt-2">
        <h1 className="rise text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t('home.title')}</h1>
        <p className="rise rise-2 mt-3 text-lg text-muted">{t('home.sub')}</p>
      </section>
      {error && <p role="alert" className="text-error">{error}</p>}
      {!error && !cats && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{Array.from({ length: 10 }, (_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-subtle" />)}</div>}
      {cats && <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cats.map((c, i) => { const Icon = iconFor(c.icon_name); return (
          <li key={c.id}><Link to={`/find/${c.slug}`} style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}
            className={`${cardCls} pop flex min-h-36 flex-col items-center justify-center gap-3 p-3 text-center transition duration-150 hover:border-brand/40 active:scale-[0.96]`}>
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand"><Icon size={30} strokeWidth={1.75} aria-hidden /></span>
            <span className="text-base font-semibold leading-tight">{catName(c.slug, c.name)}</span></Link></li>) })}</ul>}
      <div className="space-y-1">
        <Link to="/jobs/new" className="flex min-h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 font-medium active:bg-subtle">{t('home.post')}<ChevronRight size={20} className="text-muted" aria-hidden /></Link>
        <Link to="/signup" className="flex min-h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 font-medium active:bg-subtle">{t('home.join')}<ChevronRight size={20} className="text-muted" aria-hidden /></Link>
      </div>
    </div>)
}
