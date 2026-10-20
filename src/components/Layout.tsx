import { Link, NavLink, Outlet } from 'react-router-dom'
import { Home, Search, Wrench, User, LogIn, type LucideIcon } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { BRAND } from '../lib/constants'
import { btnPrimary, btnSecondary } from '../lib/ui'

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean }

export default function Layout() {
  const { session, profile, signOut } = useAuth()
  const items: Item[] = [
    { to: '/', label: 'Home', icon: Home, end: true },
    { to: '/workers', label: 'Workers', icon: Search },
    ...(session && profile?.is_worker ? [{ to: '/my-services', label: 'My services', icon: Wrench }] : []),
    ...(session ? [{ to: '/account', label: 'Account', icon: User }] : [{ to: '/signin', label: 'Sign in', icon: LogIn }]),
  ]
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-white/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2">
          <Link to="/" className="inline-flex min-h-11 items-center text-xl font-bold tracking-tight">{BRAND}<span className="text-lime">.</span></Link>
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {items.filter(i => i.to !== '/signin').map(i => (
              <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => `inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ${isActive ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-subtle'}`}>{i.label}</NavLink>))}
            {session ? <button onClick={signOut} className={`${btnSecondary} ml-2 !min-h-10 text-sm`}>Sign out</button>
              : <><Link to="/signin" className="inline-flex min-h-11 items-center px-4 text-sm font-medium">Sign in</Link><Link to="/signup" className={`${btnPrimary} !min-h-10 text-sm`}>Create account</Link></>}
          </nav>
          {!session && <Link to="/signup" className={`${btnPrimary} !min-h-10 text-sm md:hidden`}>Create account</Link>}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 md:pb-12"><Outlet />
        <footer className="mt-16 border-t border-line pt-6 text-sm text-muted">Payment is arranged directly between customers and workers. {BRAND} does not collect or guarantee payment.</footer>
      </main>
      <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line/70 bg-white/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium active:scale-95 ${isActive ? 'text-brand' : 'text-muted'}`}>
            <Icon size={22} strokeWidth={1.75} aria-hidden /> {label}</NavLink>))}
      </nav>
    </div>)
}
