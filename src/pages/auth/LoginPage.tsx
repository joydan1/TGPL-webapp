import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth'
import { authAPI } from '../../services/api'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import { ROUTES, RouteBuilder } from '../../constants/routes'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [rememberMe, setRememberMe] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const isFormFilled =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
    formData.password.length > 0

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email'
    }
    if (!formData.password) errors.password = 'Password is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleResendVerificationEmail = async () => {
    if (!unverifiedEmail) return
    setResendLoading(true)
    setResendMessage('')
    const result = await authAPI.sendVerificationEmail({ email: unverifiedEmail })
    setResendMessage(
      result.success
        ? 'Verification email sent! Check your inbox.'
        : 'Failed to resend email. Please try again.',
    )
    setResendLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setFormErrors({})
    setUnverifiedEmail(null)
    setResendMessage('')

    if (!validateForm()) return

    const result = await login({ email: formData.email, password: formData.password })

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }
      const user = useAuthStore.getState().user
      const status = user?.learner_profile?.completion_status
      navigate(status === 'complete' ? RouteBuilder.dashboard() : RouteBuilder.onboarding())
    } else {
     if (!result.success && (result as {success:false;statusCode?:number;code?:string}).statusCode === 403 && (result as {success:false;statusCode?:number;code?:string}).code === 'email_not_verified') {
        setUnverifiedEmail(formData.email)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
    if (name === 'email' && unverifiedEmail) {
      setUnverifiedEmail(null)
      setResendMessage('')
    }
  }

  useEffect(() => {
    const rememberEmail = localStorage.getItem('rememberEmail')
    if (rememberEmail) {
      setFormData((prev) => ({ ...prev, email: rememberEmail }))
      setRememberMe(true)
    }
    clearError()
  }, [clearError])

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }

        .login-page { min-height: 100vh; display: flex; background: var(--white); margin: 0; padding: 0; }

        .login-hero {
          width: 50%; background-image: url(/image1.png); background-size: cover;
          background-position: center; position: relative; overflow: hidden;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 2.5rem; border-top-right-radius: 32px; border-bottom-right-radius: 32px;
        }
        .login-hero::before {
          content: ''; position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(180deg, rgba(10,42,74,0.55) 0%, rgba(14,74,138,0.75) 50%, rgba(10,42,74,0.92) 100%);
        }
        .login-hero-content { position: relative; z-index: 10; color: #fff; margin-bottom: 8%; padding-right: 2rem; }
        .login-hero-content h1 { font-size: 3rem; font-weight: 800; line-height: 1.15; margin: 0 0 1rem 0; }
        .login-hero-content p { font-size: 1.5rem; font-weight: 400; line-height: 1.55; margin: 0 0 2rem 0; opacity: 0.82; }
        .login-hero-dots { display: flex; gap: 8px; }
        .dot-button { border: none; background: none; cursor: pointer; padding: 0; }
        .dot-active { width: 36px; height: 8px; border-radius: 4px; background: #fff; display: block; }
        .dot-inactive { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.6); background: transparent; display: block; }

        .login-form-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 1.5rem; background: var(--grey); overflow: hidden; }
        .login-logo { margin-bottom: 1.75rem; text-align: center; }
        .login-logo img { height: 2.75rem; }

        .login-card { width: 100%; max-width: 440px; background: var(--white); border: 1px solid #E8E8E8; border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-sm); }
        .login-title { text-align: center; margin-bottom: 1.75rem; }
        .login-title h2 { color: var(--black); font-size: 1.75rem; line-height: 1.1; margin: 0 0 0.75rem; font-weight: 700; }
        .login-title p { color: var(--black); opacity: 0.85; font-size: 1rem; line-height: 1.6; margin: 0; }

        .login-form { display: flex; flex-direction: column; gap: 1rem; }
        .password-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.375rem; }
        .password-label-row label { font-size: 0.875rem; font-weight: 500; color: var(--black); }
        .forgot-link { font-size: 0.875rem; color: var(--primary-500); text-decoration: none; font-weight: 500; }
        .forgot-link:hover { text-decoration: underline; }
        .password-wrapper { position: relative; }
        .eye-button { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #999; display: flex; align-items: center; padding: 0.25rem; transition: color 200ms ease; }
        .eye-button:hover { color: #666; }
        .eye-button:focus-visible { outline: 2px solid var(--primary-500); border-radius: 4px; }
        .remember-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem; }
        .remember-checkbox { width: 1rem; height: 1rem; cursor: pointer; accent-color: var(--primary-500); flex-shrink: 0; }
        .remember-label { font-size: 0.875rem; color: var(--black); cursor: pointer; user-select: none; margin: 0; }
        .login-footer { text-align: center; margin-top: 2rem; }
        .login-footer p { color: var(--black); margin: 0; font-size: 0.9375rem; }
        .login-footer a { color: var(--primary-500); font-weight: 600; text-decoration: none; }
        .login-footer a:hover { text-decoration: underline; }
        .login-trust-badge { font-size: 0.875rem; color: #999; margin-top: 1.25rem; margin-bottom: 0; text-align: center; }

        @media (max-width: 1024px) { .login-hero { display: none; } .login-form-panel { width: 100%; } }
        @media (max-width: 640px) { .login-form-panel { padding: 1.5rem 1rem; } .login-card { max-width: 100%; } .login-hero-content h1 { font-size: 1.5rem; } .login-hero-content p { font-size: 1rem; } }
      `}</style>

      <div className="login-page">
        <div className="login-hero">
          <div className="login-hero-content">
            <h1>Master<br />Project Management,<br />Boost Your Career</h1>
            <p>Learn the skills to plan, execute, and deliver<br /> successful projects.</p>
            <div className="login-hero-dots">
              <button className="dot-button" aria-label="Slide 1"><span className="dot-active" /></button>
              <button className="dot-button" aria-label="Slide 2"><span className="dot-inactive" /></button>
              <button className="dot-button" aria-label="Slide 3"><span className="dot-inactive" /></button>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          <div role="alert" aria-live="polite" style={{ width: '100%', maxWidth: '440px', marginBottom: error ? '1rem' : 0 }}>
            {error && <Alert type="error" title="Login failed">{error}</Alert>}
          </div>

          <div className="login-card">
            <div className="login-title">
              <h2>Welcome back</h2>
              <p>Log in to continue learning.</p>
            </div>

            {unverifiedEmail && (
              <div style={{ marginBottom: '1rem' }}>
                <Alert type="warning" title="Email not verified">
                  <div style={{ marginBottom: '0.75rem' }}>
                    Your email hasn't been verified yet. Check your inbox for a verification link.
                  </div>
                  <button
                    onClick={handleResendVerificationEmail}
                    disabled={resendLoading}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-500)', fontWeight: 600, cursor: resendLoading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: resendLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}
                  >
                    {resendLoading && <Spinner size={18} />}
                    {resendLoading ? 'Sending...' : 'Resend verification email'}
                  </button>
                  {resendMessage && (
                    <p style={{ fontSize: '0.8125rem', color: resendMessage.toLowerCase().includes('failed') ? 'var(--danger)' : 'var(--success)', margin: '0.5rem 0 0' }}>
                      {resendMessage}
                    </p>
                  )}
                </Alert>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <Input label="Email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleInputChange} error={formErrors.email} disabled={unverifiedEmail !== null} />

              <div>
                <div className="password-label-row">
                  <label htmlFor="password">Password</label>
                  <Link to={ROUTES.FORGOT_PASSWORD} className="forgot-link">Forgot password?</Link>
                </div>
                <div className="password-wrapper">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleInputChange} error={formErrors.password} disabled={unverifiedEmail !== null} />
                  {unverifiedEmail === null && (
                    <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="remember-row">
                <input type="checkbox" id="rememberMe" className="remember-checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <label htmlFor="rememberMe" className="remember-label">Remember me</label>
              </div>

              {unverifiedEmail === null ? (
                <Button
  type="submit"
  disabled={!isFormFilled || isLoading}
  style={{
    width: '100%',
    padding: '0.8125rem 1rem',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    {isLoading && <Spinner size={18} />}
    <span>{isLoading ? 'Logging in...' : 'Log in'}</span>
  </div>
</Button>
              )}
            </form>

            <div className="login-footer">
              <p>New here? <Link to={ROUTES.SIGNUP}>Create an account</Link></p>
            </div>
          </div>

          <p className="login-trust-badge">Trusted by 50,000+ learners across emerging markets</p>
        </div>
      </div>
    </>
  )
}
