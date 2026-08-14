import { useState } from 'react'
import {
  X, Users, TrendingUp, Star, BadgeCheck, ChevronDown, ChevronUp,
  Edit3, Tag, Archive, Trash2, PlayCircle, BookOpenText, ListChecks,
} from 'lucide-react'
import { type CourseSummary, getMockCourseDetail } from '../../types/adminCourse'

export const COURSE_DETAIL_MODAL_CSS = `
  .cd-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .cd-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 620px; overflow: hidden; }

  .cd-hero { background: linear-gradient(135deg, #2492EB, #3B82F6); padding: 1.5rem; position: relative; }
  .cd-hero-status { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(255,255,255,0.18); color: #fff; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 999px; margin-bottom: 0.9rem; }
  .cd-hero-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; }
  .cd-hero-close { position: absolute; top: 1.25rem; right: 1.25rem; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.18); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .cd-hero-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #fff; }
  .cd-hero-category { margin: 0.2rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.9rem; }

  .cd-byline { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 1.1rem 1.5rem; border-bottom: 1px solid #F3F4F6; flex-wrap: wrap; }
  .cd-trainer { display: flex; align-items: center; gap: 0.7rem; }
  .cd-trainer-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
  .cd-trainer-name { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .cd-trainer-role { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .cd-price { text-align: right; }
  .cd-price-value { margin: 0; font-size: 1.3rem; font-weight: 800; color: #111827; }
  .cd-price-label { margin: 0; font-size: 0.78rem; color: #9CA3AF; }

  .cd-scroll { padding: 1.25rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; max-height: 60vh; overflow-y: auto; }

  .cd-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.7rem; }
  .cd-stat-card { background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem; border: 1px solid #F3F4F6; }
  .cd-stat-icon { width: 30px; height: 30px; border-radius: 0.55rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .cd-stat-value { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .cd-stat-label { margin: 0.15rem 0 0; font-size: 0.74rem; color: #6B7280; }

  .cd-section { background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; overflow: hidden; }
  .cd-section-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.1rem; }
  .cd-section-title { margin: 0; font-size: 0.95rem; font-weight: 800; color: #111827; }
  .cd-trend-pill { font-size: 0.78rem; font-weight: 700; color: #059669; }

  .cd-chart { display: flex; align-items: flex-end; gap: 0.4rem; height: 70px; padding: 0 1.1rem 1rem; }
  .cd-bar { flex: 1; background: linear-gradient(180deg, #60A5FA, #2492EB); border-radius: 4px 4px 0 0; min-height: 4px; }
  .cd-chart-labels { display: flex; justify-content: space-between; padding: 0 1.1rem 1rem; font-size: 0.72rem; color: #9CA3AF; }

  .cd-details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.9rem 1.5rem; padding: 0 1.1rem 1.1rem; }
  .cd-detail-label { font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 0.2rem; }
  .cd-detail-value { font-size: 0.88rem; font-weight: 700; color: #111827; margin: 0; }

  .cd-curriculum-meta { font-size: 0.78rem; color: #9CA3AF; }
  .cd-module-row { border-top: 1px solid #F3F4F6; }
  .cd-module-head { display: flex; align-items: center; justify-content: space-between; gap: 0.6rem; padding: 0.85rem 1.1rem; cursor: pointer; }
  .cd-module-num { width: 22px; height: 22px; border-radius: 50%; background: #EFF6FF; color: #2563EB; font-size: 0.72rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cd-module-title { flex: 1; margin: 0; font-size: 0.87rem; font-weight: 700; color: #111827; }
  .cd-module-count { font-size: 0.78rem; color: #9CA3AF; }
  .cd-lesson-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 1.1rem 0.6rem 2.6rem; }
  .cd-lesson-icon { color: #9CA3AF; flex-shrink: 0; }
  .cd-lesson-title { flex: 1; margin: 0; font-size: 0.83rem; color: #374151; }
  .cd-lesson-meta { font-size: 0.76rem; color: #9CA3AF; flex-shrink: 0; }

  .cd-footer { display: flex; align-items: center; gap: 0.6rem; padding: 1.1rem 1.5rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .cd-footer-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.86rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .cd-footer-btn.primary { flex: 1; border: none; background: #2492EB; color: #fff; }
  .cd-footer-btn.secondary { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .cd-footer-btn.archive { border: 1.5px solid #FDE68A; background: #FFFBEB; color: #D97706; }
  .cd-footer-btn.danger { border: 1.5px solid #FECACA; background: #fff; color: #EFF4444; padding: 0.75rem; }

  @media (max-width: 560px) {
    .cd-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cd-details-grid { grid-template-columns: 1fr; }
  }
`

