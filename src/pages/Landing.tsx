import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ChevronRight, HardHat, Search, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { iconFor } from '../lib/icons'
import type { Cat } from '../lib/constants'
import { getDistrict, getRecent, setDistrictPref } from '../lib/recent'
import DistrictChip from '../components/DistrictChip'

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
    <div className="space-y-6">
      <section>
        <p className="rise text-lg font-medium text-muted">{hello}{first ? `, ${first}` : ''}</p>
        <h1 className="rise rise-2 mt-1 text-[2.5rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">{t('home.title')}</h1>
        <div className="rise rise-3 mt-4"><DistrictChip value={district} onChange={d => { setDistrict(d); setDistrictPref(d) }} /></div>
      </section>

      <div className="rise rise-3 relative">
        <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input type="search" name="service" autoComplete="off" spellCheck={false} aria-label={t('home.search')} value={q} onChange={e => setQ(e.target.value)} placeholder={t('home.search')}
          className="min-h-12 w-full rounded-full bg-black/[0.05] pl-12 pr-4 text-lg outline-none transition-colors duration-150 placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-brand" />
      </div>

      {recent.length > 0 && !q && <section aria-label={t('home.recent')}>
        <h2 className="text-sm font-semibold text-muted">{t('home.recent')}</h2>
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">{recent.map(c => { const Icon = iconFor(c.icon_name); return (
          <li key={c.id} className="shrink-0"><Link to={`/find/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 font-medium shadow-[0_0_0_1px_rgba(15,23,42,.08)] transition-transform active:scale-95"><Icon size={18} className="text-brand" aria-hidden />{catName(c.slug, c.name)}</Link></li>) })}</ul></section>}

      <section aria-label="Services">
        {error && <p role="alert" className="text-error">{error}</p>}
        {!error && !cats && <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">{Array.from({ length: 9 }, (_, i) => <div key={i} className="mx-auto size-[4.75rem] animate-pulse rounded-[24%] bg-subtle" />)}</div>}
        {cats && shown.length === 0 && <p className="rounded-2xl bg-subtle p-4"><span>{t('home.nomatch')} </span><Link to={`/workers?q=${encodeURIComponent(q)}`} className="font-semibold text-brand">{t('home.browse')}</Link></p>}
        {shown.length > 0 && <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5">
          {shown.map((c, i) => { const Icon = iconFor(c.icon_name); return (
            <li key={c.id}><Link to={`/find/${c.slug}`} style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }} className="pop flex flex-col items-center gap-2 text-center transition-transform duration-150 active:scale-90">
              <span className="app-icon grid size-[4.75rem] place-items-center"><Icon size={36} strokeWidth={1.75} aria-hidden /></span>
              <span className="line-clamp-2 text-[13px] font-semibold leading-tight">{catName(c.slug, c.name)}</span></Link></li>) })}</ul>}
      </section>

      <section aria-label="More" className="-mx-4">
        <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:grid sm:grid-cols-3 sm:overflow-visible">
          {[{ to: '/jobs/new', label: t('home.post'), icon: Briefcase, cls: 'tone-blue', ic: 'text-lime' },
            { to: '/signup', label: t('home.join'), icon: HardHat, cls: 'tone-night', ic: 'text-lime' },
            { to: '/workers', label: t('home.browse'), icon: Users, cls: 'tone-lime', ic: 'text-ink' }].map(c => (
            <li key={c.to} className="w-[74%] shrink-0 snap-start sm:w-auto">
              <Link to={c.to} className={`${c.cls} flex min-h-32 flex-col justify-between rounded-[28px] p-5 transition-transform duration-150 active:scale-[0.97]`}>
                <c.icon size={30} className={c.ic} aria-hidden />
                <span className="flex items-end justify-between gap-3"><span className="text-xl font-bold leading-tight">{c.label}</span><ChevronRight size={22} className="shrink-0 opacity-80" aria-hidden /></span></Link></li>))}
        </ul>
      </section>
    </div>)
}
