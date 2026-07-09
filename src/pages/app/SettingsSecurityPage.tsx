import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Check } from 'lucide-react'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'
import { authAPI } from '../../services/api'
import { ROUTES } from '../../constants/routes'

type StrengthLevel = { score: number; label: string; color: string }

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return { score: 0, label: '', color: '' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels: StrengthLevel[] = [
    { score: 1, label: 'Weak', color: '#EF4444' },
    { score: 2, label: 'Fair', color: '#F59E0B' },
    { score: 3, label: 'Good', color: '#2563EB' },
    { score: 4, label: 'Strong', color: '#059669' },
  ]
  return { ...levels[score - 1] }
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password)
  if (!password) return null
  const colors = ['#EF4444', '#F59E0B', '#2563EB', '#059669']
  return (
    <div style={{ marginTop: '0.375rem' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: '6px', flex: 1, borderRadius: '3px', background: i <= score ? colors[score - 1] : '#E5E7EB', transition: 'background 0.2s' }} />
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', marginTop: '6px', marginBottom: 0, fontWeight: 600, color }}>{`Password strength: ${label}`}</p>
    </div>
  )
}

const PAGE_CSS = `
  .security-content { padding: 2rem 2.5rem 6rem; }
  .security-card { max-width: 520px; margin: 1.5rem auto 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.5rem; }
  .field-label { font-size: 0.875rem; font-weight: 700; color: #111; margin-bottom: 0.5rem; display:block }
  .field-input { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; }
  .field-row { margin-bottom: 1rem; }
  .actions { display:flex; gap:0.75rem; margin-top: 1rem; }
  .btn { width:100%; padding: 0.85rem 1rem; border-radius: 0.75rem; font-weight:700; cursor:pointer; }
  .btn.primary { background: #2563EB; color:#fff; border: none }
  .btn.secondary { background:#fff; color:#6B7280; border:1px solid #E5E7EB }
  .form-error { color: #EF4444; margin-top: 0.5rem; font-weight:600 }
  @media (max-width:640px){ .security-content{ padding:1rem } }
`

export default function SettingsSecurityPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validate = () => {
    if (!currentPassword) return 'Current password is required'
    if (!newPassword) return 'New password is required'
    if (newPassword.length < 8) return 'New password must be at least 8 characters'
    if (newPassword !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    setSuccess(null)
    const v = validate()
    if (v) { setError(v); return }
    try {
      setLoading(true)
      const res = await authAPI.changePassword(currentPassword, newPassword)
      if (res.success) {
        setSuccess('Password updated. Redirecting you to log in again…')
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
        // Backend invalidates all refresh tokens on password change (authAPI
        // already clears local auth state) — give the user a moment to read
        // the confirmation, then send them to log back in.
        setTimeout(() => navigate(ROUTES.LOGIN), 2000)
      } else {
        setError(res.error || 'Failed to update password')
      }
    } catch (err) {
      setError('Failed to update password')
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav="settings" onNavChange={() => {}}>
        <div className="security-content">
          <div style={{ padding: '0 0.25rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Security</h1>
            <p style={{ marginTop: '0.5rem', color: '#6B7280' }}>Keep your account safe</p>
          </div>

          <div className="security-card">
            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <label className="field-label">Current Password <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input className="field-input" type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  <button type="button" aria-label="Toggle" onClick={() => setShowCurrent(!showCurrent)} style={{ position: 'absolute', right: 10, top: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field-row">
                <label className="field-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input className="field-input" type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" />
                  <button type="button" aria-label="Toggle" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: 10, top: 8, border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && <PasswordStrengthIndicator password={newPassword} />}
              </div>

              <div className="field-row">
                <label className="field-label">Confirm Password</label>
                <input className="field-input" type={showNew ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>

              {error && <div className="form-error">{error}</div>}
              {success && <div style={{ color: '#059669', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} /> {success}</div>}

              <div className="actions">
                <button className="btn primary" type="button" onClick={handleSubmit} disabled={loading || !!success}>{loading ? 'Updating…' : 'Update Password'}</button>
                <button type="button" className="btn secondary" onClick={() => { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setError(null); setSuccess(null) }} disabled={loading || !!success}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </AppShell>
    </>
  )
}