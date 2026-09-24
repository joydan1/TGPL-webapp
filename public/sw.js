// public/sw.js

// Take over as soon as a new version is installed, so edits apply on the next reload.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let payload = {}

  if (event.data) {
    try {
      payload = event.data.json()
    } catch {
      // Not JSON (the DevTools "Push" button sends plain text), so show it as the body.
      payload = { body: event.data.text() }
    }
  }

  // Browsers require a visible notification for every push, so always show one,
  // even if the payload is empty or missing fields.
  const title = payload.title || 'The Global Project Leaders'
  const options = {
    body: payload.body || '',
    icon: '/Logo.png',
    badge: '/badge-72.png',
    data: {
      url: payload.url || '/',
      notification_id: payload.notification_id,
      type: payload.type,
    },
  }
  // Same id replaces the older notification instead of stacking.
  if (payload.notification_id) options.tag = String(payload.notification_id)

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // The payload url is usually a path like "/dashboard", while client.url is absolute.
  const target = new URL(event.notification.data?.url || '/', self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin)

      if (existing) {
        try {
          await existing.focus()
          if (existing.url !== target) await existing.navigate(target)
          return
        } catch {
          // Fall through and open a new window instead.
        }
      }

      return self.clients.openWindow(target)
    })
  )
})