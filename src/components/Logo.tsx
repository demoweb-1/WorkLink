import { BRAND } from '../lib/constants'
import { IS_WORKER_APP } from '../lib/app'

export default function Logo({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={`${import.meta.env.BASE_URL}logo-symbol.png`} alt="" width={size} height={size} className="shrink-0 object-contain" />
      <span translate="no" className="text-[1.4rem] font-extrabold leading-none tracking-tight">{BRAND}</span>
      {IS_WORKER_APP && <span className="rounded-full bg-amber px-2 py-0.5 text-xs font-bold leading-none text-ink">Worker</span>}
    </span>)
}
