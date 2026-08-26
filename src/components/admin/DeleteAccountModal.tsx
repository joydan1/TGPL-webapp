import { useState } from 'react'
import { Trash2, AlertCircle, Loader2 } from 'lucide-react'
import type { AdminUser } from '../../types/adminUser'

export const DELETE_MODAL_CSS = `
  .da-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .da-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 460px; position: relative; }
  .da-topbar { height: 5px; background: #EF4444; border-radius: 1.1rem 1.1rem 0 0; }
  .da-inner { padding: 1.5rem; }

  .da-head { display: flex; gap: 0.9rem; margin-bottom: 1.25rem; }
  .da-icon { width: 48px; height: 48px; border-radius: 0.85rem; background: #FEF2F2; display: flex; align-items: center; justify-content: center; color: #EF4444; flex-shrink: 0; }
  .da-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .da-desc { margin: 0; color: #6B7280; font-size: 0.86rem; line-height: 1.5; }
  .da-desc strong { color: #111827; }

  .da-user-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem; }
  .da-user-left { display: flex; align-items: center; gap: 0.7rem; }
  .da-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  .da-user-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .da-user-email { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .da-role-badge { font-size: 0.76rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; background: #EFF6FF; color: #2492EB; white-space: nowrap; }

  .da-consequences { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
  .da-consequence { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.86rem; color: #374151; }
  .da-x-icon { width: 20px; height: 20px; border-radius: 50%; background: #FEE2E2; color: #EF4444; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.7rem; font-weight: 800; margin-top: 0.1rem; }

  .da-error { display: flex; align-items: flex-start; gap: 0.5rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 0.75rem; padding: 0.7rem 0.85rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #B91C1C; }
  .da-error svg { flex-shrink: 0; margin-top: 0.1rem; }

  .da-confirm-label { font-size: 0.85rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; display: block; }
  .da-confirm-label strong { color: #EF4444; }
  .da-confirm-input { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 0.9rem; font-size: 0.9rem; margin-bottom: 1.25rem; box-sizing: border-box; }
  .da-confirm-input:focus { outline: none; border-color: #EF4444; }
  .da-confirm-input:disabled { background: #F9FAFB; color: #9CA3AF; }

  .da-actions { display: flex; gap: 0.6rem; }
  .da-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .da-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .da-btn.confirm { border: none; background: #EF4444; color: #fff; }
  .da-btn.confirm:disabled { opacity: 0.45; cursor: not-allowed; }
`

interface DeleteAccountModalProps {
  user: AdminUser
  onClose: () => void
  onConfirm: () => void
  // Owned by the caller so a failed delete can stay on this screen with the
  // reason shown, instead of the caller closing the modal out from under
  // the person mid-action and surfacing the error somewhere else.
  submitting?: boolean
  errorMessage?: string | null
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const CONSEQUENCES = [
  'Account and login access removed immediately',
  'All course progress and certificates deleted',
  'Payment history anonymised but retained for records',
  'Cannot be recovered after confirmation',
]

export default function DeleteAccountModal({
  user, onClose, onConfirm, submitting = false, errorMessage = null,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText === 'Delete' && !submitting

  function handleConfirm() {
    if (!canDelete) return
    onConfirm()
  }

  return (
    <div className="da-overlay" onClick={() => !submitting && onClose()}>
      <div className="da-modal" onClick={(e) => e.stopPropagation()}>
        <div className="da-topbar" />
        <div className="da-inner">
          <div className="da-head">
            <div className="da-icon">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="da-title">Delete account</h3>
              <p className="da-desc">
                This will permanently remove <strong>{user.name}</strong>'s account, all their data,
                enrollments, and activity history. This cannot be undone.
              </p>
            </div>
          </div>

          <div className="da-user-row">
            <div className="da-user-left">
              <div className="da-avatar" style={{ background: user.avatar_color }}>
                {initials(user.name)}
              </div>
              <div>
                <p className="da-user-name">{user.name}</p>
                <p className="da-user-email">{user.email}</p>
              </div>
            </div>
            <span className="da-role-badge">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </span>
          </div>

          <div className="da-consequences">
            {CONSEQUENCES.map((c) => (
              <div key={c} className="da-consequence">
                <span className="da-x-icon">✕</span>
                {c}
              </div>
            ))}
          </div>

          {errorMessage && (
            <div className="da-error" role="alert">
              <AlertCircle size={15} />
              {errorMessage}
            </div>
          )}

          <label className="da-confirm-label">
            Type <strong>Delete</strong> to confirm
          </label>
          <input
            className="da-confirm-input"
            type="text"
            placeholder="Delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            disabled={submitting}
          />

          <div className="da-actions">
            <button className="da-btn cancel" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </button>
            <button className="da-btn confirm" onClick={handleConfirm} disabled={!canDelete} type="button">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {submitting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}