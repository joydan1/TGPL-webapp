// pages/app/trainer/TrainerCoursesPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TrainerShell from '../../../layouts/TrainerShell'
import { Plus } from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { coursesManageAPI, type TrainerCourseListItem } from '../../../services/api'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'

const PAGE_CSS = `
  .courses-page { padding: 1rem; background: #F5F5F5; }
  .courses-title { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #111827; }

  .courses-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

  .courses-empty { background: #fff; border-radius: 1rem; padding: 3rem 1.5rem; text-align: center; color: #6B7280; border: 1px solid rgba(148, 163, 184, 0.12); grid-column: 1 / -1; }
  .courses-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 1rem; padding: 1rem; grid-column: 1 / -1; }
  .courses-loading { padding: 2rem; text-align: center; color: #9CA3AF; grid-column: 1 / -1; }

  .course-card { background: #fff; border-radius: 1rem; overflow: hidden; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); display: flex; flex-direction: column; }
  .course-card-img { width: 100%; height: 176px; object-fit: cover; background: #E2E8F0; display: block; }
  .course-card-body { padding: 1.1rem; display: grid; gap: 0.4rem; }
  .course-card-status-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .course-card-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; font-weight: 700; }
  .course-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: capitalize; white-space: nowrap; }
  .course-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .course-status-badge.published { background: #DCFCE7; color: #16A34A; }
  .course-status-badge.archived { background: #F3F4F6; color: #6B7280; }
  .course-card-name { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
  .course-card-meta { margin: 0; color: #6B7280; font-size: 0.8rem; }
  .course-card-date { margin: 0; color: #9CA3AF; font-size: 0.78rem; }
  .course-card-preview { margin-top: 0.5rem; border: none; background: none; padding: 0; color: #2563EB; font-weight: 700; cursor: pointer; text-align: left; font-size: 0.9rem; }
  .course-card-preview:disabled { color: #9CA3AF; cursor: default; }

  .course-card-actions-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 0.5rem; }
  .course-action-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; font-weight: 700; font-size: 0.8rem; padding: 0.5rem 0.85rem; border-radius: 0.7rem; cursor: pointer; }
  .course-action-btn:hover { background: #F9FAFB; }
  .course-action-btn:disabled { opacity: 0.5; cursor: default; }
  .course-action-btn.unpublish { color: #D97706; border-color: #FDE68A; }
  .course-action-btn.publish { color: #16A34A; border-color: #BBF7D0; }
  .course-delete-note { margin-top: 0.35rem; color: #9CA3AF; font-size: 0.72rem; font-style: italic; }

  .course-action-errors { margin: 0.35rem 0 0; padding-left: 1.1rem; color: #EF4444; font-size: 0.78rem; }
  .course-action-errors li { margin: 0.1rem 0; }

  .add-course-card { border: 2px dashed #93C5FD; background: #EFF6FF; border-radius: 1rem; min-height: 260px; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .add-course-btn { appearance: none; border: none; border-radius: 999px; padding: 0.9rem 1.25rem; background: #2563EB; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.55rem; font-size: 0.9rem; white-space: nowrap; }

  @media (min-width: 640px) {
    .courses-page { padding: 1.5rem; }
    .courses-grid { grid-template-columns: repeat(2, minmax(0, 340px)); }
  }

  @media (min-width: 1024px) {
    .courses-page { padding: 1.5rem 2rem 2rem; }
    .courses-grid { grid-template-columns: repeat(auto-fill, 340px); }
  }
`

// The backend can fail a publish/unpublish action in two shapes:
//  1. A plain string error message
//  2. A validation payload: { errors: [{ field, step, message }, ...] }
// This type + helper normalizes both into something safe to store/render.
type ApiFieldError = { field?: string; step?: number; message: string }
type ApiValidationError = { errors?: ApiFieldError[] }

function extractFieldErrors(error: unknown): ApiFieldError[] | null {
  if (error && typeof error === 'object') {
    const validation = error as ApiValidationError
    if (Array.isArray(validation.errors) && validation.errors.length > 0) {
      return validation.errors
    }
  }
  return null
}

function formatApiErrorFallback(error: unknown): string {
  if (typeof error === 'string' && error.trim() !== '') return error
  return 'Something went wrong. Please try again.'
}

function formatUpdatedAgo(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  if (diffDays < 30) return `Updated ${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `Updated ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
}

