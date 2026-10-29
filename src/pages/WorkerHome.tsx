import { Link } from 'react-router-dom'
import { PhoneIncoming, UserPlus, Wrench, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { CUSTOMER_PATH } from '../lib/app'
import { btnPrimary, btnSecondary, cardCls } from '../lib/ui'
import Requests from './Requests'

function Welcome() {
  const { t } = useI18n()
  const steps = [{ icon: Wrench, label: t('wk.s1') }, { icon: PhoneIncoming, label: t('wk.s2') }, { icon: Star, label: t('wk.s3') }]
  return (
    <div className="max-w-xl space-y-8">
      <section>
        <h1 className="rise text-[2.5rem] font-bold leading-[1.08] tracking-tight sm:text-5xl">{t('wk.title')}</h1>
        <p className="rise rise-2 mt-3 text-lg text-muted">{t('wk.sub')}</p>
        <div className="rise rise-3 mt-6 flex flex-wrap gap-3">
          <Link to="/signup" className={`${btnPrimary} !min-h-14 text-lg`}><UserPlus size={22} aria-hidden />{t('nav.create')}</Link>
          <Link to="/signin" className={`${btnSecondary} !min-h-14 text-lg`}>{t('nav.signin')}</Link></div>
      </section>
      <ol className="grid gap-3 sm:grid-cols-3">{steps.map(({ icon: Icon, label }, i) => (
        <li key={label} style={{ animationDelay: `${i * 70}ms` }} className={`${cardCls} pop flex items-center gap-3 p-4 sm:flex-col sm:items-start`}>
          <span className="app-icon grid size-14 shrink-0 place-items-center"><Icon size={28} aria-hidden /></span>
          <span className="text-lg font-semibold leading-tight">{label}</span></li>))}</ol>
      <a href={CUSTOMER_PATH} className="flex min-h-14 items-center justify-between rounded-2xl border border-line bg-white px-4 font-medium active:bg-subtle">{t('wk.cust')}<span aria-hidden>&rsaquo;</span></a>
    </div>)
}

// Worker app home: welcome screen when signed out, customer requests when signed in.
export default function WorkerHome() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const { t } = useI18n()
  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  if (!session) return <Welcome />
  if (!profile) return <div className="h-48 animate-pulse rounded-2xl bg-subtle" />
  if (!profile.is_worker) return (
    <div className={`${cardCls} max-w-md space-y-4 p-6`}><p className="text-lg">{t('wk.enable')}</p>
      <button className={btnPrimary} onClick={async () => { await supabase.from('profiles').update({ is_worker: true }).eq('id', session.user.id); await refreshProfile() }}>{t('wk.enablebtn')}</button></div>)
  return <Requests />
}
