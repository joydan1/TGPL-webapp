/**
 * SignupPage
 *
 * FLOW:
 * 1. On mount: clearError() runs once to wipe any stale store error.
 *    (clearError is stable — empty deps [] is safe, no re-fire loop)
 *
 * 2. Role toggle: "I'm a learner" / "I'm a trainer"
 *    - Learner: normal signup flow.
 *    - Trainer: same form, plus a 6-digit "Unique Code" field (issued by an
 *      admin). No alert, no disabled button anymore — trainers can self-serve
 *      as long as they have a valid code.
 *    - "Contact admin to get a code" swaps the card into a short contact
 *      form (name/email/subject/message) for trainers who don't have a code
 *      yet. "Go back" returns to the signup form without losing what was
 *      already typed there.
 *
 * 3. isFormFilled: gates the button before any submission attempt.
 *    Checks: firstName, lastName, valid email format, password >= 8 chars,
 *    confirmPassword non-empty, terms accepted, and — for trainers — a
 *    complete 6-digit unique code.
 *
 * 4. Submit:
 *    a. clearError() + setFormErrors({}) — wipes stale errors
 *    b. validateForm() — sets per-field error messages if invalid
 *    c. Trainer only: validates the unique code (currently MOCKED — see
 *       mockValidateUniqueCode below — until the backend endpoint exists)
 *    d. Calls useAuth.signup() → authAPI.signup() → POST /api/v1/auth/signup/
 *       Payload is camelCase here; authAPI maps to snake_case before sending.
 *       Trainer signups also include `trainerCode`.
 *    e. SUCCESS: switches to the email verification screen (emailSent = true)
 *       No tokens issued at this stage — user must verify email first.
 *    f. FAILURE: error stored in Zustand, displayed via {error} Alert above the form.
 *
 * 5. Email verification screen (after successful signup):
 *    - Shows the email address submitted
 *    - Resend button calls authAPI.sendVerificationEmail() — uses axios + correct path
 *    - "Back to login" link
 *
 * 6. Password strength indicator: shown live as user types, hidden if error is showing
 * 7. Live password mismatch: shown as user types in confirm field, before submit
 *
 * MOCKED — BACKEND NOT READY YET:
 * - mockValidateUniqueCode(): stands in for POST /api/v1/auth/validate-trainer-code/
 * - mockSubmitContactForm(): stands in for POST /api/v1/support/contact/
 * Both are called with a fake network delay and simple pass/fail logic so the
 * UI/UX can be built and demoed now. Swap the bodies for real authAPI calls
 * (and thread trainerCode into useAuth's signup() payload type) once the
 * backend ships these endpoints — search "TODO" below.
 */

import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, ChevronLeft, Send } from 'lucide-react'
import { authAPI } from '../../services/api'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import { ROUTES } from '../../constants/routes'

type StrengthLevel = { score: number; label: string; color: string }
type ContactFormData = { name: string; email: string; subject: string; message: string }

const TRAINER_CODE_LENGTH = 6

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
          <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: i <= score ? colors[score - 1] : '#E0E0E0', transition: 'background 0.2s' }} />
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
    <svg style={{ animation: 'spin 0.7s linear infinite', width: 18, height: 18, flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill="currentColor" style={{ opacity: 0.8 }} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// TODO: replace with a real call once the backend ships
// POST /api/v1/auth/validate-trainer-code/
async function mockValidateUniqueCode(code: string): Promise<{ valid: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 600))
  // Temporary mock: any complete 6-digit code is accepted except all zeros,
  // which simulates an invalid/expired code so the error state is testable.
  return { valid: code.length === TRAINER_CODE_LENGTH && code !== '000000' }
}

// TODO: replace with a real call once the backend ships
// POST /api/v1/support/contact/
async function mockSubmitContactForm(_data: ContactFormData): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return { success: true }
}

