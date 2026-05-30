import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, BookOpen, Shield, Zap, Tag, CreditCard, Building2, Smartphone, Mail } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'

const COURSE = {
  title: 'Project Management Course',
  instructor: 'Amara Osei',
  duration: '20h 30m',
  modules: '8 modules',
  thumbnail: '/intro.png',
  price: 40992,
}

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15,18 9,12 15,6" />
  </svg>
)
const ChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
)

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .co-page {
    min-height: 100vh;
    background: #F5F5F5;
    font-family: inherit;
    padding-bottom: 3rem;
  }

  /* Header */
  .co-header {
    background: #fff;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid #F0F0F0;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .co-back-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
  }
  .co-header-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #111;
  }

  /* Stepper */
  .co-stepper {
    display: flex;
    align-items: center;
    padding: 1.25rem 1.25rem 0;
    gap: 0;
    max-width: 600px;
    margin: 0 auto;
  }
  .co-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .co-step-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .co-step-circle.active { background: #2563EB; color: #fff; }
  .co-step-circle.inactive { background: #E5E7EB; color: #9CA3AF; }
  .co-step-label { font-size: 0.875rem; font-weight: 500; }
  .co-step-label.active { color: #111; }
  .co-step-label.inactive { color: #9CA3AF; }
  .co-step-line {
    flex: 1;
    height: 1.5px;
    background: #E5E7EB;
    margin: 0 0.5rem;
  }

  /* Content */
  .co-content {
    max-width: 600px;
    margin: 1.25rem auto 0;
    padding: 0 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Card base */
  .co-card {
    background: #fff;
    border-radius: 1rem;
    overflow: hidden;
  }

  /* Course summary */
  .co-course {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
  }
  .co-course-thumb {
    width: 80px;
    height: 60px;
    border-radius: 0.5rem;
    object-fit: cover;
    flex-shrink: 0;
  }
  .co-course-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #111;
    margin-bottom: 0.2rem;
  }
  .co-course-instructor {
    font-size: 0.8rem;
    color: #6B7280;
    margin-bottom: 0.4rem;
  }
  .co-course-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .co-course-meta-item {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.78rem;
    color: #6B7280;
  }

  /* Order summary */
  .co-order {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .co-order-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #111;
  }
  .co-order-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
    color: #374151;
  }
  .co-order-divider {
    height: 1px;
    background: #F3F4F6;
  }
  .co-order-total-label {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #111;
  }
  .co-order-total-value {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #2563EB;
  }

  /* Promo */
  .co-promo {
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }
  .co-promo-left {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.875rem;
    color: #374151;
    font-weight: 500;
  }
  .co-promo-body {
    padding: 0 1.25rem 1.25rem;
    display: flex;
    gap: 0.625rem;
  }
  .co-promo-input {
    flex: 1;
    padding: 0.65rem 0.875rem;
    border: 1px solid #E5E7EB;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: #111;
    outline: none;
    font-family: inherit;
  }
  .co-promo-input:focus { border-color: #2563EB; }
  .co-promo-apply {
    padding: 0.65rem 1.1rem;
    background: #2563EB;
    color: #fff;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  /* Payment methods */
  .co-pay-section {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .co-pay-method {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1rem 1.1rem;
    border: 1.5px solid #E5E7EB;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .co-pay-method.selected { border-color: #2563EB; background: #EFF6FF; }
  .co-pay-radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #D1D5DB;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: border-color 0.15s;
  }
  .co-pay-method.selected .co-pay-radio { border-color: #2563EB; }
  .co-pay-radio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #2563EB;
  }
  .co-pay-icon {
    width: 36px;
    height: 36px;
    background: #F3F4F6;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .co-pay-name { font-size: 0.9rem; font-weight: 600; color: #111; }
  .co-pay-sub { font-size: 0.78rem; color: #9CA3AF; }

  /* Email */
  .co-email-section {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .co-email-label {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #111;
  }
  .co-email-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.75rem 1rem;
    border: 1px solid #E5E7EB;
    border-radius: 0.625rem;
    background: #FAFAFA;
  }
  .co-email-input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.9rem;
    color: #111;
    outline: none;
    font-family: inherit;
  }
  .co-email-hint {
    font-size: 0.78rem;
    color: #9CA3AF;
  }

  /* CTA */
  .co-cta-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .co-cta-btn {
    width: 100%;
    padding: 1rem;
    border-radius: 0.75rem;
    border: none;
    background: #D1D5DB;
    color: #9CA3AF;
    font-size: 1rem;
    font-weight: 600;
    cursor: not-allowed;
    font-family: inherit;
    transition: background 0.2s, color 0.2s;
  }
  .co-cta-btn.ready {
    background: #2563EB;
    color: #fff;
    cursor: pointer;
  }
  .co-cta-btn.ready:hover { opacity: 0.9; }
  .co-cta-hint {
    font-size: 0.78rem;
    color: #9CA3AF;
    text-align: center;
  }

  /* Trust badges */
  .co-trust {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .co-trust-item {
    background: #fff;
    border-radius: 0.75rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .co-trust-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .co-trust-name { font-size: 0.875rem; font-weight: 600; color: #111; }
  .co-trust-sub { font-size: 0.75rem; color: #9CA3AF; }
`

const PAYMENT_METHODS = [
  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa, Mastercard, Verve', icon: CreditCard },
  { id: 'bank', label: 'Bank Transfer', sub: 'Instant verification', icon: Building2 },
  { id: 'ussd', label: 'USSD', sub: 'Dial *737# to pay', icon: Smartphone },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [email, setEmail] = useState('learner@example.com')
  const [promoOpen, setPromoOpen] = useState(false)
  const [promoCode, setPromoCode] = useState('')

  const isReady = !!selectedMethod && email.includes('@')

  const formatPrice = (n: number) =>
    '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 0 })

  return (
    <>
      <style>{CSS}</style>
      <div className="co-page">
        {/* Header */}
        <div className="co-header">
          <button className="co-back-btn" onClick={() => navigate(-1)}><ChevronLeft /></button>
          <span className="co-header-title">Checkout</span>
        </div>

        {/* Stepper */}
        <div className="co-stepper">
          <div className="co-step">
            <div className="co-step-circle active">1</div>
            <span className="co-step-label active">Review</span>
          </div>
          <div className="co-step-line" />
          <div className="co-step">
            <div className="co-step-circle inactive">2</div>
            <span className="co-step-label inactive">Pay</span>
          </div>
          <div className="co-step-line" />
          <div className="co-step">
            <div className="co-step-circle inactive">3</div>
            <span className="co-step-label inactive">Done</span>
          </div>
        </div>

        <div className="co-content">
          {/* Course summary */}
          <div className="co-card">
            <div className="co-course">
              <img src={COURSE.thumbnail} alt={COURSE.title} className="co-course-thumb" />
              <div>
                <p className="co-course-title">{COURSE.title}</p>
                <p className="co-course-instructor">{COURSE.instructor}</p>
                <div className="co-course-meta">
                  <span className="co-course-meta-item">
                    <Clock size={12} color="#9CA3AF" />{COURSE.duration}
                  </span>
                  <span className="co-course-meta-item">
                    <BookOpen size={12} color="#9CA3AF" />{COURSE.modules}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="co-card">
            <div className="co-order">
              <p className="co-order-title">Order summary</p>
              <div className="co-order-row">
                <span>Course price</span>
                <span>{formatPrice(COURSE.price)}</span>
              </div>
              <div className="co-order-divider" />
              <div className="co-order-row">
                <span className="co-order-total-label">Total</span>
                <span className="co-order-total-value">{formatPrice(COURSE.price)}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#F3F4F6' }} />

            {/* Promo code */}
            <div>
              <div className="co-promo" onClick={() => setPromoOpen(o => !o)}>
                <span className="co-promo-left">
                  <Tag size={16} color="#6B7280" />
                  Have a promo code?
                </span>
                <span style={{ color: '#9CA3AF', transform: promoOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex' }}>
                  <ChevronDown />
                </span>
              </div>
              {promoOpen && (
                <div className="co-promo-body">
                  <input
                    className="co-promo-input"
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                  />
                  <button className="co-promo-apply">Apply</button>
                </div>
              )}
            </div>
          </div>

          {/* Payment methods */}
          <div className="co-card">
            <div className="co-pay-section">
              {PAYMENT_METHODS.map(({ id, label, sub, icon: Icon }) => (
                <div
                  key={id}
                  className={`co-pay-method${selectedMethod === id ? ' selected' : ''}`}
                  onClick={() => setSelectedMethod(id)}
                >
                  <div className="co-pay-radio">
                    {selectedMethod === id && <div className="co-pay-radio-dot" />}
                  </div>
                  <div className="co-pay-icon">
                    <Icon size={18} color="#6B7280" />
                  </div>
                  <div>
                    <p className="co-pay-name">{label}</p>
                    <p className="co-pay-sub">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          <div className="co-card">
            <div className="co-email-section">
              <p className="co-email-label">Email address</p>
              <div className="co-email-input-wrap">
                <Mail size={16} color="#9CA3AF" />
                <input
                  className="co-email-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <p className="co-email-hint">Course access link will be sent to this email</p>
            </div>
          </div>

          {/* CTA */}
          <div className="co-cta-wrap">
            <button
              className={`co-cta-btn${isReady ? ' ready' : ''}`}
              disabled={!isReady}
              onClick={() => isReady && navigate(ROUTES.CHECKOUT_PAY ?? '/checkout/pay')}
            >
              {selectedMethod ? `Pay with ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label}` : 'Select payment method'}
            </button>
            <p className="co-cta-hint">By continuing, you agree to our Terms of Service</p>
          </div>

          {/* Trust badges */}
          <div className="co-trust">
            <div className="co-trust-item">
              <div className="co-trust-icon" style={{ background: '#EFF6FF' }}>
                <Shield size={18} color="#2563EB" />
              </div>
              <div>
                <p className="co-trust-name">Secure payment</p>
                <p className="co-trust-sub">256-bit SSL</p>
              </div>
            </div>
            <div className="co-trust-item">
              <div className="co-trust-icon" style={{ background: '#FFF7ED' }}>
                <Zap size={18} color="#F59E0B" />
              </div>
              <div>
                <p className="co-trust-name">Instant access</p>
                <p className="co-trust-sub">Start learning now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}