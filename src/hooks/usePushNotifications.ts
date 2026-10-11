'use client'

import { useState, useEffect, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export type PushState = 'unsupported' | 'denied' | 'granted' | 'default' | 'loading'

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('loading')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  // Enregistre le service worker et vérifie l'état actuel
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }

    navigator.serviceWorker.register('/sw.js').then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setSubscription(existing)

      const perm = Notification.permission
      if (perm === 'denied') setState('denied')
      else if (perm === 'granted' && existing) setState('granted')
      else setState('default')
    }).catch(() => setState('unsupported'))
  }, [])

  // Naviguer vers une URL reçue via message du SW
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        window.location.href = event.data.url
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) return false
    setState('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()

      if (perm !== 'granted') {
        setState('denied')
        return false
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      // Enregistrer en base
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })

      if (res.ok) {
        setSubscription(sub)
        setState('granted')
        return true
      } else {
        await sub.unsubscribe()
        setState('default')
        return false
      }
    } catch (err) {
      console.error('Push subscribe failed:', err)
      setState('default')
      return false
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false
    setState('loading')
    try {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      })

      setSubscription(null)
      setState('default')
      return true
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
      setState('granted')
      return false
    }
  }, [subscription])

  return { state, subscription, subscribe, unsubscribe }
}
