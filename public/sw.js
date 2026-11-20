// public/sw.js

const CACHE_NAME = 'tgpl-app-shell-v1'
const APP_SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
]

// Take over as soon as a new version is installed, so edits apply on the next reload.
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)))
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

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
    badge: '/footerlogo.png',
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

// Cache successful same-origin static assets. Never cache API requests.
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/v1/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})