export default function SignupPage() {
  const { signup, isLoading, error, clearError } = useAuth()

  const [role, setRole] = useState<'learner' | 'trainer'>('learner')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Trainer unique-code field
  const [uniqueCode, setUniqueCode] = useState<string[]>(Array(TRAINER_CODE_LENGTH).fill(''))
  const [codeValidating, setCodeValidating] = useState(false)
  const codeInputRefs = useRef<Array<HTMLInputElement | null>>([])

  // "Contact admin to get a code" panel (swaps in place of the signup form)
  const [showContactForm, setShowContactForm] = useState(false)
  const [contactFormData, setContactFormData] = useState<ContactFormData>({ name: '', email: '', subject: '', message: '' })
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({})
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)

  // clearError is stable (empty deps in useAuth) — safe in deps array,
  // but using [] + eslint-disable is cleaner and equally correct
  React.useEffect(() => {
    clearError()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isFormFilled =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.password.length >= 8 &&
    formData.confirmPassword.length > 0 &&
    termsAccepted &&
    (role === 'learner' || uniqueCode.every((digit) => digit.length === 1))

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
    if (!termsAccepted) errors.terms = 'You must agree to the Terms of Service and Privacy Policy'
    if (role === 'trainer' && uniqueCode.join('').length < TRAINER_CODE_LENGTH) {
      errors.uniqueCode = 'Enter your 6-digit trainer code'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setFormErrors({})

    if (!validateForm()) return

    if (role === 'trainer') {
      setCodeValidating(true)
      const codeResult = await mockValidateUniqueCode(uniqueCode.join(''))
      setCodeValidating(false)
      if (!codeResult.valid) {
        setFormErrors((prev) => ({ ...prev, uniqueCode: 'That code is invalid or has expired. Contact admin for a new one.' }))
        return
      }
    }

    const result = await signup({
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role,
      // TODO: add `trainerCode?: string` to useAuth's signup() payload type
      // once the backend accepts it — this cast can come out at that point.
      ...(role === 'trainer' ? { trainerCode: uniqueCode.join('') } : {}),
    } as Parameters<typeof signup>[0])

    if (result.success) setEmailSent(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleResendEmail = async () => {
    setResendLoading(true)
    setResendMessage('')
    const result = await authAPI.sendVerificationEmail({ email: formData.email })
    setResendMessage(result.success ? 'Email sent! Check your inbox.' : 'Failed to resend email. Please try again.')
    setResendLoading(false)
  }

  const handleRoleChange = (r: 'learner' | 'trainer') => {
    setRole(r)
    if (formErrors.submit) setFormErrors((prev) => ({ ...prev, submit: '' }))
    if (r === 'learner' && formErrors.uniqueCode) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next.uniqueCode
        return next
      })
    }
  }

  const handleCodeChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/[^0-9]/g, '').slice(-1)
    setUniqueCode((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    if (formErrors.uniqueCode) setFormErrors((prev) => ({ ...prev, uniqueCode: '' }))
    if (value && index < TRAINER_CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !uniqueCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, TRAINER_CODE_LENGTH)
    if (!pasted) return
    setUniqueCode((prev) => {
      const next = [...prev]
      pasted.split('').forEach((digit, i) => {
        next[i] = digit
      })
      return next
    })
    if (formErrors.uniqueCode) setFormErrors((prev) => ({ ...prev, uniqueCode: '' }))
    codeInputRefs.current[Math.min(pasted.length, TRAINER_CODE_LENGTH - 1)]?.focus()
  }

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setContactFormData((prev) => ({ ...prev, [name]: value }))
    if (contactErrors[name]) setContactErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateContactForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!contactFormData.name.trim()) errors.name = 'Name is required'
    if (!contactFormData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactFormData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (!contactFormData.subject.trim()) errors.subject = 'Subject is required'
    if (!contactFormData.message.trim()) errors.message = 'Message is required'
    setContactErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateContactForm()) return
    setContactSubmitting(true)
    const result = await mockSubmitContactForm(contactFormData)
    setContactSubmitting(false)
    if (result.success) setContactSubmitted(true)
  }

  const handleBackFromContact = () => {
    setShowContactForm(false)
    setContactSubmitted(false)
    setContactErrors({})
  }

  // ── Email verification screen ──────────────────────────────────────────────
  if (emailSent) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grey)', padding: '1rem' }}>
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <img src="/Logo.png" alt="The Global Project Leaders" style={{ height: '2.75rem' }} />
            </div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--black)', margin: '0 0 0.75rem', lineHeight: 1.2 }}>Check your email</h2>
            <p style={{ color: '#4a4a4a', lineHeight: 1.7, margin: '0 0 2rem', fontSize: '0.95rem' }}>
              We sent a verification link to <strong>{formData.email}</strong>. Click the link to verify your account and get started.
            </p>
            <div style={{ padding: '1rem', background: '#F9F9F9', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem' }}>Didn't receive the email?</p>
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                style={{ background: 'none', border: 'none', color: 'var(--primary-500)', fontWeight: 600, cursor: resendLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: resendLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                {resendLoading && <Spinner />}
                {resendLoading ? 'Sending...' : 'Resend email'}
              </button>
              {resendMessage && (
                <p style={{ fontSize: '0.8125rem', color: resendMessage.toLowerCase().includes('failed') ? 'var(--danger)' : 'var(--success)', margin: '0.5rem 0 0' }}>
                  {resendMessage}
                </p>
              )}
            </div>
            <Link to={ROUTES.LOGIN} style={{ display: 'inline-block', color: 'var(--primary-500)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Back to login
            </Link>
          </div>
        </div>
      </>
    )
  }

  // ── Signup form ──────────
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .signup-page { min-height: 100vh; display: flex; background: var(--white); margin: 0; padding: 0; }

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
          background: linear-gradient(180deg, rgba(10,42,74,0.55) 0%, rgba(14,74,138,0.75) 50%, rgba(10,42,74,0.92) 100%);
          z-index: 1;
        }

        .signup-hero-content { position: relative; z-index: 10; color: #fff; margin-bottom: 8%; }
        .signup-hero-content h1 { font-size: 3rem; font-weight: 800; line-height: 1.15; margin: 0 0 1rem 0; }
        .signup-hero-content p { font-size: 1.5rem; font-weight: 400; line-height: 1.55; margin: 0 0 2rem 0; opacity: 0.82; }
        .signup-hero-dots { display: flex; gap: 8px; }
        .dot-button { border: none; background: none; cursor: pointer; padding: 0; }
        .dot-active { width: 36px; height: 8px; border-radius: 4px; background: #fff; }
        .dot-inactive { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.6); background: transparent; }

        .signup-form-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 1.5rem; background: var(--grey); overflow: hidden; }

        .signup-card { width: 100%; max-width: 440px; background: var(--white); border: 1px solid #E8E8E8; border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-sm); }

        .signup-logo { margin-bottom: 1.75rem; text-align: center; }
        .signup-logo img { height: 2.75rem; width: auto; }

        @media (max-width: 640px) {
          .signup-logo img { height: 1.5rem; width: auto; }
        }

        .signup-error-alert { width: 100%; max-width: 440px; margin-bottom: 1rem; }

        .signup-title { font-size: 1.5rem; font-weight: 700; text-align: center; color: var(--black); margin: 0 0 1.5rem 0; line-height: 1.2; }

        .role-toggle { display: flex; gap: 6px; padding: 4px; background: var(--grey); border-radius: var(--radius-lg); margin-bottom: 1.5rem; }
        .role-btn { flex: 1; padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit; border: 2px solid transparent; background: var(--grey); color: var(--black); transition: all 200ms ease; }
        .role-btn.active { background: var(--white); border-color: var(--primary-500); color: var(--primary-500); box-shadow: 0 1px 6px rgba(36,146,235,0.18); }

        .signup-form { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem; }
        .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

        .password-wrapper { position: relative; }
        .eye-button { position: absolute; right: 0.75rem; top: 2.375rem; background: none; border: none; cursor: pointer; color: #999999; display: flex; align-items: center; justify-content: center; padding: 0; transition: color 300ms ease; }
        .eye-button:hover { color: #666666; }
        .eye-button:focus-visible { outline: 2px solid var(--primary-500); border-radius: 4px; }

        .terms-group { display: flex; gap: 0.625rem; align-items: flex-start; }
        .terms-checkbox { width: 1rem; height: 1rem; min-width: 1rem; margin-top: 2px; cursor: pointer; border: 1.5px solid #D1D5DB; border-radius: 3px; accent-color: var(--primary-500); flex-shrink: 0; }
        .terms-label { font-size: 0.8125rem; color: var(--black); line-height: 1.5; cursor: pointer; user-select: none; margin: 0; }
        .terms-label a { font-weight: 600; color: var(--primary-500); text-decoration: none; }
        .terms-label a:hover { text-decoration: underline; color: var(--primary-600); }
        .terms-error { font-size: 0.75rem; color: var(--danger); margin-top: 4px; }
        .password-match-error { font-size: 0.75rem; color: var(--danger); margin-top: 4px; }

        .field-label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; color: var(--black); }

        .code-input-row { display: flex; align-items: center; gap: 6px; }
        .code-input-box { width: 100%; text-align: center; padding: 0.625rem 0; border-radius: var(--radius-md); font-size: 1rem; font-family: inherit; border: 1px solid #D1D5DB; }
        .code-input-box:focus { outline: none; border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(36,146,235,0.12); }
        .code-input-box.has-error { border-color: var(--danger); }
        .code-dash { color: #999999; font-size: 1rem; }

        .contact-admin-link { display: inline-block; background: none; border: none; padding: 0; margin-top: 0.5rem; font-size: 0.8125rem; font-weight: 600; color: var(--primary-500); cursor: pointer; font-family: inherit; }
        .contact-admin-link:hover { text-decoration: underline; }

        .go-back-link { display: inline-flex; align-items: center; gap: 2px; background: none; border: none; padding: 0; margin-bottom: 1rem; font-size: 0.875rem; color: #666666; cursor: pointer; font-family: inherit; }
        .go-back-link:hover { color: var(--black); }

        .contact-textarea { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #D1D5DB; border-radius: var(--radius-md); font-family: inherit; font-size: 0.9rem; resize: vertical; }
        .contact-textarea:focus { outline: none; border-color: var(--primary-500); box-shadow: 0 0 0 3px rgba(36,146,235,0.12); }
        .contact-textarea.has-error { border-color: var(--danger); }

        .signup-footer { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; }
        .signup-footer p { margin: 0.375rem 0; color: #999999; }
        .signup-footer a { font-weight: 600; color: var(--primary-500); text-decoration: none; }
        .signup-footer a:hover { text-decoration: underline; }
        .signup-trust-badge { font-size: 0.8125rem; color: #999999; text-align: center; margin-top: 1.5rem; line-height: 1.5; }

        @media (max-width: 1024px) { .signup-hero { display: none; } .signup-form-panel { width: 100%; } }
        @media (max-width: 640px) {
          .signup-hero-content h1 { font-size: 1.5rem; }
          .signup-hero-content p { font-size: 1rem; }
          .signup-form-panel { padding: 1.5rem 1rem; }
          .name-row { grid-template-columns: 1fr; }
          .signup-card { max-width: 100%; }
        }
      `}</style>

      <div className="signup-page">
        <div className="signup-hero">
          <div className="signup-hero-content">
            <h1>Master<br />Project Management,<br />Boost Your Career</h1>
            <p>Learn the skills to plan, execute, and deliver <br /> successful projects.</p>
            <div className="signup-hero-dots">
              <button className="dot-button dot-active" aria-label="Slide 1" />
              <button className="dot-button dot-inactive" aria-label="Slide 2" />
              <button className="dot-button dot-inactive" aria-label="Slide 3" />
            </div>
          </div>
        </div>

        <div className="signup-form-panel">
          <div className="signup-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          {/* Error alerts */}
          {!showContactForm && (
            <div role="alert" aria-live="polite" className="signup-error-alert">
              {error && <Alert type="error" title="Signup failed">{error}</Alert>}
              {formErrors.submit && <Alert type="error" title="Signup failed">{formErrors.submit}</Alert>}
            </div>
          )}

          <div className="signup-card">
            {showContactForm ? (
              contactSubmitted ? (
                // ── Contact form: success state ────────────────────────────
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#EBF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-500)" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <h2 className="signup-title" style={{ marginBottom: '0.5rem' }}>Message sent</h2>
                  <p style={{ color: '#4a4a4a', lineHeight: 1.6, fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                    Our team will review your request and follow up by email with a trainer code.
                  </p>
                  <button type="button" className="go-back-link" style={{ marginBottom: 0, justifyContent: 'center', width: '100%' }} onClick={handleBackFromContact}>
                    <ChevronLeft size={16} /> Back to signup
                  </button>
                </div>
              ) : (
                // ── Contact form ────────────────────────────────────────────
                <>
                  <button type="button" className="go-back-link" onClick={handleBackFromContact}>
                    <ChevronLeft size={16} /> Go back
                  </button>
                  <h2 className="signup-title" style={{ textAlign: 'left', marginBottom: '0.375rem' }}>Send us a message</h2>
                  <p style={{ color: '#666666', fontSize: '0.875rem', margin: '0 0 1.25rem' }}>Fill in the form and we'll be in touch shortly.</p>
                  <form className="signup-form" onSubmit={handleContactSubmit}>
                    <Input label="Name" name="name" type="text" placeholder="Your full name" value={contactFormData.name} onChange={handleContactChange} error={contactErrors.name} />
                    <Input label="Email" name="email" type="email" placeholder="your@email.com" value={contactFormData.email} onChange={handleContactChange} error={contactErrors.email} />
                    <Input label="Subject" name="subject" type="text" placeholder="Subject of your message here" value={contactFormData.subject} onChange={handleContactChange} error={contactErrors.subject} />
                    <div>
                      <label className="field-label" htmlFor="message">Message</label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="Tell us how we can help you..."
                        value={contactFormData.message}
                        onChange={handleContactChange}
                        rows={4}
                        className={`contact-textarea ${contactErrors.message ? 'has-error' : ''}`}
                      />
                      {contactErrors.message && <p className="terms-error">{contactErrors.message}</p>}
                    </div>
                    <Button
                      type="submit"
                      disabled={contactSubmitting}
                      icon={contactSubmitting ? <Spinner /> : <Send size={16} />}
                      iconPosition="left"
                      style={{ width: '100%', padding: '0.8125rem 1rem', gap: '0.5rem' }}
                    >
                      {contactSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </>
              )
            ) : (
              // ── Signup form ────────────────────────────────────────────────
              <>
                <h2 className="signup-title">Create your account</h2>

                <div className="role-toggle">
                  {(['learner', 'trainer'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`role-btn ${role === r ? 'active' : ''}`}
                      onClick={() => handleRoleChange(r)}
                    >
                      {r === 'learner' ? "I'm a learner" : "I'm a trainer"}
                    </button>
                  ))}
                </div>

                <form className="signup-form" onSubmit={handleSubmit}>
                  <div className="name-row">
                    <Input label="First name" name="firstName" type="text" placeholder="Enter your first name" value={formData.firstName} onChange={handleInputChange} error={formErrors.firstName} />
                    <Input label="Last name" name="lastName" type="text" placeholder="Enter your last name" value={formData.lastName} onChange={handleInputChange} error={formErrors.lastName} />
                  </div>

                  <Input label="Email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} error={formErrors.email} />

                  {role === 'trainer' && (
                    <div>
                      <label className="field-label">Unique Code</label>
                      <div className="code-input-row">
                        {uniqueCode.map((digit, i) => (
                          <React.Fragment key={i}>
                            <input
                              ref={(el) => (codeInputRefs.current[i] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleCodeChange(i, e.target.value)}
                              onKeyDown={(e) => handleCodeKeyDown(i, e)}
                              onPaste={handleCodePaste}
                              className={`code-input-box ${formErrors.uniqueCode ? 'has-error' : ''}`}
                              aria-label={`Trainer code digit ${i + 1}`}
                            />
                            {i === 2 && <span className="code-dash">–</span>}
                          </React.Fragment>
                        ))}
                      </div>
                      {formErrors.uniqueCode && <p className="terms-error">{formErrors.uniqueCode}</p>}
                      <button type="button" className="contact-admin-link" onClick={() => setShowContactForm(true)}>
                        Contact admin to get a code
                      </button>
                    </div>
                  )}

                  <div className="password-wrapper">
                    <Input label="Password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={formData.password} onChange={handleInputChange} error={formErrors.password} />
                    <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && !formErrors.password && <PasswordStrengthIndicator password={formData.password} />}

                  <div className="password-wrapper">
                    <Input label="Confirm password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} error={formErrors.confirmPassword} />
                    <button type="button" className="eye-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && !formErrors.confirmPassword && (
                    <p className="password-match-error">Passwords do not match</p>
                  )}

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
                        <a href={`${ROUTES.TERMS}?from=${role}`} target="_blank" rel="noopener noreferrer">Terms of Service</a>
                        {' '}and{' '}
                        <a href={`${ROUTES.PRIVACY}?from=${role}`} target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                      </label>
                    </div>
                    {formErrors.terms && <p className="terms-error">{formErrors.terms}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={!isFormFilled || isLoading || codeValidating}
                    className="submit-button"
                    icon={isLoading || codeValidating ? <Spinner /> : undefined}
                    iconPosition="left"
                    style={{ width: '100%', padding: '0.8125rem 1rem', gap: '0.5rem' }}
                  >
                    {codeValidating ? 'Checking code...' : isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>

                <div className="signup-footer">
                  <p>or</p>
                  <p>Already have an account? <Link to={ROUTES.LOGIN} style={{ fontWeight: 600 }}>Log in</Link></p>
                </div>
              </>
            )}
          </div>

          {!showContactForm && (
            <p className="signup-trust-badge">Trusted by 50,000+ learners across emerging markets</p>
          )}
        </div>
      </div>
    </>
  )
}