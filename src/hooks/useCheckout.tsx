import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react'
import { useAuthStore } from '../store/auth'
import type { CheckoutScreen, PaymentResult } from '../types'

// ── Paystack types ─────────────────────────────────────────────────────────
declare global {
  interface Window {
    PaystackPop: {
      setup: (opts: {
        key: string
        email: string
        amount: number
        ref: string
        access_code?: string
        onClose: () => void
        callback: (response: { reference: string }) => void
      }) => { openIframe: () => void }
    }
  }
}

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve()
    const s = document.createElement('script')
    s.src = 'https://js.paystack.co/v1/inline.js'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(s)
  })
}

// ── Context shape ──────────────────────────────────────────────────────────
interface CheckoutState {
  screen: CheckoutScreen
  email: string
  promoCode: string
  reference: string | null
  result: PaymentResult | null
  isProcessing: boolean
  error: string | null
  setEmail: (email: string) => void
  setPromoCode: (code: string) => void
  go: (screen: CheckoutScreen) => void
  initiatePayment: (courseSlug: string) => Promise<void>
  retryPayment: () => void
}

const CheckoutContext = createContext<CheckoutState | null>(null)

// ── Provider ───────────────────────────────────────────────────────────────
export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)

  const [screen, setScreen] = useState<CheckoutScreen>('checkout')
  const [email, setEmail] = useState(user?.email ?? '')
  const [promoCode, setPromoCode] = useState('')
  const [reference, setReference] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Poll GET /api/v1/payments/{reference}/ every 3s until is_terminal
  const pollStatus = useCallback((ref: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/payments/${ref}/`, {
          credentials: 'include',
        })
        if (!res.ok) return // keep polling on non-fatal errors

        const data: PaymentResult = await res.json()

        if (data.is_terminal) {
          stopPolling()
          setResult(data)
          setIsProcessing(false)
          setScreen(data.status === 'succeeded' ? 'success' : 'failed')
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 3000)
  }, [stopPolling])

  const initiatePayment = useCallback(async (courseSlug: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // 1. Fetch Paystack public key
      const configRes = await fetch('/api/v1/payments/config/', {
        credentials: 'include',
      })
      if (!configRes.ok) throw new Error('Could not load payment configuration')
      const { public_key } = await configRes.json()

      // 2. Create (or reuse) transaction
      const checkoutRes = await fetch('/api/v1/payments/checkout/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ course_slug: courseSlug }),
      })

      if (!checkoutRes.ok) {
        const body = await checkoutRes.json().catch(() => ({}))
        throw new Error(body?.detail ?? 'Failed to initiate payment')
      }

      const checkoutData = await checkoutRes.json()

      // 3. Free course — no Paystack needed
      if (checkoutData.is_free) {
        setResult({ ...checkoutData, status: 'succeeded', is_terminal: true, failure_reason: null })
        setIsProcessing(false)
        setScreen('success')
        return
      }

      const { reference: ref, access_code, amount_kobo } = checkoutData
      setReference(ref)

      // 4. Load Paystack inline script and open modal
      await loadPaystackScript()
      setIsProcessing(false) // loading done — modal takes over

      const handler = window.PaystackPop.setup({
        key: public_key,
        email,
        amount: amount_kobo,
        ref,
        access_code,
        // User closed the modal — they may or may not have paid, so poll anyway
        onClose: () => {
          setScreen('processing')
          pollStatus(ref)
        },
        // Paystack signals completion — poll to verify with your backend
        callback: () => {
          setScreen('processing')
          pollStatus(ref)
        },
      })

      handler.openIframe()
    } catch (e: unknown) {
      setIsProcessing(false)
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
  }, [email, pollStatus])

  // Reset everything and return to checkout so user can try again
  const retryPayment = useCallback(() => {
    stopPolling()
    setReference(null)
    setResult(null)
    setError(null)
    setIsProcessing(false)
    setScreen('checkout')
  }, [stopPolling])

  return (
    <CheckoutContext.Provider value={{
      screen,
      email,
      promoCode,
      reference,
      result,
      isProcessing,
      error,
      setEmail,
      setPromoCode,
      go: setScreen,
      initiatePayment,
      retryPayment,
    }}>
      {children}
    </CheckoutContext.Provider>
  )
}

// ── Hook ───────────────────────────────────────────────────────────────────
export const useCheckout = () => {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}