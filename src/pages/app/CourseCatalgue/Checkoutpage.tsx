import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Clock, BookOpen, CreditCard, Tag, Shield, MessageSquare, Play, Download } from 'lucide-react'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import { Card, CardBody } from '../../../components/Card'
import Input from '../../../components/Input'
import { paymentAPI } from '../../../services/api'
import { useAuthStore } from '../../../store/auth'
import { ROUTES } from '../../../constants/routes'

// ── Types ──────────────────────────────────────────────────────────────────
type Screen = 'checkout' | 'processing' | 'success' | 'failed'

interface CourseInfo {
  slug: string
  title: string
  trainerName: string
  priceNaira: string
  priceKobo: number
}

interface PaymentResult {
  reference: string
  status: 'pending' | 'succeeded' | 'failed'
  amount_kobo: number
  amount_naira: string
  paid_at: string | null
  is_terminal: boolean
  failure_reason: string | null
  course: { slug: string; title: string; trainer_name: string }
  created_at: string
}

interface CheckoutCtx {
  screen: Screen
  go: (s: Screen) => void
  email: string
  setEmail: (v: string) => void
  promoCode: string
  setPromoCode: (v: string) => void
  reference: string | null
  result: PaymentResult | null
  courseInfo: CourseInfo
  initiatePayment: () => Promise<void>
  retryPayment: () => void
  isLoading: boolean
  error: string | null
}

// ── Context ────────────────────────────────────────────────────────────────
const CheckoutContext = createContext<CheckoutCtx | null>(null)

const useCheckout = () => {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout must be used within CheckoutProvider')
  return ctx
}

// ── Paystack inline loader ─────────────────────────────────────────────────
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
    s.onerror = () => reject(new Error('Failed to load Paystack'))
    document.head.appendChild(s)
  })
}

function fmtNaira(raw: string): string {
  const num = parseFloat(raw)
  if (isNaN(num)) return `₦${raw}`
  return '₦' + num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Provider ───────────────────────────────────────────────────────────────
function CheckoutProvider({ children, courseInfo }: { children: React.ReactNode; courseInfo: CourseInfo }) {
  const user = useAuthStore(s => s.user)

  const [screen, setScreen] = useState<Screen>('checkout')
  const [email, setEmail] = useState(user?.email ?? '')
  const [promoCode, setPromoCode] = useState('')
  const [reference, setReference] = useState<string | null>(null)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Sync email when user loads into store after mount
  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const pollStatus = useCallback((ref: string) => {
    stopPolling()
    pollRef.current = setInterval(async () => {
      const res = await paymentAPI.getStatus(ref)
      if (!res.success) return
      const data = res.data!
      if (data.is_terminal) {
        stopPolling()
        setResult(data)
        setScreen(data.status === 'succeeded' ? 'success' : 'failed')
      }
    }, 3000)
  }, [stopPolling])

  const initiatePayment = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const configRes = await paymentAPI.getConfig()
      if (!configRes.success || !configRes.data) throw new Error('Failed to load payment configuration')
      const { public_key } = configRes.data

      const checkoutRes = await paymentAPI.checkout(courseInfo.slug)
      if (!checkoutRes.success || !checkoutRes.data) throw new Error(checkoutRes.error || 'Failed to initiate payment')

      const checkoutData = checkoutRes.data

      if (checkoutData.is_free) {
        setResult({
          reference: checkoutData.reference,
          status: 'succeeded',
          amount_kobo: 0,
          amount_naira: '0.00',
          paid_at: new Date().toISOString(),
          is_terminal: true,
          failure_reason: null,
          course: { slug: courseInfo.slug, title: courseInfo.title, trainer_name: courseInfo.trainerName },
          created_at: new Date().toISOString(),
        })
        setScreen('success')
        setIsLoading(false)
        return
      }

      const { reference: ref, access_code, amount_kobo } = checkoutData
      setReference(ref)

      await loadPaystackScript()
      setIsLoading(false)

      const handler = window.PaystackPop.setup({
        key: public_key,
        email,
        amount: amount_kobo,
        ref,
        access_code,
        onClose: () => { setScreen('processing'); pollStatus(ref) },
        callback: () => { setScreen('processing'); pollStatus(ref) },
      })
      handler.openIframe()
    } catch (e: unknown) {
      setIsLoading(false)
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }, [email, courseInfo, pollStatus])

  const retryPayment = useCallback(() => {
    setResult(null); setReference(null); setError(null); setScreen('checkout')
  }, [])

  return (
    <CheckoutContext.Provider value={{
      screen, go: setScreen,
      email, setEmail,
      promoCode, setPromoCode,
      reference, result,
      courseInfo,
      initiatePayment, retryPayment,
      isLoading, error,
    }}>
      {children}
    </CheckoutContext.Provider>
  )
}

