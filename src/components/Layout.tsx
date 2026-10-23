import { Link, Outlet, useLocation } from 'react-router-dom'
import { Home, Search, Briefcase, CalendarCheck, User, LogIn } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { BRAND } from '../lib/constants'
import { btnPrimary, btnSecondary } from '../lib/ui'
import GlassNav, { type NavItem } from './GlassNav'

export default function Layout() {
  const { session, signOut } = useAuth()
  const { pathname } = useLocation()
  const items: NavItem[] = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/workers', label: 'Workers', icon: Search },
    ...(session ? [{ to: '/jobs', label: 'Jobs', icon: Briefcase }, { to: '/bookings', label: 'Bookings', icon: CalendarCheck }] : []),
    ...(session ? [{ to: '/account', label: 'Account', icon: User }] : [{ to: '/signin', label: 'Sign in', icon: LogIn }]),
  ]
  const topItems = items.filter(i => i.to !== '/signin')
  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div aria-hidden className="ambient" />
      <header className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="glass mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5">
          <Link to="/" className="inline-flex min-h-11 items-center text-xl font-bold tracking-tight">{BRAND}<span className="text-lime">.</span></Link>
          <GlassNav items={topItems} variant="top" />
          <div className="flex items-center gap-1">
            {session ? <div className="hidden md:block"><button onClick={signOut} className={`${btnSecondary} !min-h-10 text-sm`}>Sign out</button></div>
              : <><Link to="/signin" className="hidden min-h-11 items-center px-4 text-sm font-medium md:inline-flex">Sign in</Link>
                  <Link to="/signup" className={`${btnPrimary} !min-h-10 text-sm`}>Create account</Link></>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-32 pt-8 md:pb-12">
        <div key={pathname} className="page-enter"><Outlet /></div>
        <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">Payment is arranged directly between customers and workers. {BRAND} does not collect or guarantee payment.</footer>
      </main>
      <GlassNav items={items} variant="bottom" />
    </div>)
}
