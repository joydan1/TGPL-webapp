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
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email'

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
      password: formData.password
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
    } else {
      if (
        (result as any).statusCode === 403 &&
        (result as any).code === 'email_not_verified'
      ) {
        setUnverifiedEmail(formData.email)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }))
    if (name === 'email' && unverifiedEmail) {
      setUnverifiedEmail(null)
      setResendMessage('')
    }
  }

  useEffect(() => {
    const rememberEmail = localStorage.getItem('rememberEmail')
    if (rememberEmail) {
      setFormData(prev => ({ ...prev, email: rememberEmail }))
      setRememberMe(true)
    }
    clearError()
  }, [clearError])

  return (
    <form className="login-form" onSubmit={handleSubmit}>

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="you@example.com"
        value={formData.email}
        onChange={handleInputChange}
        error={formErrors.email}
        disabled={unverifiedEmail !== null}
      />

      <div className="password-wrapper">
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange}
          error={formErrors.password}
          disabled={unverifiedEmail !== null}
        />

        {unverifiedEmail === null && (
          <button
            type="button"
            className="eye-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      <div className="remember-row">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <label>Remember me</label>
      </div>

      {unverifiedEmail === null && (
        <Button
          type="submit"
          disabled={!isFormFilled || isLoading}
          style={{
            width: '100%',
            padding: '0.8125rem 1rem',
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isLoading && <Spinner size={18} />}
            <span>{isLoading ? 'Logging in...' : 'Log in'}</span>
          </div>
        </Button>
      )}

      {unverifiedEmail !== null && (
        <Button
          type="button"
          onClick={() => {
            setUnverifiedEmail(null)
            setResendMessage('')
          }}
          style={{
            width: '100%',
            padding: '0.8125rem 1rem',
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          Try Again
        </Button>
      )}

    </form>
  )
}