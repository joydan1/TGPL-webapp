import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Users, TrendingUp, Star, BadgeCheck,
  Edit3, Tag, Archive, Trash2,  ChevronDown, ChevronUp, PlayCircle,
} from 'lucide-react'
import type { AdminCourseRow, AdminCourseDetail, EnrollmentTrendsResponse, TrendPeriod, EnrollmentTrendPoint } from '../../types/adminCourse'
import { adminCoursesAPI, type ApiResult } from '../../services/adminCoursesApi'
import { courseAnalyticsAPI } from '../../services/courseAnalyticsApi'
import { coursesManageAPI, type CourseCurriculumModule } from '../../services/api'

export const COURSE_DETAIL_MODAL_CSS = `
  .admincdm-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .admincdm-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 620px; overflow: hidden; position: relative; }

  .admincdm-hero { background: linear-gradient(135deg, #2492EB, #3B82F6); padding: 1.5rem; position: relative; }
  .admincdm-hero-status { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.18); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; margin-bottom: 0.9rem; }
  .admincdm-hero-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
  .admincdm-hero-close { position: absolute; top: 1.25rem; right: 1.25rem; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.18); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .admincdm-hero-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; }
  .admincdm-hero-category { margin: 0.2rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.9rem; }

  .admincdm-byline { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 1.1rem 1.5rem; border-bottom: 1px solid #F3F4F6; flex-wrap: wrap; }
  .admincdm-trainer { display: flex; align-items: center; gap: 0.7rem; }
  .admincdm-trainer-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; background: #059669; }
  .admincdm-trainer-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .admincdm-trainer-role { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .admincdm-price { text-align: right; }
  .admincdm-price-value { margin: 0; font-size: 1.3rem; font-weight: 800; color: #111827; }
  .admincdm-price-label { margin: 0; font-size: 0.78rem; color: #9CA3AF; }

  .admincdm-scroll { padding: 1.25rem 1.5rem 1.5rem; max-height: 60vh; overflow-y: auto; }

  .admincdm-loading { padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
  .admincdm-error { padding: 1rem 1.25rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.85rem; font-size: 0.85rem; }

  .admincdm-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.7rem; }
  .admincdm-stat-card { background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem; border: 1px solid #F3F4F6; }
  .admincdm-stat-icon { width: 30px; height: 30px; border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .admincdm-stat-value { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .admincdm-stat-label { margin: 0.15rem 0 0; font-size: 0.74rem; color: #6B7280; }

  .admincdm-panel { background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; }
  .admincdm-panel-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem; }
  .admincdm-panel-title { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; }

  .admincdm-details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1.5rem; padding: 0 1.1rem 1.1rem; }
  .admincdm-detail-label { font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 0.2rem; }
  .admincdm-detail-value { font-size: 0.88rem; font-weight: 700; color: #111827; margin: 0; }

  .admincdm-description { padding: 0 1.1rem 1.1rem; font-size: 0.86rem; color: #374151; line-height: 1.55; }

  .admincdm-pending-note { display: flex; align-items: flex-start; gap: 0.6rem; padding: 1rem 1.1rem; font-size: 0.82rem; color: #6B7280; line-height: 1.5; }
  .admincdm-pending-note svg { flex-shrink: 0; margin-top: 0.1rem; color: #9CA3AF; }

  .admincdm-archive-note { background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 0.85rem; padding: 0.85rem 1rem; font-size: 0.82rem; color: #92400E; line-height: 1.5; }

  .admincdm-footer { display: flex; align-items: center; gap: 0.6rem; padding: 1.1rem 1.5rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .admincdm-footer-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.86rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .admincdm-footer-btn.primary { flex: 1; border: none; background: #2492EB; color: #fff; }
  .admincdm-footer-btn.secondary { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .admincdm-footer-btn.archive { border: 1.5px solid #FDE68A; background: #FFFBEB; color: #D97706; }
  .admincdm-footer-btn.danger { border: 1.5px solid #FECACA; background: #fff; color: #EF4444; padding: 0.75rem; }

  .admincdm-trend-panel { padding: 16px 20px; border: 1px solid #EBEBEB; border-radius: 16px; }
  .admincdm-trend-head { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
  .admincdm-trend-title { margin: 0; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; line-height: 20px; color: #2B2B2C; }
  .admincdm-trend-badge { display: inline-block; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 11px; line-height: 16px; color: #2492EB; }
  .admincdm-trend-badge.down { color: #DC2626; }
  .admincdm-trend-period-select { flex: 0 0 auto; width: auto; max-width: fit-content; border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.25rem 1.6rem 0.25rem 0.55rem; font-size: 0.72rem; color: #374151; background: #fff; cursor: pointer; appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.55rem center; }
  .admincdm-trend-state { padding: 1.5rem 0; text-align: center; color: #9CA3AF; font-size: 0.82rem; }
  .admincdm-trend-state.error { color: #DC2626; }
  .admincdm-trend-bars { display: flex; flex-direction: row; align-items: flex-end; gap: 4px; padding: 12px 0 0; height: 60px; }
  .admincdm-trend-bar { flex: 1 1 0; min-width: 0; background: linear-gradient(0deg, #2492EB 0%, #B4DEFF 100%); border-radius: 6px; }
  .admincdm-trend-axis { display: flex; flex-direction: row; justify-content: space-between; padding: 6px 0 0; font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; line-height: 15px; color: #99A1AF; }
  .admincdm-trend-summary { margin: 8px 0 0; font-size: 0.78rem; color: #6B7280; }

  .admincdm-curriculum-count { font-size: 0.76rem; color: #99A1AF; }
  .admincdm-module { border-top: 1px solid #F3F4F6; }
  .admincdm-module-head { width: 100%; display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem 1.1rem; background: none; border: none; cursor: pointer; text-align: left; }
  .admincdm-module-num { width: 20px; height: 20px; border-radius: 8px; background: #F7F7F7; color: #99A1AF; font-size: 0.68rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .admincdm-module-title { flex: 1; font-size: 0.85rem; font-weight: 700; color: #111827; }
  .admincdm-module-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.76rem; color: #99A1AF; flex-shrink: 0; }
  .admincdm-lesson-list { background: #FAFAFA; }
  .admincdm-lesson-row { display: flex; align-items: center; gap: 0.7rem; padding: 0.6rem 1.1rem; border-top: 1px solid #F9FAFB; font-size: 0.8rem; color: #616873; }
  .admincdm-lesson-icon { color: #2492EB; flex-shrink: 0; display: flex; }
  .admincdm-lesson-title { flex: 1; }
  .admincdm-lesson-duration { font-size: 0.7rem; color: #99A1AF; flex-shrink: 0; }
  .admincdm-lesson-empty { color: #9CA3AF; font-style: italic; }

  @media (max-width: 560px) {
    .admincdm-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .admincdm-details-grid { grid-template-columns: 1fr; }
  }
`

