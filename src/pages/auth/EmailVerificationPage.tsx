import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth'
import { authAPI } from '../../services/api'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import type { User } from '../../types/index'
import Spinner from '../../components/Spinner'

type State = 'verifying' | 'success' | 'error'

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''

  const [state, setState] = useState<State>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  // Store profile completion status in local state so handleContinue
  // never reads stale Zustand state — the value is captured at verify time
  const [profileStatus, setProfileStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState('error')
      setErrorMessage('No verification token found. Please check your email link.')
      return
    }

    const verify = async () => {
      const result = await authAPI.verifyEmail({ token })

      if (result.success) {
        const userResult = await authAPI.getCurrentUser()
        if (userResult.success && userResult.data) {
          const userData = userResult.data
          const user: User = {
            id: parseInt(userData.id, 10),
            email: userData.email,
            name: `${userData.first_name} ${userData.last_name}`.trim(),
            role: userData.role,
            createdAt: userData.created_at,
            learner_profile: userData.learner_profile || null,
          }
          useAuthStore.getState().setUser(user)
          // Capture status into local state — safe to read synchronously in handleContinue
          setProfileStatus(userData.learner_profile?.completion_status ?? null)
          setResendEmail(userData.email)
        }
        setState('success')
      } else {
        setState('error')
        setErrorMessage(result.error || 'Verification failed. The link may have expired or already been used.')
      }
    }

    verify()
  }, [token])

  const handleResend = async () => {
    if (!resendEmail) return
    setResendLoading(true)
    setResendMessage('')
    const result = await authAPI.sendVerificationEmail({ email: resendEmail })
    setResendMessage(
      result.success
        ? 'New verification email sent! Check your inbox.'
        : 'Failed to resend. Please try again.'
    )
    setResendLoading(false)
  }

  // Reads from local state — no stale Zustand access risk
  const handleContinue = () => {
    navigate(profileStatus === 'complete' ? RouteBuilder.dashboard() : RouteBuilder.onboarding())
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grey)', padding: '1rem' }}>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: '3rem 2.5rem', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>

          <div style={{ marginBottom: '1.5rem' }}>
            <img src="/Logo.png" alt="The Global Project Leaders" style={{ height: '2.75rem' }} />
          </div>

          {/* ── Verifying ── */}
          {state === 'verifying' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-500)' }}>
                <Spinner size={24} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--black)', margin: '0 0 0.75rem' }}>
                Verifying your email...
              </h2>
              <p style={{ color: '#4a4a4a', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
                Please wait while we confirm your email address.
              </p>
            </>
          )}

          {/* ── Success ── */}
          {state === 'success' && (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l3 3 5-5" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--black)', margin: '0 0 0.75rem' }}>
                Email verified!
              </h2>
              <p style={{ color: '#4a4a4a', lineHeight: 1.7, margin: '0 0 2rem', fontSize: '0.95rem' }}>
                Your email has been successfully verified. You're all set to start learning.
              </p>
              <button
                type="button"
                onClick={handleContinue}
                style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', background: 'var(--primary-500)', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
              >
                Continue to dashboard
              </button>
            </>
          )}

          {/* ── Error ── */}
          {state === 'error' && (
            <>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--black)', margin: '0 0 0.75rem' }}>
                Verification failed
              </h2>
              <p style={{ color: '#4a4a4a', lineHeight: 1.7, margin: '0 0 1.5rem', fontSize: '0.95rem' }}>
                {errorMessage}
              </p>

              <div style={{ padding: '1rem', background: '#F9F9F9', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#666', margin: '0 0 0.5rem' }}>
                  Need a new verification link?
                </p>
                {!resendEmail ? (
                  <div>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      onChange={(e) => setResendEmail(e.target.value)}
                      style={{ width: '100%', padding: '0.625rem 0.875rem', border: '1px solid #E8E8E8', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', marginBottom: '0.5rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading || !resendEmail}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-500)', fontWeight: 600, cursor: resendLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: resendLoading ? 0.6 : 1 }}
                    >
                      {resendLoading ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-500)', fontWeight: 600, cursor: resendLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: resendLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
                  >
                    {resendLoading && <Spinner size={16} />}
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                )}
                {resendMessage && (
                  <p style={{ fontSize: '0.8125rem', margin: '0.5rem 0 0', color: resendMessage.toLowerCase().includes('failed') ? 'var(--danger)' : 'var(--success)' }}>
                    {resendMessage}
                  </p>
                )}
              </div>

              <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary-500)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}