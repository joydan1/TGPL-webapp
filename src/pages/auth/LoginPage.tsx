import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import { ROUTES, RouteBuilder } from '../../constants/routes'

function Spinner() {
  return (
    <svg
      style={{
        animation: 'spin 0.7s linear infinite',
        width: 18,
        height: 18,
        flexShrink: 0,
        display: 'block',
      }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
      <path fill="currentColor" style={{ opacity: 0.8 }} d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [rememberMe, setRememberMe] = useState(false)

  const isFormFilled = formData.email.trim().length > 0 && formData.password.length > 0

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

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
       const onboardingComplete = localStorage.getItem('onboardingComplete')
  if (!onboardingComplete) {
    navigate(RouteBuilder.onboarding())
  } else {
    navigate(RouteBuilder.dashboard())
  }

  }
  }
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  useEffect(() => {
    const rememberEmail = localStorage.getItem('rememberEmail')
    if (rememberEmail) {
      setFormData((prev) => ({
        ...prev,
        email: rememberEmail,
      }))
      setRememberMe(true)
    }
    clearError()
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section with Gradient */}
      <div
        className="hidden lg:flex lg:flex-col"
        style={{
          width: '50%',
          padding: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          justifyContent: 'flex-end',
          borderTopRightRadius: '32px',
          borderBottomRightRadius: '32px',
        }}
      >
        {/* Background image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/image1.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dark blue gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(10,42,74,0.55) 0%, rgba(14,74,138,0.75) 50%, rgba(10,42,74,0.92) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            marginBottom: '8%',
            color: 'white',
            paddingRight: '2rem',
          }}
        >
          <h1
            style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              lineHeight: 1.15,
              fontWeight: 800,
            }}
          >
            Master <br />
            Project Management, <br />
            Boost Your Career
          </h1>

          <p
            style={{
              fontSize: '1.5rem',
              opacity: 0.82,
              marginBottom: '2rem',
              lineHeight: 1.55,
            }}
          >
            Learn the skills to plan, execute, and deliver
            <br /> successful projects.
          </p>

          {/* Carousel dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                width: 36,
                height: 8,
                borderRadius: 4,
                background: '#fff',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <button
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

      {/* Right form panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
          background: 'var(--grey)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: '1.75rem' }}>
          <img src="/Logo.png" alt="The Global Project Leaders" style={{ height: '2.75rem' }} />
        </div>

        {/* Error Alert - outside the card */}
        {error && (
          <div style={{ width: '100%', maxWidth: '440px', marginBottom: '1rem' }}>
            <Alert type="error" title="Login failed">{error}</Alert>
          </div>
        )}

        {/* White card */}
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
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2
              style={{
                color: 'var(--black)',
                fontSize: '1.75rem',
                lineHeight: 1.1,
                marginBottom: '0.75rem',
                fontWeight: 700,
              }}
            >
              Welcome back
            </h2>
            <p
              style={{
                color: 'var(--black)',
                opacity: 0.85,
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Log in to continue learning.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Password with Forgot Password Link */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--black)' }}>
                  Password
                </label>
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  style={{ fontSize: '0.875rem', color: 'var(--primary-500)', textDecoration: 'none', fontWeight: 500 }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={formErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999999',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
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
                marginTop: '1.55rem',
                border: 'none',
                fontFamily: 'inherit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isFormFilled && !isLoading ? 'pointer' : 'not-allowed',
                transition: 'var(--transition)',
                background: isFormFilled ? 'var(--primary-500)' : 'rgba(36,146,235,0.45)',
                color: 'var(--white)',
                letterSpacing: '0.01em',
              }}
            >
              {isLoading ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: '0.5rem',
                  }}
                >
                  <Spinner />
                  <span>Logging in...</span>
                </span>
              ) : (
                'Log in'
              )}
            </Button>
          </form>

          {/* Signup Link */}
          <div className="text-center" style={{ marginTop: '2.5rem' }}>
            <p style={{ color: 'var(--black)', margin: 0 }}>
              New here?{' '}
              <Link
                to={ROUTES.SIGNUP}
                className="text-primary-500 hover:text-primary-700 font-medium transition-colors"
              >
                Create an account
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
    </div>
  )
}
