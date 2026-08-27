import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, ClipboardList, CheckCircle2, CalendarCheck, CalendarClock,
  Video, ChevronRight, RefreshCw, Radio,
} from 'lucide-react'
import { RouteBuilder } from '../../../constants/routes'
import { liveSessionsAPI } from '../../../services/api'
import type {
  LiveSlotBooking,
  LiveBookingStatus,
  LearnerLiveSession,
  EnrolledCourseOption,
} from '../../../services/api'
import AppShell, { SHELL_CSS } from '../../../components/layout/AppShell'
import BookSessionModal from './BookSessionModal'


interface EnrichedBooking extends LiveSlotBooking {
  session?: LearnerLiveSession
  courseInfo?: EnrolledCourseOption
}

const MATCH_TOLERANCE_MS = 5 * 60 * 1000

function matchSession(booking: LiveSlotBooking, sessions: LearnerLiveSession[]): LearnerLiveSession | undefined {
  const bookingStart = new Date(booking.slot_starts_at).getTime()
  const exactMatches = sessions.filter((s) => s.course_id === booking.course_id)
  const candidates = exactMatches.length > 0 ? exactMatches : sessions

  let best: LearnerLiveSession | undefined
  let bestDiff = Infinity
  for (const s of candidates) {
    if (!s.starts_at) continue
    const diff = Math.abs(new Date(s.starts_at).getTime() - bookingStart)
    if (diff <= MATCH_TOLERANCE_MS && diff < bestDiff) {
      best = s
      bestDiff = diff
    }
  }
  return best
}

function buildCourseMap(courses: EnrolledCourseOption[]): Map<string, EnrolledCourseOption> {
  const map = new Map<string, EnrolledCourseOption>()
  for (const c of courses) map.set(c.course_id, c)
  return map
}

type TabKey = 'upcoming' | 'history'

// ─── Helpers ──────────────────────────────────────────────────────────────
function isPast(iso: string): boolean {
  return new Date(iso).getTime() < Date.now()
}

function formatDuration(startsAt: string, endsAt: string): string {
  const mins = Math.max(0, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000))
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatDateHeading(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  }).toUpperCase()
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function initials(name?: string): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name.slice(0, 2).toUpperCase()
}

function avatarColor(seed: string): string {
  const palette = ['#7C3AED', '#0D9488', '#EA580C', '#DB2777', '#2492EB', '#65A30D']
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]
}

// Backend enum has no "completed" — we derive it client-side for a
// confirmed booking whose slot has already ended.
type DisplayStatus = LiveBookingStatus | 'completed'

function displayStatus(b: EnrichedBooking): DisplayStatus {
  if (b.status === 'confirmed' && isPast(b.slot_ends_at)) return 'completed'
  return b.status
}

function canJoinNow(b: EnrichedBooking): boolean {
  return b.status === 'confirmed' && b.session?.status === 'live' && !!b.session.join_url
}

const STATUS_LABEL: Record<DisplayStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
}

const STATUS_CLASS: Record<DisplayStatus, string> = {
  requested: 'pill amber',
  confirmed: 'pill green',
  completed: 'pill neutral',
  rejected: 'pill red',
  cancelled: 'pill red',
}

function groupByDate(bookings: EnrichedBooking[]): [string, EnrichedBooking[]][] {
  const map = new Map<string, EnrichedBooking[]>()
  for (const b of bookings) {
    const key = formatDateHeading(b.slot_starts_at)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(b)
  }
  return Array.from(map.entries())
}

