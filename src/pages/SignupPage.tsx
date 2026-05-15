import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { ROUTES } from '../constants/routes'

// ─── Password strength ───────────────────────────────────────────────────────

type StrengthLevel = { score: number; label: string; color: string }

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels: StrengthLevel[] = [
    { score: 1, label: 'Weak',   color: 'var(--danger)'      },
    { score: 2, label: 'Fair',   color: 'var(--warning)'     },
    { score: 3, label: 'Good',   color: 'var(--primary-500)' },
    { score: 4, label: 'Strong', color: 'var(--success)'     },
  ]
  return { ...levels[score - 1] }
}

const BAR_COLORS = [
  'var(--danger)',
  'var(--warning)',
  'var(--primary-500)',
  'var(--success)',
]

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password)
  if (!password) return null
  const activeColor = BAR_COLORS[score - 1]

  return (
    <div style={{ marginTop: '0.375rem' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: '4px',
              flex: 1,
              borderRadius: '2px',
              background: i <= score ? activeColor : '#E0E0E0',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontSize: '0.7rem',
          marginTop: '4px',
          marginBottom: 0,
          fontWeight: 500,
          color,
        }}
      >
        Password strength: {label}
      </p>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      style={{ animation: 'spin 0.7s linear infinite', width: 18, height: 18, flexShrink: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill="currentColor" style={{ opacity: 0.8 }} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading, error } = useAuth()

  const [role, setRole] = useState<'learner' | 'trainer'>('learner')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Button is enabled only when all fields have content + terms checked.
  
  const isFormFilled =
    formData.fullName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    termsAccepted

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!termsAccepted) {
      errors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    if (role === 'trainer') {
      setFormErrors({ submit: 'Trainer signup is not available through this form' })
      return
    }

    const result = await signup({ email: formData.email, password: formData.password })
    if (result.success) navigate(ROUTES.DASHBOARD)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const eyeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '0.75rem',
    top: '2.375rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999999',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    transition: 'color 300ms ease-in-out',
  }

  return (
    <div style={{ minHeight: '100vh', maxHeight: '100vh', borderTopRightRadius: '32px', display: 'flex' }}>

      {/* ── Left hero ── */}
      <div
        className="hidden lg:flex lg:flex-col"
        style={{
          width: '42%',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'flex-end',
          paddingBottom: '4rem',
          
        }}
      >
        {/* Background photo  */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/image1.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
        {/* Blue tint overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,42,74,0.55) 0%, rgba(14,74,138,0.75) 50%, rgba(10,42,74,0.92) 100%)',
          }}
        />

        {/* Hero text  */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            marginBottom: '8%',
          }}
        >
          {/* Text */}
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1.15 }}>
            Master 
            <br /> Project Management, 
            <br />  Boost Your Career
          </h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.82, marginBottom: '2rem', lineHeight: 1.55 }}>
            Learn the skills to plan, execute, and deliver
            <br /> successful projects.
          </p>

          {/* Carousel dots  */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              aria-label="Slide 1"
              style={{ width: 36, height: 8, borderRadius: 4, background: 'var(--white)', border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <button
              aria-label="Slide 2"
              style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: '2px solid rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }}
            />
            <button
              aria-label="Slide 3"
              style={{ width: 10, height: 10, borderRadius: '50%', background: 'transparent', border: '2px solid rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0 }}
            />
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
    padding: '2.5rem 1.5rem',
          background: 'var(--grey)', 
        }}
      >
        {/* Logo  */}
        <div style={{ marginBottom: '1.75rem'}}>
          <img src="/Logo.png" alt="The Global Project Leaders" style={{ height: '2.75rem' }} />
        </div>

        {/* White card */}
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '758px',
            background: 'var(--white)',
            border: '1px solid #E8E8E8',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Title  */}
          <h2
            style={{
              textAlign: 'center',
              color: 'var(--black)',
              marginBottom: '1.25rem',
              fontSize: '1.5rem',
            }}
          >
            Create your account
          </h2>

          {/* ── Role selector ── */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '4px',
              background: 'var(--grey)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '1.5rem',
            }}
          >
            {(['learner', 'trainer'] as const).map((r) => {
              const active = role === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'var(--transition)',
                    background: active ? 'var(--white)' : 'var(--grey)',
                    border: active ? '2px solid var(--primary-500)' : '2px solid transparent',
                    color: active ? 'var(--primary-500)' : 'var(--black)',
                    boxShadow: active ? '0 1px 6px rgba(36,146,235,0.18)' : 'none',
                  }}
                >
                  {r === 'learner' ? "I'm a learner" : "I'm a trainer"}
                </button>
              )
            })}
          </div>

          {/* API */}
          {error && <Alert type="error">{error}</Alert>}
          {formErrors.submit && <Alert type="error">{formErrors.submit}</Alert>}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            {/* Full name */}
            <Input
              label="Full name"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              error={formErrors.fullName}
              
            />

            {/* Email */}
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
             
            />

            {/* Password + strength */}
            <div>
              <div style={{ position: 'relative' }}>
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={formErrors.password}
                  
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={eyeButtonStyle}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!formErrors.password && (
                <PasswordStrengthIndicator password={formData.password} />
              )}
            </div>

            {/* Confirm password */}
            <div style={{ position: 'relative' }}>
              <Input
                label="Confirm password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={formErrors.confirmPassword}
                
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={eyeButtonStyle}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Terms checkbox */}
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                {/*
                  We use a native checkbox input for accessibility, but restyle it from scratch
                */}
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (e.target.checked && formErrors.terms) {
                      setFormErrors((prev) => {
                        const next = { ...prev }
                        delete next.terms
                        return next
                      })
                    }
                  }}
                  style={{
                    // Reset global input styles
                    width: '1rem',
                    height: '1rem',
                    minWidth: '1rem',
                    padding: 0,
                    marginTop: '2px',
                    flexShrink: 0,
                    border: '1.5px solid #D1D5DB',
                    borderRadius: '3px',
                    background: 'var(--white)',
                    accentColor: 'var(--primary-500)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                />
                <label
                  htmlFor="terms"
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--black)', 
                    lineHeight: 1.5,
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  I agree to the{' '}
                  {/* Global a { color: var(--primary-500) } handles the blue */}
                  <a href="/terms" style={{ fontWeight: 600 }}>
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" style={{ fontWeight: 600 }}>
                    Privacy Policy
                  </a>
                </label>
              </div>

              {formErrors.terms && (
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--danger)',
                    marginTop: '4px',
                    marginBottom: 0,
                  }}
                >
                  {formErrors.terms}
                </p>
              )}
            </div>

            {/*
              ── Create account button ──
              • Disabled + greyed out when form is not fully filled
              • Active (primary blue) when all fields are filled & terms checked
              • Shows spinner + "Creating account..." while isLoading
            */}
            <Button
              type="submit"
              disabled={!isFormFilled || isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.8125rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isFormFilled && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)',
                // Blue when enabled, muted blue-grey when disabled
                background: isFormFilled
                  ? 'var(--primary-500)'
                  : 'rgba(36,146,235,0.45)',
                color: 'var(--white)',
                letterSpacing: '0.01em',
              }}
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Divider + login */}
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ color: '#999999', fontSize: '0.875rem', marginBottom: '0.375rem' }}>
              or
            </p>
            <p style={{ color: 'var(--black)', fontSize: '0.875rem', marginBottom: 0 }}>
              Already have an account?{' '}
              {/* Global a already handles primary-500 colour */}
              <Link to={ROUTES.LOGIN} style={{ fontWeight: 600 }}>
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <p
          style={{
            fontSize: '0.875rem',
            color: '#999999',
            marginTop: '1.25rem',
            marginBottom: 0,
            textAlign: 'center',
          }}
        >
          Trusted by 50,000+ learners across emerging markets
        </p>
      </div>

      <style>
{`
  @keyframes spin { to { transform: rotate(360deg); } }

  .form-container {
    justify-content: center;
  }

  @media (max-width: 768px) {
    .form-container {
      justify-content: flex-start;
      padding-top: 3rem;
    }
  }
`}
</style>
    </div>
  )
}