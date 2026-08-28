import { useEffect, useMemo, useState } from 'react'
import {
  X, Mail, KeyRound, Ban, BookOpen, CheckCircle2, BadgeCheck, BarChart3,
   Trash2,  Loader2, AlertCircle, Repeat2, Star, Users, AlertTriangle,
   Video, UploadCloud, Sparkles, Clock,
} from 'lucide-react'
import { type AdminUser, type UserStatus } from '../../types/adminUser'
import { apiClient } from '../../services/api' 
import DeactivateUserModal, { DEACTIVATE_MODAL_CSS, type DeactivatePayload } from './DeactivateUserModal'
import DeleteAccountModal, { DELETE_MODAL_CSS } from './DeleteAccountModal'
import MessageComposerModal, { MESSAGE_MODAL_CSS } from './MessageComposerModal'
import ChangeRoleModal, { CHANGE_ROLE_MODAL_CSS } from './ChangeRoleModal'
import { ADMIN_PERMISSIONS } from './InviteUserModal'

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
  .up-role-badge.learner { background: #EFF6FF; color: #2492EB; }
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
  .up-stat-value.muted { color: #9CA3AF; }
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
  .up-progress-pct { font-size: 0.9rem; font-weight: 800; color: #2492EB; }
  .up-progress-track { height: 8px; border-radius: 999px; background: #F3F4F6; overflow: hidden; }
  .up-progress-fill { height: 100%; border-radius: 999px; background: #2492EB; }

  .up-activity-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-activity-icon { width: 34px; height: 34px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .up-activity-icon.enrolled { background: #EFF6FF; color: #2492EB; }
  .up-activity-icon.completed_module { background: #ECFDF5; color: #059669; }
  .up-activity-icon.course_created { background: #F5F3FF; color: #7C3AED; }
  .up-activity-icon.live_session_hosted { background: #FEF3C7; color: #D97706; }
  .up-activity-icon.material_added { background: #E9F5FF; color: #2492EB; }
  .up-activity-title { margin: 0; font-size: 0.88rem; font-weight: 600; color: #111827; }
  .up-activity-time { margin: 0.1rem 0 0; font-size: 0.78rem; color: #9CA3AF; }

  .up-load-more-btn { display: block; width: 100%; text-align: center; border: none; background: none; color: #2492EB; font-weight: 700; font-size: 0.85rem; padding: 0.85rem 1.1rem; cursor: pointer; border-top: 1px solid #F3F4F6; }
  .up-load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .up-perm-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-perm-icon { width: 30px; height: 30px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .up-perm-icon.on { background: #EFF6FF; color: #2492EB; }
  .up-perm-icon.off { background: #F3F4F6; color: #D1D5DB; }
  .up-perm-text { flex: 1; min-width: 0; }
  .up-perm-title-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
  .up-perm-title { font-size: 0.85rem; font-weight: 700; }
  .up-perm-title.on { color: #111827; }
  .up-perm-title.off { color: #9CA3AF; }
  .up-perm-desc { font-size: 0.76rem; margin-top: 0.1rem; }
  .up-perm-desc.on { color: #6B7280; }
  .up-perm-desc.off { color: #C4C9D4; }
  .up-sensitive-tag { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 999px; padding: 0.1rem 0.4rem; white-space: nowrap; }
  .up-perm-state { font-size: 0.78rem; font-weight: 700; flex-shrink: 0; }
  .up-perm-state.on { color: #2492EB; }
  .up-perm-state.off { color: #9CA3AF; }

  .up-course-row { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .up-course-icon { width: 32px; height: 32px; border-radius: 0.6rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #E9F5FF; color: #2492EB; }
  .up-course-text { flex: 1; min-width: 0; }
  .up-course-title { margin: 0; font-size: 0.88rem; font-weight: 600; color: #111827; }
  .up-course-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .up-course-warning { display: flex; align-items: center; gap: 0.3rem; margin: 0.3rem 0 0; font-size: 0.74rem; font-weight: 600; color: #D97706; }
  .up-course-status { flex-shrink: 0; font-size: 0.7rem; font-weight: 700; text-transform: capitalize; padding: 0.2rem 0.6rem; border-radius: 999px; }
  .up-course-status.published { background: #ECFDF5; color: #059669; }
  .up-course-status.draft { background: #F3F4F6; color: #9CA3AF; }
  .up-course-status.archived { background: #FEF2F2; color: #DC2626; }

  .up-danger-zone { border: 1.5px solid #FECACA; border-radius: 1rem; overflow: hidden; }
  .up-danger-title { margin: 0; padding: 1rem 1.1rem 0.6rem; font-size: 0.95rem; font-weight: 800; color: #DC2626; }
  .up-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.9rem 1.1rem 1.1rem; flex-wrap: wrap; }
  .up-danger-label { margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827; }
  .up-danger-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .up-delete-btn { display: flex; align-items: center; gap: 0.4rem; border: 1.5px solid #FECACA; background: #fff; color: #DC2626; font-weight: 700; font-size: 0.85rem; padding: 0.6rem 1rem; border-radius: 0.7rem; cursor: pointer; white-space: nowrap; }
  .up-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .up-loading, .up-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; padding: 3rem 1rem; color: #6B7280; font-size: 0.9rem; }
  .up-error { color: #DC2626; }

  @media (max-width: 640px) {
    .up-stats-4, .up-stats-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .up-perm-desc { display: none; }
  }
`

export const USER_PROFILE_MODAL_ALL_CSS =
  USER_PROFILE_MODAL_CSS + DEACTIVATE_MODAL_CSS + DELETE_MODAL_CSS + MESSAGE_MODAL_CSS + CHANGE_ROLE_MODAL_CSS



interface AdminInProgressCourse {
  course_id: string
  course_title: string
  percent_complete: number
}

interface AdminUserDetail {
  id: string
  full_name: string
  email: string
  role: 'learner' | 'trainer' | 'admin'
  is_active: boolean
  avatar_url: string | null
  created_at: string
  last_login_at: string | null
  // Learner and trainer fields live side by side here — each detail
  // response only populates the set that applies to that user's role.
  stats?: {
    courses_enrolled?: number
    courses_completed?: number
    certificates_earned?: number
    avg_completion_rate?: number
    total_courses_count?: number
    published_courses_count?: number
    students_registered?: number
    avg_rating?: number | null
  }
  // Learners only. Excludes not-started (0%) and fully-completed (100%)
  // courses — this is specifically the "in progress" band.
  in_progress_courses?: AdminInProgressCourse[]
  suspension: {
    is_active: boolean
    expires_at: string | null
    reason: string | null
  } | null
  // null for learner/trainer responses; an object with the 8 booleans
  // below when role is "admin" — same shape the invite flow sends/receives.
  permissions: {
    manage_users?: boolean
    moderate_content?: boolean
    manage_courses?: boolean
    view_analytics?: boolean
    send_announcements?: boolean
    view_revenue?: boolean
    manage_payouts?: boolean
    system_settings?: boolean
  } | null
}

// One row from GET /v1/admin/courses/?trainer_id={id} — only the fields
// this modal displays; the endpoint returns more (pricing, revenue, etc.)
// that other admin screens use.
interface AdminCourseListItem {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  enrollment_count: number
  completion_percentage: number
  is_final_assignment_set: boolean
}

// GET /v1/admin/users/{id}/activity/ — learner types are enrolled /
// completed_module; trainer types are course_created / live_session_hosted /
// material_added. `course_published` and `review_left` are intentionally
// not emitted yet (no publish timestamps tracked, no review system).
type ActivityType = 'enrolled' | 'completed_module' | 'course_created' | 'live_session_hosted' | 'material_added'

interface AdminActivityItem {
  type: ActivityType
  description: string
  created_at: string
  course_id?: string
  module_id?: string
}

interface AdminActivityPage {
  count: number
  next: string | null
  previous: string | null
  results: AdminActivityItem[]
}

const ACTIVITY_ICON: Record<ActivityType, typeof BookOpen> = {
  enrolled: BookOpen,
  completed_module: CheckCircle2,
  course_created: Sparkles,
  live_session_hosted: Video,
  material_added: UploadCloud,
}

type SuspendDuration = '24h' | '3d' | '7d' | '30d' | 'indefinite'

interface SuspendPayload {
  duration: SuspendDuration
  reason: string
  internal_note?: string
  notify_user_by_email: boolean
}

// The role-change endpoint only accepts learner <-> trainer (admins are
// created solely via the invite flow, and the backend rejects setting role
// to admin here) — so this is the only shape ChangeRoleModal ever deals in.
type ChangeableRole = 'learner' | 'trainer'

interface UserProfileModalProps {
  user: AdminUser
  onClose: () => void
  onStatusChange?: (userId: string, status: UserStatus) => void
  onDeleted?: (userId: string) => void
  onRoleChange?: (userId: string, role: ChangeableRole) => void
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

// The 8 permission fields live under detail.permissions (an object, only
// populated for role "admin") rather than as a flat keyof AdminUserDetail,
// so read them through an untyped lookup rather than pretending `id` is a
// keyof the permissions object.
function permissionEnabled(detail: AdminUserDetail, id: string): boolean {
  return Boolean((detail.permissions as unknown as Record<string, boolean | undefined> | null)?.[id])
}

function StatCard({
  icon, iconBg, value, line1, line2, muted,
}: {
  icon: React.ReactNode
  iconBg: string
  value: string | number
  line1: string
  line2: string
  muted?: boolean
}) {
  return (
    <div className="up-stat-card">
      <div className="up-stat-icon" style={{ background: iconBg }}>{icon}</div>
      <p className={`up-stat-value${muted ? ' muted' : ''}`}>{value}</p>
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

export default function UserProfileModal({ user, onClose, onStatusChange, onDeleted, onRoleChange }: UserProfileModalProps) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<'resetPassword' | 'suspend' | 'delete' | 'role' | null>(null)

  const [showDeactivate, setShowDeactivate] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [showChangeRole, setShowChangeRole] = useState(false)

  // Owned separately from actionError: these render inside the delete/role
  // confirm modals themselves rather than behind them, so a failure stays
  // visible right where the person is looking instead of closing the modal
  // out from under them.
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null)

  const [courses, setCourses] = useState<AdminCourseListItem[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  const [activities, setActivities] = useState<AdminActivityItem[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [activitiesNextUrl, setActivitiesNextUrl] = useState<string | null>(null)
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false)

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

  useEffect(() => {
    if (detail?.role !== 'trainer') return
    let cancelled = false
    setCoursesLoading(true)
    setCoursesError(null)
    apiClient
      .get<{ results: AdminCourseListItem[] }>('/v1/admin/courses/', {
        params: { trainer_id: user.id, page_size: 50 },
      })
      .then((res) => {
        if (!cancelled) setCourses(res.data.results)
      })
      .catch(() => {
        if (!cancelled) setCoursesError("Couldn't load this trainer's courses.")
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detail?.role, user.id])

  // Activity feed applies to learners and trainers only (admins don't have
  // a defined activity type set yet).
  useEffect(() => {
    if (detail?.role !== 'learner' && detail?.role !== 'trainer') return
    let cancelled = false
    setActivitiesLoading(true)
    setActivitiesError(null)
    setActivitiesNextUrl(null)
    apiClient
      .get<AdminActivityPage>(`/v1/admin/users/${user.id}/activity/`)
      .then((res) => {
        if (cancelled) return
        setActivities(res.data.results)
        setActivitiesNextUrl(res.data.next)
      })
      .catch(() => {
        if (!cancelled) setActivitiesError("Couldn't load recent activity.")
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [detail?.role, user.id])

  async function handleLoadMoreActivities() {
    if (!activitiesNextUrl) return
    setLoadingMoreActivities(true)
    try {
      const res = await apiClient.get<AdminActivityPage>(activitiesNextUrl)
      setActivities((prev) => [...prev, ...res.data.results])
      setActivitiesNextUrl(res.data.next)
    } catch {
      setActivitiesError("Couldn't load more activity.")
    } finally {
      setLoadingMoreActivities(false)
    }
  }

  // suspension is null when the user has never been suspended (or isn't
  // currently) — guard with ?. rather than assuming it's always an object.
  const isActive = detail ? !(detail.suspension?.is_active ?? false) : user.status === 'active'
  const roleIsLearner = detail?.role === 'learner'
  const roleIsTrainer = detail?.role === 'trainer'
  const roleIsAdmin = detail?.role === 'admin'
  const canDelete = detail?.role === 'learner'
  const canChangeRole = roleIsLearner || roleIsTrainer

  const enabledPermCount = useMemo(() => {
    if (!detail || !roleIsAdmin) return 0
    return ADMIN_PERMISSIONS.filter((perm) => permissionEnabled(detail, perm.id)).length
  }, [detail, roleIsAdmin])

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

  function openDeleteModal() {
    setDeleteError(null)
    setShowDelete(true)
  }

  async function handleDeleteConfirm() {
    if (!canDelete) return
    setDeleteError(null)
    setBusyAction('delete')
    try {
      await apiClient.delete(`/v1/admin/users/${user.id}/?confirm=true`)
      // Only close on success — a failure keeps the confirm modal open with
      // the reason shown, instead of dropping the person back onto the
      // profile modal with no indication anything went wrong there.
      setShowDelete(false)
      onDeleted?.(user.id)
      onClose()
    } catch (err: any) {
      const apiMessage = err?.response?.data?.detail || err?.response?.data?.message
      setDeleteError(apiMessage || "Couldn't delete this account. Please try again.")
    } finally {
      setBusyAction(null)
    }
  }

  function openChangeRoleModal() {
    setRoleChangeError(null)
    setShowChangeRole(true)
  }

  async function handleChangeRoleConfirm(nextRole: ChangeableRole) {
    if (!canChangeRole) return
    setRoleChangeError(null)
    setBusyAction('role')
    try {
      const res = await apiClient.patch<AdminUserDetail>(`/v1/admin/users/${user.id}/role/`, { role: nextRole })
      setDetail(res.data)
      onRoleChange?.(user.id, nextRole)
      setShowChangeRole(false)
    } catch (err: any) {
      const apiMessage = err?.response?.data?.detail || err?.response?.data?.message
      setRoleChangeError(apiMessage || `Couldn't move this user to ${nextRole}. Please try again.`)
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
                  {canChangeRole && (
                    <button
                      className="up-btn"
                      type="button"
                      onClick={openChangeRoleModal}
                      disabled={busyAction === 'role'}
                      title={`Move to ${roleIsLearner ? 'Trainer' : 'Learner'}`}
                    >
                      <Repeat2 size={16} /> Change role
                    </button>
                  )}
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
    <StatCard icon={<BookOpen size={17} color="#2492EB" />} iconBg="#DBEAFE" value={detail.stats?.courses_enrolled ?? 0} line1="courses" line2="Enrolled" />
    <StatCard icon={<CheckCircle2 size={17} color="#059669" />} iconBg="#D1FAE5" value={detail.stats?.courses_completed ?? 0} line1="courses" line2="Completed" />
    <StatCard icon={<BadgeCheck size={17} color="#D97706" />} iconBg="#FEF3C7" value={detail.stats?.certificates_earned ?? 0} line1="earned" line2="Certificates" />
    <StatCard icon={<BarChart3 size={17} color="#7C3AED" />} iconBg="#EDE9FE" value={`${detail.stats?.avg_completion_rate ?? 0}%`} line1="avg" line2="Completion Rate" />
  </div>
)}

                  {roleIsTrainer && (
                    <div className="up-stats-grid up-stats-4">
                      <StatCard
                        icon={<BookOpen size={17} color="#2492EB" />}
                        iconBg="#DBEAFE"
                        value={detail.stats?.total_courses_count ?? 0}
                        line1="courses"
                        line2="Total Courses"
                      />
                      <StatCard
                        icon={<CheckCircle2 size={17} color="#059669" />}
                        iconBg="#D1FAE5"
                        value={detail.stats?.published_courses_count ?? 0}
                        line1="courses"
                        line2="Published"
                      />
                      <StatCard
                        icon={<Users size={17} color="#D97706" />}
                        iconBg="#FEF3C7"
                        value={detail.stats?.students_registered ?? 0}
                        line1="learners"
                        line2="Students Registered"
                      />
                      <StatCard
                        icon={<Star size={17} color="#7C3AED" />}
                        iconBg="#EDE9FE"
                        value={(() => {
                          const rating = detail.stats?.avg_rating
                          return rating != null ? rating.toFixed(1) : '—'
                        })()}
                        line1={detail.stats?.avg_rating != null ? 'avg' : 'No ratings'}
                        line2={detail.stats?.avg_rating != null ? 'Rating' : 'yet'}
                        muted={detail.stats?.avg_rating == null}
                      />
                    </div>
                  )}

                  {roleIsAdmin && (
                    <div className="up-section">
                      <div className="up-section-head-row">
                        <h4 className="up-section-title">Admin permissions</h4>
                        <span className="up-section-count">{enabledPermCount} of {ADMIN_PERMISSIONS.length} enabled</span>
                      </div>
                      {ADMIN_PERMISSIONS.map((perm) => {
                        const on = permissionEnabled(detail, perm.id)
                        const Icon = perm.icon
                        return (
                          <div className="up-perm-row" key={perm.id}>
                            <div className={`up-perm-icon ${on ? 'on' : 'off'}`}>
                              <Icon size={14} />
                            </div>
                            <div className="up-perm-text">
                              <div className="up-perm-title-row">
                                <span className={`up-perm-title ${on ? 'on' : 'off'}`}>{perm.label}</span>
                                {perm.sensitive && <span className="up-sensitive-tag">Sensitive</span>}
                              </div>
                              <div className={`up-perm-desc ${on ? 'on' : 'off'}`}>{perm.description}</div>
                            </div>
                            <span className={`up-perm-state ${on ? 'on' : 'off'}`}>{on ? 'On' : 'Off'}</span>
                          </div>
                        )
                      })}
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
                    {roleIsTrainer && <DetailRow label="Total courses" value={detail.stats?.total_courses_count ?? 0} />}
                    {roleIsTrainer && <DetailRow label="Published courses" value={detail.stats?.published_courses_count ?? 0} />}
                    {roleIsTrainer && <DetailRow label="Students registered" value={detail.stats?.students_registered ?? 0} />}
                  </div>

                  {roleIsLearner && (
                    <div className="up-section">
                      <div className="up-section-head-row">
                        <h4 className="up-section-title">In Progress</h4>
                        <span className="up-section-count">{(detail.in_progress_courses ?? []).length} courses</span>
                      </div>
                      {(detail.in_progress_courses ?? []).length === 0 && (
                        <div className="up-section-pending">No courses in progress.</div>
                      )}
                      {(detail.in_progress_courses ?? []).map((course) => (
                        <div className="up-progress-row" key={course.course_id}>
                          <div className="up-progress-head">
                            <span className="up-progress-title">{course.course_title}</span>
                            <span className="up-progress-pct">{course.percent_complete}%</span>
                          </div>
                          <div className="up-progress-track">
                            <div className="up-progress-fill" style={{ width: `${course.percent_complete}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {roleIsTrainer && (
                    <div className="up-section">
                      <div className="up-section-head-row">
                        <h4 className="up-section-title">Courses</h4>
                        <span className="up-section-count">{courses.length} total</span>
                      </div>
                      {coursesLoading && <div className="up-section-pending">Loading courses…</div>}
                      {!coursesLoading && coursesError && <div className="up-section-pending">{coursesError}</div>}
                      {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="up-section-pending">No courses yet.</div>
                      )}
                      {!coursesLoading && !coursesError && courses.map((course) => (
                        <div className="up-course-row" key={course.id}>
                          <div className="up-course-icon">
                            <BookOpen size={14} />
                          </div>
                          <div className="up-course-text">
                            <p className="up-course-title">{course.title}</p>
                            <p className="up-course-sub">
                              {course.enrollment_count} students · {course.completion_percentage}% completed
                            </p>
                            {course.status === 'published' && !course.is_final_assignment_set && (
                              <p className="up-course-warning">
                                <AlertTriangle size={11} /> No capstone set — blocks certificates
                              </p>
                            )}
                          </div>
                          <span className={`up-course-status ${course.status}`}>{course.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(roleIsLearner || roleIsTrainer) && (
                    <div className="up-section">
                      <div className="up-section-head-row">
                        <h4 className="up-section-title">Recent activity</h4>
                      </div>
                      {activitiesLoading && <div className="up-section-pending">Loading activity…</div>}
                      {!activitiesLoading && activitiesError && (
                        <div className="up-section-pending">{activitiesError}</div>
                      )}
                      {!activitiesLoading && !activitiesError && activities.length === 0 && (
                        <div className="up-section-pending">No recent activity.</div>
                      )}
                      {!activitiesLoading && !activitiesError && activities.map((activity, idx) => {
                        const Icon = ACTIVITY_ICON[activity.type] ?? Clock
                        return (
                          <div className="up-activity-row" key={`${activity.type}-${activity.created_at}-${idx}`}>
                            <div className={`up-activity-icon ${activity.type}`}>
                              <Icon size={15} />
                            </div>
                            <div>
                              <p className="up-activity-title">{activity.description}</p>
                              <p className="up-activity-time">{formatDate(activity.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                      {!activitiesLoading && !activitiesError && activitiesNextUrl && (
                        <button
                          className="up-load-more-btn"
                          type="button"
                          onClick={handleLoadMoreActivities}
                          disabled={loadingMoreActivities}
                        >
                          {loadingMoreActivities ? 'Loading…' : 'Load more'}
                        </button>
                      )}
                    </div>
                  )}

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
                        onClick={openDeleteModal}
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
          submitting={busyAction === 'delete'}
          errorMessage={deleteError}
        />
      )}

      {showChangeRole && (roleIsLearner || roleIsTrainer) && (
        <ChangeRoleModal
          user={user}
          currentRole={roleIsLearner ? 'learner' : 'trainer'}
          onClose={() => setShowChangeRole(false)}
          onConfirm={handleChangeRoleConfirm}
          submitting={busyAction === 'role'}
          errorMessage={roleChangeError}
        />
      )}

      {showMessage && (
        <MessageComposerModal user={user} onClose={() => setShowMessage(false)} />
      )}
    </>
  )
}