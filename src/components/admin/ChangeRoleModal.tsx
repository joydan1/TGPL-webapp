import { useState } from 'react'
import { Repeat2, AlertCircle, Loader2 } from 'lucide-react'
import type { AdminUser } from '../../types/adminUser'

export const CHANGE_ROLE_MODAL_CSS = `
  .cr-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .cr-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 440px; position: relative; }
  .cr-topbar { height: 5px; background: #2492EB; border-radius: 1.1rem 1.1rem 0 0; }
  .cr-inner { padding: 1.5rem; }

  .cr-head { display: flex; gap: 0.9rem; margin-bottom: 1.25rem; }
  .cr-icon { width: 48px; height: 48px; border-radius: 0.85rem; background: #EFF6FF; display: flex; align-items: center; justify-content: center; color: #2492EB; flex-shrink: 0; }
  .cr-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .cr-desc { margin: 0; color: #6B7280; font-size: 0.86rem; line-height: 1.5; }
  .cr-desc strong { color: #111827; }

  .cr-user-row { display: flex; align-items: center; gap: 0.7rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem; }
  .cr-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  .cr-user-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .cr-user-email { margin: 0; font-size: 0.78rem; color: #9CA3AF; }

  .cr-role-transition { display: flex; align-items: center; justify-content: center; gap: 0.85rem; margin-bottom: 1.25rem; }
  .cr-role-pill { flex: 1; text-align: center; border-radius: 0.85rem; padding: 0.9rem 0.5rem; font-weight: 700; font-size: 0.85rem; border: 1.5px solid #E5E7EB; color: #9CA3AF; background: #F9FAFB; }
  .cr-role-pill.target { border-color: #2492EB; background: #EFF6FF; color: #2492EB; }
  .cr-role-arrow { color: #9CA3AF; flex-shrink: 0; }

  .cr-error { display: flex; align-items: flex-start; gap: 0.5rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.75rem; padding: 0.7rem 0.85rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #B91C1C; }
  .cr-error svg { flex-shrink: 0; margin-top: 0.1rem; }

  .cr-actions { display: flex; gap: 0.6rem; }
  .cr-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .cr-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .cr-btn.confirm { border: none; background: #2492EB; color: #fff; }
  .cr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

// The role-change endpoint only ever accepts learner <-> trainer — the
// backend rejects setting role to admin (admins are created only via the
// invite flow). This modal is intentionally a binary toggle, not a picker.
type ChangeableRole = 'learner' | 'trainer'

interface ChangeRoleModalProps {
  user: AdminUser
  currentRole: ChangeableRole
  onClose: () => void
  onConfirm: (nextRole: ChangeableRole) => Promise<void> | void
  submitting?: boolean
  errorMessage?: string | null
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function roleLabel(role: ChangeableRole) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default function ChangeRoleModal({
  user, currentRole, onClose, onConfirm, submitting = false, errorMessage = null,
}: ChangeRoleModalProps) {
  const [nextRole] = useState<ChangeableRole>(currentRole === 'learner' ? 'trainer' : 'learner')

  function handleConfirm() {
    if (submitting) return
    onConfirm(nextRole)
  }

  return (
    <div className="cr-overlay" onClick={() => !submitting && onClose()}>
      <div className="cr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cr-topbar" />
        <div className="cr-inner">
          <div className="cr-head">
            <div className="cr-icon">
              <Repeat2 size={22} />
            </div>
            <div>
              <h3 className="cr-title">Change role</h3>
              <p className="cr-desc">
                Move <strong>{user.name}</strong> from <strong>{roleLabel(currentRole)}</strong> to{' '}
                <strong>{roleLabel(nextRole)}</strong>. They'll get {roleLabel(nextRole).toLowerCase()} access immediately.
              </p>
            </div>
          </div>

          <div className="cr-user-row">
            <div className="cr-avatar" style={{ background: user.avatar_color }}>
              {initials(user.name)}
            </div>
            <div>
              <p className="cr-user-name">{user.name}</p>
              <p className="cr-user-email">{user.email}</p>
            </div>
          </div>

          <div className="cr-role-transition">
            <div className="cr-role-pill">{roleLabel(currentRole)}</div>
            <Repeat2 size={16} className="cr-role-arrow" />
            <div className="cr-role-pill target">{roleLabel(nextRole)}</div>
          </div>

          {errorMessage && (
            <div className="cr-error" role="alert">
              <AlertCircle size={15} />
              {errorMessage}
            </div>
          )}

          <div className="cr-actions">
            <button className="cr-btn cancel" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </button>
            <button className="cr-btn confirm" onClick={handleConfirm} type="button" disabled={submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Repeat2 size={15} />}
              {submitting ? 'Changing…' : `Move to ${roleLabel(nextRole)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}