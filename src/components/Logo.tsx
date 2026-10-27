import { BRAND } from '../lib/constants'

export default function Logo({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={`${import.meta.env.BASE_URL}logo-symbol.png`} alt="" width={size} height={size} className="shrink-0 object-contain" />
      <span translate="no" className="text-[1.4rem] font-extrabold leading-none tracking-tight">{BRAND}</span>
    </span>)
}
