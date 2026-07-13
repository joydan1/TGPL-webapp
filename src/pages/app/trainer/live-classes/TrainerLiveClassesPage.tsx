// pages/trainer/live-classes/TrainerLiveClassesPage.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Video,
  Users,
  Star,
  Plus,
  Radio,
  Calendar,
  Clock,
  MoreVertical,
  X,
  ArrowRight,
  PlayCircle,
  Eye,
  Loader2,
} from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import { useAuth } from '../../../../hooks/useAuth'
import { liveSessionsAPI } from '../../../../services/api'
import type { LiveManageBooking, LiveSession } from '../../../../services/api'

/* ────────────────────────────────────────────────────────────────────────
 * Data shape note:
 * There's no single "list my published sessions" endpoint, so this page
 * derives its session list from GET /v1/live/manage/bookings/ (each booking
 * carries its .session). Bookings are grouped by session.id so one session
 * with several learners renders as ONE card, matching the mockup.
 *
 * "Go Live" / "Start Now" open a confirm modal that hands off to the
 * session's Google Meet link (session.meeting_link). "View Recording" on a
 * past session opens session.recording_url. Both field names are
 * best-guesses — confirm against a real payload and adjust if needed.
 * ------------------------------------------------------------------------ */

type SessionCard = {
  session: LiveSession
  confirmedCount: number
  bookingsCount: number
}

function groupBySession(bookings: LiveManageBooking[]): SessionCard[] {
  const map = new Map<string, SessionCard>()
  for (const b of bookings) {
    if (!b.session) continue
    const existing = map.get(b.session.id)
    if (existing) {
      existing.bookingsCount += 1
      if (b.status === 'confirmed') existing.confirmedCount += 1
    } else {
      map.set(b.session.id, {
        session: b.session,
        bookingsCount: 1,
        confirmedCount: b.status === 'confirmed' ? 1 : 0,
      })
    }
  }
  return Array.from(map.values())
}

