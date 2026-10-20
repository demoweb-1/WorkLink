import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

// variant "top": text-only segmented control inside the header pill (desktop).
// variant "bottom": floating Liquid Glass tab bar (mobile).
export default function GlassNav({ items, variant }: { items: NavItem[]; variant: 'top' | 'bottom' }) {
  const { pathname } = useLocation()
  const n = items.length
  const idx = items.findIndex(i => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(i.to + '/')))
  const top = variant === 'top'
  return (
    <nav aria-label={top ? 'Main' : 'Tabs'}
      className={top ? 'hidden md:block' : 'glass fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-md rounded-full p-1 md:hidden'}
      style={top ? { width: `${n * 7.5}rem` } : undefined}>
      <div className="relative grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        <span aria-hidden className="lens" style={{ width: `${100 / n}%`, transform: `translateX(${Math.max(idx, 0) * 100}%)`, opacity: idx >= 0 ? 1 : 0 }} />
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `relative z-10 flex items-center justify-center rounded-full font-medium transition-colors duration-200 active:scale-95 ${isActive ? 'text-brand' : 'text-ink/70'} ${top ? 'min-h-11 text-sm' : 'min-h-14 flex-col gap-0.5 text-xs'}`}>
            {!top && <Icon size={22} strokeWidth={1.75} aria-hidden />}{label}
          </NavLink>))}
      </div>
    </nav>)
}
