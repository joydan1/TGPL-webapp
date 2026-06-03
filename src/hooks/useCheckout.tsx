import { useState, useCallback, createContext, useContext } from 'react'
import { paymentAPI } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { PaymentMethod, CheckoutScreen, CardDetails, PaymentResult } from '../types'

// ── Context ───────────────────────────
interface CheckoutState {
  screen: CheckoutScreen
  method: PaymentMethod | null
  email: string
  promoCode: string
  cardDetails: CardDetails
  result: PaymentResult | null
  isProcessing: boolean
  orderRef: string
  setEmail: (email: string) => void
  setPromoCode: (code: string) => void
  setCardDetails: (fn: (prev: CardDetails) => CardDetails) => void
  go: (screen: CheckoutScreen) => void
  proceed: (method: PaymentMethod) => void
  processPayment: () => Promise<void>
  retry: () => void
  reset: () => void
}

const CheckoutContext = createContext<CheckoutState | null>(null)

const ORDER_REF = `TGPL-${Math.floor(10000000 + Math.random() * 90000000)}`

// ── Provider ───────────────────────────────────────────────────────────────
export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(s => s.user)
  const [screen, setScreen] = useState<CheckoutScreen>('checkout')
  const [method, setMethod] = useState<PaymentMethod | null>(null)
  const [email, setEmail] = useState(user?.email ?? '')
  const [promoCode, setPromoCode] = useState('')
  const [cardDetails, setCardDetails] = useState<CardDetails>({ number: '', name: '', expiry: '', cvv: '' })
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const go = useCallback((s: CheckoutScreen) => setScreen(s), [])

  const proceed = useCallback((m: PaymentMethod) => {
    setMethod(m)
    if (m === 'card') setScreen('card-details')
    else if (m === 'bank') setScreen('bank-details')
    else setScreen('ussd-details')
  }, [])

  const processPayment = useCallback(async () => {
    if (!method) return
    setScreen('processing')
    setIsProcessing(true)
    try {
      const res = await paymentAPI.verify({ referenceId: ORDER_REF, method })
      if (res.success && res.data?.status === 'success') {
        setResult({ success: true, orderId: ORDER_REF })
        setScreen('success')
      } else {
        setResult({ success: false, referenceId: ORDER_REF, error: 'Payment declined' })
        setScreen('failed')
      }
    } catch {
      setResult({ success: false, referenceId: ORDER_REF, error: 'Payment failed' })
      setScreen('failed')
    } finally {
      setIsProcessing(false)
    }
  }, [method])

  const retry = useCallback(() => {
    if (!method) return
    setScreen(method === 'card' ? 'card-details' : method === 'bank' ? 'bank-details' : 'ussd-details')
  }, [method])

  const reset = useCallback(() => {
    setMethod(null)
    setCardDetails({ number: '', name: '', expiry: '', cvv: '' })
    setResult(null)
    setScreen('checkout')
  }, [])

  return (
    <CheckoutContext.Provider value={{
      screen, method, email, promoCode, cardDetails, result, isProcessing, orderRef: ORDER_REF,
      setEmail, setPromoCode, setCardDetails, go, proceed, processPayment, retry, reset,
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