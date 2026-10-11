// TerangaLearn Service Worker — Push Notifications
const CACHE_NAME = 'terangalearn-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Réception d'une notification push
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'TerangaLearn', body: event.data.text() }
  }

  const {
    title = 'TerangaLearn',
    body = 'Tu as un nouveau message',
    icon = '/logo.png',
    badge = '/logo.png',
    url = '/dashboard',
    tag = 'terangalearn',
    data: extraData = {},
  } = data

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data: { url, ...extraData },
      vibrate: [100, 50, 100],
      requireInteraction: false,
    })
  )
})

// Clic sur la notification → ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, focus + navigation
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.postMessage({ type: 'NAVIGATE', url })
          return
        }
      }
      // Sinon ouvre un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Fermeture de notification
self.addEventListener('notificationclose', (event) => {
  // Analytics optionnel
})