// ─── CSS ────────────────────────────────────────────────────────────────────
const BOOKINGS_CSS = `
  .content { padding: 2rem clamp(1rem, 4vw, 2.5rem) 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; box-sizing: border-box; }
  .bk-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .bk-title { font-size: 1.75rem; font-weight: 700; color: #111; }
  .bk-subtitle { font-size: 0.9375rem; color: #6B7280; margin-top: 0.25rem; }
  .bk-cta {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none;
    border-radius: 0.625rem; padding: 0.7rem 1.25rem; font-size: 0.875rem; font-weight: 700; cursor: pointer;
    white-space: nowrap; flex-shrink: 0;
  }
  .bk-cta:hover { opacity: 0.9; }

  .bk-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .bk-stat { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 0.875rem; min-width: 0; }
  .bk-stat-icon { width: 2.5rem; height: 2.5rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bk-stat-value { font-size: 1.375rem; font-weight: 700; color: #111; line-height: 1.1; }
  .bk-stat-label { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .bk-tabs-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .bk-tabs { display: inline-flex; background: #F3F4F6; border-radius: 0.625rem; padding: 0.25rem; max-width: 100%; overflow-x: auto; }
  .bk-tab {
    border: none; background: transparent; padding: 0.55rem 1.25rem; border-radius: 0.5rem;
    font-size: 0.875rem; font-weight: 700; color: #6B7280; cursor: pointer; white-space: nowrap;
  }
  .bk-tab.active { background: #2492EB; color: #fff; }
  .bk-refresh {
    width: 2.25rem; height: 2.25rem; border-radius: 50%; border: 1px solid #E5E7EB; background: #fff;
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; flex-shrink: 0;
  }
  .bk-refresh:hover { background: #F9FAFB; }
  .bk-refresh.spinning svg { animation: bk-spin 0.7s linear infinite; }
  @keyframes bk-spin { to { transform: rotate(360deg); } }

  .bk-day-label { font-size: 0.75rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.04em; margin: 0.25rem 0 0.5rem; }
  .bk-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .bk-row {
    background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem 1.25rem;
    display: flex; align-items: center; gap: 1rem; cursor: pointer; flex-wrap: wrap;
  }
  .bk-row:hover { border-color: #D1D5DB; }
  .bk-avatar {
    width: 2.75rem; height: 2.75rem; border-radius: 50%; flex-shrink: 0; color: #fff; font-weight: 700;
    font-size: 0.9375rem; display: flex; align-items: center; justify-content: center;
  }
  .bk-row-main { flex: 1 1 160px; min-width: 0; }
  .bk-row-title { font-size: 0.9375rem; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bk-row-sub { font-size: 0.8125rem; color: #6B7280; margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bk-row-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
  .bk-row-time { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: #374151; font-weight: 600; white-space: nowrap; }
  .pill { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 2rem; white-space: nowrap; }
  .pill.amber { background: #FFFBEB; color: #B45309; }
  .pill.green { background: #ECFDF3; color: #16A34A; }
  .pill.red { background: #FEF2F2; color: #DC2626; }
  .pill.neutral { background: #F3F4F6; color: #6B7280; }
  .pill.live { background: #FEF2F2; color: #DC2626; display: inline-flex; align-items: center; gap: 0.3rem; }
  .pill-dot { width: 6px; height: 6px; border-radius: 50%; background: #DC2626; animation: bk-pulse 1.4s ease infinite; }
  @keyframes bk-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
  .bk-join-btn {
    display: flex; align-items: center; gap: 0.375rem; background: #DC2626; color: #fff; border: none;
    border-radius: 0.5rem; padding: 0.45rem 0.9rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap;
  }
  .bk-join-btn:hover { opacity: 0.9; }
  .bk-chevron { color: #C0C5CC; flex-shrink: 0; }

  .bk-empty { background: #fff; border: 1px dashed #E5E7EB; border-radius: 0.875rem; padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; text-align: center; }
  .bk-empty-title { font-size: 1rem; font-weight: 700; color: #374151; }
  .bk-empty-sub { font-size: 0.875rem; color: #9CA3AF; max-width: 340px; line-height: 1.5; }
  .bk-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.875rem 1rem; font-size: 0.875rem; }
  .bk-loading { display: flex; flex-direction: column; gap: 0.75rem; }
  .bk-skeleton { height: 74px; border-radius: 0.875rem; background: linear-gradient(90deg, #F3F4F6 25%, #ECECEC 37%, #F3F4F6 63%); background-size: 400% 100%; animation: bk-shimmer 1.4s ease infinite; }
  @keyframes bk-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  @media (max-width: 900px) {
    .bk-stats { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .content { padding: 1.5rem 1rem 2rem; gap: 1.25rem; }
    .bk-title { font-size: 1.375rem; }
    .bk-header { flex-direction: column; align-items: stretch; }
    .bk-cta { width: 100%; }
    .bk-stats { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .bk-stat { padding: 0.9rem 1rem; gap: 0.625rem; }
    .bk-stat-value { font-size: 1.125rem; }
    .bk-stat-label { font-size: 0.75rem; }
    .bk-tabs-row { flex-wrap: nowrap; }
    .bk-tab { padding: 0.5rem 0.875rem; font-size: 0.8125rem; }
    .bk-row { padding: 0.875rem; gap: 0.75rem; }
    .bk-row-meta { align-items: flex-start; flex: 1 1 100%; flex-direction: row; justify-content: space-between; order: 3; }
    .bk-join-btn, .bk-chevron { order: 2; }
  }
  @media (max-width: 400px) {
    .bk-stats { grid-template-columns: repeat(2, 1fr); }
    .bk-stat-icon { width: 2.1rem; height: 2.1rem; }
  }
`

