import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../components/Input'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { ROUTES } from '../constants/routes'

// Password strength calculator
type StrengthLevel = { score: number; label: string; color: string }

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels: StrengthLevel[] = [
    { score: 1, label: 'Weak', color: 'var(--danger)' },
    { score: 2, label: 'Fair', color: 'var(--warning)' },
    { score: 3, label: 'Good', color: 'var(--primary-500)' },
    { score: 4, label: 'Strong', color: 'var(--success)' },
  ]
  return { ...levels[score - 1] }
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score } = getPasswordStrength(password)
  if (!password) return null
  const colors = ['var(--danger)', 'var(--warning)', 'var(--primary-500)', 'var(--success)']
  const { label, color } = getPasswordStrength(password)

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
              background: i <= score ? colors[score - 1] : '#E0E0E0',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: '0.6875rem', marginTop: '4px', marginBottom: 0, fontWeight: 500, color }}>
        Password strength: {label}
      </p>
    </div>
  )
}

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

export default function SignupPage() {
  const navigate = useNavigate()
  const { signup, isLoading, error, clearError } = useAuth()

  const [role, setRole] = useState<'learner' | 'trainer'>('learner')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Clear any previous errors on mount
  React.useEffect(() => {
    clearError()
  }, [])

  const isFormFilled =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.email.trim().length > 0 &&
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    termsAccepted

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
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
    const result = await signup({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    })
    if (result.success) navigate(ROUTES.LOGIN)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        * { box-sizing: border-box; }

        .signup-page {
          min-height: 100vh;
          display: flex;
          background: var(--white);
          margin: 0;
          padding: 0;
        }

        /* ── Hero Section (50% width) ── */
        .signup-hero {
          width: 50%;
          background-image: url(/image1.png);
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 2.5rem;
          border-top-right-radius: 32px;
          border-bottom-right-radius: 32px;
        }

        .signup-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(10, 42, 74, 0.55) 0%,
            rgba(14, 74, 138, 0.75) 50%,
            rgba(10, 42, 74, 0.92) 100%
          );
          z-index: 1;
        }

        .signup-hero-content {
          position: relative;
          z-index: 10;
          color: #fff;
          margin-bottom: 8%;
        }

        .signup-hero-content h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 1rem 0;
        }

        .signup-hero-content p {
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.55;
          margin: 0 0 2rem 0;
          opacity: 0.82;
        }

        .signup-hero-dots {
          display: flex;
          gap: 8px;
        }

        .dot-button {
          border: none;
          background: none;
          cursor: pointer;
          padding: 0;
        }

        .dot-active {
          width: 36px;
          height: 8px;
          border-radius: 4px;
          background: #fff;
        }

        .dot-inactive {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.6);
          background: transparent;
        }

        /* ── Form Panel (50% width) ── */
        .signup-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem;
          background: var(--grey);
          overflow: hidden;
        }

        .signup-card {
          width: 100%;
          max-width: 440px;
          background: var(--white);
          border: 1px solid #E8E8E8;
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .signup-logo {
          margin-bottom: 1.75rem;
          text-align: center;
        }

        .signup-logo img {
          height: 2.75rem;
        }

        .signup-title {
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          color: var(--black);
          margin: 0 0 1.5rem 0;
          line-height: 1.2;
        }

        /* ── Role Toggle ── */
        .role-toggle {
          display: flex;
          gap: 6px;
          padding: 4px;
          background: var(--grey);
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
        }

        .role-btn {
          flex: 1;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          border: 2px solid transparent;
          background: var(--grey);
          color: var(--black);
          transition: all 200ms ease;
        }

        .role-btn.active {
          background: var(--white);
          border-color: var(--primary-500);
          color: var(--primary-500);
          box-shadow: 0 1px 6px rgba(36, 146, 235, 0.18);
        }

        /* ── Form ── */
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .name-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .password-wrapper {
          position: relative;
        }

        .eye-button {
          position: absolute;
          right: 0.75rem;
          top: 2.375rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 300ms ease;
        }

        .eye-button:hover {
          color: #666666;
        }

        /* ── Terms ── */
        .terms-group {
          display: flex;
          gap: 0.625rem;
          align-items: flex-start;
        }

        .terms-checkbox {
          width: 1rem;
          height: 1rem;
          min-width: 1rem;
          margin-top: 2px;
          padding: 0;
          cursor: pointer;
          border: 1.5px solid #D1D5DB;
          border-radius: 3px;
          accent-color: var(--primary-500);
          flex-shrink: 0;
        }

        .terms-label {
          font-size: 0.8125rem;
          color: var(--black);
          line-height: 1.5;
          cursor: pointer;
          user-select: none;
          margin: 0;
        }

        .terms-label a {
          font-weight: 600;
          color: var(--primary-500);
          text-decoration: none;
        }

        .terms-label a:hover {
          text-decoration: underline;
          color: var(--primary-600);
        }

        .terms-error {
          font-size: 0.75rem;
          color: var(--danger);
          margin-top: 4px;
        }

        /* ── Submit Button ── */
        .submit-button {
          width: 100%;
          padding: 0.8125rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.01em;
          background: var(--primary-500);
          color: var(--white);
          cursor: pointer;
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── Footer ── */
        .signup-footer {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.8125rem;
        }

        .signup-footer p {
          margin: 0.375rem 0;
          color: #999999;
        }

        .signup-footer a {
          font-weight: 600;
          color: var(--primary-500);
          text-decoration: none;
        }

        .signup-footer a:hover {
          text-decoration: underline;
        }

        .signup-trust-badge {
          font-size: 0.8125rem;
          color: #999999;
          text-align: center;
          margin-top: 1.5rem;
          line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .signup-hero { 
            display: none;
          }
          .signup-form-panel { width: 100%; }
        }

        @media (max-width: 640px) {
          .signup-hero-content h1 { font-size: 1.5rem; }
          .signup-hero-content p { font-size: 1rem; }
          .signup-form-panel { padding: 1.5rem 1rem; }
          .name-row { grid-template-columns: 1fr; }
          .signup-card { max-width: 100%; }
        }
      `}</style>

      <div className="signup-page">
        {/* ── Hero Section ── */}
        <div className="signup-hero">
          <div className="signup-hero-content">
            <h1>
              Master<br />
              Project Management,<br />
              Boost Your Career
            </h1>
            <p>Learn the skills to plan, execute, and deliver <br /> successful projects.</p>
            <div className="signup-hero-dots">
              <button className="dot-button dot-active" aria-label="Slide 1" />
              <button className="dot-button dot-inactive" aria-label="Slide 2" />
              <button className="dot-button dot-inactive" aria-label="Slide 3" />
            </div>
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="signup-form-panel">
          {/* Logo (outside card) */}
          <div className="signup-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          <div className="signup-card">
            {/* Title */}
            <h2 className="signup-title">Create your account</h2>

            {/* Role Toggle */}
            <div className="role-toggle">
              {(['learner', 'trainer'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`role-btn ${role === r ? 'active' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r === 'learner' ? "I'm a learner" : "I'm a trainer"}
                </button>
              ))}
            </div>

            {/* Errors */}
            {error && <Alert type="error" title="Signup failed">{error}</Alert>}
            {formErrors.submit && <Alert type="error" title="Signup failed">{formErrors.submit}</Alert>}

            {/* Form */}
            <form className="signup-form" onSubmit={handleSubmit}>
              {/* Names */}
              <div className="name-row">
                <Input
                  label="First name"
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  error={formErrors.firstName}
                />
                <Input
                  label="Last name"
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  error={formErrors.lastName}
                />
              </div>

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

              {/* Password */}
              <div className="password-wrapper">
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
                  className="eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!formErrors.password && <PasswordStrengthIndicator password={formData.password} />}

              {/* Confirm Password */}
              <div className="password-wrapper">
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
                  className="eye-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Terms */}
              <div>
                <div className="terms-group">
                  <input
                    type="checkbox"
                    id="terms"
                    className="terms-checkbox"
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
                  />
                  <label htmlFor="terms" className="terms-label">
                    I agree to the{' '}
                    <a href="/terms" style={{ fontWeight: 600 }}>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" style={{ fontWeight: 600 }}>
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {formErrors.terms && <p className="terms-error">{formErrors.terms}</p>}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={!isFormFilled || isLoading}
                className="submit-button"
                style={{
                  opacity: isFormFilled ? 1 : 0.45,
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    <span>Creating account...</span>
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="signup-footer">
              <p>or</p>
              <p>
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} style={{ fontWeight: 600 }}>
                  Log in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <p className="signup-trust-badge">Trusted by 50,000+ learners across emerging markets</p>
        </div>
      </div>
    </>
  )
}