const LESSON_ICON = { video: PlayCircle, reading: BookOpenText, quiz: ListChecks } as const

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`
  return `₦${n}`
}

interface CourseDetailModalProps {
  course: CourseSummary
  onClose: () => void
  onEdit?: () => void
  onSetPrice?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export default function CourseDetailModal({
  course, onClose, onEdit, onSetPrice, onArchive, onDelete,
}: CourseDetailModalProps) {
  const detail = getMockCourseDetail(course)
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(detail.modules[0]?.id ?? null)

  const maxTrend = Math.max(...detail.enrollment_trend, 1)
  const isArchived = course.status === 'archived'

  return (
    <div className="cd-overlay" onClick={onClose}>
      <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cd-hero">
          <span className="cd-hero-status">
            <span className="cd-hero-status-dot" />
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </span>
          <button className="cd-hero-close" onClick={onClose} aria-label="Close" type="button">
            <X size={16} />
          </button>
          <h2 className="cd-hero-title">{course.title}</h2>
          <p className="cd-hero-category">{course.category}</p>
        </div>

        <div className="cd-byline">
          <div className="cd-trainer">
            <div className="cd-trainer-avatar" style={{ background: course.trainer.avatar_color }}>
              {initials(course.trainer.name)}
            </div>
            <div>
              <p className="cd-trainer-name">{course.trainer.name}</p>
              <p className="cd-trainer-role">{course.trainer.role}</p>
            </div>
          </div>
          <div className="cd-price">
            <p className="cd-price-value">{course.price == null ? 'Free' : `₦${course.price.toLocaleString()}`}</p>
            <p className="cd-price-label">{course.price == null ? '' : 'per learner'}</p>
          </div>
        </div>

        <div className="cd-scroll">
          <div className="cd-stats-grid">
            <div className="cd-stat-card">
              <div className="cd-stat-icon" style={{ background: '#DBEAFE' }}><Users size={15} color="#2563EB" /></div>
              <p className="cd-stat-value">{course.enrolled}</p>
              <p className="cd-stat-label">Enrolled</p>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon" style={{ background: '#D1FAE5' }}><TrendingUp size={15} color="#059669" /></div>
              <p className="cd-stat-value">{formatMoney(course.revenue)}</p>
              <p className="cd-stat-label">Revenue</p>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon" style={{ background: '#FEF3C7' }}><Star size={15} color="#D97706" /></div>
              <p className="cd-stat-value">{detail.avg_rating.toFixed(1)}</p>
              <p className="cd-stat-label">Avg rating</p>
            </div>
            <div className="cd-stat-card">
              <div className="cd-stat-icon" style={{ background: '#EDE9FE' }}><BadgeCheck size={15} color="#7C3AED" /></div>
              <p className="cd-stat-value">{detail.completion_rate}%</p>
              <p className="cd-stat-label">Completion</p>
            </div>
          </div>

          <div className="cd-section">
            <div className="cd-section-head">
              <h4 className="cd-section-title">Enrollment trend</h4>
              <span className="cd-trend-pill">↑ +{detail.trend_change_pct}% this month</span>
            </div>
            <div className="cd-chart">
              {detail.enrollment_trend.map((v, i) => (
                <div key={i} className="cd-bar" style={{ height: `${(v / maxTrend) * 100}%` }} />
              ))}
            </div>
            <div className="cd-chart-labels">
              <span>12 months ago</span>
              <span>This month</span>
            </div>
          </div>

          <div className="cd-section">
            <div className="cd-section-head">
              <h4 className="cd-section-title">Course details</h4>
            </div>
            <div className="cd-details-grid">
              <div>
                <p className="cd-detail-label">Total lessons</p>
                <p className="cd-detail-value">{detail.total_lessons} lessons</p>
              </div>
              <div>
                <p className="cd-detail-label">Video content</p>
                <p className="cd-detail-value">{detail.video_count} videos</p>
              </div>
              <div>
                <p className="cd-detail-label">Modules</p>
                <p className="cd-detail-value">{detail.modules.length} modules</p>
              </div>
              <div>
                <p className="cd-detail-label">Quizzes</p>
                <p className="cd-detail-value">{detail.quiz_count} quizzes</p>
              </div>
              <div>
                <p className="cd-detail-label">Certificate</p>
                <p className="cd-detail-value">{detail.has_certificate ? 'Yes — on completion' : 'No'}</p>
              </div>
              <div>
                <p className="cd-detail-label">Language</p>
                <p className="cd-detail-value">{detail.language}</p>
              </div>
              <div>
                <p className="cd-detail-label">Last updated</p>
                <p className="cd-detail-value">{course.updated_at}</p>
              </div>
              <div>
                <p className="cd-detail-label">Access</p>
                <p className="cd-detail-value">{detail.access}</p>
              </div>
            </div>
          </div>

          <div className="cd-section">
            <div className="cd-section-head">
              <h4 className="cd-section-title">Curriculum</h4>
              <span className="cd-curriculum-meta">{detail.total_lessons} lessons · {detail.modules.length} modules</span>
            </div>
            {detail.modules.map((mod, idx) => {
              const expanded = expandedModuleId === mod.id
              return (
                <div key={mod.id} className="cd-module-row">
                  <div
                    className="cd-module-head"
                    onClick={() => setExpandedModuleId(expanded ? null : mod.id)}
                  >
                    <span className="cd-module-num">{idx + 1}</span>
                    <p className="cd-module-title">{mod.title}</p>
                    <span className="cd-module-count">{mod.lessons.length} lessons</span>
                    {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                  </div>
                  {expanded && mod.lessons.map((lesson) => {
                    const Icon = LESSON_ICON[lesson.type]
                    return (
                      <div key={lesson.id} className="cd-lesson-row">
                        <Icon size={16} className="cd-lesson-icon" />
                        <p className="cd-lesson-title">{lesson.title}</p>
                        <span className="cd-lesson-meta">
                          {lesson.type === 'quiz' ? `${lesson.questions} Qs` : lesson.duration}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        <div className="cd-footer">
          <button className="cd-footer-btn primary" onClick={onEdit} type="button">
            <Edit3 size={15} /> Edit course
          </button>
          <button className="cd-footer-btn secondary" onClick={onSetPrice} type="button">
            <Tag size={15} /> Set price
          </button>
          {!isArchived && (
            <button className="cd-footer-btn archive" onClick={onArchive} type="button">
              <Archive size={15} /> Archive
            </button>
          )}
          <button className="cd-footer-btn danger" onClick={onDelete} aria-label="Delete course" type="button">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}