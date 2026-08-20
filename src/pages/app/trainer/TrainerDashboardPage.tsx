import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TrainerShell from '../../../layouts/TrainerShell'
import { Plus, Play, Users, BookOpen, ClipboardList, Star } from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { useAuth } from '../../../hooks/useAuth'
import {
  coursesManageAPI,
  trainerReviewsAPI,
  trainerDashboardAPI,
  trainerSessionsAPI,
  type TrainerCourseListItem,
  type TrainerPendingReview,
  type TrainerSession,
} from '../../../services/api'

const PAGE_CSS = `
  .db-page { padding: 1rem; padding-bottom: 2rem; background: #F5F5F5; }

  .db-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .db-greeting { margin: 0; color: #6B7280; font-size: 0.9rem; }
  .db-name { margin: 0.3rem 0 0; font-size: 1.5rem; font-weight: 800; color: #111827; }
  .db-add-btn { appearance: none; border: none; border-radius: 999px; padding: 0.75rem 1.1rem; background: #2492EB; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; white-space: nowrap; }

  .db-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; margin-top: 1.25rem; }
  .db-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .db-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .db-stat-title { margin: 0; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.7rem; }
  .db-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .db-stat-value { margin: 0.65rem 0 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .db-stat-label { margin: 0.5rem 0 0; font-size: 0.8rem; font-weight: 600; }

  .db-section-title { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 700; color: #111827; }
  .db-sections { display: flex; flex-direction: column; gap: 2rem; margin-top: 1.75rem; }

  .db-live-card { border-radius: 1rem; overflow: hidden;  background: #2492EB; color: #fff; padding: 1.25rem;  display: flex; 
  flex-direction: column; gap: 1rem;}
  .db-live-badge { margin: 0; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.9; display: flex; align-items: center; gap: 0.4rem; }
  .db-live-dot { width: 8px; height: 8px; border-radius: 999px; background: #05DF72; display: inline-block; flex-shrink: 0; }
  .db-live-title { margin: 0.65rem 0 0; font-size: 1.1rem; font-weight: 700; line-height: 1.3; }
  .db-live-sub { margin: 0.65rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.85rem; }
  .db-live-btn { border: none; border-radius: 999px; padding: 0.85rem 1.1rem; background: #fff; color: #2492EB; font-weight: 700; cursor: pointer; white-space: nowrap; align-self: flex-start; display: flex; align-items: center; gap: 0.4rem; }

  .db-reviews-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); }
  .db-reviews-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .db-view-all { border: none; background: none; color:#2492EB; font-weight: 700; cursor: pointer; font-size: 0.85rem; }
  .db-review-list { margin-top: 0.85rem; display: grid; gap: 0.75rem; }
  .db-review-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.85rem; border-radius: 1rem; background: #F8FAFF; border: 1px solid #E5E7EB; flex-wrap: wrap; }
  .db-review-person { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
  .db-review-avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: #64748B; }
  .db-review-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .db-review-course { margin: 0.25rem 0 0; color: #64748B; font-size: 0.8rem; }
  .db-review-meta { text-align: right; }
  .db-review-time { margin: 0; color: #6B7280; font-size: 0.75rem; }
  .db-review-btn { margin-top: 0.5rem; border: none; border-radius: 999px; background: #2492EB; color: #fff; padding: 0.55rem 0.9rem; font-weight: 700; cursor: pointer; font-size: 0.8rem; }
  .db-empty-note { color: #9CA3AF; font-size: 0.85rem; text-align: center; padding: 1rem 0; margin: 0; }

  .db-course-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); max-width: 340px; }
  .db-course-img-wrap { position: relative; }
  .db-course-img { width: 100%; height: 176px; object-fit: cover; border-radius: 1rem; background: #E2E8F0; display: block; }
  .db-course-body { margin-top: 1rem; display: grid; gap: 0.5rem; }
  .db-course-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; font-weight: 700; }
  .db-course-name { margin: 0; font-size: 1.15rem; font-weight: 700; color: #111827; }
  .db-course-date { margin: 0; color: #6B7280; font-size: 0.8rem; }
  .db-course-preview-btn { margin-top: 1rem; width: 100%; border: none; border-radius: 999px; padding: 0.8rem 1rem; background: #EFF6FF; color: #2492EB; font-weight: 700; cursor: pointer; }

 @media (max-width: 639px) {
  .db-course-card {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  .db-course-img {
    height: 140px;   /* was fixed at 176px for all breakpoints */
  }
  .db-course-body {
    gap: 0.4rem;     /* slightly tighter on small screens */
  }
  .db-course-preview-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    padding: 0.8rem 1rem;
    font-size: 0.92rem;
    box-sizing: border-box;
  }
}

  @media (min-width: 640px) {
    .db-page { padding: 1.5rem; }
    .db-name { font-size: 1.85rem; }
    .db-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
    .db-live-card { flex-direction: row; align-items: center; justify-content: space-between; padding: 1.5rem; }
    .db-live-title { font-size: 1.25rem; }
  }

 @media (min-width: 1024px) {
  .db-page { padding: 1.5rem 2rem 2rem; }
  .db-name { font-size: 2.25rem; }
}
`

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatSessionTime(iso: string): string {
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} · ${timePart}`
}

export default function TrainerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [draftCount, setDraftCount] = useState<number | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  const [pendingReviews, setPendingReviews] = useState<TrainerPendingReview[]>([])
  const [pendingCount, setPendingCount] = useState<number | null>(null)
  const [overdueCount, setOverdueCount] = useState<number | null>(null)
  const [reviewsError, setReviewsError] = useState<string | null>(null)

  const [nextSession, setNextSession] = useState<TrainerSession | null>(null)
  const [sessionIsLive, setSessionIsLive] = useState(false)
  const [activeLearners, setActiveLearners] = useState<number | null>(null)

  const [activeCourse, setActiveCourse] = useState<TrainerCourseListItem | null>(null)
  const [courseError, setCourseError] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [avgScore, setAvgScore] = useState<number | null>(null)
  const [totalReviews, setTotalReviews] = useState<number | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)

    const [summaryDbRes, draftRes, summaryRes, pendingRes, myCoursesRes, liveRes, upcomingRes] = await Promise.all([
      trainerDashboardAPI.getSummary(),
      coursesManageAPI.listMyCourses({ status: 'draft' }),
      trainerReviewsAPI.getSummary(),
      trainerReviewsAPI.getPendingReviews(),
      coursesManageAPI.listMyCourses(),
      trainerSessionsAPI.getSessions('live'),
      trainerSessionsAPI.getSessions('upcoming'),
    ])

    if (summaryDbRes.success && draftRes.success) {
      setPublishedCount(summaryDbRes.data.courses_published)
      setActiveLearners(summaryDbRes.data.active_learners)
      setDraftCount(draftRes.count)
    } else {
      setStatsError('Failed to load course stats')
    }

    if (summaryRes.success) {
      setPendingCount(summaryRes.data.pending_count)
      setAvgScore(summaryRes.data.average_score)
      setTotalReviews(summaryRes.data.total_reviews)
    }

    if (pendingRes.success) {
      setPendingReviews(pendingRes.data.slice(0, 2))
      setOverdueCount(pendingRes.data.filter((r) => r.is_late).length)
    } else {
      setReviewsError(pendingRes.error)
    }

    if (myCoursesRes.success) {
      const sorted = [...myCoursesRes.data].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      setActiveCourse(sorted[0] ?? null)
    } else {
      setCourseError(myCoursesRes.error)
    }

    if (liveRes.success && liveRes.data.length > 0) {
      setNextSession(liveRes.data[0])
      setSessionIsLive(true)
    } else if (upcomingRes.success && upcomingRes.data.length > 0) {
      setNextSession(upcomingRes.data[0])
      setSessionIsLive(false)
    }

    setLoading(false)
  }

  if (!user) return null

  const firstName = (user.name || '').split(' ')[0] || 'there'

  const stats = [
    {
      title: 'Active learners',
      value: activeLearners !== null ? String(activeLearners) : '—',
      label: 'Holding active access',
      labelColor: '#2563EB',
      icon: Users,
      iconBg: '#DBEAFE',
      iconColor: '#2563EB',
    },
    {
      title: 'Courses published',
      value: publishedCount !== null ? String(publishedCount) : '—',
      label: draftCount !== null ? `${draftCount} in draft` : '—',
      labelColor: '#16A34A',
      icon: BookOpen,
      iconBg: '#EDE9FE',
      iconColor: '#7C3AED',
    },
    {
      title: 'Pending reviews',
      value: pendingCount !== null ? String(pendingCount) : '—',
      label: overdueCount !== null && totalReviews !== null
        ? `${overdueCount} overdue · ${totalReviews} total`
        : '—',
      labelColor: '#D97706',
      icon: ClipboardList,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      title: 'Avg. assignment score',
      value: avgScore !== null ? avgScore.toFixed(1) : '—',
      label: avgScore !== null ? 'Across graded submissions' : 'No graded submissions yet',
      labelColor: '#059669',
      icon: Star,
      iconBg: '#D1FAE5',
      iconColor: '#059669',
    },
  ]

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="db-page">
        <div className="db-header">
          <div>
            <p className="db-greeting">{getGreeting()},</p>
            <h1 className="db-name">{firstName} 👋</h1>
          </div>
          <button className="db-add-btn" onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}>
            <Plus size={18} />
            Add new course
          </button>
        </div>

        {statsError && <p className="db-empty-note">{statsError}</p>}
        <div className="db-stats">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className="db-stat-card">
                <div className="db-stat-top">
                  <p className="db-stat-title">{stat.title}</p>
                  <div className="db-stat-icon" style={{ background: stat.iconBg }}>
                    <Icon size={16} color={stat.iconColor} />
                  </div>
                </div>
                <p className="db-stat-value">{loading ? '…' : stat.value}</p>
                <p className="db-stat-label" style={{ color: stat.labelColor }}>{loading ? '' : stat.label}</p>
              </div>
            )
          })}
        </div>

        
        <section className="db-sections">
          <div>
            <h3 className="db-section-title">Upcoming Live Session(s)</h3>
            {nextSession ? (
              <div className="db-live-card">
                <div>
                  <p className="db-live-badge">
                    <span className="db-live-dot" />
                    {sessionIsLive ? 'Live now' : formatSessionTime(nextSession.starts_at)}
                  </p>
                  <h2 className="db-live-title">{nextSession.title}</h2>
                  <p className="db-live-sub">{nextSession.course_title}</p>
                </div>
                <button className="db-live-btn" onClick={() => navigate(ROUTES.TRAINER_LIVE_CLASSES)}>
                  <Play size={15} fill="#1D4ED8" /> Begin Session
                </button>
              </div>
            ) : (
              <div className="db-live-card" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                <div>
                  <p className="db-live-sub" style={{ margin: 0, color: '#6B7280' }}>No upcoming sessions scheduled.</p>
                </div>
                <button className="db-live-btn" style={{ background: '#2492EB', color: '#fff' }} onClick={() => navigate(ROUTES.TRAINER_LIVE_CLASSES)}>
                  Schedule a session
                </button>
              </div>
            )}
          </div>

          <div className="db-reviews-card">
            <div className="db-reviews-header">
              <h3 className="db-section-title" style={{ margin: 0 }}>Pending reviews</h3>
              <button className="db-view-all" onClick={() => navigate(ROUTES.TRAINER_REVIEWS)}>View all</button>
            </div>
            <div className="db-review-list">
              {reviewsError && <p className="db-empty-note">{reviewsError}</p>}
              {!reviewsError && !loading && pendingReviews.length === 0 && (
                <p className="db-empty-note">No pending reviews right now.</p>
              )}
              {pendingReviews.map((review) => (
                <div key={review.id} className="db-review-row">
                  <div className="db-review-person">
                    <div className="db-review-avatar">{initials(review.learner_name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <p className="db-review-name">{review.learner_name}</p>
                      <p className="db-review-course">{review.assignment_title}</p>
                    </div>
                  </div>
                  <div className="db-review-meta">
                    <p className="db-review-time">{timeAgo(review.submitted_at)}</p>
                    <button className="db-review-btn" onClick={() => navigate(ROUTES.TRAINER_REVIEWS)}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="db-section-title">Active Course</h3>
            {!courseError && !loading && !activeCourse && (
              <div className="db-course-card" style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
                <p className="db-empty-note" style={{ padding: 0, marginBottom: '0.85rem' }}>
                  You haven't created any courses yet.
                </p>
                <button className="db-add-btn" style={{ margin: '0 auto' }} onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}>
                  <Plus size={16} />
                  Add your first course
                </button>
              </div>
            )}
            {activeCourse && (
              <div className="db-course-card">
                <div className="db-course-img-wrap">
                  <img
                    src={activeCourse.thumbnail_url || '/image1.png'}
                    alt={activeCourse.title}
                    className="db-course-img"
                  />
                 
                </div>
                <div className="db-course-body">
                  {/* TODO: TrainerCourseListItem has no `category` field — showing subtitle instead */}
                  <p className="db-course-cat">{activeCourse.subtitle || activeCourse.status}</p>
                  <h4 className="db-course-name">{activeCourse.title}</h4>
                  <p className="db-course-date">
                    {activeCourse.module_count} modules · {activeCourse.lesson_count} lessons
                  </p>
                </div>
                <button
  className="db-course-preview-btn"
  onClick={() => navigate(RouteBuilder.trainerCourseEdit(activeCourse.id))}
>
  Manage
</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </TrainerShell>
  )
}