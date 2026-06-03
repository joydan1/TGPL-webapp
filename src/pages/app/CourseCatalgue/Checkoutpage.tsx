import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, BookOpen, CreditCard, Building2, Smartphone, Tag, Shield, Lock, MessageSquare, Play, Download, RotateCcw, Mail } from 'lucide-react'
import Alert from '../../../components/Alert'
import Button from '../../../components/Button'
import { Card, CardBody } from '../../../components/Card'
import Input from '../../../components/Input'
import { useCheckout } from '../../../hooks/useCheckout'
import { ROUTES } from '../../../constants/routes'
import type { PaymentMethod } from '../../../types'

// ── Constants ──────────────────────────────────────────────────────────────
const COURSE = {
  title: 'Project Management Course',
  instructor: 'Enobong Okposin',
  duration: '4h 30m',
  modules: '8 modules',
  thumbnail: '/intro.png',
  price: 40992,
}

const BANK = {
  number: '8929374625',
  name: 'TGPL Education Ltd',
  bankName: 'Guaranty Trust Bank (GTBank)',
}

const USSD_CODE = '*737*40992*89282937291#'

const fmt = (n: number) => '₦' + n.toLocaleString('en-NG')

const PAYMENT_METHODS: { id: PaymentMethod; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa, Mastercard, Verve', icon: <CreditCard size={18} color="#6B7280" /> },
  { id: 'bank', label: 'Bank Transfer', sub: 'Instant verification', icon: <Building2 size={18} color="#6B7280" /> },
  { id: 'ussd', label: 'USSD', sub: 'Dial *737# to pay', icon: <Smartphone size={18} color="#6B7280" /> },
]

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
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.25rem 0', maxWidth: 600, margin: '0 auto' }}>
      {['Review', 'Pay', 'Done'].map((label, i) => {
        const num = i + 1
        const done = num < step
        const active = num === step
        return (
          <>
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: done || active ? '#2563EB' : '#E5E7EB', color: done || active ? '#fff' : '#9CA3AF' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg> : num}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: active || done ? '#111' : '#9CA3AF' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1.5, background: done ? '#2563EB' : '#E5E7EB', margin: '0 0.5rem' }} />}
          </>
        )
      })}
    </div>
  )
}

