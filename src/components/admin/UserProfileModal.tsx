import { useEffect, useState } from 'react'
import {
  X, Mail, KeyRound, Ban, BookOpen, CheckCircle2, BadgeCheck, BarChart3,
   Trash2,  Loader2, AlertCircle,
} from 'lucide-react'
import { type AdminUser, type UserStatus } from '../../types/adminUser'
import { apiClient } from '../../services/api' 
import DeactivateUserModal, { DEACTIVATE_MODAL_CSS, type DeactivatePayload } from './DeactivateUserModal'
import DeleteAccountModal, { DELETE_MODAL_CSS } from './DeleteAccountModal'
import MessageComposerModal, { MESSAGE_MODAL_CSS } from './MessageComposerModal'

export const USER_PROFILE_MODAL_CSS = `
  .up-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .up-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 640px; }
  .up-scroll { padding: 1.5rem; }

  .up-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.1rem; }
  .up-eyebrow { margin: 0; font-size: 1.4rem; font-weight: 800; color: #111827; }
  .up-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.2rem; }

  .up-identity { display: flex; gap: 1rem; margin-bottom: 1.1rem; }
  .up-avatar { width: 64px; height: 64px; border-radius: 0.9rem; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.4rem; flex-shrink: 0; object-fit: cover; }
  .up-name-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .up-name { margin: 0; font-size: 1.35rem; font-weight: 800; color: #111827; }
  .up-role-badge { display: inline-flex; align-items: center; font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 999px; }
  .up-role-badge.learner { background: #EFF6FF; color: #2563EB; }
  .up-role-badge.trainer { background: #ECFDF5; color: #059669; }
  .up-role-badge.admin { background: #F5F3FF; color: #7C3AED; }
  .up-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 999px; }
  .up-status-badge.active { background: #ECFDF5; color: #059669; }
  .up-status-badge.inactive { background: #FEF3C7; color: #D97706; }
  .up-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .up-email { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .up-meta { margin: 0.15rem 0 0; color: #9CA3AF; font-size: 0.8rem; }
  .up-suspension-note { margin: 0.3rem 0 0; color: #D97706; font-size: 0.8rem; font-weight: 600; }

  .up-actions { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .up-btn { display: flex; align-items: center; gap: 0.45rem; border: 1.5px solid #E5E7EB; background: #F9FAFB; color: #374151; font-weight: 700; font-size: 0.83rem; padding: 0.6rem 1rem; border-radius: 0.7rem; cursor: pointer; white-space: nowrap; }
  .up-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .up-deactivate { border-color: #FDE68A; background: #FFFBEB; color: #D97706; }
  .up-deactivate.active { border-color: #A7F3D0; background: #ECFDF5; color: #059669; }

  .up-body { display: flex; flex-direction: column; gap: 1.25rem; }

  .up-stats-grid { display: grid; gap: 0.85rem; }
  .up-stats-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .up-stats-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .up-stat-card { background: #F9FAFB; border-radius: 0.9rem; padding: 1rem; border: 1px solid #F3F4F6; }
  .up-stat-icon { width: 34px; height: 34px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.6rem; }
  .up-stat-value { margin: 0; font-size: 1.4rem; font-weight: 800; color: #111827; }
  .up-stat-label { margin: 0.2rem 0 0; font-size: 0.76rem; color: #6B7280; line-height: 1.3; }

  .up-section { background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04); }
  .up-section-title { margin: 0; padding: 1rem 1.1rem; font-size: 1rem; font-weight: 800; color: #111827; }
  .up-section-head-row { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem 0; }
  .up-section-head-row .up-section-title { padding: 0 0 1rem; }
  .up-section-count { font-size: 0.8rem; color: #9CA3AF; }
  .up-section-pending { padding: 1rem 1.1rem; font-size: 0.85rem; color: #9CA3AF; }

  .up-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-detail-label { font-size: 0.85rem; color: #9CA3AF; }
  .up-detail-value { font-size: 0.9rem; font-weight: 700; color: #111827; }

  .up-progress-row { padding: 0.9rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-progress-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
  .up-progress-title { font-size: 0.9rem; font-weight: 700; color: #111827; }
  .up-progress-pct { font-size: 0.9rem; font-weight: 800; color: #2563EB; }
  .up-progress-track { height: 8px; border-radius: 999px; background: #F3F4F6; overflow: hidden; }
  .up-progress-fill { height: 100%; border-radius: 999px; background: #2563EB; }

  .up-activity-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-activity-icon { width: 34px; height: 34px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .up-activity-title { margin: 0; font-size: 0.88rem; font-weight: 600; color: #111827; }
  .up-activity-time { margin: 0.1rem 0 0; font-size: 0.78rem; color: #9CA3AF; }

  .up-danger-zone { border: 1.5px solid #FECACA; border-radius: 1rem; overflow: hidden; }
  .up-danger-title { margin: 0; padding: 1rem 1.1rem 0.6rem; font-size: 0.95rem; font-weight: 800; color: #DC2626; }
  .up-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.9rem 1.1rem 1.1rem; flex-wrap: wrap; }
  .up-danger-label { margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827; }
  .up-danger-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .up-delete-btn { display: flex; align-items: center; gap: 0.4rem; border: 1.5px solid #FECACA; background: #fff; color: #DC2626; font-weight: 700; font-size: 0.85rem; padding: 0.6rem 1rem; border-radius: 0.7rem; cursor: pointer; white-space: nowrap; }
  .up-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; border-color: #E5E7EB; color: #9CA3AF; }

  .up-loading, .up-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 3rem 1rem; color: #6B7280; font-size: 0.9rem; }
  .up-error { color: #DC2626; }

  @media (max-width: 640px) {
    .up-stats-4, .up-stats-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`

