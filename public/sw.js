// Mithra Worker service worker: shows phone alerts for new customer requests.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('push', e => {
  let d = {}
  try { d = e.data ? e.data.json() : {} } catch (_) { /* ignore bad payload */ }
  e.waitUntil(self.registration.showNotification(d.title || 'Mithra Worker', {
    body: d.body || '', icon: 'icon-192-worker.png', badge: 'favicon-worker.png', tag: d.tag || 'request', data: { url: d.url || './' } }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const target = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus()
    return self.clients.openWindow(target)
  }))
})
