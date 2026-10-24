import { supabase } from './supabase'
export type Contacted = { worker_id: string; name: string; service: string; at: number; snooze?: number }
const KEY = 'wl_contacted'
export function getContacted(): Contacted[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Contacted[] } catch { return [] } }
function save(l: Contacted[]) { try { localStorage.setItem(KEY, JSON.stringify(l.slice(0, 10))) } catch { /* storage blocked */ } }
export function removeContacted(id: string) { save(getContacted().filter(e => e.worker_id !== id)) }
export function snoozeContacted(id: string, ms: number) { save(getContacted().map(e => e.worker_id === id ? { ...e, snooze: Date.now() + ms } : e)) }
// Called when someone taps Call or WhatsApp. Never blocks the call itself.
export function recordContact(e: Omit<Contacted, 'at'>, uid: string | undefined, channel: 'call' | 'whatsapp') {
  if (uid && uid === e.worker_id) return
  save([{ ...e, at: Date.now() }, ...getContacted().filter(x => x.worker_id !== e.worker_id)])
  if (uid) void supabase.from('contact_clicks').upsert({ customer_id: uid, worker_id: e.worker_id, channel }, { onConflict: 'customer_id,worker_id' })
}