function sessionDateTime(session: LiveSession): Date {
  return new Date(`${session.date}T${session.start_time}`)
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (sameDay(date, today)) return 'Today'
  if (sameDay(date, tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

const PAGE_CSS = `
  .lc-page { padding: 1rem; background: #F5F5F5; }

  .lc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .lc-title { margin: 0; font-size: 1.5rem; font-weight: 800; color: #111827; }
  .lc-subtitle { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .lc-header-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
  .lc-btn-outline { display: flex; align-items: center; gap: 0.4rem; border: 1px solid #2563EB; background: #fff; color: #2563EB; font-weight: 700; border-radius: 999px; padding: 0.65rem 1.1rem; cursor: pointer; font-size: 0.875rem; }
  .lc-btn-primary { display: flex; align-items: center; gap: 0.4rem; border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.65rem 1.1rem; cursor: pointer; font-size: 0.875rem; }
  .lc-btn-primary:disabled, .lc-btn-outline:disabled { opacity: 0.6; cursor: not-allowed; }

  .lc-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; margin-top: 1.25rem; }
  .lc-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .lc-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .lc-stat-title { margin: 0; color: #6B7280; font-size: 0.8rem; }
  .lc-stat-value { margin: 0.5rem 0 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .lc-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lc-stat-sub { margin: 0.4rem 0 0; font-size: 0.78rem; color: #9CA3AF; }

  .lc-tabs { display: flex; gap: 1.5rem; margin-top: 1.5rem; border-bottom: 1px solid #E5E7EB; }
  .lc-tab { border: none; background: none; padding: 0 0 0.85rem; font-weight: 700; font-size: 0.95rem; color: #9CA3AF; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
  .lc-tab.active { color: #111827; border-bottom-color: #2563EB; }

  .lc-list { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1.25rem; }
  @media (min-width: 900px) { .lc-list.upcoming { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

  .lc-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); padding: 1.1rem; display: flex; align-items: center; gap: 0.85rem; }
  .lc-card-icon { width: 42px; height: 42px; border-radius: 0.7rem; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lc-card-icon.recording { background: #F3F4F6; color: #374151; cursor: pointer; border: none; }
  .lc-card-body { flex: 1; min-width: 0; }
  .lc-card-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .lc-card-sub { margin: 0.2rem 0 0; color: #2563EB; font-weight: 600; font-size: 0.85rem; }
  .lc-card-meta { display: flex; align-items: center; gap: 0.9rem; margin-top: 0.5rem; color: #9CA3AF; font-size: 0.8rem; flex-wrap: wrap; }
  .lc-card-meta span { display: flex; align-items: center; gap: 0.3rem; }
  .lc-card-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
  .lc-start-btn { border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.6rem 1.1rem; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
  .lc-recording-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; font-weight: 700; border-radius: 999px; padding: 0.55rem 1rem; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
  .lc-icon-btn { border: none; background: #F3F4F6; color: #374151; border-radius: 999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }

  .lc-empty { background: #fff; border-radius: 1rem; padding: 2.5rem 1.5rem; text-align: center; color: #9CA3AF; border: 1px dashed #E5E7EB; margin-top: 1rem; }
  .lc-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.85rem; padding: 0.9rem 1.1rem; margin-top: 1rem; font-size: 0.875rem; }
  .lc-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 2.5rem; color: #6B7280; }
  .lc-spin { animation: lc-spin 0.8s linear infinite; }
  @keyframes lc-spin { to { transform: rotate(360deg); } }

  @media (min-width: 640px) {
    .lc-page { padding: 1.5rem; }
    .lc-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  }
  @media (min-width: 1024px) {
    .lc-page { padding: 1.5rem 2rem 2rem; }
  }

  /* ── Modals ── */
  .lc-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 500; }
  .lc-modal { background: #fff; border-radius: 1.25rem; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; position: relative; padding: 1.5rem; text-align: center; }
  .lc-modal.left { text-align: left; }
  .lc-modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; color: #6B7280; }
  .lc-modal-title { margin: 0 0 1.5rem; font-size: 1.15rem; font-weight: 800; color: #111827; text-align: left; }
  .lc-meet-badge { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700; font-size: 1.05rem; color: #111827; margin: 1rem 0; }
  .lc-meet-copy { color: #4B5563; font-size: 0.95rem; line-height: 1.5; margin: 0 0 2rem; }
  .lc-meet-btn { width: 100%; border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.95rem; text-decoration: none; }

  .lc-field { margin-bottom: 1rem; text-align: left; }
  .lc-field label { display: block; font-weight: 700; color: #111827; font-size: 0.85rem; margin-bottom: 0.4rem; }
  .lc-field input { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.7rem 0.85rem; font-size: 0.9rem; font-family: inherit; }
  .lc-field-row { display: flex; gap: 0.75rem; }
  .lc-field-row .lc-field { flex: 1; }
  .lc-modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
`

export default function TrainerLiveClassesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')
  const [bookings, setBookings] = useState<LiveManageBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [goLiveTarget, setGoLiveTarget] = useState<LiveSession | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  // TODO: swap for a real course dropdown once a "my courses" list endpoint is wired in
  const [courseSlug, setCourseSlug] = useState('')
  const [form, setForm] = useState({ date: '', startTime: '', duration: 60, title: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await liveSessionsAPI.getManageBookings()
    if (result.success) {
      setBookings(result.data)
    } else {
      setError(result.error || 'Failed to load live sessions.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  const now = useMemo(() => new Date(), [])
  const allSessions = useMemo(() => groupBySession(bookings), [bookings])

  const upcoming = useMemo(
    () =>
      allSessions
        .filter((s) => s.session.status !== 'cancelled' && sessionDateTime(s.session) >= now)
        .sort((a, b) => sessionDateTime(a.session).getTime() - sessionDateTime(b.session).getTime()),
    [allSessions, now],
  )

  const past = useMemo(
    () =>
      allSessions
        .filter((s) => sessionDateTime(s.session) < now)
        .sort((a, b) => sessionDateTime(b.session).getTime() - sessionDateTime(a.session).getTime()),
    [allSessions, now],
  )

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed')
    const uniqueLearners = new Set(confirmed.map((b) => b.learner.id))
    const uniqueSessions = new Set(bookings.map((b) => b.session?.id).filter(Boolean))
    const avgAttendance = uniqueSessions.size ? Math.round(confirmed.length / uniqueSessions.size) : 0
    return {
      totalSessions: uniqueSessions.size,
      studentsReached: uniqueLearners.size,
      avgAttendance,
    }
  }, [bookings])

  async function handleCreateSlot() {
    if (!courseSlug || !form.date || !form.startTime) {
      setSubmitError('Course, date and start time are required.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)

    const start = new Date(`${form.date}T${form.startTime}`)
    const end = new Date(start.getTime() + form.duration * 60000)
    const endTime = end.toTimeString().slice(0, 5)

    const slotResult = await liveSessionsAPI.createManageCourseSlot(courseSlug, {
      date: form.date,
      start_time: form.startTime,
      end_time: endTime,
    })
    if (!slotResult.success) {
      setSubmitError(slotResult.error || 'Failed to schedule session.')
      setSubmitting(false)
      return
    }

    if (form.title.trim()) {
      const sessionResult = await liveSessionsAPI.publishSession(courseSlug, {
        title: form.title.trim(),
        date: form.date,
        start_time: form.startTime,
        end_time: endTime,
      })
      if (!sessionResult.success) {
        setSubmitError(sessionResult.error || 'Slot created, but publishing the session failed.')
        setSubmitting(false)
        return
      }
    }

    setShowSchedule(false)
    setForm({ date: '', startTime: '', duration: 60, title: '' })
    setSubmitting(false)
    await loadBookings()
  }

  if (!user) return null

  const list = activeTab === 'upcoming' ? upcoming : past

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="lc-page">
        <div className="lc-header">
          <div>
            <h1 className="lc-title">Live Classes</h1>
            <p className="lc-subtitle">Teach your students in real time</p>
          </div>
          <div className="lc-header-actions">
            <button className="lc-btn-outline" onClick={() => setShowSchedule(true)}>
              <Plus size={16} /> Schedule Session
            </button>
            <button
              className="lc-btn-primary"
              onClick={() => setGoLiveTarget(upcoming[0]?.session ?? null)}
              disabled={upcoming.length === 0}
            >
              <Radio size={16} /> Go Live
            </button>
          </div>
        </div>

        <div className="lc-stats">
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Total Sessions</p>
              <div className="lc-stat-icon" style={{ background: '#DBEAFE' }}>
                <Video size={16} color="#2563EB" />
              </div>
            </div>
            <p className="lc-stat-value">{stats.totalSessions}</p>
            <p className="lc-stat-sub">All time</p>
          </div>
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Total Students Reached</p>
              <div className="lc-stat-icon" style={{ background: '#FEF3C7' }}>
                <Users size={16} color="#D97706" />
              </div>
            </div>
            <p className="lc-stat-value">{stats.studentsReached}</p>
            <p className="lc-stat-sub">Across all sessions</p>
          </div>
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Avg. Attendance</p>
              <div className="lc-stat-icon" style={{ background: '#D1FAE5' }}>
                <Star size={16} color="#059669" />
              </div>
            </div>
            <p className="lc-stat-value">{stats.avgAttendance}</p>
            <p className="lc-stat-sub">Per session</p>
          </div>
        </div>

        <div className="lc-tabs">
          <button className={`lc-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
            Upcoming
          </button>
          <button className={`lc-tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
            Past Sessions
          </button>
        </div>

        {error && <div className="lc-error">{error}</div>}

        {loading ? (
          <div className="lc-loading">
            <Loader2 className="lc-spin" size={18} /> Loading live sessions…
          </div>
        ) : list.length === 0 ? (
          <div className="lc-empty">{activeTab === 'upcoming' ? 'No upcoming sessions yet.' : 'No past sessions yet.'}</div>
        ) : (
          <div className={`lc-list ${activeTab}`}>
            {list.map(({ session }) => {
              const start = sessionDateTime(session)
              return (
                <div className="lc-card" key={session.id}>
                  {activeTab === 'upcoming' ? (
                    <div className="lc-card-icon">
                      <Video size={18} />
                    </div>
                  ) : (
                    <button
                      className="lc-card-icon recording"
                      onClick={() => session.recording_url && window.open(session.recording_url, '_blank')}
                      aria-label="Play recording"
                    >
                      <PlayCircle size={20} />
                    </button>
                  )}
                  <div className="lc-card-body">
                    <p className="lc-card-title">{session.title}</p>
                    <p className="lc-card-sub">{session.course.title}</p>
                    <div className="lc-card-meta">
                      <span>
                        <Calendar size={13} /> {formatDateLabel(start)}
                      </span>
                      <span>
                        <Clock size={13} /> {formatTimeLabel(start)}
                        {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
                      </span>
                      {activeTab === 'past' && (
                        <span>
                          <Eye size={13} /> {session.recording_views ?? 0} views
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lc-card-actions">
                    {activeTab === 'upcoming' ? (
                      <>
                        <button className="lc-start-btn" onClick={() => setGoLiveTarget(session)}>
                          <Radio size={14} /> Start Now
                        </button>
                        <button className="lc-icon-btn" aria-label="More options">
                          <MoreVertical size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="lc-recording-btn"
                          onClick={() => session.recording_url && window.open(session.recording_url, '_blank')}
                        >
                          <PlayCircle size={14} /> View Recording
                        </button>
                        <button className="lc-icon-btn" aria-label="More options">
                          <MoreVertical size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {goLiveTarget && (
        <div className="lc-modal-overlay" onClick={() => setGoLiveTarget(null)}>
          <div className="lc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lc-modal-close" onClick={() => setGoLiveTarget(null)} aria-label="Close">
              <X size={18} />
            </button>
            <h3 className="lc-modal-title">Start a Live Class</h3>
            <div className="lc-meet-badge">
              <Video size={20} color="#4285F4" /> Google Meet
            </div>
            <p className="lc-meet-copy">This process will direct you to Google Meet where you can begin the live class session.</p>
            <a
              className="lc-meet-btn"
              href={goLiveTarget.meeting_link || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                if (!goLiveTarget.meeting_link) e.preventDefault()
                setGoLiveTarget(null)
              }}
            >
              Continue to Google Meet <ArrowRight size={16} />
            </a>
          </div>
        </div>
      )}

      {showSchedule && (
        <div className="lc-modal-overlay" onClick={() => setShowSchedule(false)}>
          <div className="lc-modal left" onClick={(e) => e.stopPropagation()}>
            <button className="lc-modal-close" onClick={() => setShowSchedule(false)} aria-label="Close">
              <X size={16} />
            </button>
            <h3 className="lc-modal-title">Schedule a live session</h3>

            <div className="lc-field">
              {/* TODO: replace with a real course dropdown once "my courses" data is available */}
              <label>Course slug</label>
              <input
                type="text"
                placeholder="e.g. project-management-pro"
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
              />
            </div>

            <div className="lc-field">
              <label>Session title</label>
              <input
                type="text"
                placeholder="e.g. Advanced Agile Methodologies"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="lc-field-row">
              <div className="lc-field">
                <label>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="lc-field">
                <label>Start time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="lc-field">
              <label>Duration (minutes)</label>
              <input
                type="number"
                min={15}
                step={15}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
              />
            </div>

            {submitError && <div className="lc-error">{submitError}</div>}

            <div className="lc-modal-actions">
              <button className="lc-btn-outline" onClick={() => setShowSchedule(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="lc-btn-primary" onClick={handleCreateSlot} disabled={submitting}>
                {submitting ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TrainerShell>
  )
}