// ── Shared UI ──────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15,18 9,12 15,6" />
  </svg>
)

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ background: '#fff', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, zIndex: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', padding: '0.25rem' }}><ChevronLeft /></button>
      <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>{title}</span>
    </div>
  )
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Review', 'Pay', 'Done']
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.25rem 0', maxWidth: 600, margin: '0 auto' }}>
      {steps.map((label, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <div key={label} style={{ display: 'contents' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: done || active ? '#2563EB' : '#E5E7EB', color: done || active ? '#fff' : '#9CA3AF' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg> : num}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: active || done ? '#111' : '#9CA3AF' }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div key={`d-${i}`} style={{ flex: 1, height: 1.5, background: done ? '#2563EB' : '#E5E7EB', margin: '0 0.5rem' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function CourseSummary() {
  const { courseInfo } = useCheckout()
  return (
    <Card variant="elevated">
      <CardBody style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src="/intro.png" alt={courseInfo.title} style={{ width: 80, height: 60, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
        <div>
          <p style={{ fontWeight: 700, color: '#111', margin: '0 0 0.2rem', fontSize: '0.9375rem' }}>{courseInfo.title}</p>
          <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>{courseInfo.trainerName}</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[{ icon: <Clock size={12} color="#9CA3AF" />, text: 'Full access' }, { icon: <BookOpen size={12} color="#9CA3AF" />, text: 'Certificate included' }].map(({ icon, text }) => (
              <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#6B7280' }}>{icon}{text}</span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

const wrap: React.CSSProperties = { maxWidth: 600, margin: '1.25rem auto 0', padding: '0 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }

// ── Checkout Screen ────────────────────────────────────────────────────────
function CheckoutScreen({ onBack }: { onBack: () => void }) {
  const { email, setEmail, promoCode, setPromoCode, initiatePayment, isLoading, error, courseInfo } = useCheckout()
  const [promoOpen, setPromoOpen] = useState(false)
  const canPay = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !isLoading

  return (
    <>
      <Header title="Checkout" onBack={onBack} />
      <Stepper step={1} />
      <div style={wrap}>
        <CourseSummary />

        {/* Order summary */}
        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', margin: 0 }}>Order summary</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#374151' }}>
              <span>Course price</span>
              <span>{fmtNaira(courseInfo.priceNaira)}</span>
            </div>
            <div style={{ height: 1, background: '#F3F4F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#2563EB' }}>{fmtNaira(courseInfo.priceNaira)}</span>
            </div>
          </CardBody>
          <div style={{ height: 1, background: '#F3F4F6' }} />
          {/* Promo code */}
          <div>
            <div onClick={() => setPromoOpen(o => !o)} style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>
                <Tag size={16} color="#6B7280" />Have a promo code?
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" style={{ transform: promoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>
            {promoOpen && (
              <div style={{ padding: '0 1.25rem 1.25rem', display: 'flex', gap: '0.625rem' }}>
                <Input placeholder="Enter promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} style={{ padding: '0.65rem 0.875rem' }} />
                <Button size="small" style={{ whiteSpace: 'nowrap' }}>Apply</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Email — pre-filled from user account, editable */}
        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', margin: 0 }}>Email address</p>
            <Input
              iconType="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              hint="Course access link will be sent to this email"
            />
          </CardBody>
        </Card>

        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: 500 }}>Powered by</span>
            <PaystackLogo />
          </div>
          <Button size="large" disabled={!canPay} onClick={initiatePayment} style={{ width: '100%', borderRadius: '0.75rem' }}>
            {isLoading ? 'Please wait…' : `Pay ${fmtNaira(courseInfo.priceNaira)}`}
          </Button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>By continuing, you agree to our Terms of Service</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', paddingBottom: '1rem' }}>
          {[
            { bg: '#EFF6FF', icon: <Shield size={18} color="#2563EB" />, label: 'Secure payment', sub: '256-bit SSL' },
            { bg: '#FFF7ED', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" /></svg>, label: 'Instant access', sub: 'Start learning now' },
          ].map(({ bg, icon, label, sub }) => (
            <Card key={label} variant="elevated">
              <CardBody style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>{sub}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Paystack Logo ──────────────────────────────────────────────────────────
function PaystackLogo() {
  return (
    <svg width="90" height="20" viewBox="0 0 90 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="2" width="18" height="5" rx="1.5" fill="#00C3F7" />
      <rect x="0" y="8.5" width="18" height="5" rx="1.5" fill="#011B33" />
      <rect x="0" y="15" width="18" height="5" rx="1.5" fill="#011B33" opacity="0.4" />
      <text x="23" y="15" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="13" fill="#011B33">Paystack</text>
    </svg>
  )
}

// ── Processing Screen ──────────────────────────────────────────────────────
function ProcessingScreen() {
  const { reference, go } = useCheckout()
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CreditCard size={32} color="#2563EB" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111', margin: '0 0 0.75rem' }}>Processing payment</p>
        <p style={{ fontSize: '1rem', color: '#6B7280', margin: '0 0 0.5rem', lineHeight: 1.6 }}>Don't close this page. We're confirming your payment.</p>
        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: 0 }}>This usually takes 5–30 seconds</p>
      </div>
      {reference && (
        <div style={{ background: '#F3F4F6', borderRadius: '0.75rem', padding: '0.875rem 1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>Order reference</p>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{reference}</p>
        </div>
      )}
      <button onClick={() => go('checkout')} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.9rem', cursor: 'pointer', marginTop: '2rem' }}>
        Cancel
      </button>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen() {
  const { result, courseInfo } = useCheckout()
  const navigate = useNavigate()

  // Prefer API result data, fall back to courseInfo passed at checkout
  const courseTitle = result?.course?.title || courseInfo.title
  const trainerName = result?.course?.trainer_name || courseInfo.trainerName
  const amountDisplay = result?.amount_naira ? fmtNaira(result.amount_naira) : fmtNaira(courseInfo.priceNaira)
  const dateDisplay = result?.paid_at
    ? new Date(result.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const ref = result?.reference ?? '—'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 16px rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111', margin: '0 0 0.5rem' }}>Payment successful</p>
        <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>You now have full access to <strong>{courseTitle}</strong></p>
      </div>
      <Card variant="elevated" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)', borderRadius: '0.75rem 0.75rem 0 0', padding: '0.875rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Order ID</span>
          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111' }}>{ref}</span>
        </div>
        <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F3F4F6' }}>
            <img src="/intro.png" alt={courseTitle} style={{ width: 56, height: 42, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', margin: 0 }}>{courseTitle}</p>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>{trainerName}</p>
            </div>
          </div>
          {[
            { icon: <CreditCard size={16} color="#9CA3AF" />, label: 'Amount paid', value: amountDisplay },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Date', value: dateDisplay },
            { icon: <CreditCard size={16} color="#9CA3AF" />, label: 'Payment method', value: 'Paystack' },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>{icon}{label}</span>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111' }}>{value}</span>
            </div>
          ))}
        </CardBody>
      </Card>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Button size="large" icon={<Play size={16} />} onClick={() => navigate(ROUTES.COURSES)} style={{ width: '100%', borderRadius: '0.75rem' }}>Start learning</Button>
        <Button size="large" variant="outline" icon={<Download size={16} />} style={{ width: '100%', borderRadius: '0.75rem' }}>Download receipt</Button>
        <button onClick={() => navigate(ROUTES.DASHBOARD ?? '/')} style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'center' }}>Go to dashboard</button>
      </div>
    </div>
  )
}

// ── Failed Screen ──────────────────────────────────────────────────────────
function FailedScreen() {
  const { result, retryPayment } = useCheckout()
  const failureTitle = result?.failure_reason ?? 'Your card was declined'
  const ref = result?.reference ?? '—'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="#F59E0B" />
          <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1" fill="#fff" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111', margin: '0 0 0.375rem' }}>Payment didn't go through</p>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', margin: '0 0 0.75rem' }}>{failureTitle}</p>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, maxWidth: 360, lineHeight: 1.6 }}>
          This could be due to incorrect card details, expired card, or your bank blocking the transaction.
        </p>
      </div>
      <div style={{ background: '#F3F4F6', borderRadius: '0.75rem', padding: '0.875rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>Reference ID</p>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{ref}</p>
      </div>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Button size="large" onClick={retryPayment} style={{ width: '100%', borderRadius: '0.75rem' }}>Try again</Button>
        <Button size="large" variant="outline" onClick={retryPayment} style={{ width: '100%', borderRadius: '0.75rem' }}>Use a different method</Button>
        <button style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <MessageSquare size={16} />Contact support
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>Need help? Our support team is available 24/7.</p>
      </div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
function CheckoutPageInner() {
  const navigate = useNavigate()
  const { screen } = useCheckout()

  const screens: Record<Screen, React.ReactNode> = {
    checkout: <CheckoutScreen onBack={() => navigate(-1)} />,
    processing: <ProcessingScreen />,
    success: <SuccessScreen />,
    failed: <FailedScreen />,
  }

  return <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>{screens[screen]}</div>
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = (location.state as {
    courseSlug?: string
    priceNaira?: string
    priceKobo?: number
    courseTitle?: string
    trainerName?: string
  } | null)

  const courseSlug = state?.courseSlug

  // Guard: no slug means someone navigated here directly — send back
  if (!courseSlug) {
    navigate(ROUTES.COURSES, { replace: true })
    return null
  }

  const courseInfo: CourseInfo = {
    slug: courseSlug,
    title: state?.courseTitle ?? courseSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    trainerName: state?.trainerName ?? '',
    priceNaira: state?.priceNaira ?? '0',
    priceKobo: state?.priceKobo ?? 0,
  }

  return (
    <CheckoutProvider courseInfo={courseInfo}>
      <CheckoutPageInner />
    </CheckoutProvider>
  )
}