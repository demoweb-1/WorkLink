import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useI18n } from '../lib/i18n'
import { disablePush, enablePush, isInstalledApp, isIos, pushStatus, syncPush } from '../lib/push'
import { btnPrimary, cardCls } from '../lib/ui'

// Worker app: turn phone alerts on or off.
export default function AlertsCard() {
  const { session } = useAuth()
  const { t } = useI18n()
  const [state, setState] = useState<'on' | 'off' | 'blocked' | 'unsupported' | null>(null)
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null)
  useEffect(() => { pushStatus().then(s => { setState(s); if (s === 'on' && session) void syncPush().catch(() => {}) }) }, [session])
  if (!state) return null
  async function turnOn() {
    setBusy(true); setErr(null)
    try { setState(await enablePush()) } catch { setErr(t('al.fail')) } finally { setBusy(false) }
  }
  async function turnOff() { setBusy(true); await disablePush(); setState('off'); setBusy(false) }

  if (state === 'on') return (
    <div className={`${cardCls} flex items-center justify-between gap-3 p-4`}>
      <p role="status" className="flex items-center gap-2 font-semibold"><CheckCircle2 size={22} className="text-success" aria-hidden />{t('al.on')}</p>
      <button disabled={busy} onClick={turnOff} className="min-h-11 rounded-full px-4 text-sm font-semibold text-muted active:scale-95">{t('al.off')}</button></div>)
  if (state === 'blocked') return <p className="rounded-2xl bg-subtle p-4"><BellOff size={20} className="mb-1 inline" aria-hidden /> {t('al.blocked')}</p>
  if (state === 'unsupported' || (isIos() && !isInstalledApp())) return <p className="rounded-2xl bg-subtle p-4">{t('al.ios')}</p>
  return (
    <div className={`${cardCls} space-y-3 p-4`}>
      <p className="flex items-start gap-2 text-lg font-semibold leading-tight"><Bell size={24} className="mt-0.5 shrink-0" aria-hidden />{t('al.title')}</p>
      {err && <p role="alert" className="text-error">{err}</p>}
      <button disabled={busy} onClick={turnOn} className={`${btnPrimary} !min-h-14 w-full text-lg`}>{busy ? '…' : t('al.btn')}</button></div>)
}