// Structural layout is applied inline (not via the CSS string above) so it
// cannot be overridden by any external stylesheet, cascade layer, or
// injected rule elsewhere in the app — whatever was previously collapsing
// / absolutely-positioning these panels, inline styles win over it since
// only another inline style or an !important rule can beat them.
const SCROLL_INLINE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
}
const PANEL_INLINE: React.CSSProperties = {
  display: 'block',
  position: 'static',
  width: '100%',
  marginBottom: 0,
  height: 'auto',
  overflow: 'visible',
  transition: 'none',
}

// The trend endpoint returns one point per calendar day for whatever
// period was requested (confirmed: last_30_days returns exactly 30 daily
// points), so last_90_days / all_time can come back with 90+ or hundreds
// of points. Rather than hardcoding period-specific granularity rules
// (hourly/daily/weekly) that assume backend behavior we haven't verified,
// this buckets generically so the chart never renders more than MAX_BARS
// bars regardless of how much data comes back. MAX_BARS is 12 to match
// the Figma spec's fixed 12-bar layout (equal-width flex bars).
const MAX_BARS = 12

// Figma specs a fixed per-bar opacity ramp (0.7 -> 0.98, oldest to
// newest) as the recency cue, rather than value-based highlighting.
// Matches the 12 hand-authored opacity values in the export closely
// enough to generalize to any bar count.
function barOpacity(index: number, total: number): number {
  if (total <= 1) return 0.98
  return 0.7 + (index / (total - 1)) * 0.28
}