function AmountBanner() {
  return (
    <div style={{ background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', borderRadius: '1rem', padding: '1.5rem' }}>
      <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', margin: '0 0 0.25rem' }}>Total amount</p>
      <p style={{ color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.25rem' }}>{fmt(COURSE.price)}</p>
      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem', margin: 0 }}>{COURSE.title}</p>
    </div>
  )
}

function CourseSummary() {
  return (
    <Card variant="elevated">
      <CardBody style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={COURSE.thumbnail} alt={COURSE.title} style={{ width: 80, height: 60, borderRadius: '0.5rem', objectFit: 'cover', flexShrink: 0 }} />
        <div>
          <p style={{ fontWeight: 700, color: '#111', margin: '0 0 0.2rem', fontSize: '0.9375rem' }}>{COURSE.title}</p>
          <p style={{ color: '#6B7280', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>{COURSE.instructor}</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[{ icon: <Clock size={12} color="#9CA3AF" />, text: COURSE.duration }, { icon: <BookOpen size={12} color="#9CA3AF" />, text: COURSE.modules }].map(({ icon, text }) => (
              <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#6B7280' }}>{icon}{text}</span>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function SecureBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.8rem' }}>
      <Shield size={14} color="#22C55E" /><span>Secure payment</span>
      <span style={{ color: '#D1D5DB' }}>|</span>
      <Lock size={14} color="#6B7280" /><span>256-bit SSL</span>
    </div>
  )
}

const wrap: React.CSSProperties = { maxWidth: 600, margin: '1.25rem auto 0', padding: '0 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }
// ── Checkout Screen ────────────────────────────────────────────────────────
function CheckoutScreen({ onBack }: { onBack: () => void }) {
  const { proceed, email, setEmail, promoCode, setPromoCode } = useCheckout()
  const [localMethod, setLocalMethod] = useState<PaymentMethod | null>(null)
  const [promoOpen, setPromoOpen] = useState(false)

  return (
    <>
      <Header title="Checkout" onBack={onBack} />
      <Stepper step={1} />
      <div style={wrap}>
        <CourseSummary />

        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', margin: 0 }}>Order summary</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#374151' }}>
              <span>Course price</span><span>{fmt(COURSE.price)}</span>
            </div>
            <div style={{ height: 1, background: '#F3F4F6' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111' }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#2563EB' }}>{fmt(COURSE.price)}</span>
            </div>
          </CardBody>
          <div style={{ height: 1, background: '#F3F4F6' }} />
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

        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', margin: 0 }}>Email address</p>
            <Input iconType="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" hint="Course access link will be sent to this email" />
          </CardBody>
        </Card>

        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111', margin: 0 }}>Payment method</p>
            {PAYMENT_METHODS.map(({ id, label, sub, icon }) => (
              <div key={id} onClick={() => setLocalMethod(id)} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.1rem', border: `1.5px solid ${localMethod === id ? '#2563EB' : '#E5E7EB'}`, borderRadius: '0.75rem', cursor: 'pointer', background: localMethod === id ? '#EFF6FF' : '#fff' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${localMethod === id ? '#2563EB' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {localMethod === id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />}
                </div>
                <div style={{ width: 36, height: 36, background: '#F3F4F6', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111', margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>{sub}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Button size="large" disabled={!localMethod || !email.includes('@')} onClick={() => localMethod && proceed(localMethod)} style={{ width: '100%', borderRadius: '0.75rem' }}>
          {localMethod ? `Pay with ${PAYMENT_METHODS.find(m => m.id === localMethod)?.label}` : 'Select payment method'}
        </Button>
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


// ── Bank Transfer Screen ───────────────────────────────────────────────────
function BankTransferScreen() {
  const { go, processPayment } = useCheckout()
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <>
      <Header title="Bank Transfer" onBack={() => go('checkout')} />
      <Stepper step={2} />
      <div style={wrap}>
        <AmountBanner />
        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: '0 0 0.25rem' }}>Transfer to this account</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Use the details below to complete your payment</p>
            </div>
            {[
              { label: 'Account number', value: BANK.number, copyable: true },
              { label: 'Account name', value: BANK.name },
              { label: 'Bank name', value: BANK.bankName },
            ].map(({ label, value, copyable }) => (
              <div key={label} style={{ background: '#F9FAFB', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>{label}</p>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{value}</p>
                </div>
                {copyable && (
                  <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontWeight: 600, fontSize: '0.875rem' }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
        <Alert type="info" title="Important">Your enrollment will be activated within 5 minutes of payment confirmation. Keep your transaction receipt.</Alert>
        <Button size="large" onClick={processPayment} style={{ width: '100%', borderRadius: '0.75rem' }}>I have paid</Button>
      </div>
    </>
  )
}

// ── USSD Screen ────────────────────────────────────────────────────────────
function USSDScreen() {
  const { go, processPayment } = useCheckout()
  const [copied, setCopied] = useState(false)
  const copy = () => { navigator.clipboard.writeText(USSD_CODE); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <>
      <Header title="USSD Payment" onBack={() => go('checkout')} />
      <Stepper step={2} />
      <div style={wrap}>
        <AmountBanner />
        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: '0 0 0.25rem' }}>Dial this USSD code</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Use your phone to complete the payment</p>
            </div>
            <div style={{ background: '#1F2937', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.375rem' }}>Dial on your phone</p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', margin: 0 }}>{USSD_CODE}</p>
              </div>
              <button onClick={copy} style={{ background: '#374151', border: 'none', color: '#fff', borderRadius: '0.5rem', padding: '0.4rem 0.875rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', margin: '0 0 0.75rem' }}>How to pay:</p>
              {['Dial the USSD code on your phone', 'Follow the prompts to complete payment', 'Click "I have paid" below once done'].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.625rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0, paddingTop: 2 }}>{step}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Alert type="info">This USSD code works with GTBank. You'll receive an SMS confirmation once payment is successful.</Alert>
        <Button size="large" onClick={processPayment} style={{ width: '100%', borderRadius: '0.75rem' }}>I have paid</Button>
      </div>
    </>
  )
}

// ── Card Details Screen ────────────────────────────────────────────────────
function CardDetailsScreen() {
  const { go, cardDetails, setCardDetails } = useCheckout()
  const ready = cardDetails.number.replace(/\s/g, '').length === 16 && cardDetails.name && cardDetails.expiry.length === 5 && cardDetails.cvv.length === 3

  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length >= 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }

  return (
    <>
      <Header title="Checkout" onBack={() => go('checkout')} />
      <Stepper step={2} />
      <div style={wrap}>
        <CourseSummary />
        <AmountBanner />
        <Card variant="elevated">
          <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>Card details</p>
            <Input label="Card number" placeholder="1234 5678 9012 3456" value={cardDetails.number} onChange={e => setCardDetails(d => ({ ...d, number: fmtCard(e.target.value) }))} style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }} />
            <Input label="Cardholder name" placeholder="Name on card" value={cardDetails.name} onChange={e => setCardDetails(d => ({ ...d, name: e.target.value }))} style={{ padding: '0.75rem 1rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Input label="Expiry date" placeholder="MM/YY" value={cardDetails.expiry} onChange={e => setCardDetails(d => ({ ...d, expiry: fmtExpiry(e.target.value) }))} style={{ padding: '0.75rem 1rem' }} />
              <Input label="CVV" placeholder="123" type="password" maxLength={3} value={cardDetails.cvv} onChange={e => setCardDetails(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) }))} style={{ padding: '0.75rem 1rem' }} />
            </div>
            <SecureBadge />
          </CardBody>
        </Card>
        {ready && <Button size="large" onClick={() => go('card-pin')} style={{ width: '100%', borderRadius: '0.75rem' }}>Pay Now</Button>}
      </div>
    </>
  )
}

// ── Card PIN Screen ────────────────────────────────────────────────────────
function CardPinScreen() {
  const { go } = useCheckout()
  const [pin, setPin] = useState(['', '', '', ''])
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3]

  const handlePin = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...pin]; next[i] = d; setPin(next)
    if (d && i < 3) refs[i + 1].current?.focus()
  }
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <>
      <Header title="Checkout" onBack={() => go('card-details')} />
      <Stepper step={2} />
      <div style={wrap}>
        <CourseSummary />
        <AmountBanner />
        <Card variant="elevated">
          <CardBody style={{ padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={24} color="#2563EB" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', margin: '0 0 0.375rem' }}>Enter your card PIN</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>Enter the 4-digit PIN for card ending in 1121</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {pin.map((d, i) => (
                <input key={i} ref={refs[i]} type="password" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handlePin(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                  style={{ width: 52, height: 60, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, border: `1.5px solid ${d ? '#2563EB' : '#E5E7EB'}`, borderRadius: '0.75rem', outline: 'none', background: '#fff', color: '#111' }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#9CA3AF', fontSize: '0.8rem' }}>
              <Shield size={14} /><span>Your PIN is encrypted and secure</span>
            </div>
          </CardBody>
        </Card>
        <Button size="large" disabled={!pin.every(d => d !== '')} onClick={() => go('card-otp')} style={{ width: '100%', borderRadius: '0.75rem' }}>Continue</Button>
      </div>
    </>
  )
}

// ── Card OTP Screen ────────────────────────────────────────────────────────
function CardOTPScreen() {
  const { go, processPayment } = useCheckout()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const r0 = useRef<HTMLInputElement>(null)
  const r1 = useRef<HTMLInputElement>(null)
  const r2 = useRef<HTMLInputElement>(null)
  const r3 = useRef<HTMLInputElement>(null)
  const r4 = useRef<HTMLInputElement>(null)
  const r5 = useRef<HTMLInputElement>(null)
  const refs = [r0, r1, r2, r3, r4, r5]

  const handleOtp = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[i] = d; setOtp(next)
    if (d && i < 5) refs[i + 1].current?.focus()
  }
  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <>
      <Header title="Checkout" onBack={() => go('card-pin')} />
      <Stepper step={2} />
      <div style={wrap}>
        <CourseSummary />
        <AmountBanner />
        <Card variant="elevated">
          <CardBody style={{ padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={24} color="#22C55E" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111', margin: '0 0 0.375rem' }}>Enter OTP</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>A 6-digit code was sent to learner@example.com</p>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              {otp.map((d, i) => (
                <input key={i} ref={refs[i]} type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleOtp(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, border: `1.5px solid ${d ? '#2563EB' : '#E5E7EB'}`, borderRadius: '0.75rem', outline: 'none', background: '#fff', color: '#111' }}
                />
              ))}
            </div>
            <button style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>Resend OTP</button>
          </CardBody>
        </Card>
        <Alert type="info">The OTP is valid for 10 minutes. Check your spam folder if you don't see it.</Alert>
        <Button size="large" disabled={!otp.every(d => d !== '')} onClick={processPayment} style={{ width: '100%', borderRadius: '0.75rem' }}>Complete Payment</Button>
      </div>
    </>
  )
}

// ── Processing Screen ──────────────────────────────────────────────────────
function ProcessingScreen() {
  const { go, orderRef } = useCheckout()
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
      <div style={{ background: '#F3F4F6', borderRadius: '0.75rem', padding: '0.875rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>Order reference</p>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{orderRef}</p>
      </div>
      <button onClick={() => go('checkout')} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.9rem', cursor: 'pointer', marginTop: '2rem' }}>Cancel</button>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────────────
function SuccessScreen() {
  const { method, orderRef } = useCheckout()
  const navigate = useNavigate()
  const methodLabel = method === 'card' ? 'Debit Card' : method === 'bank' ? 'Bank Transfer' : 'USSD'

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 12px rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111', margin: '0 0 0.5rem' }}>Payment successful</p>
        <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>You now have full access to <strong>{COURSE.title}</strong></p>
      </div>
      <Card variant="elevated" style={{ width: '100%', maxWidth: 480 }}>
        <CardBody style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Order ID</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111' }}>{orderRef}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6' }}>
            <img src={COURSE.thumbnail} alt={COURSE.title} style={{ width: 56, height: 42, borderRadius: '0.5rem', objectFit: 'cover' }} />
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111', margin: 0 }}>{COURSE.title}</p>
              <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>{COURSE.instructor}</p>
            </div>
          </div>
          {[
            { icon: <CreditCard size={16} color="#9CA3AF" />, label: 'Amount paid', value: fmt(COURSE.price) },
            { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'Date', value: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { icon: <CreditCard size={16} color="#9CA3AF" />, label: 'Payment method', value: methodLabel },
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
  const { result, retry, reset } = useCheckout()
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', padding: '2rem' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 700, fontSize: '1.5rem', color: '#111', margin: '0 0 0.375rem' }}>Payment didn't go through</p>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#374151', margin: '0 0 0.75rem' }}>Your card was declined</p>
        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, maxWidth: 360, lineHeight: 1.6 }}>This could be due to incorrect card details, expired card, or your bank blocking the transaction for security reasons.</p>
      </div>
      <div style={{ background: '#F3F4F6', borderRadius: '0.75rem', padding: '0.875rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>Reference ID</p>
        <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{result?.referenceId}</p>
      </div>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <Button size="large" icon={<RotateCcw size={16} />} onClick={retry} style={{ width: '100%', borderRadius: '0.75rem' }}>Try again</Button>
        <Button size="large" variant="outline" onClick={reset} style={{ width: '100%', borderRadius: '0.75rem' }}>Use a different method</Button>
        <button style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <MessageSquare size={16} />Contact support
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>Need help? Our support team is available 24/7 to assist you with payment issues.</p>
      </div>
    </div>
  )
}
// ── Root ───────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate()
  const { screen } = useCheckout()

  const screens: Record<string, React.ReactNode> = {
    'checkout': <CheckoutScreen onBack={() => navigate(ROUTES.COURSES)} />,
    'bank-details': <BankTransferScreen />,
    'ussd-details': <USSDScreen />,
    'card-details': <CardDetailsScreen />,
    'card-pin': <CardPinScreen />,
    'card-otp': <CardOTPScreen />,
    'processing': <ProcessingScreen />,
    'success': <SuccessScreen />,
    'failed': <FailedScreen />,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {screens[screen]}
    </div>
  )
}