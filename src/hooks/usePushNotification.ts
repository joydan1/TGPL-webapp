// hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react'
import { pushAPI } from '../services/pushApi'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// iOS Safari (and any other browser on iOS, since they're all WebKit under the
// hood) only supports Web Push when the site has been added to the Home

function detectIOSHomeScreenState() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isIOS: false, isStandalone: false, needsHomeScreenInstall: false }
  }

  const ua = navigator.userAgent
  // Covers iPhone/iPod, iPad on iOS <13, and iPad on iOS 13+ which reports as
  // "MacIntel" but exposes touch points a real Mac never has.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  // Standalone = launched from a Home Screen icon. iOS exposes this as
  // navigator.standalone (non-standard, Safari-only); other browsers use the
  // display-mode media query.
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia?.('(display-mode: standalone)').matches === true

  return { isIOS, isStandalone, needsHomeScreenInstall: isIOS && !isStandalone }
}

export function usePushNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
  const [permission, setPermission] = useState<NotificationPermission | null>(
    isSupported ? Notification.permission : null,
  )
  const [subscribing, setSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [{ isIOS, isStandalone, needsHomeScreenInstall }] = useState(detectIOSHomeScreenState)

  // If the browser already granted permission in a previous session, silently
  // re-register the subscription (idempotent server-side) — no prompt shown.
  useEffect(() => {
    if (!isSupported || Notification.permission !== 'granted') return
    if (needsHomeScreenInstall) return // iOS Safari not installed — nothing to re-subscribe
    registerAndSubscribe().catch(() => {
      // silent — this is a background sync, not a user-initiated action
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, needsHomeScreenInstall])

   async function registerAndSubscribe() {
    const registration = await navigator.serviceWorker.register('/sw.js')
    const keyRes = await pushAPI.getVapidPublicKey()
    if (!keyRes.success) throw new Error(keyRes.error)

    if (!keyRes.data.public_key) {
      // Not an error — push just isn't configured on this environment yet.
      return null
    }

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.data.public_key),
      })
    }

    const json = subscription.toJSON()
    const result = await pushAPI.subscribe({
      endpoint: json.endpoint!,
      keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      user_agent: navigator.userAgent,
    })
    if (!result.success) throw new Error(result.error)
    return subscription
  }

   const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications are not supported in this browser.')
      return false
    }
    if (needsHomeScreenInstall) {
      setError('Add this app to your Home Screen first, then enable notifications from there.')
      return false
    }
    setSubscribing(true)
    setError(null)

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setSubscribing(false)
        return false
      }
      const subscription = await registerAndSubscribe()
      setSubscribing(false)
      if (subscription === null) {
        setError('Push notifications aren\'t available in this environment yet.')
        return false
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications.')
      setSubscribing(false)
      return false
    }
  }, [isSupported, needsHomeScreenInstall])

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (!subscription) return

    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    await pushAPI.unsubscribe(endpoint)
  }, [isSupported])

  return {
    isSupported,
    permission,
    subscribing,
    error,
    subscribe,
    unsubscribe,
    isIOS,
    isStandalone,
    needsHomeScreenInstall,
  }
}