export const USER_PROFILE_MODAL_ALL_CSS =
  USER_PROFILE_MODAL_CSS + DEACTIVATE_MODAL_CSS + DELETE_MODAL_CSS + MESSAGE_MODAL_CSS



interface AdminUserDetail {
  id: string
  full_name: string
  email: string
  role: 'learner' | 'trainer' | 'admin'
  is_active: boolean
  avatar_url: string | null
  created_at: string
  last_login_at: string | null
  stats?: {
    courses_enrolled?: number
    courses_completed?: number
    certificates_earned?: number
    avg_completion_rate?: number
  }
  suspension: {
    is_active: boolean
    expires_at: string | null
    reason: string | null
  } | null
}

type SuspendDuration = '24h' | '3d' | '7d' | '30d' | 'indefinite'

interface SuspendPayload {
  duration: SuspendDuration
  reason: string
  internal_note?: string
  notify_user_by_email: boolean
}

interface UserProfileModalProps {
  user: AdminUser
  onClose: () => void
  onStatusChange?: (userId: string, status: UserStatus) => void
  onDeleted?: (userId: string) => void
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatLastActive(dateStr: string | null) {
  if (!dateStr) return 'Never logged in'
  return formatDate(dateStr)
}

function StatCard({
  icon, iconBg, value, line1, line2,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  line1: string
  line2: string
}) {
  return (
    <div className="up-stat-card">
      <div className="up-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <p className="up-stat-value">{value}</p>
      <p className="up-stat-label">{line1}<br />{line2}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="up-detail-row">
      <span className="up-detail-label">{label}</span>
      <span className="up-detail-value">{value}</span>
    </div>
  )
}

export default function UserProfileModal({ user, onClose, onStatusChange, onDeleted }: UserProfileModalProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'resetPassword' | 'suspend' | 'delete' | null>(null)

  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    apiClient
      .get<AdminUserDetail>(`/v1/admin/users/${user.id}/`)
      .then((res) => {
        if (!cancelled) setDetail(res.data)
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load this user's profile. Please try again.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user.id])

  // suspension is null when the user has never been suspended (or isn't
  // currently) — guard with ?. rather than assuming it's always an object.
  const isActive = detail ? !(detail.suspension?.is_active ?? false) : user.status === 'active'
  const roleIsLearner = detail?.role === 'learner'
  const roleIsTrainer = detail?.role === 'trainer'
  const canDelete = detail?.role === 'learner'

  async function handleResetPassword() {
    setActionError(null)
    setBusyAction('resetPassword')
    try {
      await apiClient.post(`/v1/admin/users/${user.id}/reset-password/`)
    } catch {
      setActionError("Couldn't send the reset email. Please try again.")
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDeactivateConfirm(payload: DeactivatePayload) {
    setActionError(null)
    setBusyAction('suspend')
    try {
      if (isActive) {
     
        const suspendPayload = payload as unknown as SuspendPayload
        await apiClient.post(`/v1/admin/users/${user.id}/suspend/`, suspendPayload)
      } else {
        await apiClient.post(`/v1/admin/users/${user.id}/reactivate/`)
      }
      const res = await apiClient.get<AdminUserDetail>(`/v1/admin/users/${user.id}/`)
      setDetail(res.data)
      onStatusChange?.(user.id, res.data.suspension?.is_active ? 'inactive' : 'active')
      setShowDeactivate(false)
    } catch {
      setActionError(
        isActive ? "Couldn't suspend this user. Please try again." : "Couldn't reactivate this user. Please try again."
      )
    } finally {
      setBusyAction(null)
    }
  }

  async function handleDeleteConfirm() {
    if (!canDelete) return
    setActionError(null)
    setBusyAction('delete')
    try {
      await apiClient.delete(`/v1/admin/users/${user.id}/`)
      onDeleted?.(user.id)
      setShowDelete(false)
      onClose()
    } catch {
      setActionError("Couldn't delete this account. Please try again.")
      setShowDelete(false)
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <>
      <div className="up-overlay" onClick={onClose}>
        <div className="up-modal" onClick={(e) => e.stopPropagation()}>
          <div className="up-scroll">
            <div className="up-head">
              <h2 className="up-eyebrow">User Profile</h2>
              <button className="up-close" onClick={onClose} aria-label="Close" type="button">
                <X size={20} />
              </button>
            </div>

            {loading && (
              <div className="up-loading">
                <Loader2 size={22} className="animate-spin" />
                Loading profile…
              </div>
            )}

            {!loading && loadError && (
              <div className="up-error">
                <AlertCircle size={22} />
                {loadError}
              </div>
            )}

            {!loading && !loadError && detail && (
              <>
                <div className="up-identity">
                  {detail.avatar_url ? (
                    <img className="up-avatar" src={detail.avatar_url} alt="" />
                  ) : (
                    <div className="up-avatar" style={{ background: user.avatar_color }}>
                      {initials(detail.full_name)}
                    </div>
                  )}
                  <div>
                    <div className="up-name-row">
                      <h3 className="up-name">{detail.full_name}</h3>
                      <span className={`up-role-badge ${detail.role}`}>{detail.role}</span>
                      <span className={`up-status-badge ${isActive ? 'active' : 'inactive'}`}>
                        <span className="up-status-dot" />
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <p className="up-email">{detail.email}</p>
                    <p className="up-meta">
                      Joined {formatDate(detail.created_at)} · Last active {formatLastActive(detail.last_login_at)}
                    </p>
                    {!isActive && detail.suspension?.reason && (
                      <p className="up-suspension-note">
                        Suspended: {detail.suspension.reason}
                        {detail.suspension.expires_at ? ` · until ${formatDate(detail.suspension.expires_at)}` : ' · indefinite'}
                      </p>
                    )}
                  </div>
                </div>

                {actionError && (
                  <div className="up-error" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                    <AlertCircle size={16} />
                    {actionError}
                  </div>
                )}

                <div className="up-actions">
                  <button className="up-btn" onClick={() => setShowMessage(true)} type="button">
                    <Mail size={16} /> Message
                  </button>
                  <button
                    className="up-btn"
                    type="button"
                    onClick={handleResetPassword}
                    disabled={busyAction === 'resetPassword'}
                  >
                    <KeyRound size={16} /> {busyAction === 'resetPassword' ? 'Sending…' : 'Reset password'}
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    className={`up-btn up-deactivate${!isActive ? ' active' : ''}`}
                    onClick={() => setShowDeactivate(true)}
                    type="button"
                    disabled={busyAction === 'suspend'}
                  >
                    <Ban size={16} /> {isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>

                <div className="up-body">
                 {roleIsLearner && (
  <div className="up-stats-grid up-stats-4">
    <StatCard icon={<BookOpen size={17} color="#2563EB" />} iconBg="#DBEAFE" value={detail.stats?.courses_enrolled ?? 0} line1="courses" line2="Enrolled" />
    <StatCard icon={<CheckCircle2 size={17} color="#059669" />} iconBg="#D1FAE5" value={detail.stats?.courses_completed ?? 0} line1="courses" line2="Completed" />
    <StatCard icon={<BadgeCheck size={17} color="#D97706" />} iconBg="#FEF3C7" value={detail.stats?.certificates_earned ?? 0} line1="earned" line2="Certificates" />
    <StatCard icon={<BarChart3 size={17} color="#7C3AED" />} iconBg="#EDE9FE" value={`${detail.stats?.avg_completion_rate ?? 0}%`} line1="avg" line2="Completion Rate" />
  </div>
)}

                  {roleIsTrainer && (
                    <div className="up-section">
                      <h4 className="up-section-title">Trainer stats</h4>
                      <div className="up-section-pending">
                        Backend hasn't confirmed the trainer detail response shape yet — not
                        showing placeholder numbers here to avoid misleading you. Ask for a
                        trainer example response before this section is built out.
                      </div>
                    </div>
                  )}

                  <div className="up-section">
                    <h4 className="up-section-title">Account details</h4>
                    <DetailRow label="Email" value={detail.email} />
                    <DetailRow label="Role" value={detail.role} />
                    <DetailRow label="Status" value={isActive ? 'Active' : 'Suspended'} />
                    <DetailRow label="Joined" value={formatDate(detail.created_at)} />
                    <DetailRow label="Last active" value={formatLastActive(detail.last_login_at)} />
                    {roleIsLearner && <DetailRow label="Courses enrolled" value={detail.stats?.courses_enrolled ?? 0} />}
                    {roleIsLearner && <DetailRow label="Certificates" value={detail.stats?.certificates_earned ?? 0} />}
                  </div>

                  {/*
                    "In progress" (per-course %) and "Recent activity" sections from the mock
                    are dropped here — GET /admin/users/{id}/ doesn't return anything like
                    in_progress[] or recent_activity[]. Re-add once backend confirms those,
                    or point them at a different endpoint if one exists for activity feeds.
                  */}

                  <div className="up-danger-zone">
                    <h4 className="up-danger-title">Danger zone</h4>
                    <div className="up-danger-row">
                      <div>
                        <p className="up-danger-label">Delete this account</p>
                        <p className="up-danger-sub">
                          {canDelete
                            ? 'This is permanent and cannot be undone'
                            : `${detail.role === 'trainer' ? 'Trainer' : 'Admin'} accounts can't be deleted yet — this needs a separate decision since it touches course ownership`}
                        </p>
                      </div>
                      <button
                        className="up-delete-btn"
                        onClick={() => setShowDelete(true)}
                        type="button"
                        disabled={!canDelete}
                        title={canDelete ? undefined : 'Deletion is only available for learner accounts right now'}
                      >
                        <Trash2 size={15} /> Delete account
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showDeactivate && detail && (
        <DeactivateUserModal
          user={{ ...user, status: isActive ? 'active' : 'inactive' }}
          onClose={() => setShowDeactivate(false)}
          onConfirm={handleDeactivateConfirm}
        />
      )}

      {showDelete && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {showMessage && (
        <MessageComposerModal user={user} onClose={() => setShowMessage(false)} />
      )}
    </>
  )
}