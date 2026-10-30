// Supabase Edge Function: sends a phone alert to every worker who matches a new "Call me back" request.
// Triggered by a Database Webhook on INSERT into public.quick_requests.
// Secrets needed: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, WEBHOOK_SECRET
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

Deno.serve(async (req) => {
  if (req.headers.get('x-webhook-secret') !== Deno.env.get('WEBHOOK_SECRET')) return new Response('Forbidden', { status: 403 })
  const body = await req.json()
  const r = body.record as { id: string; category_id: string; district: string }
  if (!r?.id) return new Response('No record', { status: 400 })

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  // Same rule the Requests screen uses: active service in this category that covers this district.
  const { data: matches } = await sb.from('worker_services').select('worker_id').eq('is_active', true).eq('category_id', r.category_id).contains('service_areas', [r.district])
  const workerIds = [...new Set((matches ?? []).map((m: { worker_id: string }) => m.worker_id))]
  if (workerIds.length === 0) return Response.json({ sent: 0 })
  const { data: subs } = await sb.from('push_subscriptions').select('id,endpoint,p256dh,auth').in('user_id', workerIds)
  const { data: cat } = await sb.from('service_categories').select('name').eq('id', r.category_id).maybeSingle()

  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
  // The customer's phone number is never put in the alert; the worker opens the app to see it.
  const payload = JSON.stringify({ title: `New request: ${cat?.name ?? 'Customer'}`, body: `${r.district}. Tap to call.`, url: './', tag: r.id })
  let sent = 0
  await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 }); sent++ }
    catch (e) { const code = (e as { statusCode?: number }).statusCode; if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('id', s.id) }
  }))
  return Response.json({ sent })
})
