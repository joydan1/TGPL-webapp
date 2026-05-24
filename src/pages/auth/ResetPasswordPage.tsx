import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
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

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams<{ token: string }>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [updated, setUpdated] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  const isFormFilled = password.length > 0 && confirmPassword.length > 0

  useEffect(() => {
    if (!token) {
      setInvalidToken(true)
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token) return

    if (!isFormFilled) {
      setError('Please enter both password fields.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setError(null)
    setIsLoading(true)

    const result = await authAPI.confirmPasswordReset({ token, new_password: password })

    if (result.success) {
      setUpdated(true)
    } else {
      setError(result.error || 'Unable to update password. Please try again.')
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
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <img src="/Logo.png" alt="TGPL" style={{ height: '2.5rem', marginBottom: '1.5rem' }} />
            <h2 style={{ color: 'var(--black)', fontSize: '1.75rem', lineHeight: 1.1, marginBottom: '0.75rem' }}>
              {updated ? 'Password updated!' : 'Create new password'}
            </h2>
            <p style={{ color: 'rgba(0,0,0,0.65)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
              {updated
                ? 'Your password has been successfully updated. You can now log in with your new password.'
                : 'Your new password must be different from previously used passwords.'}
            </p>
          </div>

          {invalidToken ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Invalid or missing reset link.</p>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                style={{ color: 'var(--primary-500)', fontWeight: 600 }}
              >
                Send a new reset link
              </Link>
            </div>
          ) : updated ? (
            <div>
              <Button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--primary-500)',
                  color: 'var(--white)',
                  fontWeight: 600,
                }}
              >
                Continue to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">New password</label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="SecurePass123!"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    error={undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey hover:text-black transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Confirm password</label>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="SecurePass123!"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    error={undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-grey hover:text-black transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', margin: '-0.5rem 0 0 0', fontSize: '0.95rem' }}>{error}</p>
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
                }}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Update password...
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
              <p style={{ margin: 0, color: 'rgba(0, 0, 0, 0.65)', fontSize: '0.95rem', textAlign: 'center' }}>
                Remembered your password?{' '}
                <Link to={ROUTES.LOGIN} style={{ color: 'var(--primary-500)', fontWeight: 600 }}>
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