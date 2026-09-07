import { useState, useRef, useCallback, useEffect, createContext, useContext } from 'react'
import { useAuthStore } from '../store/auth'
import { paymentAPI } from '../services/api'
import type { CheckoutResponse, FreeCourseCheckoutResponse } from '../services/api'
import type { CheckoutScreen, PaymentResult } from '../types'

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

const POLL_INTERVAL_MS = 3000
const POLL_MAX_ATTEMPTS = 10
const POLL_MAX_ERRORS = 3

type PromoStatus = 'idle' | 'validating' | 'applied' | 'error'

interface AppliedPromo {
  code: string
  originalPriceKobo: number
  discountKobo: number
  finalPriceKobo: number
}

// Copy for the rejection reasons confirmed so far. Extend this map as
// Mark sends the remaining shapes (expired / not-started / already-used / not-found) —
// anything not listed here falls back to the backend's own `detail` string.
const PROMO_REASON_COPY: Record<string, string> = {
  course_is_free: 'This course is already free — promo codes don\u2019t apply.',
  promo_code_exhausted: 'This code has reached its usage limit.',
  course_not_applicable: 'This promo code is not applicable to this course.',
  promo_code_not_applicable: 'This promo code is not applicable to this course.',
  promo_not_applicable: 'This promo code is not applicable to this course.',
  course_not_eligible: 'This promo code is not applicable to this course.',
}

function promoRejectionMessage(reason: string, detail?: string): string {
  if (PROMO_REASON_COPY[reason]) return PROMO_REASON_COPY[reason]
  if (detail && /not applicable|not eligible|does not apply|doesn\u2019t apply/i.test(detail)) {
    return 'This promo code is not applicable to this course.'
  }
  return detail ?? 'That code can\u2019t be used right now.'
}

interface CheckoutState {
  screen: CheckoutScreen
  email: string
  promoCode: string
  promoStatus: PromoStatus
  appliedPromo: AppliedPromo | null
  promoError: string | null
  reference: string | null
  result: PaymentResult | null
  isProcessing: boolean
  error: string | null
  setEmail: (email: string) => void
  setPromoCode: (code: string) => void
  applyPromo: (courseSlug: string) => Promise<void>
  go: (screen: CheckoutScreen) => void
  initiatePayment: (courseSlug: string) => Promise<void>
  retryPayment: () => void
}