// ─── Component ──────────────────────────────────────────────────────────────
export default function LiveBookingsPage() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('bookings')
  const [tab, setTab] = useState<TabKey>('upcoming')
  const [bookings, setBookings] = useState<EnrichedBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    const [bookingsRes, sessionsRes, coursesRes] = await Promise.all([
      liveSessionsAPI.getMyBookings(),
      liveSessionsAPI.getDiscoverSessions(),
      liveSessionsAPI.getEnrolledCoursesForBooking(),
    ])
    if (!bookingsRes.success) {
      setError(bookingsRes.error)
      isRefresh ? setRefreshing(false) : setLoading(false)
      return
    }
    // Session discovery and course lookup failing shouldn't block the bookings list — it just
    // means titles/trainer names fall back further down the chain.
    const sessions = sessionsRes.success ? sessionsRes.data : []
    const courseMap = coursesRes.success ? buildCourseMap(coursesRes.data) : new Map()
    const enriched: EnrichedBooking[] = bookingsRes.data.map((b: LiveSlotBooking) => ({
      ...b,
      session: matchSession(b, sessions),
      courseInfo: courseMap.get(b.course_id),
    }))
    setBookings(enriched)
    isRefresh ? setRefreshing(false) : setLoading(false)
  }, [])

  async function handleJoin(e: React.MouseEvent, b: EnrichedBooking) {
    e.stopPropagation()
    if (!b.session?.join_url) {
      setError('Unable to join this session.')
      return
    }
    window.open(b.session.join_url, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => { load() }, [load])

  const upcoming = useMemo(
    () => bookings
      .filter((b) => (b.status === 'requested' || b.status === 'confirmed') && !isPast(b.slot_ends_at))
      .sort((a, b) => new Date(a.slot_starts_at).getTime() - new Date(b.slot_starts_at).getTime()),
    [bookings],
  )
  const history = useMemo(
    () => bookings
      .filter((b) => b.status === 'rejected' || b.status === 'cancelled' || isPast(b.slot_ends_at))
      .sort((a, b) => new Date(b.slot_starts_at).getTime() - new Date(a.slot_starts_at).getTime()),
    [bookings],
  )

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed' && !isPast(b.slot_ends_at)).length,
    awaiting: bookings.filter((b) => b.status === 'requested').length,
    held: bookings.filter((b) => b.status === 'confirmed' && isPast(b.slot_ends_at)).length,
  }

  const shown = tab === 'upcoming' ? upcoming : history
  const grouped = groupByDate(shown)

  function goToBooking(b: EnrichedBooking) {
    // Adjust to wherever a single booking's detail should live.
    navigate(RouteBuilder.course(b.course_id), { state: { bookingId: b.id } })
  }

  return (
    <>
      <style>{SHELL_CSS + BOOKINGS_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="content">
          <div className="bk-header">
            <div>
              <h1 className="bk-title">Bookings</h1>
              <p className="bk-subtitle">Your 1-on-1 sessions with trainers</p>
            </div>
            <button className="bk-cta" onClick={() => setModalOpen(true)}>
              <CalendarClock size={16} /> Book a session
            </button>
          </div>

          <div className="bk-stats">
            <div className="bk-stat">
              <div className="bk-stat-icon" style={{ background: '#EFF6FF' }}><ClipboardList size={18} color="#2492EB" /></div>
              <div><div className="bk-stat-value">{stats.total}</div><div className="bk-stat-label">Total bookings</div></div>
            </div>
            <div className="bk-stat">
              <div className="bk-stat-icon" style={{ background: '#ECFDF3' }}><CheckCircle2 size={18} color="#16A34A" /></div>
              <div><div className="bk-stat-value">{stats.confirmed}</div><div className="bk-stat-label">Confirmed</div></div>
            </div>
            <div className="bk-stat">
              <div className="bk-stat-icon" style={{ background: '#FFFBEB' }}><Clock size={18} color="#B45309" /></div>
              <div><div className="bk-stat-value">{stats.awaiting}</div><div className="bk-stat-label">Awaiting review</div></div>
            </div>
            <div className="bk-stat">
              <div className="bk-stat-icon" style={{ background: '#F3F4F6' }}><CalendarCheck size={18} color="#6B7280" /></div>
              <div><div className="bk-stat-value">{stats.held}</div><div className="bk-stat-label">Sessions held</div></div>
            </div>
          </div>

          <div className="bk-tabs-row">
            <div className="bk-tabs">
              <button className={`bk-tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>
                Upcoming ({upcoming.length})
              </button>
              <button className={`bk-tab${tab === 'history' ? ' active' : ''}`} onClick={() => setTab('history')}>
                History ({history.length})
              </button>
            </div>
            <button
              className={`bk-refresh${refreshing ? ' spinning' : ''}`}
              onClick={() => load(true)}
              disabled={refreshing}
              aria-label="Refresh bookings"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {error && <div className="bk-error">{error}</div>}

          {loading ? (
            <div className="bk-loading">
              {[0, 1, 2].map((i) => <div key={i} className="bk-skeleton" />)}
            </div>
          ) : shown.length === 0 ? (
            <div className="bk-empty">
              <Video size={28} color="#D1D5DB" />
              <span className="bk-empty-title">
                {tab === 'upcoming' ? 'No upcoming sessions' : 'No past sessions yet'}
              </span>
              <span className="bk-empty-sub">
                {tab === 'upcoming'
                  ? 'Book a 1-on-1 with a trainer to get started.'
                  : 'Completed and cancelled sessions will show up here.'}
              </span>
            </div>
          ) : (
            <div>
              {grouped.map(([dateLabel, rows]) => (
                <div key={dateLabel}>
                  <div className="bk-day-label">{dateLabel}</div>
                  <div className="bk-list" style={{ marginBottom: '1rem' }}>
                    {rows.map((b) => {
                      const status = displayStatus(b)
                      const name = b.session?.trainer_name ?? b.courseInfo?.trainer_name ?? b.trainer_name ?? 'Your trainer'
                      const title =
                        b.session?.title ||
                        b.session?.topic ||
                        b.courseInfo?.title ||
                        b.course_title ||
                        `Session with ${name}`
                      const live = canJoinNow(b)
                      return (
                        <div key={b.id} className="bk-row" onClick={() => goToBooking(b)}>
                          <div className="bk-avatar" style={{ background: avatarColor(b.course_id) }}>
                            {initials(name)}
                          </div>
                          <div className="bk-row-main">
                            <div className="bk-row-title">{title}</div>
                            <div className="bk-row-sub">{name}</div>
                          </div>
                          <div className="bk-row-meta">
                            <div className="bk-row-time">
                              <Clock size={13} />
                              {formatTime(b.slot_starts_at)} · {formatDuration(b.slot_starts_at, b.slot_ends_at)}
                            </div>
                            {live ? (
                              <span className="pill live"><span className="pill-dot" />LIVE NOW</span>
                            ) : (
                              <span className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</span>
                            )}
                          </div>
                          {live ? (
                            <button className="bk-join-btn" onClick={(e) => handleJoin(e, b)}>
                              <Radio size={13} /> Join
                            </button>
                          ) : (
                            <ChevronRight size={16} className="bk-chevron" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>

      {modalOpen && (
        <BookSessionModal
          onClose={() => setModalOpen(false)}
          onBooked={() => { setModalOpen(false); load(true) }}
        />
      )}
    </>
  )
}