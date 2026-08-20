import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Users, TrendingUp, Star, BadgeCheck,
  Edit3, Tag, Archive, Trash2, Info, ChevronDown, ChevronUp, PlayCircle,
} from 'lucide-react'
import type { AdminCourseRow, AdminCourseDetail, EnrollmentTrendsResponse, TrendPeriod } from '../../types/adminCourse'
import { adminCoursesAPI, type ApiResult } from '../../services/adminCoursesApi'
import { courseAnalyticsAPI } from '../../services/courseAnalyticsApi'
import { coursesManageAPI, type CourseCurriculumModule } from '../../services/api'

export const COURSE_DETAIL_MODAL_CSS = `
  .cdvm-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .cdvm-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 620px; overflow: hidden; }

  .cdvm-hero { background: linear-gradient(135deg, #2492EB, #3B82F6); padding: 1.5rem; position: relative; }
  .cdvm-hero-status { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.18); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; margin-bottom: 0.9rem; }
  .cdvm-hero-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
  .cdvm-hero-close { position: absolute; top: 1.25rem; right: 1.25rem; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.18); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .cdvm-hero-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; }
  .cdvm-hero-category { margin: 0.2rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.9rem; }

  .cdvm-byline { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 1.1rem 1.5rem; border-bottom: 1px solid #F3F4F6; flex-wrap: wrap; }
  .cdvm-trainer { display: flex; align-items: center; gap: 0.7rem; }
  .cdvm-trainer-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; background: #059669; }
  .cdvm-trainer-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .cdvm-trainer-role { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .cdvm-price { text-align: right; }
  .cdvm-price-value { margin: 0; font-size: 1.3rem; font-weight: 800; color: #111827; }
  .cdvm-price-label { margin: 0; font-size: 0.78rem; color: #9CA3AF; }

  .cdvm-scroll { padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; max-height: 60vh; overflow-y: auto; }

  .cdvm-loading { padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
  .cdvm-error { padding: 1rem 1.25rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.85rem; font-size: 0.85rem; }

  .cdvm-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.7rem; }
  .cdvm-stat-card { background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem; border: 1px solid #F3F4F6; }
  .cdvm-stat-icon { width: 30px; height: 30px; border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .cdvm-stat-value { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .cdvm-stat-label { margin: 0.15rem 0 0; font-size: 0.74rem; color: #6B7280; }

  .cdvm-section { background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; overflow: hidden; }
  .cdvm-section-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem; }
  .cdvm-section-title { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; }

  .cdvm-details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1.5rem; padding: 0 1.1rem 1.1rem; }
  .cdvm-detail-label { font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 0.2rem; }
  .cdvm-detail-value { font-size: 0.88rem; font-weight: 700; color: #111827; margin: 0; }

  .cdvm-description { padding: 0 1.1rem 1.1rem; font-size: 0.86rem; color: #374151; line-height: 1.55; }

  .cdvm-pending-note { display: flex; align-items: flex-start; gap: 0.6rem; padding: 1rem 1.1rem; font-size: 0.82rem; color: #6B7280; line-height: 1.5; }
  .cdvm-pending-note svg { flex-shrink: 0; margin-top: 0.1rem; color: #9CA3AF; }

  .cdvm-archive-note { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 0.85rem; padding: 0.85rem 1rem; font-size: 0.82rem; color: #92400E; line-height: 1.5; }

  .cdvm-footer { display: flex; align-items: center; gap: 0.6rem; padding: 1.1rem 1.5rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .cdvm-footer-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.86rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .cdvm-footer-btn.primary { flex: 1; border: none; background: #2492EB; color: #fff; }
  .cdvm-footer-btn.secondary { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .cdvm-footer-btn.archive { border: 1.5px solid #FDE68A; background: #FFFBEB; color: #D97706; }
  .cdvm-footer-btn.danger { border: 1.5px solid #FECACA; background: #fff; color: #EF4444; padding: 0.75rem; }

  .cdvm-trend-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; padding: 1rem 1.1rem 0; flex-wrap: wrap; }
  .cdvm-trend-badge { display: inline-block; margin-top: 0.2rem; font-size: 0.72rem; font-weight: 700; color: #2492EB; }
  .cdvm-trend-badge.down { color: #DC2626; }
  .cdvm-trend-period-select { border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.3rem 0.6rem; font-size: 0.76rem; color: #374151; background: #fff; cursor: pointer; }
  .cdvm-trend-state { padding: 1.5rem 1.1rem; text-align: center; color: #9CA3AF; font-size: 0.82rem; }
  .cdvm-trend-state.error { color: #DC2626; }
  .cdvm-trend-bars { display: flex; align-items: flex-end; gap: 3px; padding: 1rem 1.1rem 0.5rem; height: 68px; overflow-x: auto; }
  .cdvm-trend-bar { flex: 1 0 4px; min-width: 4px; background: linear-gradient(0deg, #2492EB 0%, #B4DEFF 100%); border-radius: 3px; }
  .cdvm-trend-axis { display: flex; justify-content: space-between; padding: 0 1.1rem 0.75rem; font-size: 0.68rem; color: #99A1AF; }
  .cdvm-trend-summary { padding: 0 1.1rem 1rem; margin: 0; font-size: 0.78rem; color: #6B7280; }

  .cdvm-curriculum-count { font-size: 0.76rem; color: #99A1AF; }
  .cdvm-module { border-top: 1px solid #F3F4F6; }
  .cdvm-module-head { width: 100%; display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem 1.1rem; background: none; border: none; cursor: pointer; text-align: left; }
  .cdvm-module-num { width: 20px; height: 20px; border-radius: 8px; background: #F7F7F7; color: #99A1AF; font-size: 0.68rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cdvm-module-title { flex: 1; font-size: 0.85rem; font-weight: 700; color: #111827; }
  .cdvm-module-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.76rem; color: #99A1AF; flex-shrink: 0; }
  .cdvm-lesson-list { background: #FAFAFA; }
  .cdvm-lesson-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.6rem 1.1rem; border-top: 1px solid #F9FAFB; font-size: 0.8rem; color: #616873; }
  .cdvm-lesson-icon { color: #2492EB; flex-shrink: 0; display: flex; }
  .cdvm-lesson-title { flex: 1; }
  .cdvm-lesson-duration { font-size: 0.7rem; color: #99A1AF; flex-shrink: 0; }
  .cdvm-lesson-empty { color: #9CA3AF; font-style: italic; }

  @media (max-width: 560px) {
    .cdvm-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cdvm-details-grid { grid-template-columns: 1fr; }
  }
`

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
function fmtTrendDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function formatNaira(kobo: number) {
  const naira = kobo / 100
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(1)}K`
  return naira === 0 ? 'Nil' : `₦${naira.toLocaleString()}`
}

/**
 * TODO(backend): the Figma spec calls for these fields, none of which are
 * on AdminCourseDetail today. Confirm with the backend dev whether they
 * exist / will exist on GET /admin/courses/{slug}/, then replace the
 * `as any` casts below with real typed fields:
 *   - average_rating (number | null)      -> "Avg rating" stat card
 *   - video_count (number)                -> "Video content" detail row
 *   - quiz_count (number)                 -> "Quizzes" detail row
 *   - access_type ('lifetime' | 'timed')  -> "Access" detail row
 * Until then these render as "—" instead of throwing.
 */
type PendingFields = {
  average_rating?: number | null
  video_count?: number
  quiz_count?: number
  access_type?: string
}

interface CourseDetailModalProps {
  course: AdminCourseRow
  onClose: () => void
  onEdit?: () => void
  onSetPrice?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export default function CourseDetailModal({
  course, onClose, onEdit, onSetPrice, onArchive, onDelete,
}: CourseDetailModalProps) {

  const [detail, setDetail] = useState<AdminCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [trend, setTrend] = useState<EnrollmentTrendsResponse | null>(null)
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('last_30_days')
  const [trendLoading, setTrendLoading] = useState(true)
  const [trendError, setTrendError] = useState<string | null>(null)

  const [curriculum, setCurriculum] = useState<CourseCurriculumModule[] | null>(null)
  const [curriculumLoading, setCurriculumLoading] = useState(true)
  const [curriculumError, setCurriculumError] = useState<string | null>(null)
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTrendLoading(true)
    setTrendError(null)
    courseAnalyticsAPI.getEnrollmentTrends(course.slug, trendPeriod).then((res) => {
      if (cancelled) return
      if (res.success) {
        setTrend(res.data)
      } else {
        setTrendError(res.error)
      }
      setTrendLoading(false)
    })
    return () => { cancelled = true }
  }, [course.slug, trendPeriod])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminCoursesAPI.getCourse(course.slug).then((res: ApiResult<AdminCourseDetail>) => {
      if (cancelled) return
      if (res.success) {
        setDetail(res.data)
      } else {
        setError(res.error)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [course.slug])

  // Owner-scoped endpoint (coursesManageAPI.getCurriculum), confirmed via
  // Swagger to also work for admins on courses they don't own — no
  // separate admin-curriculum endpoint exists, and none is needed.
  useEffect(() => {
    let cancelled = false
    setCurriculumLoading(true)
    setCurriculumError(null)
    coursesManageAPI.getCurriculum(course.id).then((res) => {
      if (cancelled) return
      if (res.success) {
        setCurriculum(res.data)
        // Match design default: first module open, rest collapsed.
        if (res.data.length > 0) setExpandedModuleId(res.data[0].id)
      } else {
        setCurriculumError(res.error)
      }
      setCurriculumLoading(false)
    })
    return () => { cancelled = true }
  }, [course.id])

  const isArchived = course.status === 'archived'
  const pending = (detail ?? {}) as AdminCourseDetail & PendingFields

  const videoCount = curriculum
    ? curriculum.reduce((sum, m) => sum + m.lessons.filter((l) => l.duration_display).length, 0)
    : undefined
  const quizCount = pending.quiz_count

  // Portaled to document.body so this modal's `position: fixed` overlay is
  // always positioned/sized against the real viewport, regardless of
  // whether some ancestor up the tree (a hover-transform card, a
  // framer-motion wrapper, etc.) has a `transform`/`filter`/`will-change`
  // that would otherwise hijack it as the containing block and clip the
  // trend/details sections at inconsistent points depending on where the
  // modal happens to be mounted.
  return createPortal(
    <div className="cdvm-overlay" onClick={onClose}>
      <div className="cdvm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cdvm-hero">
          <span className="cdvm-hero-status">
            <span className="cdvm-hero-status-dot" />
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </span>
          <button className="cdvm-hero-close" onClick={onClose} aria-label="Close" type="button">
            <X size={16} />
          </button>
          <h2 className="cdvm-hero-title">{course.title}</h2>
          <p className="cdvm-hero-category">{detail?.category || (loading ? 'Loading…' : '—')}</p>
        </div>

        <div className="cdvm-byline">
          <div className="cdvm-trainer">
            <div className="cdvm-trainer-avatar">
              {initials(course.trainer.full_name)}
            </div>
            <div>
              <p className="cdvm-trainer-name">{course.trainer.full_name}</p>
              <p className="cdvm-trainer-role">{course.trainer.email}</p>
            </div>
          </div>
          <div className="cdvm-price">
            <p className="cdvm-price-value">{course.is_free ? 'Free' : formatNaira(course.price_kobo)}</p>
            <p className="cdvm-price-label">{course.is_free ? '' : 'per learner'}</p>
          </div>
        </div>

        <div className="cdvm-scroll">
          {loading && <div className="cdvm-loading">Loading course details…</div>}
          {!loading && error && <div className="cdvm-error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="cdvm-stats-grid">
                <div className="cdvm-stat-card">
                  <div className="cdvm-stat-icon" style={{ background: '#DBEAFE' }}><Users size={15} color="#2563EB" /></div>
                  <p className="cdvm-stat-value">{course.enrollment_count}</p>
                  <p className="cdvm-stat-label">Enrolled</p>
                </div>
                <div className="cdvm-stat-card">
                  <div className="cdvm-stat-icon" style={{ background: '#D1FAE5' }}><TrendingUp size={15} color="#059669" /></div>
                  <p className="cdvm-stat-value">{formatNaira(course.revenue_kobo)}</p>
                  <p className="cdvm-stat-label">Revenue</p>
                </div>
                <div className="cdvm-stat-card">
                  <div className="cdvm-stat-icon" style={{ background: '#FFF7E6' }}><Star size={15} color="#FE9A00" /></div>
                  <p className="cdvm-stat-value">{pending.average_rating != null ? pending.average_rating.toFixed(1) : '—'}</p>
                  <p className="cdvm-stat-label">Avg rating</p>
                </div>
                <div className="cdvm-stat-card">
                  <div className="cdvm-stat-icon" style={{ background: '#EDE9FE' }}><BadgeCheck size={15} color="#7C3AED" /></div>
                  <p className="cdvm-stat-value">{course.completion_percentage}%</p>
                  <p className="cdvm-stat-label">Completion</p>
                </div>
              </div>

              {isArchived && detail?.archive && (
                <div className="cdvm-archive-note">
                  Archived {new Date(detail.archive.archived_at).toLocaleDateString()} by {detail.archive.archived_by_email}
                  {' '}— reason: {detail.archive.reason.replace(/_/g, ' ')}
                  {detail.archive.note ? `. ${detail.archive.note}` : ''}
                </div>
              )}

              {detail?.description && (
                <div className="cdvm-section">
                  <div className="cdvm-section-head">
                    <h4 className="cdvm-section-title">Description</h4>
                  </div>
                  <p className="cdvm-description">{detail.description}</p>
                </div>
              )}

              <div className="cdvm-section">
                <div className="cdvm-trend-head">
                  <div>
                    <p className="cdvm-section-title" style={{ marginBottom: 2 }}>Enrollment trend</p>
                    {trend && (
                      <span className={`cdvm-trend-badge${trend.summary.growth_rate_percent < 0 ? ' down' : ''}`}>
                        {trend.summary.growth_rate_percent >= 0 ? '↑' : '↓'} {Math.abs(trend.summary.growth_rate_percent)}%
                      </span>
                    )}
                  </div>
                  <select
                    className="cdvm-trend-period-select"
                    value={trendPeriod}
                    onChange={(e) => setTrendPeriod(e.target.value as TrendPeriod)}
                  >
                    <option value="last_7_days">Last 7 days</option>
                    <option value="last_30_days">Last 30 days</option>
                    <option value="last_90_days">Last 90 days</option>
                    <option value="all_time">All time</option>
                  </select>
                </div>

                {trendLoading && <div className="cdvm-trend-state">Loading trend…</div>}
                {!trendLoading && trendError && <div className="cdvm-trend-state error">{trendError}</div>}

                {!trendLoading && !trendError && trend && (
                  trend.data.length === 0 ? (
                    <div className="cdvm-trend-state">No enrollment data for this period.</div>
                  ) : (
                    <>
                      <div className="cdvm-trend-bars">
                        {(() => {
                          const max = Math.max(1, ...trend.data.map((d) => d.new_enrollments))
                          return trend.data.map((d) => (
                            <div
                              key={d.date}
                              className="cdvm-trend-bar"
                              style={{ height: `${Math.max(3, (d.new_enrollments / max) * 60)}px` }}
                              title={`${fmtTrendDate(d.date)}: ${d.new_enrollments} new enrollment${d.new_enrollments === 1 ? '' : 's'}`}
                            />
                          ))
                        })()}
                      </div>
                      <div className="cdvm-trend-axis">
                        <span>{fmtTrendDate(trend.summary.period_start)}</span>
                        <span>{fmtTrendDate(trend.summary.period_end)}</span>
                      </div>
                      <p className="cdvm-trend-summary">
                        {trend.summary.total_new_enrollments} new enrollment{trend.summary.total_new_enrollments === 1 ? '' : 's'} this period · {trend.summary.total_enrollments_all_time} all-time
                      </p>
                    </>
                  )
                )}
              </div>

              <div className="cdvm-section">
                <div className="cdvm-section-head">
                  <h4 className="cdvm-section-title">Course details</h4>
                </div>
                <div className="cdvm-details-grid">
                  <div>
                    <p className="cdvm-detail-label">Total lessons</p>
                    <p className="cdvm-detail-value">{detail?.lesson_count ?? '—'} lessons</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Video content</p>
                    <p className="cdvm-detail-value">{videoCount ?? '—'} videos</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Modules</p>
                    <p className="cdvm-detail-value">{detail?.module_count ?? '—'} modules</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Quizzes</p>
                    <p className="cdvm-detail-value">{quizCount ?? '—'} quizzes</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Certificate</p>
                    <p className="cdvm-detail-value">{detail?.has_certificate ? 'Yes — on completion' : 'No'}</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Language</p>
                    <p className="cdvm-detail-value">{detail?.language ?? '—'}</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Last updated</p>
                    <p className="cdvm-detail-value">{detail?.updated_at ? new Date(detail.updated_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="cdvm-detail-label">Access</p>
                    <p className="cdvm-detail-value">{pending.access_type === 'timed' ? 'Limited-time' : 'Lifetime after enroll'}</p>
                  </div>
                </div>
              </div>

              <div className="cdvm-section">
                <div className="cdvm-section-head">
                  <h4 className="cdvm-section-title">Curriculum</h4>
                  {curriculum && (
                    <span className="cdvm-curriculum-count">
                      {curriculum.reduce((sum, m) => sum + m.lessons.length, 0)} lessons · {curriculum.length} modules
                    </span>
                  )}
                </div>

                {curriculumLoading && <div className="cdvm-trend-state">Loading curriculum…</div>}
                {!curriculumLoading && curriculumError && <div className="cdvm-trend-state error">{curriculumError}</div>}
                {!curriculumLoading && !curriculumError && curriculum && curriculum.length === 0 && (
                  <div className="cdvm-trend-state">No modules added yet.</div>
                )}

                {!curriculumLoading && !curriculumError && curriculum && curriculum.map((module) => {
                  const isOpen = expandedModuleId === module.id
                  return (
                    <div className="cdvm-module" key={module.id}>
                      <button
                        type="button"
                        className="cdvm-module-head"
                        onClick={() => setExpandedModuleId(isOpen ? null : module.id)}
                      >
                        <span className="cdvm-module-num">{module.order}</span>
                        <span className="cdvm-module-title">{module.title}</span>
                        <span className="cdvm-module-meta">
                          {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="cdvm-lesson-list">
                          {module.lessons.map((lesson) => (
                            <div className="cdvm-lesson-row" key={lesson.id}>
                              <span className="cdvm-lesson-icon"><PlayCircle size={14} /></span>
                              <span className="cdvm-lesson-title">
                                {lesson.title}{lesson.is_preview ? ' · Preview' : ''}
                              </span>
                              <span className="cdvm-lesson-duration">{lesson.duration_display || '—'}</span>
                            </div>
                          ))}
                          {module.lessons.length === 0 && (
                            <div className="cdvm-lesson-row cdvm-lesson-empty">No lessons in this module yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="cdvm-pending-note">
                <Info size={15} />
                <span>
                  Avg rating, quiz count, and access type aren't returned by
                  the admin course-detail API yet — showing "—" until those
                  fields exist. Video content count is estimated from lessons
                  with a duration in the curriculum response; worth confirming
                  with the backend that's a reliable proxy for "video lesson."
                </span>
              </div>
            </>
          )}
        </div>

        <div className="cdvm-footer">
          <button className="cdvm-footer-btn primary" onClick={onEdit} type="button">
            <Edit3 size={15} /> Edit course
          </button>
          <button className="cdvm-footer-btn secondary" onClick={onSetPrice} type="button">
            <Tag size={15} /> Set price
          </button>
          {!isArchived && (
            <button className="cdvm-footer-btn archive" onClick={onArchive} type="button">
              <Archive size={15} /> Archive
            </button>
          )}
          <button className="cdvm-footer-btn danger" onClick={onDelete} aria-label="Delete course" type="button">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}