interface TrendBucket {
  /** Axis/tooltip label — a single day ("Aug 12") or a range ("Aug 10–12") */
  label: string
  value: number
  /** % change vs the previous bucket; null for the first bucket or when previous was 0 */
  changePercent: number | null
}

function bucketTrendData(data: EnrollmentTrendPoint[], maxBars: number): TrendBucket[] {
  if (data.length === 0) return []
  const bucketSize = Math.max(1, Math.ceil(data.length / maxBars))
  const buckets: TrendBucket[] = []
  for (let i = 0; i < data.length; i += bucketSize) {
    const chunk = data.slice(i, i + bucketSize)
    const value = chunk.reduce((sum, d) => sum + d.new_enrollments, 0)
    const label = chunk.length === 1
      ? fmtTrendDate(chunk[0].date)
      : `${fmtTrendDate(chunk[0].date)}\u2013${fmtTrendDate(chunk[chunk.length - 1].date)}`
    buckets.push({ label, value, changePercent: null })
  }
  for (let i = 1; i < buckets.length; i++) {
    const prev = buckets[i - 1].value
    buckets[i].changePercent = prev > 0 ? Math.round(((buckets[i].value - prev) / prev) * 100) : null
  }
  return buckets
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
function fmtTrendDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
// Figma's badge reads "+12% this month" — that phrase is only accurate for
// the last_30_days view, so it's derived per-period instead of hardcoded.
function trendPeriodPhrase(period: TrendPeriod): string {
  switch (period) {
    case 'last_7_days': return 'this week'
    case 'last_30_days': return 'this month'
    case 'last_90_days': return 'last 90 days'
    case 'all_time': return 'all time'
  }
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
 *   - average_rating (number | null)
 *   - video_count (number)
 *   - quiz_count (number)
 *   - access_type ('lifetime' | 'timed')
 * Until then these render as "—" instead of throwing.
 *
 * TODO(backend): a real-time / 24h enrollment view was requested, but
 * TrendPeriod only supports last_7_days | last_30_days | last_90_days |
 * all_time, and EnrollmentTrendPoint is one point per calendar day — there's
 * no hourly granularity to draw from. Adding a 24h view needs a backend
 * change (new period value + hourly aggregation), not just a frontend one.
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
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('last_7_days')
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
      if (res.success) setTrend(res.data)
      else setTrendError(res.error)
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
      if (res.success) setDetail(res.data)
      else setError(res.error)
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

  return createPortal(
    <div className="admincdm-overlay" onClick={onClose}>
      <div className="admincdm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admincdm-hero">
          <span className="admincdm-hero-status">
            <span className="admincdm-hero-status-dot" />
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </span>
          <button className="admincdm-hero-close" onClick={onClose} aria-label="Close" type="button">
            <X size={16} />
          </button>
          <h2 className="admincdm-hero-title">{course.title}</h2>
          <p className="admincdm-hero-category">{detail?.category || (loading ? 'Loading…' : '—')}</p>
        </div>

        <div className="admincdm-byline">
          <div className="admincdm-trainer">
            <div className="admincdm-trainer-avatar">
              {initials(course.trainer.full_name)}
            </div>
            <div>
              <p className="admincdm-trainer-name">{course.trainer.full_name}</p>
              <p className="admincdm-trainer-role">{course.trainer.email}</p>
            </div>
          </div>
          <div className="admincdm-price">
            <p className="admincdm-price-value">{course.is_free ? 'Free' : formatNaira(course.price_kobo)}</p>
            <p className="admincdm-price-label">{course.is_free ? '' : 'per learner'}</p>
          </div>
        </div>

        <div className="admincdm-scroll" style={SCROLL_INLINE}>
          {loading && <div className="admincdm-loading">Loading course details…</div>}
          {!loading && error && <div className="admincdm-error">{error}</div>}

          {!loading && !error && (
            <>
              <div className="admincdm-stats-grid" style={{ display: 'grid' }}>
                <div className="admincdm-stat-card">
                  <div className="admincdm-stat-icon" style={{ background: '#DBEAFE' }}><Users size={15} color="#2492EB" /></div>
                  <p className="admincdm-stat-value">{course.enrollment_count}</p>
                  <p className="admincdm-stat-label">Enrolled</p>
                </div>
                <div className="admincdm-stat-card">
                  <div className="admincdm-stat-icon" style={{ background: '#D1FAE5' }}><TrendingUp size={15} color="#059669" /></div>
                  <p className="admincdm-stat-value">{formatNaira(course.revenue_kobo)}</p>
                  <p className="admincdm-stat-label">Revenue</p>
                </div>
                <div className="admincdm-stat-card">
                  <div className="admincdm-stat-icon" style={{ background: '#FFF7E6' }}><Star size={15} color="#FE9A00" /></div>
                  <p className="admincdm-stat-value">{pending.average_rating != null ? pending.average_rating.toFixed(1) : '—'}</p>
                  <p className="admincdm-stat-label">Avg rating</p>
                </div>
                <div className="admincdm-stat-card">
                  <div className="admincdm-stat-icon" style={{ background: '#EDE9FE' }}><BadgeCheck size={15} color="#7C3AED" /></div>
                  <p className="admincdm-stat-value">{course.completion_percentage}%</p>
                  <p className="admincdm-stat-label">Completion</p>
                </div>
              </div>

              {isArchived && detail?.archive && (
                <div className="admincdm-archive-note" style={PANEL_INLINE}>
                  Archived {new Date(detail.archive.archived_at).toLocaleDateString()} by {detail.archive.archived_by_email}
                  {' '}— reason: {detail.archive.reason.replace(/_/g, ' ')}
                  {detail.archive.note ? `. ${detail.archive.note}` : ''}
                </div>
              )}

              {detail?.description && (
                <div className="admincdm-panel" style={PANEL_INLINE}>
                  <div className="admincdm-panel-head">
                    <h4 className="admincdm-panel-title">Description</h4>
                  </div>
                  <p className="admincdm-description">{detail.description}</p>
                </div>
              )}

              <div className="admincdm-panel admincdm-trend-panel" style={PANEL_INLINE}>
                <div className="admincdm-trend-head">
                  <p className="admincdm-trend-title">Enrollment trend</p>
                  <select
                    className="admincdm-trend-period-select"
                    value={trendPeriod}
                    onChange={(e) => setTrendPeriod(e.target.value as TrendPeriod)}
                  >
                    <option value="last_7_days">Last 7 days</option>
                    <option value="last_30_days">Last 30 days</option>
                    <option value="last_90_days">Last 90 days</option>
                    <option value="all_time">All time</option>
                  </select>
                </div>
                {trend && (
                  <span className={`admincdm-trend-badge${trend.summary.growth_rate_percent < 0 ? ' down' : ''}`}>
                    {trend.summary.growth_rate_percent >= 0 ? '↑' : '↓'} {trend.summary.growth_rate_percent >= 0 ? '+' : ''}{trend.summary.growth_rate_percent}% {trendPeriodPhrase(trendPeriod)}
                  </span>
                )}

                {trendLoading && <div className="admincdm-trend-state">Loading trend…</div>}
                {!trendLoading && trendError && <div className="admincdm-trend-state error">{trendError}</div>}

                {!trendLoading && !trendError && trend && (
                  trend.data.length === 0 ? (
                    <div className="admincdm-trend-state">No enrollment data for this period.</div>
                  ) : (
                    <>
                      {(() => {
                        const buckets = bucketTrendData(trend.data, MAX_BARS)
                        const max = Math.max(1, ...buckets.map((b) => b.value))
                        return (
                          <div className="admincdm-trend-bars">
                            {buckets.map((b, i) => {
                              const changeStr = b.changePercent === null
                                ? ''
                                : ` (${b.changePercent >= 0 ? '+' : ''}${b.changePercent}% vs previous)`
                              return (
                                <div
                                  key={i}
                                  className="admincdm-trend-bar"
                                  style={{
                                    height: `${Math.max(2, (b.value / max) * 60)}px`,
                                    opacity: barOpacity(i, buckets.length),
                                  }}
                                  title={`${b.label}: ${b.value} new enrollment${b.value === 1 ? '' : 's'}${changeStr}`}
                                />
                              )
                            })}
                          </div>
                        )
                      })()}
                      <div className="admincdm-trend-axis">
                        <span>{fmtTrendDate(trend.summary.period_start)}</span>
                        <span>{fmtTrendDate(trend.summary.period_end)}</span>
                      </div>
                      <p className="admincdm-trend-summary">
                        {trend.summary.total_new_enrollments} new enrollment{trend.summary.total_new_enrollments === 1 ? '' : 's'}
                        {' · avg '}
                        {Math.round((trend.summary.total_new_enrollments / trend.data.length) * 10) / 10}/day
                        {' · '}{trend.summary.total_enrollments_all_time} all-time
                      </p>
                    </>
                  )
                )}
              </div>

              <div className="admincdm-panel" style={PANEL_INLINE}>
                <div className="admincdm-panel-head">
                  <h4 className="admincdm-panel-title">Course details</h4>
                </div>
                <div className="admincdm-details-grid" style={{ display: 'grid' }}>
                  <div>
                    <p className="admincdm-detail-label">Total lessons</p>
                    <p className="admincdm-detail-value">{detail?.lesson_count ?? '—'} lessons</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Video content</p>
                    <p className="admincdm-detail-value">{videoCount ?? '—'} videos</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Modules</p>
                    <p className="admincdm-detail-value">{detail?.module_count ?? '—'} modules</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Quizzes</p>
                    <p className="admincdm-detail-value">{quizCount ?? '—'} quizzes</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Certificate</p>
                    <p className="admincdm-detail-value">{detail?.has_certificate ? 'Yes — on completion' : 'No'}</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Language</p>
                    <p className="admincdm-detail-value">{detail?.language ?? '—'}</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Last updated</p>
                    <p className="admincdm-detail-value">{detail?.updated_at ? new Date(detail.updated_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <div>
                    <p className="admincdm-detail-label">Access</p>
                    <p className="admincdm-detail-value">{pending.access_type === 'timed' ? 'Limited-time' : 'Lifetime after enroll'}</p>
                  </div>
                </div>
              </div>

              <div className="admincdm-panel" style={PANEL_INLINE}>
                <div className="admincdm-panel-head">
                  <h4 className="admincdm-panel-title">Curriculum</h4>
                  {curriculum && (
                    <span className="admincdm-curriculum-count">
                      {curriculum.reduce((sum, m) => sum + m.lessons.length, 0)} lessons · {curriculum.length} modules
                    </span>
                  )}
                </div>

                {curriculumLoading && <div className="admincdm-trend-state">Loading curriculum…</div>}
                {!curriculumLoading && curriculumError && <div className="admincdm-trend-state error">{curriculumError}</div>}
                {!curriculumLoading && !curriculumError && curriculum && curriculum.length === 0 && (
                  <div className="admincdm-trend-state">No modules added yet.</div>
                )}

                {!curriculumLoading && !curriculumError && curriculum && curriculum.map((module) => {
                  const isOpen = expandedModuleId === module.id
                  return (
                    <div className="admincdm-module" key={module.id}>
                      <button
                        type="button"
                        className="admincdm-module-head"
                        onClick={() => setExpandedModuleId(isOpen ? null : module.id)}
                      >
                        <span className="admincdm-module-num">{module.order}</span>
                        <span className="admincdm-module-title">{module.title}</span>
                        <span className="admincdm-module-meta">
                          {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="admincdm-lesson-list">
                          {module.lessons.map((lesson) => (
                            <div className="admincdm-lesson-row" key={lesson.id}>
                              <span className="admincdm-lesson-icon"><PlayCircle size={14} /></span>
                              <span className="admincdm-lesson-title">
                                {lesson.title}{lesson.is_preview ? ' · Preview' : ''}
                              </span>
                              <span className="admincdm-lesson-duration">{lesson.duration_display || '—'}</span>
                            </div>
                          ))}
                          {module.lessons.length === 0 && (
                            <div className="admincdm-lesson-row admincdm-lesson-empty">No lessons in this module yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

               
            </>
          )}
        </div>

        <div className="admincdm-footer">
          <button className="admincdm-footer-btn primary" onClick={onEdit} type="button">
            <Edit3 size={15} /> Edit course
          </button>
          <button className="admincdm-footer-btn secondary" onClick={onSetPrice} type="button">
            <Tag size={15} /> Set price
          </button>
          {!isArchived && (
            <button className="admincdm-footer-btn archive" onClick={onArchive} type="button">
              <Archive size={15} /> Archive
            </button>
          )}
          <button className="admincdm-footer-btn danger" onClick={onDelete} aria-label="Delete course" type="button">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}