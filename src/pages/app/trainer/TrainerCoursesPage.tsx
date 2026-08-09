// pages/app/trainer/TrainerCoursesPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TrainerShell from '../../../layouts/TrainerShell'
import { BookOpen } from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { coursesManageAPI, type TrainerCourseListItem } from '../../../services/api'
import ConfirmDialog from '../../../components/ConfirmDialog'
import { useConfirm } from '../../../hooks/useConfirm'

const PAGE_CSS = `
  .courses-page { padding: 24px; background: #F7F7F7; box-sizing: border-box; }

  .courses-section { margin-bottom: 32px; display: flex; flex-direction: column; gap: 8px; }
  .courses-section-title {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 20px;
    color: #2B3942;
  }

  .courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(249px, 249px));
    gap: 20px;
  }

  .courses-empty { background: #fff; border-radius: 16px; padding: 2.5rem 1.5rem; text-align: center; color: #99A1AF; border: 1px solid #F3F4F6; font-size: 13px; grid-column: 1 / -1; }
  .courses-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 16px; padding: 1rem; grid-column: 1 / -1; }
  .courses-loading { padding: 2rem; text-align: center; color: #9CA3AF; grid-column: 1 / -1; }

  /* ── Course card ── */
  .course-card {
    box-sizing: border-box;
    width: 249px;
    background: #FFFFFF;
    border: 1px solid #F3F4F6;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .course-card-img-wrap { position: relative; width: 100%; aspect-ratio: 247 / 215.72; background: #E2E8F0; }
  .course-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .course-card-img-gradient {
    position: absolute; inset: 0;
    background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%);
  }

  .course-card-body { padding: 10px; display: flex; flex-direction: column; }

  .course-card-top-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .course-card-cat {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 10px;
    line-height: 15px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #2492EB;
  }
  .course-status-badge {
    font-family: 'Sora', sans-serif;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    text-transform: capitalize;
    white-space: nowrap;
    background: #F3F4F6;
    color: #6A7282;
  }

  .course-card-name {
    margin: 2px 0 0;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    color: #2B3942;
  }
  .course-card-meta {
    margin: 4px 0 0;
    font-family: 'Sora', sans-serif;
    font-weight: 400;
    font-size: 9px;
    line-height: 14px;
    color: #99A1AF;
  }
  .course-card-date {
    margin: 0;
    font-family: 'Sora', sans-serif;
    font-weight: 400;
    font-size: 9px;
    line-height: 14px;
    color: #99A1AF;
  }

  .course-card-action-row {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .course-card-preview {
    border: none;
    background: none;
    padding: 0;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 10px;
    line-height: 15px;
    letter-spacing: 0.5px;
    color: #2492EB;
    cursor: pointer;
    text-align: center;
  }
  .course-card-preview:disabled { color: #99A1AF; cursor: default; }

  .continue-edit-btn {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 31px;
    padding: 8px 24px;
    border: 1px solid #2492EB;
    border-radius: 12px;
    background: #fff;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 10px;
    line-height: 15px;
    letter-spacing: 0.5px;
    color: #2492EB;
    cursor: pointer;
  }
  .continue-edit-btn:hover { background: #EFF6FF; }

  .course-status-action {
    border: none;
    background: none;
    font-family: 'Sora', sans-serif;
    font-weight: 600;
    font-size: 10px;
    line-height: 15px;
    letter-spacing: 0.5px;
    cursor: pointer;
    padding: 0;
  }
  .course-status-action.unpublish { color: #D97706; }
  .course-status-action.publish { color: #16A34A; }
  .course-status-action:disabled { opacity: 0.5; cursor: default; }

  .course-action-errors { margin: 6px 0 0; padding-left: 1rem; color: #EF4444; font-size: 10px; line-height: 14px; }
  .course-action-errors li { margin: 2px 0; }
  .course-action-error-msg { color: #EF4444; font-size: 10px; line-height: 14px; margin: 6px 0 0; text-align: center; }

  /* ── Add-course card ── */
  .add-course-card {
    box-sizing: border-box;
    width: 249px;
    aspect-ratio: 251 / 347.72;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #E9F5FF;
    border: 1px dashed #2492EB;
    border-radius: 16px;
  }
  .add-course-btn {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 24px;
    background: #2492EB;
    border: none;
    border-radius: 12px;
    font-family: 'Sora', sans-serif;
    font-weight: 700;
    font-size: 12px;
    line-height: 16px;
    color: #FFFFFF;
    cursor: pointer;
    white-space: nowrap;
  }
  .add-course-btn:hover { opacity: 0.92; }

  /* ── Responsive: fluid grid below the point where fixed 249px columns stop fitting ── */
  @media (max-width: 640px) {
    .courses-page { padding: 16px; }
    .courses-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .course-card, .add-course-card { width: 100%; }
  }

  @media (max-width: 380px) {
    .courses-grid { grid-template-columns: 1fr; }
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
  if (diffDays < 1) return 'Uploaded today'
  if (diffDays === 1) return 'Uploaded yesterday'
  if (diffDays < 30) return `Uploaded ${diffDays} days ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `Uploaded ${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`
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
    navigate(RouteBuilder.trainerCourseEdit(courseId))
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

  function renderActionErrors(courseId: string) {
    if (actionErrorId !== courseId) return null
    return (
      <>
        {actionFieldErrors && (
          <ul className="course-action-errors">
            {actionFieldErrors.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        )}
        {actionError && <p className="course-action-error-msg">{actionError}</p>}
      </>
    )
  }

  function CourseCard({ course }: { course: TrainerCourseListItem }) {
    const isPublished = course.status === 'published'
    const isDraft = course.status === 'draft'
    const isPending = pendingActionId === course.id

    return (
      <div className="course-card">
        <div className="course-card-img-wrap">
          <img
            src={course.thumbnail_url || '/image1.png'}
            alt={course.title}
            className="course-card-img"
            onError={(e) => { (e.target as HTMLImageElement).src = '/image1.png' }}
          />
          <div className="course-card-img-gradient" />
        </div>

        <div className="course-card-body">
          <div className="course-card-top-row">
            <p className="course-card-cat">{course.subtitle || 'Course'}</p>
            {course.status === 'archived' && <span className="course-status-badge">Archived</span>}
          </div>
          <h4 className="course-card-name">{course.title}</h4>
          <p className="course-card-meta">
            {course.module_count} module{course.module_count === 1 ? '' : 's'} · {course.lesson_count} lesson{course.lesson_count === 1 ? '' : 's'}
          </p>
          <p className="course-card-date">{formatUpdatedAgo(course.updated_at)}</p>

          <div className="course-card-action-row">
            {isDraft ? (
              <button type="button" className="continue-edit-btn" onClick={() => handlePreview(course.id)}>
                Continue to edit
              </button>
            ) : (
              <button type="button" className="course-card-preview" onClick={() => handlePreview(course.id)}>
                Preview
              </button>
            )}

            {isPublished && (
              <button
                type="button"
                className="course-status-action unpublish"
                onClick={() => handleUnpublish(course.id, course.title)}
                disabled={isPending}
              >
                {isPending ? 'Unpublishing…' : 'Unpublish'}
              </button>
            )}
            {isDraft && (
              <button
                type="button"
                className="course-status-action publish"
                onClick={() => handlePublish(course.id, course.title)}
                disabled={isPending}
              >
                {isPending ? 'Publishing…' : 'Publish'}
              </button>
            )}

            {renderActionErrors(course.id)}
          </div>
        </div>
      </div>
    )
  }

  const publishedCourses = courses.filter((c) => c.status === 'published')
  const draftCourses = courses.filter((c) => c.status === 'draft')
  const archivedCourses = courses.filter((c) => c.status === 'archived')

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="courses-page">
        {loading ? (
          <div className="courses-loading">Loading your courses…</div>
        ) : error ? (
          <div className="courses-error">{error}</div>
        ) : courses.length === 0 ? (
          <div className="courses-section">
            <h3 className="courses-section-title">My Courses</h3>
            <div className="courses-grid">
              <div className="courses-empty">You haven't created any courses yet. Start your first one below.</div>
              <div className="add-course-card">
                <button type="button" className="add-course-btn" onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}>
                  <BookOpen size={15} />
                  Add new course
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="courses-section">
              <h3 className="courses-section-title">Active Course</h3>
              <div className="courses-grid">
                {publishedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
                <div className="add-course-card">
                  <button type="button" className="add-course-btn" onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}>
                    <BookOpen size={15} />
                    Add new course
                  </button>
                </div>
              </div>
            </div>

            {draftCourses.length > 0 && (
              <div className="courses-section">
                <h3 className="courses-section-title">Draft(s)</h3>
                <div className="courses-grid">
                  {draftCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            )}

            {archivedCourses.length > 0 && (
              <div className="courses-section">
                <h3 className="courses-section-title">Archived</h3>
                <div className="courses-grid">
                  {archivedCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
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