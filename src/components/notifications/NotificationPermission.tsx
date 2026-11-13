'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

/**
 * Demande la permission push et enregistre la subscription VAPID.
 * Affiche une bannière discrète en bas du dashboard si la permission
 * n'a pas encore été accordée (ou refusée).
 * S'efface une fois la permission accordée ou refusée définitivement.
 */
export default function NotificationPermission() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    // Pas de support = on ne fait rien
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return

    const perm = Notification.permission
    setStatus(perm)

    // Afficher la bannière seulement si l'utilisateur n'a pas encore décidé
    // et qu'il n'a pas fermé la bannière manuellement cette session
    const dismissed = sessionStorage.getItem('notif-banner-dismissed')
    if (perm === 'default' && !dismissed) {
      setShow(true)
    }
  }, [])

  const dismiss = () => {
    sessionStorage.setItem('notif-banner-dismissed', '1')
    setShow(false)
  }

  const requestPermission = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      setStatus(permission)

      if (permission === 'granted') {
        await subscribeUser()
        setShow(false)
      } else {
        setShow(false)
      }
    } catch (err) {
      console.error('Permission push refusée :', err)
    } finally {
      setLoading(false)
    }
  }

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY non défini')
        return
      }

      // Convertir la clé VAPID base64 → Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // Envoyer la subscription au serveur
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
          userAgent: navigator.userAgent.slice(0, 200),
        }),
      })
    } catch (err) {
      console.error('Erreur subscription push :', err)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-green/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell className="w-4 h-4 text-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
            Activer les notifications
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
            Reçois les annonces importantes de TerangaLearn directement sur ton appareil.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={requestPermission}
              disabled={loading}
              className="flex-1 py-1.5 rounded-lg bg-green text-white text-xs font-semibold hover:bg-green/90 disabled:opacity-60 transition"
            >
              {loading ? 'Activation…' : 'Activer'}
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