export default function TrainerCoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<TrainerCourseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionErrorId, setActionErrorId] = useState<string | null>(null)
  const [actionFieldErrors, setActionFieldErrors] = useState<ApiFieldError[] | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingActionId, setPendingActionId] = useState<string | null>(null)

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const result = await coursesManageAPI.listMyCourses()
    if (result.success) {
      setCourses(result.data)
    } else {
      setError(formatApiErrorFallback(result.error))
    }
    setLoading(false)
  }

  function handlePreview(courseId: string) {
    navigate(RouteBuilder.trainerCourseManage(courseId))
  }

  function applyActionError(courseId: string, rawError: unknown) {
    setActionErrorId(courseId)
    const fieldErrors = extractFieldErrors(rawError)
    if (fieldErrors) {
      setActionFieldErrors(fieldErrors)
      setActionError(null)
    } else {
      setActionFieldErrors(null)
      setActionError(formatApiErrorFallback(rawError))
    }
  }

  function clearActionError() {
    setActionErrorId(null)
    setActionFieldErrors(null)
    setActionError(null)
  }

  async function handleUnpublish(courseId: string, courseTitle: string) {
    const confirmed = await confirm({
      title: `Unpublish "${courseTitle}"?`,
      message: 'Learners will lose access to this course until you publish it again.',
      confirmLabel: 'Unpublish',
      destructive: true,
    })
    if (!confirmed) return

    setPendingActionId(courseId)
    clearActionError()
    const result = await coursesManageAPI.unpublishDraft(courseId)
    setPendingActionId(null)
    if (!result.success) {
      applyActionError(courseId, result.error)
      return
    }
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: 'draft' } : c)))
  }

  async function handlePublish(courseId: string, courseTitle: string) {
    const confirmed = await confirm({
      title: `Publish "${courseTitle}"?`,
      message: 'This makes the course visible and enrollable for learners right away.',
      confirmLabel: 'Publish',
      destructive: false,
    })
    if (!confirmed) return

    setPendingActionId(courseId)
    clearActionError()
    const result = await coursesManageAPI.publishDraft(courseId)
    setPendingActionId(null)
    if (!result.success) {
      applyActionError(courseId, result.error)
      return
    }
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: 'published' } : c)))
  }

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="courses-page">
        <h3 className="courses-title">My Courses</h3>
        <div className="courses-grid">
          {loading ? (
            <div className="courses-loading">Loading your courses…</div>
          ) : error ? (
            <div className="courses-error">{error}</div>
          ) : courses.length === 0 ? (
            <div className="courses-empty">You haven't created any courses yet. Start your first one below.</div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="course-card">
                <img
                  src={course.thumbnail_url || '/image1.png'}
                  alt={course.title}
                  className="course-card-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/image1.png' }}
                />
                <div className="course-card-body">
                  <div className="course-card-status-row">
                    <p className="course-card-cat">{course.subtitle || 'Course'}</p>
                    <span className={`course-status-badge ${course.status}`}>{course.status}</span>
                  </div>
                  <h4 className="course-card-name">{course.title}</h4>
                  <p className="course-card-meta">
                    {course.module_count} module{course.module_count === 1 ? '' : 's'} · {course.lesson_count} lesson{course.lesson_count === 1 ? '' : 's'}
                  </p>
                  <p className="course-card-date">{formatUpdatedAgo(course.updated_at)}</p>
                  <button
                    type="button"
                    className="course-card-preview"
                    onClick={() => handlePreview(course.id)}
                  >
                    Preview
                  </button>

                  <div className="course-card-actions-row">
                    {course.status === 'published' ? (
                      <button
                        type="button"
                        className="course-action-btn unpublish"
                        onClick={() => handleUnpublish(course.id, course.title)}
                        disabled={pendingActionId === course.id}
                      >
                        {pendingActionId === course.id ? 'Unpublishing…' : 'Unpublish'}
                      </button>
                    ) : course.status === 'draft' ? (
                      <button
                        type="button"
                        className="course-action-btn publish"
                        onClick={() => handlePublish(course.id, course.title)}
                        disabled={pendingActionId === course.id}
                      >
                        {pendingActionId === course.id ? 'Publishing…' : 'Publish'}
                      </button>
                    ) : null}
                  </div>

                  {actionErrorId === course.id && actionFieldErrors && (
                    <ul className="course-action-errors">
                      {actionFieldErrors.map((e, i) => (
                        <li key={i}>{e.message}</li>
                      ))}
                    </ul>
                  )}
                  {actionErrorId === course.id && actionError && (
                    <p style={{ color: '#EF4444', fontSize: '0.78rem', margin: '0.35rem 0 0' }}>{actionError}</p>
                  )}

                  <p className="course-delete-note">Deleting courses isn't supported yet — ask an admin if this needs to be removed permanently.</p>
                </div>
              </div>
            ))
          )}

          <div className="add-course-card">
            <button
              type="button"
              className="add-course-btn"
              onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </TrainerShell>
  )
}