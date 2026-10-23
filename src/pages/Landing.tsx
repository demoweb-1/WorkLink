import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ChevronDown, ChevronRight, HardHat, MapPin, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import { DISTRICTS, type Cat } from '../lib/constants'
import { getDistrict, getRecent, setDistrictPref } from '../lib/recent'

export default function Landing() {
  const { t, catName } = useI18n()
  const { profile } = useAuth()
  const [cats, setCats] = useState<Cat[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [district, setDistrict] = useState(getDistrict)
  useEffect(() => {
    supabase.from('service_categories').select('id,name,slug,icon_name').eq('is_active', true).order('name')
      .then(({ data, error }) => error ? setError('Could not load services. Check your connection and try again.') : setCats(data as Cat[]))
  }, [])
  const hour = new Date().getHours()
  const hello = t(hour < 12 ? 'hi.morning' : hour < 18 ? 'hi.afternoon' : 'hi.evening')
  const first = profile?.display_name.split(' ')[0]
  const shown = useMemo(() => (cats ?? []).filter(c => `${c.name} ${catName(c.slug, c.name)}`.toLowerCase().includes(q.trim().toLowerCase())), [cats, q, catName])
  const recent = useMemo(() => getRecent().map(s => cats?.find(c => c.slug === s)).filter((c): c is Cat => Boolean(c)), [cats])

  return (
    <div className="space-y-7">
      <section>
        <p className="rise text-lg font-medium text-muted">{hello}{first ? `, ${first}` : ''}</p>
        <h1 className="rise rise-2 mt-1 text-4xl font-bold leading-tight tracking-tight">{t('home.title')}</h1>
      </section>

      <section aria-label="Search" className="rise rise-3 space-y-3">
        <div className="relative">
          <MapPin size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand" aria-hidden />
          <select aria-label={t('find.where')} name="district" value={district} onChange={e => { setDistrict(e.target.value); setDistrictPref(e.target.value) }}
            className="min-h-14 w-full appearance-none rounded-full border border-line bg-white pl-12 pr-12 text-lg font-semibold text-ink">
            <option value="">{t('find.all')}</option>{DISTRICTS.map(d => <option key={d}>{d}</option>)}</select>
          <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        </div>
        <div className="relative">
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" name="service" autoComplete="off" spellCheck={false} aria-label={t('home.search')} value={q} onChange={e => setQ(e.target.value)} placeholder={t('home.search')}
            className="min-h-14 w-full rounded-full border border-line bg-white pl-12 pr-4 text-lg" />
        </div>
      </section>

      {recent.length > 0 && !q && <section aria-label={t('home.recent')}>
        <h2 className="text-sm font-semibold text-muted">{t('home.recent')}</h2>
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">{recent.map(c => { const Icon = iconFor(c.icon_name); return (
          <li key={c.id} className="shrink-0"><Link to={`/find/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 font-medium transition active:scale-95"><Icon size={18} className="text-brand" aria-hidden />{catName(c.slug, c.name)}</Link></li>) })}</ul></section>}

      <section aria-label="Services">
        {error && <p role="alert" className="text-error">{error}</p>}
        {!error && !cats && <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">{Array.from({ length: 9 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-subtle" />)}</div>}
        {cats && shown.length === 0 && <p className="rounded-2xl bg-subtle p-4"><span>{t('home.nomatch')} </span><Link to={`/workers?q=${encodeURIComponent(q)}`} className="font-semibold text-brand">{t('home.browse')}</Link></p>}
        {shown.length > 0 && <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
          {shown.map((c, i) => { const Icon = iconFor(c.icon_name); return (
            <li key={c.id}><Link to={`/find/${c.slug}`} style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }} className="pop group flex flex-col items-center gap-2 text-center active:scale-95 transition-transform duration-150">
              <span className="grid aspect-[1/0.9] w-full place-items-center rounded-3xl border border-line bg-white text-brand transition-colors duration-150 group-hover:border-brand/40 group-active:bg-brand-soft"><Icon size={36} strokeWidth={1.6} aria-hidden /></span>
              <span className="line-clamp-2 min-h-10 text-sm font-semibold leading-tight">{catName(c.slug, c.name)}</span></Link></li>) })}</ul>}
      </section>

      <section aria-label="More" className="-mx-4">
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
          {[{ to: '/jobs/new', label: t('home.post'), icon: Briefcase, cls: 'bg-brand text-white', ic: 'text-lime' },
            { to: '/signup', label: t('home.join'), icon: HardHat, cls: 'bg-night text-white', ic: 'text-lime' },
            { to: '/workers', label: t('home.browse'), icon: Users, cls: 'bg-lime text-ink', ic: 'text-ink' }].map(c => (
            <li key={c.to} className="w-[72%] shrink-0 snap-start sm:w-auto">
              <Link to={c.to} className={`${c.cls} flex min-h-28 items-end justify-between gap-3 rounded-3xl p-4 transition-transform duration-150 active:scale-[0.97]`}>
                <span className="text-lg font-bold leading-tight">{c.label}</span>
                <span className="flex items-center gap-1"><c.icon size={28} className={c.ic} aria-hidden /><ChevronRight size={20} aria-hidden /></span></Link></li>))}
        </ul>
      </section>
    </div>)
}