const CheckoutContext = createContext<CheckoutState | null>(null)

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)

  const [screen, setScreen]       = useState<CheckoutScreen>('checkout')
  const [email, setEmail]         = useState(user?.email ?? '')
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus]   = useState<PromoStatus>('idle')
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null)
  const [promoError, setPromoError]     = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [result, setResult]       = useState<PaymentResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollAttempts = useRef(0)
  const pollErrors   = useRef(0)

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    pollAttempts.current = 0
    pollErrors.current = 0
  }, [])

  const failPayment = useCallback((reason: string) => {
    stopPolling()
    setResult(prev => prev
      ? { ...prev, status: 'failed', is_terminal: true, failure_reason: reason }
      : {
          reference: '',
          status: 'failed',
          amount_kobo: 0,
          amount_naira: '0.00',
          paid_at: null,
          is_terminal: true,
          failure_reason: reason,
          course: { slug: '', title: '', trainer_name: '' },
          created_at: new Date().toISOString(),
        }
    )
    setIsProcessing(false)
    setScreen('failed')
  }, [stopPolling])

  const pollStatus = useCallback((ref: string) => {
    stopPolling()

    pollRef.current = setInterval(async () => {
      pollAttempts.current += 1

      if (pollAttempts.current > POLL_MAX_ATTEMPTS) {
        failPayment('Payment could not be confirmed. Please contact support if your card was charged.')
        return
      }

      const res = await paymentAPI.getStatus(ref)

      if (!res.success) {
        pollErrors.current += 1
        if (pollErrors.current >= POLL_MAX_ERRORS) {
          failPayment('Unable to verify payment status. Please contact support.')
        }
        return
      }

      pollErrors.current = 0

      const data = res.data!
      if (data.is_terminal) {
        stopPolling()
        setResult(data)
        setIsProcessing(false)
        setScreen(data.status === 'succeeded' ? 'success' : 'failed')
      }
    }, POLL_INTERVAL_MS)
  }, [stopPolling, failPayment])

  // Editing the promo box after a code was applied or rejected clears that
  // state, so a stale discount can't ride along on a changed input.
  const setPromoCodeChecked = useCallback((code: string) => {
    setPromoCode(code)
    setPromoStatus(prevStatus => {
      if (prevStatus !== 'idle') {
        setAppliedPromo(null)
        setPromoError(null)
        return 'idle'
      }
      return prevStatus
    })
  }, [])

  const applyPromo = useCallback(async (courseSlug: string) => {
    const code = promoCode.trim()
    if (!code) return
    setPromoStatus('validating')
    setPromoError(null)

    const res = await paymentAPI.validatePromoCode(code, courseSlug)

    if (!res.success) {
      setPromoStatus('error')
      setPromoError('Something went wrong checking that code. Please try again.')
      return
    }

    const data = res.data!
    if (!data.valid) {
      setPromoStatus('error')
      setAppliedPromo(null)
      setPromoError(promoRejectionMessage(data.reason, data.detail))
      return
    }

    setPromoStatus('applied')
    setAppliedPromo({
      code: data.code,
      originalPriceKobo: data.original_price_kobo,
      discountKobo: data.discount_kobo,
      finalPriceKobo: data.final_price_kobo,
    })
    setPromoCode(data.code)
  }, [promoCode])

  const clearPromo = useCallback(() => {
    setPromoStatus('idle')
    setAppliedPromo(null)
    setPromoError(null)
  }, [])

  const initiatePayment = useCallback(async (courseSlug: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      const configRes = await paymentAPI.getConfig()
      if (!configRes.success || !configRes.data) {
        throw new Error('Could not load payment configuration')
      }
      const { public_key } = configRes.data
      const checkoutRes = await paymentAPI.checkout(courseSlug, appliedPromo?.code)
      if (!checkoutRes.success) {
        throw new Error('error' in checkoutRes ? checkoutRes.error : 'Failed to initiate payment')
      }

      const checkoutData: CheckoutResponse | FreeCourseCheckoutResponse = checkoutRes.data

      if (checkoutData.is_free) {
        setResult({
          reference: checkoutData.reference,
          status: 'succeeded',
          amount_kobo: 0,
          amount_naira: '0.00',
          paid_at: new Date().toISOString(),
          is_terminal: true,
          failure_reason: null,
          course: { slug: courseSlug, title: '', trainer_name: '' },
          created_at: new Date().toISOString(),
        })
        setIsProcessing(false)
        setScreen('success')
        return
      }

      const { reference: ref, access_code, amount_kobo } = checkoutData as CheckoutResponse
      setReference(ref)

      await loadPaystackScript()
      setIsProcessing(false)

      const handler = window.PaystackPop.setup({
        key: public_key,
        email,
        amount: amount_kobo,
        ref,
        access_code,
        onClose: () => {
          setScreen('checkout')
        },
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
  }, [email, pollStatus, appliedPromo])

  const retryPayment = useCallback(() => {
    stopPolling()
    setReference(null)
    setResult(null)
    setError(null)
    setIsProcessing(false)
    clearPromo()
    setScreen('checkout')
  }, [stopPolling, clearPromo])

  return (
    <CheckoutContext.Provider value={{
      screen, email, promoCode, promoStatus, appliedPromo, promoError,
      reference, result, isProcessing, error,
      setEmail, setPromoCode: setPromoCodeChecked, applyPromo,
      go: setScreen,
      initiatePayment, retryPayment,
    }}>
      {children}
    </CheckoutContext.Provider>
  )
}

export const useCheckout = () => {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}