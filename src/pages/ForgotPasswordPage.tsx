import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../components/Input'
import Button from '../components/Button'
import { ROUTES } from '../constants/routes'
import { authAPI } from '../services/api'

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

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const isFormFilled = email.trim().length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormFilled) return

    setError(null)
    setIsLoading(true)

    const result = await authAPI.requestPasswordReset({ email: email.trim() })

    if (result.success) {
      setSent(true)
      setSentEmail(email.trim())
    } else {
      setError(result.error || 'Unable to send reset link. Please try again.')
    }

    setIsLoading(false)
  }

  const handleResend = async () => {
    if (!sentEmail) return
    setError(null)
    setIsLoading(true)

    const result = await authAPI.requestPasswordReset({ email: sentEmail })

    if (!result.success) {
      setError(result.error || 'Unable to resend link. Please try again.')
    }

    setIsLoading(false)
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
            backgroundImage: 'url(/image1.png)',
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
            Master <br />
            Project Management, <br />
            Boost Your Career
          </h1>
          <p style={{ fontSize: '1.5rem', opacity: 0.82, marginBottom: '2rem', lineHeight: 1.55 }}>
            Learn the skills to plan, execute, and deliver
            <br /> successful projects.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{ width: 36, height: 8, borderRadius: 4, background: '#fff', border: 'none' }}
            />
            <button
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'transparent',
              }}
            />
            <button
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'transparent',
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
        <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/Logo.png" alt="TGPL" style={{ height: '2.5rem', margin: '0 auto' }} />
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--white)',
            border: '1px solid #E8E8E8',
            marginTop: '1rem',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ color: 'var(--black)', fontSize: '1.75rem', lineHeight: 1.1, marginBottom: '0.75rem' }}>
              {sent ? 'Check your email' : 'Reset your password'}
            </h2>
            <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
              {sent
                ? `We've sent a password reset link to ${sentEmail}.`
                : 'Enter your email and we’ll send you a link to reset your password.'}
            </p>
          </div>

          {sent ? (
            <div>
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  background: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>Next steps:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '1.25rem', color: 'rgba(0, 0, 0, 0.75)' }}>
                  <li>Check your email inbox</li>
                  <li>Click the reset link (valid for 1 hour)</li>
                  <li>Create a new password</li>
                </ul>
              </div>

              <div className="text-center" style={{ marginBottom: '1rem' }}>
                <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)' }}>
                  Didn't receive the email?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--primary-500)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    Resend email
                  </button>
                </p>
              </div>

              <Button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{
                  width: '100%',
                  marginTop: '0.75rem',
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
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={error || undefined}
              />
              {error && (
                <p style={{ color: 'var(--danger)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>{error}</p>
              )}
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
                  background: isFormFilled ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
                  color: 'var(--white)',
                  letterSpacing: '0.01em',
                  marginTop: '0.75rem',
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Sending link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
              <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)', fontSize: '0.95rem' }}>
                Remember your password?{' '}
                <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary-500)', fontWeight: 600 }}>
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
