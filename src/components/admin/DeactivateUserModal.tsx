import { useState } from 'react'
import { Ban } from 'lucide-react'
import type { AdminUser } from '../../types/adminUser'

export const DEACTIVATE_MODAL_CSS = `
  .dm-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
  .dm-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; position: relative; }
  .dm-topbar { height: 5px; background: linear-gradient(90deg, #F59E0B, #FBBF24); border-radius: 1.1rem 1.1rem 0 0; }
  .dm-inner { padding: 1.5rem; }

  .dm-head { display: flex; gap: 0.9rem; margin-bottom: 1.25rem; }
  .dm-icon { width: 48px; height: 48px; border-radius: 0.85rem; background: #FEF3C7; display: flex; align-items: center; justify-content: center; color: #D97706; flex-shrink: 0; }
  .dm-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .dm-desc { margin: 0; color: #6B7280; font-size: 0.88rem; line-height: 1.5; }
  .dm-desc strong { color: #111827; }

  .dm-user-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem; }
  .dm-user-left { display: flex; align-items: center; gap: 0.7rem; }
  .dm-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  .dm-user-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .dm-user-email { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .dm-status-pill { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.76rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; background: #ECFDF5; color: #059669; }
  .dm-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #059669; }

  .dm-label { display: block; font-size: 0.85rem; font-weight: 700; color: #111827; margin: 0 0 0.6rem; }

  .dm-duration-row { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .dm-duration-pill { border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; font-size: 0.82rem; font-weight: 700; padding: 0.55rem 0.9rem; border-radius: 0.7rem; cursor: pointer; }
  .dm-duration-pill.selected { border-color: #F59E0B; color: #D97706; background: #FFFBEB; }

  .dm-required { color: #EF444; }

  .dm-reason-list { display: flex; flex-direction: column; gap: 0.55rem; margin-bottom: 1.25rem; }
  .dm-reason-option { display: flex; align-items: center; gap: 0.75rem; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 0.9rem; cursor: pointer; font-size: 0.87rem; font-weight: 600; color: #374151; }
  .dm-reason-option.selected { border-color: #2492EB; background: #EFF6FF; color: #2492EB; }
  .dm-radio { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #D1D5DB; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .dm-reason-option.selected .dm-radio { border-color: #2492EB; }
  .dm-radio-dot { width: 9px; height: 9px; border-radius: 50%; background: #2492EB; }

  .dm-note { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 0.9rem; font-size: 0.85rem; font-family: inherit; resize: vertical; min-height: 70px; margin-bottom: 1.25rem; }
  .dm-note::placeholder { color: #9CA3AF; }

  .dm-notify-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.5rem; }
  .dm-notify-label { margin: 0; font-weight: 700; font-size: 0.87rem; color: #111827; }
  .dm-notify-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }

  .dm-toggle { position: relative; width: 44px; height: 25px; flex-shrink: 0; }
  .dm-toggle input { opacity: 0; width: 0; height: 0; }
  .dm-toggle-track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
  .dm-toggle input:checked + .dm-toggle-track { background: #2492EB; }
  .dm-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 19px; height: 19px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
  .dm-toggle input:checked ~ .dm-toggle-track .dm-toggle-thumb { }
  .dm-toggle input:checked + .dm-toggle-track .dm-toggle-thumb { transform: translateX(19px); }

  .dm-actions { display: flex; gap: 0.6rem; }
  .dm-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
  .dm-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .dm-btn.confirm { border: 1.5px solid #F59E0B; background: #fff; color: #D97706; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .dm-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
`

const DURATIONS = [
  { key: '24h', label: '24 hours' },
  { key: '3d', label: '3 days' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'indefinite', label: 'Indefinite' },
] as const

const REASONS = [
  'Violation of community guidelines',
  'Suspicious or fraudulent activity',
  'Repeated policy breaches',
  'Payment dispute',
  'User-requested suspension',
  'Other',
] as const

export interface DeactivatePayload {
  duration: (typeof DURATIONS)[number]['key']
  reason: string
  note: string
  notify: boolean
}

interface DeactivateUserModalProps {
  user: AdminUser
  onClose: () => void
  onConfirm: (payload: DeactivatePayload) => void
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function DeactivateUserModal({ user, onClose, onConfirm }: DeactivateUserModalProps) {
  const isReactivating = user.status === 'inactive'
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]['key']>('7d')
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [notify, setNotify] = useState(true)

  const canConfirm = isReactivating || reason !== ''

  function handleConfirm() {
    if (!canConfirm) return
    onConfirm({ duration, reason, note, notify })
  }

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dm-topbar" />
        <div className="dm-inner">
          <div className="dm-head">
            <div className="dm-icon">
              <Ban size={22} />
            </div>
            <div>
              <h3 className="dm-title">{isReactivating ? 'Reactivate User' : 'Deactivate User'}</h3>
              <p className="dm-desc">
                <strong>{user.name}</strong>{' '}
                {isReactivating
                  ? 'will regain access to the platform immediately.'
                  : 'will lose access to the platform for the selected duration. You can reactivate at any time.'}
              </p>
            </div>
          </div>

          <div className="dm-user-row">
            <div className="dm-user-left">
              <div className="dm-avatar" style={{ background: user.avatar_color }}>
                {initials(user.name)}
              </div>
              <div>
                <p className="dm-user-name">{user.name}</p>
                <p className="dm-user-email">{user.email}</p>
              </div>
            </div>
            <span className="dm-status-pill">
              <span className="dm-status-dot" />
              {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>

          {!isReactivating && (
            <>
              <label className="dm-label">Duration</label>
              <div className="dm-duration-row">
                {DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={`dm-duration-pill${duration === d.key ? ' selected' : ''}`}
                    onClick={() => setDuration(d.key)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <label className="dm-label">
                Reason <span className="dm-required">*</span>
              </label>
              <div className="dm-reason-list">
                {REASONS.map((r) => (
                  <div
                    key={r}
                    className={`dm-reason-option${reason === r ? ' selected' : ''}`}
                    onClick={() => setReason(r)}
                  >
                    <span className="dm-radio">
                      {reason === r && <span className="dm-radio-dot" />}
                    </span>
                    {r}
                  </div>
                ))}
              </div>

              <label className="dm-label">Internal note (optional)</label>
              <textarea
                className="dm-note"
                placeholder="Add context for other admins..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <div className="dm-notify-row">
                <div>
                  <p className="dm-notify-label">Notify user by email</p>
                  <p className="dm-notify-sub">Send suspension notice to {user.email}</p>
                </div>
                <label className="dm-toggle">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                  />
                  <span className="dm-toggle-track">
                    <span className="dm-toggle-thumb" />
                  </span>
                </label>
              </div>
            </>
          )}

          <div className="dm-actions">
            <button className="dm-btn cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="dm-btn confirm" onClick={handleConfirm} disabled={!canConfirm} type="button">
              <Ban size={15} /> {isReactivating ? 'Reactivate account' : 'Deactivate account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}