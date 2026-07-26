// pages/trainer/live-classes/TrainerLiveClassesPage.tsx
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  Video, Users, Star, Plus, Radio, Calendar, Clock, MoreVertical, X,
  ArrowRight, PlayCircle, Eye, Loader2, Link as LinkIcon, Ban, CheckCircle2, Square,
} from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import { useAuth } from '../../../../hooks/useAuth'
import { liveSessionsAPI, trainerSessionsAPI, coursesManageAPI } from '../../../../services/api'
import type { LiveManageBooking, TrainerSession, TrainerCourseListItem } from '../../../../services/api'

type SessionWithExtras = TrainerSession & {
  recording_url?: string | null
  recording_views?: number
}

type SessionCard = {
  session: SessionWithExtras
  confirmedCount: number
  bookingsCount: number
}

function buildBookingCounts(bookings: LiveManageBooking[]): Map<string, { confirmed: number; total: number }> {
  const map = new Map<string, { confirmed: number; total: number }>()
  for (const b of bookings) {
    if (!b.session) continue
    const existing = map.get(b.session.id)
    if (existing) {
      existing.total += 1
      if (b.status === 'confirmed') existing.confirmed += 1
    } else {
      map.set(b.session.id, { total: 1, confirmed: b.status === 'confirmed' ? 1 : 0 })
    }
  }
  return map
}

