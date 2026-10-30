import { supabase } from './supabase'

// Public key (safe to ship). The matching private key lives only in the Supabase Edge Function secrets.
const VAPID_PUBLIC_KEY = 'BCPnnNk9XQPPcv9ORdB9QEIuIplfzFTw8_xb2SMcDH7XOYn3y50CBwFOKsUovK_5DdOPDw3pTwRHYY1bpvNL4tE'
const SCOPE = import.meta.env.BASE_URL

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isInstalledApp = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true

function keyBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}
async function register() {
  const reg = await navigator.serviceWorker.register(`${SCOPE}sw.js`, { scope: SCOPE })
  await navigator.serviceWorker.ready
  return reg
}
async function save(sub: PushSubscription) {
  const j = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
  const { error } = await supabase.rpc('save_push_subscription', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth })
  if (error) throw error
}
export async function pushStatus(): Promise<'on' | 'off' | 'blocked' | 'unsupported'> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'blocked'
  const reg = await navigator.serviceWorker.getRegistration(SCOPE)
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}
export async function enablePush(): Promise<'on' | 'blocked'> {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return 'blocked'
  const reg = await register()
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }))
  await save(sub)
  return 'on'
}
// Re-link this device to whoever is signed in now (a phone can change hands).
export async function syncPush() {
  if (!pushSupported() || Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker.getRegistration(SCOPE)
  const sub = await reg?.pushManager.getSubscription()
  if (sub) await save(sub)
}
export async function disablePush() {
  if (!pushSupported()) return
  try {
    const reg = await navigator.serviceWorker.getRegistration(SCOPE)
    const sub = await reg?.pushManager.getSubscription()
    if (sub) { await supabase.rpc('remove_push_subscription', { p_endpoint: sub.endpoint }); await sub.unsubscribe() }
  } catch { /* nothing to undo */ }
}
