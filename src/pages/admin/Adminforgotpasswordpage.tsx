import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { ROUTES } from '../../constants/routes'
import { authAPI } from '../../services/api'

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

function CheckCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [sent, setSent] = useState(false)

  const isFormFilled = email.trim().length > 0

  async function submitResetRequest() {
    setError(null)
    const result = await authAPI.requestPasswordReset({ email: email.trim() })
    if (!result.success) {
      setError(result.error || 'Something went wrong. Please try again.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!isFormFilled) {
      setError('Please enter your email address.')
      return
    }

    setIsLoading(true)
    const ok = await submitResetRequest()
    setIsLoading(false)
    if (ok) setSent(true)
  }

  const handleResend = async () => {
    setIsResending(true)
    await submitResetRequest()
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/admin-hero.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,42,74,0.55) 0%, rgba(14,74,138,0.75) 50%, rgba(10,42,74,0.92) 100%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10, marginBottom: '8%', color: 'white' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1.15 }}>
            Manage TGPL, <br />
            Keep projects on track, <br />
            one task at a time!
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              aria-label="Slide 1"
              style={{ width: 36, height: 8, borderRadius: 4, background: '#fff', border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <button
              aria-label="Slide 2"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <button
              aria-label="Slide 3"
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          background: 'var(--grey)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--white)',
            border: '1px solid #E8E8E8',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {!sent && (
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <img src="/Logo.png" alt="TGPL" style={{ height: '2.5rem', marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--black)', fontSize: '1.75rem', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                Reset your password
              </h2>
              <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
                Enter your email and we'll send you a link to reset your password.
              </p>
            </div>
          )}

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <CheckCircleIcon />
              </div>
              <h2 style={{ color: 'var(--black)', fontSize: '1.75rem', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                Check your email
              </h2>
              <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '1rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                We've sent a password reset link to <br />
                <strong style={{ color: 'var(--black)' }}>{email}</strong>
              </p>

              <div
                style={{
                  background: 'var(--grey)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.5rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--black)', margin: '0 0 0.65rem', fontSize: '0.95rem' }}>
                  Next steps:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'rgba(0,0,0,0.7)', fontSize: '0.9rem', lineHeight: 1.9 }}>
                  <li>Check your email inbox</li>
                  <li>Click the reset link (valid for 1 hour)</li>
                  <li>Create a new password</li>
                </ul>
              </div>

              <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Didn't receive the email?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  style={{
                    color: 'var(--primary-500)',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: isResending ? 'not-allowed' : 'pointer',
                    opacity: isResending ? 0.6 : 1,
                  }}
                >
                  {isResending ? 'Resending…' : 'Resend email'}
                </button>
              </p>

              <Button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
                style={{
                  width: '100%',
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--primary-500)',
                  background: 'transparent',
                  color: 'var(--primary-500)',
                  fontWeight: 600,
                }}
              >
                Back to login
              </Button>

              {import.meta.env.DEV && (
                <button
                  type="button"
                  onClick={() => navigate(`${ROUTES.ADMIN_RESET_PASSWORD}?token=demo`)}
                  style={{
                    display: 'block',
                    margin: '1rem auto 0',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(0,0,0,0.35)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  [Demo: Skip to password reset]
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  error={undefined}
                />
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', margin: '-0.5rem 0 0 0', fontSize: '0.95rem' }}>{error}</p>
              )}

              <Button
                type="submit"
                disabled={!isFormFilled || isLoading}
                icon={isLoading ? <Spinner /> : undefined}
                iconPosition="left"
                style={{
                  width: '100%',
                  padding: '0.8125rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  fontFamily: 'inherit',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: isFormFilled && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'var(--transition)',
                  background: isFormFilled ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
                  color: 'var(--white)',
                  letterSpacing: '0.01em',
                  gap: '0.5rem',
                }}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>

              <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)', fontSize: '0.95rem', textAlign: 'center' }}>
                Remember your password?{' '}
                <Link to={ROUTES.ADMIN_LOGIN} style={{ color: 'var(--primary-500)', fontWeight: 600 }}>
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}