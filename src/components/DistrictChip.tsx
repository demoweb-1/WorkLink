import { ChevronDown, MapPin } from 'lucide-react'
import { DISTRICTS } from '../lib/constants'
import { useI18n } from '../lib/i18n'

// Looks like a location chip; the real <select> sits invisibly on top so it opens the native picker.
export default function DistrictChip({ value, onChange, required = false }: { value: string; onChange: (d: string) => void; required?: boolean }) {
  const { t } = useI18n()
  return (
    <label className="relative inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full bg-brand-soft pl-3.5 pr-3 font-semibold text-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand">
      <MapPin size={18} aria-hidden /><span className="truncate">{value || (required ? t('rq.pick') : t('find.all'))}</span><ChevronDown size={16} aria-hidden />
      <select aria-label={t('find.where')} name="district" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {required ? <option value="" disabled>{t('rq.pick')}</option> : <option value="">{t('find.all')}</option>}
        {DISTRICTS.map(d => <option key={d}>{d}</option>)}</select>
    </label>)
}