function sessionDateTime(session: TrainerSession): Date {
  return new Date(session.starts_at)
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

function isLikelyUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim())
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
  .lc-card.is-live { border-color: rgba(220, 38, 38, 0.35); box-shadow: 0 16px 46px rgba(220, 38, 38, 0.08); }
  .lc-card-icon { width: 42px; height: 42px; border-radius: 0.7rem; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lc-card-icon.is-live { background: #FEE2E2; color: #DC2626; }
  .lc-card-icon.recording { background: #F3F4F6; color: #374151; cursor: pointer; border: none; }
  .lc-card-body { flex: 1; min-width: 0; }
  .lc-card-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  .lc-card-sub { margin: 0.2rem 0 0; color: #2563EB; font-weight: 600; font-size: 0.85rem; }
  .lc-card-meta { display: flex; align-items: center; gap: 0.9rem; margin-top: 0.5rem; color: #9CA3AF; font-size: 0.8rem; flex-wrap: wrap; }
  .lc-card-meta span { display: flex; align-items: center; gap: 0.3rem; }
  .lc-card-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
  .lc-start-btn { border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.6rem 1.1rem; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
  .lc-end-btn { border: none; background: #DC2626; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.6rem 1.1rem; cursor: pointer; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
  .lc-end-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lc-recording-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; font-weight: 700; border-radius: 999px; padding: 0.55rem 1rem; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
  .lc-icon-btn { border: none; background: #F3F4F6; color: #374151; border-radius: 999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .lc-icon-btn-wrap { position: relative; }

  .lc-menu { position: absolute; top: calc(100% + 6px); right: 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12); min-width: 170px; z-index: 50; overflow: hidden; }
  .lc-menu-item { display: flex; align-items: center; gap: 0.5rem; width: 100%; text-align: left; border: none; background: none; padding: 0.65rem 0.9rem; font-size: 0.85rem; font-weight: 600; color: #111827; cursor: pointer; }
  .lc-menu-item:hover { background: #F9FAFB; }
  .lc-menu-item.danger { color: #DC2626; }

  .lc-badge { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 700; border-radius: 999px; padding: 0.15rem 0.55rem; text-transform: uppercase; letter-spacing: 0.02em; }
  .lc-badge.ended { background: #F3F4F6; color: #374151; }
  .lc-badge.cancelled { background: #FEE2E2; color: #B91C1C; }
  .lc-badge.live { background: #DC2626; color: #fff; }
  .lc-badge.live .lc-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; animation: lc-pulse 1.4s ease-in-out infinite; }
  @keyframes lc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }

  .lc-confirm-copy { color: #4B5563; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1.5rem; text-align: left; }
  .lc-btn-danger { border: none; background: #DC2626; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.65rem 1.1rem; cursor: pointer; font-size: 0.875rem; }
  .lc-btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

  .lc-empty { background: #fff; border-radius: 1rem; padding: 2.5rem 1.5rem; text-align: center; color: #9CA3AF; border: 1px dashed #E5E7EB; margin-top: 1rem; }
  .lc-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.85rem; padding: 0.9rem 1.1rem; margin-top: 1rem; font-size: 0.875rem; }
  .lc-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 2.5rem; color: #6B7280; }
  .lc-spin { animation: lc-spin 0.8s linear infinite; }
  @keyframes lc-spin { to { transform: rotate(360deg); } }

  @media (min-width: 640px) {
    .lc-page { padding: 1.5rem; }
    .lc-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  }
  @media (min-width: 1024px) { .lc-page { padding: 1.5rem 2rem 2rem; } }

  .lc-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 500; }
  .lc-modal { background: #fff; border-radius: 1.25rem; width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto; position: relative; padding: 1.5rem; text-align: center; }
  .lc-modal.left { text-align: left; }
  .lc-modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; color: #6B7280; }
  .lc-modal-title { margin: 0 0 1.5rem; font-size: 1.15rem; font-weight: 800; color: #111827; text-align: left; }
  .lc-meet-badge { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 700; font-size: 1.05rem; color: #111827; margin: 1rem 0; }
  .lc-meet-copy { color: #4B5563; font-size: 0.95rem; line-height: 1.5; margin: 0 0 1rem; }
  .lc-meet-btn { width: 100%; border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.95rem; text-decoration: none; }
  .lc-meet-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lc-meet-link-row { display: flex; justify-content: center; margin: 1rem 0 1.5rem; }
  .lc-meet-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #2563EB; font-weight: 700; font-size: 1rem; text-decoration: underline; background: none; border: none; cursor: pointer; }
  .lc-meet-input { width: 100%; box-sizing: border-box; border: 1px solid #BFDBFE; border-radius: 0.85rem; padding: 0.9rem 1rem; font-size: 0.95rem; font-family: inherit; text-align: center; color: #111827; margin-bottom: 1.25rem; background: #F9FAFB; }
  .lc-meet-input::placeholder { color: #9CA3AF; font-style: italic; }
  .lc-meet-input.invalid { border-color: #FCA5A5; }
  .lc-meet-input:disabled { opacity: 0.6; }
  .lc-success-icon { width: 72px; height: 72px; border-radius: 50%; background: #22C55E; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 0 0 12px rgba(34,197,94,0.12); }
  .lc-success-title { font-size: 1.1rem; font-weight: 800; color: #111827; margin-bottom: 0.4rem; }
  .lc-success-sub { font-size: 0.9rem; color: #6B7280; margin-bottom: 1.5rem; }

  .lc-field { margin-bottom: 1rem; text-align: left; }
  .lc-field label { display: block; font-weight: 700; color: #111827; font-size: 0.85rem; margin-bottom: 0.4rem; }
  .lc-field input, .lc-field select { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.7rem 0.85rem; font-size: 0.9rem; font-family: inherit; background: #fff; }
  .lc-field input.invalid { border-color: #FCA5A5; }
  .lc-field-hint { margin: 0.35rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .lc-field-hint.warn { color: #B45309; }
  .lc-field-row { display: flex; gap: 0.75rem; }
  .lc-field-row .lc-field { flex: 1; }
  .lc-modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
`

export default function TrainerLiveClassesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const [upcomingSessions, setUpcomingSessions] = useState<TrainerSession[]>([])
  const [liveSessions, setLiveSessions] = useState<TrainerSession[]>([])
  const [pastSessions, setPastSessions] = useState<TrainerSession[]>([])
  const [bookings, setBookings] = useState<LiveManageBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Go live modal ──
  const [goLiveTarget, setGoLiveTarget] = useState<SessionWithExtras | null>(null)
  const [goLiveJoinUrl, setGoLiveJoinUrl] = useState('')
  const [goLivePhase, setGoLivePhase] = useState<'form' | 'submitting' | 'success'>('form')
  const [goLiveError, setGoLiveError] = useState<string | null>(null)

  // ── End session modal ──
  const [endTarget, setEndTarget] = useState<SessionWithExtras | null>(null)
  const [endSubmitting, setEndSubmitting] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  // ── Schedule modal ──
  const [showSchedule, setShowSchedule] = useState(false)
  const [myCourses, setMyCourses] = useState<TrainerCourseListItem[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [form, setForm] = useState({ date: '', startTime: '', duration: 60, title: '', joinUrl: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<SessionWithExtras | null>(null)
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [upcomingRes, liveRes, pastRes, bookingsRes] = await Promise.all([
      trainerSessionsAPI.getSessions('upcoming'),
      trainerSessionsAPI.getSessions('live'),
      trainerSessionsAPI.getSessions('past'),
      liveSessionsAPI.getManageBookings(),
    ])

    if (upcomingRes.success) setUpcomingSessions(upcomingRes.data)
    else setError(upcomingRes.error || 'Failed to load upcoming sessions.')

    if (liveRes.success) setLiveSessions(liveRes.data)

    if (pastRes.success) setPastSessions(pastRes.data)
    else setError((prev) => prev ?? pastRes.error ?? 'Failed to load past sessions.')

    if (bookingsRes.success) setBookings(bookingsRes.data)

    setLoading(false)
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const bookingCounts = useMemo(() => buildBookingCounts(bookings), [bookings])

  function toCard(session: TrainerSession): SessionCard {
    const counts = bookingCounts.get(session.id)
    return {
      session: session as SessionWithExtras,
      confirmedCount: counts?.confirmed ?? 0,
      bookingsCount: counts?.total ?? 0,
    }
  }

  const upcoming: SessionCard[] = useMemo(() => {
    const live = liveSessions.map(toCard)
    const scheduled = upcomingSessions
      .filter((s) => s.status !== 'cancelled')
      .sort((a, b) => sessionDateTime(a).getTime() - sessionDateTime(b).getTime())
      .map(toCard)
    return [...live, ...scheduled]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upcomingSessions, liveSessions, bookingCounts])

  const past: SessionCard[] = useMemo(
    () =>
      pastSessions
        .sort((a, b) => sessionDateTime(b).getTime() - sessionDateTime(a).getTime())
        .map(toCard),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pastSessions, bookingCounts],
  )

  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'confirmed')
    const uniqueLearners = new Set(confirmed.map((b) => b.learner.id))
    const totalSessions = upcomingSessions.length + liveSessions.length + pastSessions.length
    const uniqueBookedSessions = new Set(bookings.map((b) => b.session?.id).filter(Boolean))
    const avgAttendance = uniqueBookedSessions.size
      ? Math.round(confirmed.length / uniqueBookedSessions.size)
      : 0
    return { totalSessions, studentsReached: uniqueLearners.size, avgAttendance }
  }, [bookings, upcomingSessions, liveSessions, pastSessions])

  function resetScheduleForm() {
    setForm({ date: '', startTime: '', duration: 60, title: '', joinUrl: '' })
    setSubmitError(null)
    setSelectedCourseId('')
  }

  async function openScheduleModal() {
    setShowSchedule(true)
    setCoursesError(null)
    setCoursesLoading(true)
    const res = await coursesManageAPI.listMyCourses({ status: 'published' })
    setCoursesLoading(false)
    if (res.success) {
      setMyCourses(res.data)
    } else {
      setCoursesError(res.error || 'Failed to load your courses.')
    }
  }

  async function handleCreateSlot() {
    if (!selectedCourseId || !form.date || !form.startTime) {
      setSubmitError('Course, date and start time are required.')
      return
    }
    const trimmedJoinUrl = form.joinUrl.trim()
    if (trimmedJoinUrl && !isLikelyUrl(trimmedJoinUrl)) {
      setSubmitError('Join link should be a full URL, e.g. https://meet.google.com/abc-defg-hij')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    // listMyCourses only returns id/title — resolve the real slug here.
    const draftRes = await coursesManageAPI.getDraft(selectedCourseId)
    if (!draftRes.success) {
      setSubmitError(draftRes.error || 'Failed to resolve course details.')
      setSubmitting(false)
      return
    }
    const courseSlug = draftRes.data.slug

    const start = new Date(`${form.date}T${form.startTime}`)
    const end = new Date(start.getTime() + form.duration * 60000)

    const slotResult = await liveSessionsAPI.createManageCourseSlot(courseSlug, {
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
    })
    if (!slotResult.success) {
      setSubmitError(slotResult.error || 'Failed to schedule session.')
      setSubmitting(false)
      return
    }

    if (form.title.trim()) {
      const sessionResult = await liveSessionsAPI.publishSession(courseSlug, {
        title: form.title.trim(),
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        ...(trimmedJoinUrl ? { join_url: trimmedJoinUrl } : {}),
      })
      if (!sessionResult.success) {
        setSubmitError(sessionResult.error || 'Slot created, but publishing the session failed.')
        setSubmitting(false)
        return
      }
    }

    setShowSchedule(false)
    resetScheduleForm()
    setSubmitting(false)
    await loadAll()
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return
    setCancelSubmitting(true)
    setCancelError(null)

    const res = await liveSessionsAPI.cancelSession(cancelTarget.id)
    if (!res.success) {
      setCancelError(res.error || 'Failed to cancel session.')
      setCancelSubmitting(false)
      return
    }

    setCancelSubmitting(false)
    setCancelTarget(null)
    await loadAll()
  }

  // ── Go live handlers ──
  function openGoLive(session: SessionWithExtras | null) {
    if (!session) return
    setGoLiveTarget(session)
    setGoLiveJoinUrl(session.join_url ?? '')
    setGoLivePhase('form')
    setGoLiveError(null)
  }

  function closeGoLiveModal() {
    if (goLivePhase === 'submitting') return
    setGoLiveTarget(null)
    setGoLiveJoinUrl('')
    setGoLivePhase('form')
    setGoLiveError(null)
  }

  async function handleSendLinkAndGoLive() {
    if (!goLiveTarget) return
    const trimmed = goLiveJoinUrl.trim()
    if (!trimmed || !isLikelyUrl(trimmed)) {
      setGoLiveError('Paste a valid meeting link (starting with http:// or https://).')
      return
    }

    setGoLivePhase('submitting')
    setGoLiveError(null)

    if (trimmed !== (goLiveTarget.join_url ?? '')) {
      const updateRes = await liveSessionsAPI.updateSession(goLiveTarget.id, { join_url: trimmed })
      if (!updateRes.success) {
        setGoLiveError(updateRes.error || 'Failed to save the meeting link.')
        setGoLivePhase('form')
        return
      }
    }

    const goLiveRes = await liveSessionsAPI.goLiveSession(goLiveTarget.id)
    if (!goLiveRes.success) {
      setGoLiveError(goLiveRes.error || 'Failed to go live.')
      setGoLivePhase('form')
      return
    }

    setGoLivePhase('success')
    await loadAll()
  }

  // ── End session handlers ──
  async function handleConfirmEnd() {
    if (!endTarget) return
    setEndSubmitting(true)
    setEndError(null)

    const res = await liveSessionsAPI.endSession(endTarget.id)
    if (!res.success) {
      setEndError(res.error || 'Failed to end session.')
      setEndSubmitting(false)
      return
    }

    setEndSubmitting(false)
    setEndTarget(null)
    await loadAll()
  }

  if (!user) return null

  const list = activeTab === 'upcoming' ? upcoming : past
  const nextUpcoming = upcoming.find((c) => c.session.status !== 'live')?.session ?? null

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
            <button className="lc-btn-outline" onClick={openScheduleModal}>
              <Plus size={16} /> Schedule Session
            </button>
            <button
              className="lc-btn-primary"
              onClick={() => openGoLive(nextUpcoming)}
              disabled={!nextUpcoming}
            >
              <Radio size={16} /> Go Live
            </button>
          </div>
        </div>

        <div className="lc-stats">
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Total Sessions</p>
              <div className="lc-stat-icon" style={{ background: '#DBEAFE' }}><Video size={16} color="#2563EB" /></div>
            </div>
            <p className="lc-stat-value">{stats.totalSessions}</p>
            <p className="lc-stat-sub">All time</p>
          </div>
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Total Students Reached</p>
              <div className="lc-stat-icon" style={{ background: '#FEF3C7' }}><Users size={16} color="#D97706" /></div>
            </div>
            <p className="lc-stat-value">{stats.studentsReached}</p>
            <p className="lc-stat-sub">Across all sessions</p>
          </div>
          <div className="lc-stat-card">
            <div className="lc-stat-top">
              <p className="lc-stat-title">Avg. Attendance</p>
              <div className="lc-stat-icon" style={{ background: '#D1FAE5' }}><Star size={16} color="#059669" /></div>
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
          <div className="lc-loading"><Loader2 className="lc-spin" size={18} /> Loading live sessions…</div>
        ) : list.length === 0 ? (
          <div className="lc-empty">{activeTab === 'upcoming' ? 'No upcoming sessions yet.' : 'No past sessions yet.'}</div>
        ) : (
          <div className={`lc-list ${activeTab}`}>
            {list.map(({ session }) => {
              const start = sessionDateTime(session)
              const isLive = activeTab === 'upcoming' && session.status === 'live'
              return (
                <div className={`lc-card${isLive ? ' is-live' : ''}`} key={session.id}>
                  {activeTab === 'upcoming' ? (
                    <div className={`lc-card-icon${isLive ? ' is-live' : ''}`}>
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
                    <p className="lc-card-title">
                      {session.title}
                      {isLive && (
                        <span className="lc-badge live"><span className="lc-live-dot" />Live</span>
                      )}
                      {activeTab === 'past' && session.status === 'cancelled' && (
                        <span className="lc-badge cancelled"><Ban size={11} /> Cancelled</span>
                      )}
                      {activeTab === 'past' && session.status === 'ended' && (
                        <span className="lc-badge ended"><CheckCircle2 size={11} /> Ended</span>
                      )}
                    </p>
                    <p className="lc-card-sub">{session.course_title}</p>
                    <div className="lc-card-meta">
                      <span><Calendar size={13} /> {formatDateLabel(start)}</span>
                      <span>
                        <Clock size={13} /> {formatTimeLabel(start)}
                        {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
                      </span>
                      {activeTab === 'past' && session.status !== 'cancelled' && (
                        <span><Eye size={13} /> {session.recording_views ?? 0} views</span>
                      )}
                    </div>
                  </div>
                  <div className="lc-card-actions">
                    {activeTab === 'upcoming' ? (
                      isLive ? (
                        <button className="lc-end-btn" onClick={() => { setEndError(null); setEndTarget(session) }}>
                          <Square size={13} fill="currentColor" /> End Session
                        </button>
                      ) : (
                        <>
                          <button className="lc-start-btn" onClick={() => openGoLive(session)}>
                            <Radio size={14} /> Start Now
                          </button>
                          <div className="lc-icon-btn-wrap">
                            <button
                              className="lc-icon-btn"
                              aria-label="More options"
                              onClick={() => setOpenMenuId(openMenuId === session.id ? null : session.id)}
                            >
                              <MoreVertical size={16} />
                            </button>
                            {openMenuId === session.id && (
                              <>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenMenuId(null)} />
                                <div className="lc-menu">
                                  <button
                                    className="lc-menu-item danger"
                                    onClick={() => { setOpenMenuId(null); setCancelError(null); setCancelTarget(session) }}
                                  >
                                    <Ban size={14} /> Cancel session
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )
                    ) : session.status === 'cancelled' ? (
                      <span />
                    ) : (
                      <>
                        <button
                          className="lc-recording-btn"
                          onClick={() => session.recording_url && window.open(session.recording_url, '_blank')}
                        >
                          <PlayCircle size={14} /> View Recording
                        </button>
                        <button className="lc-icon-btn" aria-label="More options"><MoreVertical size={16} /></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Go live modal ── */}
      {goLiveTarget && (
        <div className="lc-modal-overlay" onClick={closeGoLiveModal}>
          <div className="lc-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lc-modal-close" onClick={closeGoLiveModal} aria-label="Close" disabled={goLivePhase === 'submitting'}>
              <X size={18} />
            </button>

            {goLivePhase !== 'success' ? (
              <>
                <h3 className="lc-modal-title">Start a Live Class</h3>
                <div className="lc-meet-badge"><Video size={20} color="#4285F4" /> Google Meet</div>
                <p className="lc-meet-copy">
                  This process will direct you to Google Meet where you can create a meeting link and paste it below to begin a live class session.
                </p>

                <div className="lc-meet-link-row">
                  <button
                    type="button"
                    className="lc-meet-link"
                    onClick={() => window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer')}
                  >
                    Get meeting link <ArrowRight size={15} />
                  </button>
                </div>

                <input
                  type="url"
                  className={`lc-meet-input${goLiveJoinUrl.trim() && !isLikelyUrl(goLiveJoinUrl) ? ' invalid' : ''}`}
                  placeholder="Paste meeting link here"
                  value={goLiveJoinUrl}
                  onChange={(e) => { setGoLiveJoinUrl(e.target.value); setGoLiveError(null) }}
                  disabled={goLivePhase === 'submitting'}
                />

                {goLiveError && <div className="lc-error">{goLiveError}</div>}

                <button
                  className="lc-meet-btn"
                  onClick={handleSendLinkAndGoLive}
                  disabled={goLivePhase === 'submitting' || !goLiveJoinUrl.trim()}
                >
                  {goLivePhase === 'submitting'
                    ? <><Loader2 size={16} className="lc-spin" /> Sending…</>
                    : 'Send link to learners'}
                </button>
              </>
            ) : (
              <>
                <div className="lc-success-icon"><CheckCircle2 size={32} color="#fff" /></div>
                <div className="lc-success-title">Meeting link has been sent to your learners.</div>
                <div className="lc-success-sub">Proceed back to Google Meet to begin your class.</div>
                <button className="lc-meet-btn" onClick={closeGoLiveModal}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── End session modal ── */}
      {endTarget && (
        <div
          className="lc-modal-overlay"
          onClick={() => { if (!endSubmitting) { setEndTarget(null); setEndError(null) } }}
        >
          <div className="lc-modal left" onClick={(e) => e.stopPropagation()}>
            <button
              className="lc-modal-close"
              onClick={() => { setEndTarget(null); setEndError(null) }}
              aria-label="Close"
              disabled={endSubmitting}
            >
              <X size={18} />
            </button>
            <h3 className="lc-modal-title">End this live session?</h3>
            <p className="lc-confirm-copy">
              <strong>{endTarget.title}</strong> will be marked as ended and moved to your Past
              Sessions list. Learners will no longer be able to join.
            </p>
            {endError && <div className="lc-error">{endError}</div>}
            <div className="lc-modal-actions">
              <button
                className="lc-btn-outline"
                onClick={() => { setEndTarget(null); setEndError(null) }}
                disabled={endSubmitting}
              >
                Keep it live
              </button>
              <button className="lc-btn-danger" onClick={handleConfirmEnd} disabled={endSubmitting}>
                {endSubmitting ? 'Ending…' : 'Yes, end session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel modal ── */}
      {cancelTarget && (
        <div
          className="lc-modal-overlay"
          onClick={() => { if (!cancelSubmitting) { setCancelTarget(null); setCancelError(null) } }}
        >
          <div className="lc-modal left" onClick={(e) => e.stopPropagation()}>
            <button
              className="lc-modal-close"
              onClick={() => { setCancelTarget(null); setCancelError(null) }}
              aria-label="Close"
              disabled={cancelSubmitting}
            >
              <X size={18} />
            </button>
            <h3 className="lc-modal-title">Cancel this session?</h3>
            <p className="lc-confirm-copy">
              <strong>{cancelTarget.title}</strong> on {formatDateLabel(sessionDateTime(cancelTarget))} at{' '}
              {formatTimeLabel(sessionDateTime(cancelTarget))} will be cancelled. This can't be
              undone — anyone who booked will be notified, and the session moves to your Past list
              marked as cancelled.
            </p>
            {cancelError && <div className="lc-error">{cancelError}</div>}
            <div className="lc-modal-actions">
              <button
                className="lc-btn-outline"
                onClick={() => { setCancelTarget(null); setCancelError(null) }}
                disabled={cancelSubmitting}
              >
                Keep session
              </button>
              <button className="lc-btn-danger" onClick={handleConfirmCancel} disabled={cancelSubmitting}>
                {cancelSubmitting ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Schedule modal ── */}
      {showSchedule && (
        <div className="lc-modal-overlay" onClick={() => { setShowSchedule(false); resetScheduleForm() }}>
          <div className="lc-modal left" onClick={(e) => e.stopPropagation()}>
            <button className="lc-modal-close" onClick={() => { setShowSchedule(false); resetScheduleForm() }} aria-label="Close">
              <X size={16} />
            </button>
            <h3 className="lc-modal-title">Schedule a live session</h3>

            <div className="lc-field">
              <label>Course</label>
              {coursesLoading ? (
                <p className="lc-field-hint">Loading your courses…</p>
              ) : coursesError ? (
                <div className="lc-error">{coursesError}</div>
              ) : myCourses.length === 0 ? (
                <p className="lc-field-hint">No published courses found.</p>
              ) : (
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="" disabled>Select a course</option>
                  {myCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              )}
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
                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
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

            <div className="lc-field">
              <label><LinkIcon size={13} style={{ verticalAlign: '-2px', marginRight: '0.3rem' }} />Join link</label>
              <input
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={form.joinUrl}
                className={form.joinUrl.trim() && !isLikelyUrl(form.joinUrl) ? 'invalid' : ''}
                onChange={(e) => setForm((f) => ({ ...f, joinUrl: e.target.value }))}
              />
              <p className={`lc-field-hint ${form.joinUrl.trim() && !isLikelyUrl(form.joinUrl) ? 'warn' : ''}`}>
                {form.joinUrl.trim() && !isLikelyUrl(form.joinUrl)
                  ? 'Needs to start with http:// or https://'
                  : "Paste your Google Meet (or other) link now, or add it later before going live."}
              </p>
            </div>

            {submitError && <div className="lc-error">{submitError}</div>}

            <div className="lc-modal-actions">
              <button className="lc-btn-outline" onClick={() => { setShowSchedule(false); resetScheduleForm() }} disabled={submitting}>
                Cancel
              </button>
              <button
                className="lc-btn-primary"
                onClick={handleCreateSlot}
                disabled={submitting || coursesLoading || !selectedCourseId}
              >
                {submitting ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </TrainerShell>
  )
}