import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import { ROUTES } from '../../constants/routes'
import { authAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

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
  const { clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  // Clear any previous errors on mount
  React.useEffect(() => {
    clearError()
  }, [])

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
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        * { box-sizing: border-box; }

        .forgot-page {
          min-height: 100vh;
          display: flex;
          background: var(--white);
          margin: 0;
          padding: 0;
        }

        /* ── Hero Section (50% width) ── */
        .forgot-hero {
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

        .forgot-hero::before {
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

        .forgot-hero-content {
          position: relative;
          z-index: 10;
          color: #fff;
          margin-bottom: 8%;
        }

        .forgot-hero-content h1 {
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.15;
          margin: 0 0 1rem 0;
        }

        .forgot-hero-content p {
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.55;
          margin: 0 0 2rem 0;
          opacity: 0.82;
        }

        .forgot-hero-dots {
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
        .forgot-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 1.5rem;
          background: var(--grey);
          overflow: hidden;
        }

        .forgot-logo {
          margin-bottom: 1.75rem;
          text-align: center;
        }

        .forgot-logo img {
          height: 2.75rem;
        }

        .forgot-card {
          width: 100%;
          max-width: 440px;
          background: var(--white);
          border: 1px solid #E8E8E8;
          border-radius: var(--radius-lg);
          padding: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .forgot-title {
          text-align: center;
          color: var(--black);
          font-size: 1.75rem;
          line-height: 1.1;
          margin: 0 0 0.75rem 0;
          font-weight: 700;
        }

        .forgot-subtitle {
          text-align: center;
          color: rgba(0, 0, 0, 0.65);
          font-size: 1rem;
          line-height: 1.7;
          margin: 0 0 1.75rem 0;
        }

        .forgot-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .success-box {
          margin-bottom: 1.5rem;
          padding: 1.5rem;
          border-radius: 1rem;
          background: #F0F9FF;
          border: 1px solid #BFDBFE;
        }

        .success-box p {
          margin: 0;
          font-weight: 600;
          color: var(--primary-500);
        }

        .success-box ul {
          margin-top: 1rem;
          padding-left: 1.25rem;
          color: rgba(0, 0, 0, 0.75);
        }

        .success-box li {
          margin-bottom: 0.5rem;
        }

        .resend-text {
          text-align: center;
          margin-bottom: 1rem;
          color: rgba(0, 0, 0, 0.65);
          font-size: 0.95rem;
        }

        .resend-button {
          border: none;
          background: transparent;
          color: var(--primary-500);
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          text-decoration: none;
        }

        .resend-button:hover {
          text-decoration: underline;
        }

        .resend-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-link-text {
          margin: 0;
          color: rgba(0, 0, 0, 0.65);
          font-size: 0.95rem;
          text-align: center;
        }

        .back-link {
          color: var(--primary-500);
          font-weight: 600;
          text-decoration: none;
        }

        .back-link:hover {
          text-decoration: underline;
        }

        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.8125rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          background: var(--primary-500);
          color: var(--white);
          letter-spacing: 0.01em;
          margin-top: 0.75rem;
        }

        .submit-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .secondary-button {
          width: 100%;
          padding: 0.9rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--primary-500);
          background: transparent;
          color: var(--primary-500);
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease;
          margin-top: 0.75rem;
        }

        .secondary-button:hover {
          background: #F0F9FF;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .forgot-hero { 
            display: none;
          }
          .forgot-form-panel { width: 100%; }
        }

        @media (max-width: 640px) {
          .forgot-hero-content h1 { font-size: 1.5rem; }
          .forgot-hero-content p { font-size: 1rem; }
          .forgot-form-panel { padding: 1.5rem 1rem; }
          .forgot-card { max-width: 100%; }
          .forgot-title { font-size: 1.5rem; }
        }
      `}</style>

      <div className="forgot-page">
        {/* ── Hero Section ── */}
        <div className="forgot-hero">
          <div className="forgot-hero-content">
            <h1>
              Master <br />
              Project Management, <br />
              Boost Your Career
            </h1>
            <p>Learn the skills to plan, execute, and deliver successful projects.</p>
            <div className="forgot-hero-dots">
              <button className="dot-button dot-active" aria-label="Slide 1" />
              <button className="dot-button dot-inactive" aria-label="Slide 2" />
              <button className="dot-button dot-inactive" aria-label="Slide 3" />
            </div>
          </div>
        </div>

        {/* ── Form Panel ── */}
        <div className="forgot-form-panel">
          {/* Logo */}
          <div className="forgot-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          {/* Card */}
          <div className="forgot-card">
            {sent && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle size={48} color="var(--success)" strokeWidth={1.5} />
                </div>
              </div>
            )}
            <h2 className="forgot-title">{sent ? 'Check your email' : 'Reset your password'}</h2>
            <p className="forgot-subtitle">
              {sent
                ? `We've sent a password reset link to ${sentEmail}.`
                : 'Enter your email and we\'ll send you a link to reset your password.'}
            </p>

            {/* Error Alert */}
            {error && <Alert type="error" title="Reset failed">{error}</Alert>}

            {sent ? (
              <div>
                {/* Success Box */}
                <div className="success-box">
                  <p>Next steps:</p>
                  <ul>
                    <li>Check your email inbox</li>
                    <li>Click the reset link (valid for 1 hour)</li>
                    <li>Create a new password</li>
                  </ul>
                </div>

                {/* Resend */}
                <p className="resend-text">
                  Didn't receive the email?{' '}
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    Resend email
                  </button>
                </p>

                {/* Back to Login */}
                <Button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <form className="forgot-form" onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button
                  type="submit"
                  disabled={!isFormFilled || isLoading}
                  className="submit-button"
                  icon={isLoading ? <Spinner /> : undefined}
                  iconPosition="left"
                  style={{ gap: '0.5rem' }}
                >
                  {isLoading ? 'Sending link...' : 'Send reset link'}
                </Button>

                <p className="back-link-text">
                  Remember your password?{' '}
                  <Link to={ROUTES.LOGIN} className="back-link">
                    Back to login
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}