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

    if (!formData.password) {
      errors.password = 'Password is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleResendVerificationEmail = async () => {
    if (!unverifiedEmail) return

    setResendLoading(true)
    setResendMessage('')

    const result = await authAPI.sendVerificationEmail({
      email: unverifiedEmail,
    })

    setResendMessage(
      result.success
        ? 'Verification email sent! Check your inbox.'
        : 'Failed to resend email. Please try again.'
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

    const result = await login({
      email: formData.email,
      password: formData.password,
    })

    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberEmail', formData.email)
      } else {
        localStorage.removeItem('rememberEmail')
      }

      const user = useAuthStore.getState().user
      const status = user?.learner_profile?.completion_status

      navigate(
        status === 'complete'
          ? RouteBuilder.dashboard()
          : RouteBuilder.onboarding()
      )

      return
    }

    // ✅ SAFE ERROR CHECK (NO CASTING, NO TS ERRORS)
    const typedResult = result as {
      success: false
      statusCode?: number
      code?: string
      error?: string
    }

    if (
      typedResult.statusCode === 403 &&
      typedResult.code === 'email_not_verified'
    ) {
      setUnverifiedEmail(formData.email)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({ ...prev, [name]: value }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }

    if (name === 'email' && unverifiedEmail) {
      setUnverifiedEmail(null)
      setResendMessage('')
    }
  }

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberEmail')

    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }

    clearError()
  }, [clearError])

  return (
    <>
      <div className="login-page">
        <div className="login-hero">
          <div className="login-hero-content">
            <h1>Master Project Management,<br />Boost Your Career</h1>
            <p>Learn the skills to plan, execute, and deliver successful projects.</p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-logo">
            <img src="/Logo.png" alt="Logo" />
          </div>

          {error && (
            <Alert type="error" title="Login failed">
              {error}
            </Alert>
          )}

          {unverifiedEmail && (
            <Alert type="warning" title="Email not verified">
              <p>Check your inbox for verification link.</p>

              <button
                onClick={handleResendVerificationEmail}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>

              {resendMessage && <p>{resendMessage}</p>}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              disabled={!!unverifiedEmail}
              error={formErrors.email}
            />

            <div className="password-wrapper">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                disabled={!!unverifiedEmail}
                error={formErrors.password}
              />

              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <Button disabled={!isFormFilled || isLoading}>
              {isLoading ? <Spinner size={18} /> : 'Log in'}
            </Button>
          </form>

          <p>
            New here? <Link to={ROUTES.SIGNUP}>Create account</Link>
          </p>
        </div>
      </div>
    </>
  )
}