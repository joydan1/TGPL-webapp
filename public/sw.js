// public/sw.js
self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json()

  const { title, body, url, notification_id, type } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/Logo.png',        // swap for your actual icon path
      badge: '/badge-72.png',
      data: { url, notification_id, type },
      tag: notification_id,          // replaces older notifications of the same id instead of stacking
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url
  if (!url) return

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url === url)
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})