import { useState, useCallback } from 'react'
import { paymentAPI } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { PaymentMethod, CheckoutScreen, CardDetails, PaymentResult } from '../types'

const ORDER_REF = `TGPL-${Math.floor(10000000 + Math.random() * 90000000)}`

export const useCheckout = () => {
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
    go(m === 'card' ? 'card-details' : m === 'bank' ? 'bank-details' : 'ussd-details')
  }, [go])

  const processPayment = useCallback(async () => {
    if (!method) return
    go('processing')
    setIsProcessing(true)

    try {
      const res = await paymentAPI.verify({ referenceId: ORDER_REF, method })
      if (res.success && res.data?.status === 'success') {
        setResult({ success: true, orderId: ORDER_REF })
        go('success')
      } else {
        setResult({ success: false, referenceId: ORDER_REF, error: 'Payment declined' })
        go('failed')
      }
    } catch {
      setResult({ success: false, referenceId: ORDER_REF, error: 'Payment failed' })
      go('failed')
    } finally {
      setIsProcessing(false)
    }
  }, [method, go])

  const retry = useCallback(() => {
    if (!method) return
    go(method === 'card' ? 'card-details' : method === 'bank' ? 'bank-details' : 'ussd-details')
  }, [method, go])

  const reset = useCallback(() => {
    setMethod(null)
    setCardDetails({ number: '', name: '', expiry: '', cvv: '' })
    setResult(null)
    go('checkout')
  }, [go])

  return {
    screen, method, email, setEmail,
    promoCode, setPromoCode,
    cardDetails, setCardDetails,
    result, isProcessing,
    orderRef: ORDER_REF,
    go, proceed, processPayment, retry, reset,
  }
}