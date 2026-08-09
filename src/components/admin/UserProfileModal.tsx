import { useState } from 'react'
import {
  X, Mail, KeyRound, Ban, BookOpen, CheckCircle2, BadgeCheck, BarChart3,
  Users, Star, Trash2,
} from 'lucide-react'
import {
  type AdminUser, type UserStatus, getMockLearnerStats, getMockTrainerStats,
} from '../../types/adminUser'
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
  .up-avatar { width: 64px; height: 64px; border-radius: 0.9rem; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 1.4rem; flex-shrink: 0; }
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

  .up-actions { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .up-btn { display: flex; align-items: center; gap: 0.45rem; border: 1.5px solid #E5E7EB; background: #F9FAFB; color: #374151; font-weight: 700; font-size: 0.83rem; padding: 0.6rem 1rem; border-radius: 0.7rem; cursor: pointer; white-space: nowrap; }
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

  .up-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-detail-label { font-size: 0.85rem; color: #9CA3AF; }
  .up-detail-value { font-size: 0.9rem; font-weight: 700; color: #111827; }

  .up-progress-row { padding: 0.9rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-progress-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
  .up-progress-title { font-size: 0.9rem; font-weight: 700; color: #111827; }
  .up-progress-pct { font-size: 0.9rem; font-weight: 800; color: #2563EB; }
  .up-progress-track { height: 8px; border-radius: 999px; background: #F3F4F6; overflow: hidden; }
  .up-progress-fill { height: 100%; border-radius: 999px; background: #2563EB; }

  .up-course-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-course-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #EFF6FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .up-course-text { flex: 1; min-width: 0; }
  .up-course-title { margin: 0; font-size: 0.88rem; font-weight: 700; color: #111827; }
  .up-course-sub { margin: 0.1rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .up-course-rating { display: flex; align-items: center; gap: 0.3rem; font-size: 0.85rem; font-weight: 700; color: #111827; flex-shrink: 0; }
  .up-course-status { font-size: 0.75rem; font-weight: 700; padding: 0.22rem 0.55rem; border-radius: 999px; flex-shrink: 0; white-space: nowrap; }
  .up-course-status.published { background: #ECFDF5; color: #059669; }
  .up-course-status.draft { background: #F3F4F6; color: #6B7280; }

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

  @media (max-width: 640px) {
    .up-stats-4, .up-stats-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
`

export const USER_PROFILE_MODAL_ALL_CSS =
  USER_PROFILE_MODAL_CSS + DEACTIVATE_MODAL_CSS + DELETE_MODAL_CSS + MESSAGE_MODAL_CSS

const ACTIVITY_ICON = {
  book: { Icon: BookOpen, bg: '#DBEAFE', color: '#2563EB' },
  star: { Icon: Star, bg: '#FEF3C7', color: '#D97706' },
  check: { Icon: CheckCircle2, bg: '#D1FAE5', color: '#059669' },
} as const

interface UserProfileModalProps {
  user: AdminUser
  onClose: () => void
  onStatusChange?: (userId: string, status: UserStatus) => void
  onDeleted?: (userId: string) => void
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
  const [status, setStatus] = useState<UserStatus>(user.status)
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMessage, setShowMessage] = useState(false)

  const learnerStats = user.role === 'learner' ? getMockLearnerStats(user) : null
  const trainerStats = user.role === 'trainer' ? getMockTrainerStats(user) : null

  function handleDeactivateConfirm(_payload: DeactivatePayload) {
    const nextStatus: UserStatus = status === 'active' ? 'inactive' : 'active'
    // TODO: call adminUsersAPI.setUserStatus(user.id, nextStatus, payload) once
    // a deactivate/reactivate endpoint exists — payload carries duration/reason/note/notify.
    setStatus(nextStatus)
    onStatusChange?.(user.id, nextStatus)
    setShowDeactivate(false)
  }

  function handleDeleteConfirm() {
    // TODO: call adminUsersAPI.deleteUser(user.id) once the endpoint exists
    onDeleted?.(user.id)
    setShowDelete(false)
    onClose()
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

            <div className="up-identity">
              <div className="up-avatar" style={{ background: user.avatar_color }}>
                {initials(user.name)}
              </div>
              <div>
                <div className="up-name-row">
                  <h3 className="up-name">{user.name}</h3>
                  <span className={`up-role-badge ${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                  <span className={`up-status-badge ${status}`}>
                    <span className="up-status-dot" />
                    {status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="up-email">{user.email}</p>
                <p className="up-meta">
                  Joined {formatDate(user.joined_at)} · Last active {user.last_active}
                </p>
              </div>
            </div>

            <div className="up-actions">
              <button className="up-btn" onClick={() => setShowMessage(true)} type="button">
                <Mail size={16} /> Message
              </button>
              <button className="up-btn" type="button">
                <KeyRound size={16} /> Reset password
              </button>
              <div style={{ flex: 1 }} />
              <button
                className={`up-btn up-deactivate${status === 'inactive' ? ' active' : ''}`}
                onClick={() => setShowDeactivate(true)}
                type="button"
              >
                <Ban size={16} /> {status === 'inactive' ? 'Reactivate' : 'Deactivate'}
              </button>
            </div>

            <div className="up-body">
              {learnerStats && (
                <div className="up-stats-grid up-stats-4">
                  <StatCard icon={<BookOpen size={17} color="#2563EB" />} iconBg="#DBEAFE" value={learnerStats.courses_enrolled} line1="courses" line2="Enrolled" />
                  <StatCard icon={<CheckCircle2 size={17} color="#059669" />} iconBg="#D1FAE5" value={learnerStats.courses_completed} line1="courses" line2="Completed" />
                  <StatCard icon={<BadgeCheck size={17} color="#D97706" />} iconBg="#FEF3C7" value={learnerStats.certificates_earned} line1="earned" line2="Certificates" />
                  <StatCard icon={<BarChart3 size={17} color="#7C3AED" />} iconBg="#EDE9FE" value={`${learnerStats.avg_completion_rate}%`} line1="avg" line2="Completion Rate" />
                </div>
              )}

              {trainerStats && (
                <div className="up-stats-grid up-stats-3">
                  <StatCard icon={<Users size={17} color="#2563EB" />} iconBg="#DBEAFE" value={trainerStats.total_students} line1="all courses" line2="Total Students" />
                  <StatCard icon={<BookOpen size={17} color="#059669" />} iconBg="#D1FAE5" value={trainerStats.courses_total} line1="published" line2="Courses" />
                  <StatCard icon={<Star size={17} color="#D97706" />} iconBg="#FEF3C7" value={trainerStats.avg_rating.toFixed(1)} line1="out of 5.0" line2="Avg Rating" />
                </div>
              )}

              <div className="up-section">
                <h4 className="up-section-title">Account details</h4>
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Role" value={user.role.charAt(0).toUpperCase() + user.role.slice(1)} />
                <DetailRow label="Status" value={status === 'active' ? 'Active' : 'Inactive'} />
                <DetailRow label="Joined" value={formatDate(user.joined_at)} />
                <DetailRow label="Last active" value={user.last_active} />
                {learnerStats && <DetailRow label="Courses enrolled" value={learnerStats.courses_enrolled} />}
                {learnerStats && <DetailRow label="Certificates" value={learnerStats.certificates_earned} />}
                {trainerStats && <DetailRow label="Courses published" value={trainerStats.courses_published} />}
              </div>

              {learnerStats && learnerStats.in_progress.length > 0 && (
                <div className="up-section">
                  <h4 className="up-section-title">In progress</h4>
                  {learnerStats.in_progress.map((course) => (
                    <div key={course.id} className="up-progress-row">
                      <div className="up-progress-head">
                        <span className="up-progress-title">{course.title}</span>
                        <span className="up-progress-pct">{course.percent}%</span>
                      </div>
                      <div className="up-progress-track">
                        <div className="up-progress-fill" style={{ width: `${course.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {trainerStats && (
                <div className="up-section">
                  <div className="up-section-head-row">
                    <h4 className="up-section-title">Courses</h4>
                    <span className="up-section-count">{trainerStats.courses.length} total</span>
                  </div>
                  {trainerStats.courses.map((course) => (
                    <div key={course.id} className="up-course-row">
                      <div className="up-course-icon">
                        <BookOpen size={16} color="#2563EB" />
                      </div>
                      <div className="up-course-text">
                        <p className="up-course-title">{course.title}</p>
                        <p className="up-course-sub">{course.students} students</p>
                      </div>
                      <div className="up-course-rating">
                        <Star size={13} color="#D97706" fill="#D97706" /> {course.rating}
                      </div>
                      <span className={`up-course-status ${course.status}`}>{course.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {(learnerStats || trainerStats) && (
                <div className="up-section">
                  <h4 className="up-section-title">Recent activity</h4>
                  {(learnerStats?.recent_activity ?? trainerStats?.recent_activity ?? []).map((item) => {
                    const { Icon, bg, color } = ACTIVITY_ICON[item.icon]
                    return (
                      <div key={item.id} className="up-activity-row">
                        <div className="up-activity-icon" style={{ background: bg }}>
                          <Icon size={15} color={color} />
                        </div>
                        <div>
                          <p className="up-activity-title">{item.title}</p>
                          <p className="up-activity-time">{item.time_ago}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="up-danger-zone">
                <h4 className="up-danger-title">Danger zone</h4>
                <div className="up-danger-row">
                  <div>
                    <p className="up-danger-label">Delete this account</p>
                    <p className="up-danger-sub">This is permanent and cannot be undone</p>
                  </div>
                  <button className="up-delete-btn" onClick={() => setShowDelete(true)} type="button">
                    <Trash2 size={15} /> Delete account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeactivate && (
        <DeactivateUserModal
          user={{ ...user, status }}
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