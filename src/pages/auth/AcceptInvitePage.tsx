import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authAPI } from '../../services/api'
import { Eye, EyeOff } from 'lucide-react'
import Input from '../../components/Input'
import Button from '../../components/Button'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import { ROUTES, RouteBuilder } from '../../constants/routes'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loadCurrentUser } = useAuth()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({ firstName: '', lastName: '', password: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const isFormFilled =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    formData.password.length >= 8

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.firstName.trim()) errors.firstName = 'First name is required'
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required'
    if (!formData.password) errors.password = 'Password is required'
    else if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!token) return
    if (!validateForm()) return

    setIsLoading(true)
    const result = await authAPI.acceptInvite({
      token,
      password: formData.password,
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
    })

    if (result.success) {
      // authAPI.acceptInvite() already stored the access/refresh tokens via
      // the store setters (same as verifyEmail). loadCurrentUser() fetches
      // /me/, maps it to the app's User type, and calls store.setUser(),
      // which flips isAuthenticated true — required for ProtectedRoute's
      // requiredRole check to pass immediately on the redirect below.
      const userResult = await loadCurrentUser()
      const user = userResult.success ? userResult.user : undefined

      const destination =
        user?.role === 'trainer'
          ? RouteBuilder.trainerDashboard()
          : user?.role === 'admin'
            ? RouteBuilder.adminDashboard()
            : user?.learner_profile?.completion_status === 'complete'
              ? RouteBuilder.dashboard()
              : RouteBuilder.onboarding()

      navigate(destination)
    } else {
      setError(result.error)
      setIsLoading(false)
    }
  }

  const missingTokenView = !token

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

        .login-form-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2.5rem 1.5rem; background: var(--grey); overflow: hidden; }
        .login-logo { margin-bottom: 1.75rem; text-align: center; }
        .login-logo img { height: 2.75rem; width: auto; }

        .login-card { width: 100%; max-width: 440px; background: var(--white); border: 1px solid #E8E8E8; border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-sm); }
        .login-title { text-align: center; margin-bottom: 1.75rem; }
        .login-title h2 { color: var(--black); font-size: 1.75rem; line-height: 1.1; margin: 0 0 0.75rem; font-weight: 700; }
        .login-title p { color: var(--black); opacity: 0.85; font-size: 1rem; line-height: 1.6; margin: 0; }

        .login-form { display: flex; flex-direction: column; gap: 1rem; }
        .password-wrapper { position: relative; }
        .eye-button { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #999; display: flex; align-items: center; padding: 0.25rem; transition: color 200ms ease; }
        .eye-button:hover { color: #666; }
        .eye-button:focus-visible { outline: 2px solid var(--primary-500); border-radius: 4px; }
        .login-footer { text-align: center; margin-top: 2rem; }
        .login-footer p { color: var(--black); margin: 0; font-size: 0.9375rem; }
        .login-footer a { color: var(--primary-500); font-weight: 600; text-decoration: none; }
        .login-footer a:hover { text-decoration: underline; }
        .name-row { display: flex; gap: 0.75rem; }
        .name-row > div { flex: 1; }

        @media (max-width: 1024px) { .login-hero { display: none; } .login-form-panel { width: 100%; } }
        @media (max-width: 640px) { .login-form-panel { padding: 1.5rem 1rem; } .login-card { max-width: 100%; } .login-logo img { height: 1.5rem; width: auto; } .name-row { flex-direction: column; gap: 1rem; } }
      `}</style>

      <div className="login-page">
        <div className="login-hero">
          <div className="login-hero-content">
            <h1>You're Invited<br />to Join TGPL</h1>
            <p>Set up your account to start learning<br />with The Global Project Leaders.</p>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          <div role="alert" aria-live="polite" style={{ width: '100%', maxWidth: '440px', marginBottom: error ? '1rem' : 0 }}>
            {error && <Alert type="error" title="Couldn't accept invite">{error}</Alert>}
          </div>

          <div className="login-card">
            {missingTokenView ? (
              <>
                <div className="login-title">
                  <h2>Invalid invite link</h2>
                  <p>This link is missing its invite token. Please use the exact link from your invite email.</p>
                </div>
                <div className="login-footer">
                  <p>Already have an account? <Link to={ROUTES.LOGIN}>Log in</Link></p>
                </div>
              </>
            ) : (
              <>
                <div className="login-title">
                  <h2>Set up your account</h2>
                  <p>You've been invited to join TGPL. Add your name and choose a password to get started.</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                  <div className="name-row">
                    <Input label="First name" name="firstName" type="text" placeholder="Jane" value={formData.firstName} onChange={handleInputChange} error={formErrors.firstName} />
                    <Input label="Last name" name="lastName" type="text" placeholder="Doe" value={formData.lastName} onChange={handleInputChange} error={formErrors.lastName} />
                  </div>

                  <div>
                    <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--black)', display: 'block', marginBottom: '0.375rem' }}>Password</label>
                    <div className="password-wrapper">
                      <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" value={formData.password} onChange={handleInputChange} error={formErrors.password} />
                      <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!isFormFilled || isLoading}
                    icon={isLoading ? <Spinner size={18} /> : undefined}
                    iconPosition="left"
                    style={{ width: '100%', padding: '0.8125rem 1rem', marginTop: '0.5rem', gap: '0.5rem' }}
                  >
                    {isLoading ? 'Setting up...' : 'Accept invite'}
                  </Button>
                </form>

                <div className="login-footer">
                  <p>Already have an account? <Link to={ROUTES.LOGIN}>Log in</Link></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}