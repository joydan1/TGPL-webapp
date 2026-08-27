import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  CheckCircle2,
  CalendarClock,
  CalendarCheck2,
  RefreshCw,
  Video,
  Link2,
  X as XIcon,
  ChevronRight,
  Check,
} from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import {
  liveSessionsAPI,
  coursesManageAPI,
  type LiveManageBooking,
  type LiveSlot,
  type TrainerCourseListItem,
} from '../../../../services/api'

const PAGE_CSS = `
  .bk-page { padding: 1rem; background: #F5F5F5; }

  /* ── Header row ─────────────────────────────────────────────────────── */
  .bk-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .bk-header-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .bk-header-subtitle { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .bk-set-availability-btn { border: none; background: #2492EB; color: #fff; font-weight: 700; font-size: 0.9rem; padding: 0.75rem 1.15rem; border-radius: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25); }
  .bk-set-availability-btn:hover { background: #2462EB; }

  /* ── Stat cards ──────────────────────────────────────────────────────── */
  .bk-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .bk-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); display: flex; align-items: center; gap: 0.85rem; min-width: 0; }
  .bk-stat-icon { width: 44px; height: 44px; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bk-stat-value { margin: 0; font-size: 1.5rem; font-weight: 800; color: #111827; line-height: 1.1; }
  .bk-stat-title { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }

  /* ── Tabs / filter row ───────────────────────────────────────────────── */
  .bk-tabs-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin: 1.5rem 0 1rem; }
  .bk-tab-group { display: flex; background: #fff; border-radius: 0.85rem; padding: 0.25rem; border: 1px solid rgba(148, 163, 184, 0.18); }
  .bk-tab-pill { border: none; background: none; cursor: pointer; padding: 0.55rem 1rem; border-radius: 0.65rem; font-size: 0.85rem; font-weight: 700; color: #374151; }
  .bk-tab-pill.active { background: #2492EB; color: #fff; }
  .bk-tab-controls { display: flex; align-items: center; gap: 0.5rem; }
  .bk-filter-select { padding: 0.6rem 0.85rem; border: 1px solid #2492EB; border-radius: 0.75rem; font-size: 0.85rem; background: #fff; color: #616873; }
  .bk-refresh-btn { border: 1px solid #E5E7EB; background: #fff; width: 38px; height: 38px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; flex-shrink: 0; }
  .bk-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .bk-refresh-btn.spinning svg { animation: bk-spin 0.8s linear infinite; }
  @keyframes bk-spin { to { transform: rotate(360deg); } }

  /* ── Date-grouped booking rows ──────────────────────────────────────── */
  .bk-date-label { margin: 1.1rem 0 0.6rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: #9CA3AF; text-transform: uppercase; }
  .bk-row-list { display: flex; flex-direction: column; gap: 0.7rem; }
  .bk-row { background: #fff; border-radius: 1rem; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); padding: 1rem 1.1rem; display: flex; align-items: center; gap: 0.85rem; cursor: pointer; text-align: left; width: 100%; }
  .bk-row:hover { border-color: rgba(37, 99, 235, 0.25); }
  .bk-avatar { width: 42px; height: 42px; border-radius: 999px; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 700; font-size: 0.85rem; }
  .bk-row-main { flex: 1; min-width: 0; }
  .bk-row-name-line { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .bk-row-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .bk-row-sub { margin: 0.2rem 0 0; color: #9CA3AF; font-size: 0.8rem; }
  .bk-row-meta { margin: 0.35rem 0 0; color: #6B7280; font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem; }
  .bk-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
  .bk-row-time { font-size: 0.8rem; color: #6B7280; font-weight: 600; white-space: nowrap; }
  .bk-row-chevron { color: #D1D5DB; flex-shrink: 0; }

  .bk-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; text-transform: capitalize; }
  .bk-status-badge.requested { background: #FEF3C7; color: #D97706; }
  .bk-status-badge.confirmed { background: #DCFCE7; color: #16A34A; }
  .bk-status-badge.rejected { background: #FEE2E2; color: #DC2626; }
  .bk-status-badge.cancelled { background: #FEE2E2; color: #DC2626; }

  .bk-empty-state { background: #fff; border-radius: 1rem; padding: 2rem 1rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.12); }
  .bk-error-state { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 1rem; padding: 1rem; font-size: 0.875rem; margin-bottom: 0.85rem; }

  /* ── Modal shell ─────────────────────────────────────────────────────── */
  .bk-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 1.25rem; z-index: 60; }
  .bk-modal { background: #fff; border-radius: 1.25rem; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25); }
  .bk-modal-header { padding: 1.25rem 1.4rem 1rem; border-bottom: 1px solid #F3F4F6; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .bk-modal-eyebrow { margin: 0; font-size: 0.75rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.04em; }
  .bk-modal-title { margin: 0.2rem 0 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .bk-modal-subtitle { margin: 0.15rem 0 0; color: #6B7280; font-size: 0.85rem; }
  .bk-modal-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.25rem; flex-shrink: 0; }
  .bk-modal-body { padding: 1.25rem 1.4rem; }

  .bk-modal-person-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1rem; }
  .bk-modal-person-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .bk-modal-person-sub { margin: 0.15rem 0 0; color: #6B7280; font-size: 0.8rem; }

  .bk-modal-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; margin-bottom: 1rem; }
  .bk-modal-info-card { background: #F9FAFB; border-radius: 0.75rem; padding: 0.7rem 0.85rem; }
  .bk-modal-info-label { display: flex; align-items: center; gap: 0.35rem; margin: 0 0 0.3rem; font-size: 0.7rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.03em; text-transform: uppercase; }
  .bk-modal-info-value { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }

  .bk-modal-note-label { margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.03em; text-transform: uppercase; }
  .bk-modal-note { background: #F9FAFB; border-radius: 0.75rem; padding: 0.75rem 0.85rem; color: #374151; font-size: 0.85rem; margin-bottom: 1rem; }

  .bk-modal-link-label { display: block; color: #2492EB; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.6rem; text-decoration: none; }
  .bk-modal-link-row { display: flex; gap: 0.5rem; margin-bottom: 1.1rem; }
  .bk-modal-link-input { flex: 1; min-width: 0; padding: 0.65rem 0.85rem; border: 1px solid #E5E7EB; border-radius: 0.7rem; font-size: 0.85rem; }
  .bk-modal-link-send { border: 1px solid #2492EB; background: #fff; color: #2492EB; font-weight: 700; font-size: 0.85rem; padding: 0.65rem 1.1rem; border-radius: 0.7rem; cursor: pointer; white-space: nowrap; }
  .bk-modal-link-send:disabled { opacity: 0.5; cursor: not-allowed; }
  .bk-modal-error { color: #DC2626; font-size: 0.75rem; margin: -0.7rem 0 1rem; }

  .bk-modal-footer { padding: 1rem 1.4rem 1.4rem; display: flex; gap: 0.7rem; border-top: 1px solid #F3F4F6; }
  .bk-modal-btn { flex: 1; border-radius: 0.85rem; padding: 0.8rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .bk-modal-btn.secondary { border: 1px solid #E5E7EB; background: #fff; color: #374151; }
  .bk-modal-btn.primary { border: none; background: #2492EB; color: #fff; }
  .bk-modal-btn.danger { border: 1px solid #FCA5A5; background: #fff; color: #DC2626; }
  .bk-modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Set-availability modal ─────────────────────────────────────────── */
  .bk-avail-notice { display: flex; gap: 0.6rem; background: #EFF6FF; color: #1D4ED8; border-radius: 0.85rem; padding: 0.85rem 1rem; font-size: 0.85rem; line-height: 1.4; margin-bottom: 1.1rem; }
  .bk-avail-course-field { margin-bottom: 1.1rem; }
  .bk-avail-course-label { display: block; font-size: 0.75rem; font-weight: 700; color: #6B7280; margin-bottom: 0.4rem; }
  .bk-avail-course-select { width: 100%; padding: 0.65rem 0.85rem; border: 1px solid #E5E7EB; border-radius: 0.75rem; font-size: 0.9rem; background: #fff; color: #111827; }
  .bk-avail-course-select:disabled { opacity: 0.6; cursor: not-allowed; }
  .bk-avail-day { margin-bottom: 1rem; }
  .bk-avail-day-label { margin: 0 0 0.5rem; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .bk-avail-slot-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border-radius: 0.85rem; padding: 0.8rem 1rem; margin-bottom: 0.5rem; background: #F3F4F6; }
  .bk-avail-slot-row.on { background: #EFF6FF; }
  .bk-avail-slot-time { font-size: 0.9rem; font-weight: 600; color: #111827; }
  .bk-avail-slot-row.off .bk-avail-slot-time { color: #9CA3AF; }
  .bk-avail-slot-booked-note { font-size: 0.72rem; color: #D97706; font-weight: 600; margin-left: 0.5rem; }
  .bk-avail-toggle { position: relative; width: 44px; height: 26px; border-radius: 999px; border: none; cursor: pointer; background: #D1D5DB; flex-shrink: 0; transition: background 0.15s ease; }
  .bk-avail-toggle.on { background: #2492EB; }
  .bk-avail-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
  .bk-avail-toggle-thumb { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 999px; background: #fff; transition: transform 0.15s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.25); }
  .bk-avail-toggle.on .bk-avail-toggle-thumb { transform: translateX(18px); }
  .bk-avail-duration-note { color: #6B7280; font-size: 0.8rem; }
  .bk-avail-grid-loading { color: #9CA3AF; font-size: 0.85rem; padding: 1rem 0; text-align: center; }

  /* ── Confirmation modal ──────────────────────────────────────────────── */
  .bk-confirm-modal { background: #fff; border-radius: 1.25rem; padding: 2.25rem 1.75rem; max-width: 360px; width: 100%; text-align: center; box-shadow: 0 30px 80px rgba(15, 23, 42, 0.25); }
  .bk-confirm-icon { width: 64px; height: 64px; border-radius: 999px; background: #DCFCE7; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.1rem; color: #16A34A; }
  .bk-confirm-title { margin: 0 0 0.5rem; font-size: 1.15rem; font-weight: 800; color: #111827; }
  .bk-confirm-body { margin: 0 0 1.4rem; color: #6B7280; font-size: 0.9rem; line-height: 1.4; }
  .bk-confirm-close { border: none; background: #2492EB; color: #fff; font-weight: 700; font-size: 0.9rem; padding: 0.8rem 1.4rem; border-radius: 0.85rem; cursor: pointer; width: 100%; }

  @media (min-width: 640px) {
    .bk-page { padding: 1.5rem; }
    .bk-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
  }

  @media (min-width: 1024px) {
    .bk-page { padding: 1.5rem 2rem 2rem; }
  }
`

type TabKey = 'upcoming' | 'history'
type StatusFilterKey = 'all' | 'requested' | 'confirmed' | 'rejected' | 'cancelled'

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
const AVAILABILITY_WINDOW_DAYS = 14

type WeekdayName = (typeof DAYS_OF_WEEK)[number]

const WEEKDAY_JS_INDEX: Record<WeekdayName, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
}

type AvailTemplateRow = {
  id: string
  day: WeekdayName
  start: string // "HH:mm"
  end: string // "HH:mm"
}

const AVAIL_TEMPLATE_ROWS: AvailTemplateRow[] = [
  { id: 'mon-1', day: 'Mon', start: '09:00', end: '12:00' },
  { id: 'mon-2', day: 'Mon', start: '14:00', end: '17:00' },
  { id: 'tue-1', day: 'Tue', start: '10:00', end: '12:00' },
  { id: 'tue-2', day: 'Tue', start: '14:00', end: '16:00' },
  { id: 'wed-1', day: 'Wed', start: '09:00', end: '12:00' },
  { id: 'wed-2', day: 'Wed', start: '14:00', end: '17:00' },
  { id: 'thu-1', day: 'Thu', start: '09:00', end: '12:00' },
  { id: 'thu-2', day: 'Thu', start: '15:00', end: '17:00' },
  { id: 'fri-1', day: 'Fri', start: '10:00', end: '13:00' },
]

/** All calendar dates (as local Date objects, midnight) matching `weekday` within the next N days, starting tomorrow. */
function upcomingDatesForWeekday(weekday: WeekdayName, daysAhead: number): Date[] {
  const targetIndex = WEEKDAY_JS_INDEX[weekday]
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let offset = 1; offset <= daysAhead; offset++) {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    if (d.getDay() === targetIndex) dates.push(d)
  }
  return dates
}

/** Combine a calendar date with an "HH:mm" time (local) and return an ISO string. */
function combineDateAndTime(date: Date, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(h, m, 0, 0)
  return combined.toISOString()
}

function slotMatchesTemplateRow(slot: LiveSlot, row: AvailTemplateRow): boolean {
  const start = new Date(slot.starts_at)
  if (isNaN(start.getTime())) return false
  const dayName = DAYS_OF_WEEK.find((d) => WEEKDAY_JS_INDEX[d] === start.getDay())
  if (dayName !== row.day) return false
  const pad = (n: number) => String(n).padStart(2, '0')
  const hhmm = `${pad(start.getHours())}:${pad(start.getMinutes())}`
  return hhmm === row.start
}

function initials(name?: string | null) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function safeDate(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function formatDateLabel(value?: string | null) {
  const d = safeDate(value)
  if (!d) return 'Unknown date'
  return d
    .toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
}

function formatTime(value?: string | null) {
  const d = safeDate(value)
  if (!d) return '--:--'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(start?: string | null, end?: string | null) {
  const s = safeDate(start)
  const e = safeDate(end)
  if (!s || !e) return 'Unavailable'
  const mins = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000))
  return `${mins} min`
}

// Optional fields that may or may not exist on the booking object depending on
// what the API returns — read defensively so the UI never breaks on missing data.
function getOptional(booking: LiveManageBooking, key: string): string | undefined {
  const value = (booking as unknown as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value : undefined
}

export default function TrainerBookingsPage() {
  const [bookings, setBookings] = useState<LiveManageBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all')

  const [selectedBooking, setSelectedBooking] = useState<LiveManageBooking | null>(null)
  const [actioning, setActioning] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [editingRecording, setEditingRecording] = useState(false)
  const [recordingDraft, setRecordingDraft] = useState('')
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [savingRecording, setSavingRecording] = useState(false)

  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [enabledRowIds, setEnabledRowIds] = useState<Set<string>>(new Set())
  const [savingAvailability, setSavingAvailability] = useState(false)
  const [availError, setAvailError] = useState<string | null>(null)
  const [saveSummary, setSaveSummary] = useState<string | null>(null)
  const [showSavedConfirmation, setShowSavedConfirmation] = useState(false)

  const [availCourses, setAvailCourses] = useState<TrainerCourseListItem[]>([])
  const [availCoursesLoading, setAvailCoursesLoading] = useState(false)
  const [availCoursesError, setAvailCoursesError] = useState<string | null>(null)
  const [availSelectedCourseId, setAvailSelectedCourseId] = useState<string>('')
  const [availResolvedSlug, setAvailResolvedSlug] = useState<string>('')
  const [availSlugResolving, setAvailSlugResolving] = useState(false)
  const [availExistingSlots, setAvailExistingSlots] = useState<LiveSlot[]>([])
  const [availSlotsLoading, setAvailSlotsLoading] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  // Load the trainer's published courses the first time the availability modal opens.
  useEffect(() => {
    if (!showAvailabilityModal || availCourses.length > 0 || availCoursesLoading) return

    setAvailCoursesLoading(true)
    setAvailCoursesError(null)
    coursesManageAPI.listMyCourses({ status: 'published' }).then((result) => {
      setAvailCoursesLoading(false)
      if (result.success) {
        setAvailCourses(result.data)
        if (result.data.length > 0) {
          setAvailSelectedCourseId((prev) => prev || result.data[0].id)
        }
      } else {
        setAvailCoursesError(result.error)
      }
    })
  }, [showAvailabilityModal, availCourses.length, availCoursesLoading])

  // Resolve the course slug (the slots endpoints need the slug, not the id).
  useEffect(() => {
    if (!availSelectedCourseId) {
      setAvailResolvedSlug('')
      return
    }
    let cancelled = false
    setAvailSlugResolving(true)
    setAvailError(null)
    setAvailResolvedSlug('')

    coursesManageAPI.getDraft(availSelectedCourseId).then((result) => {
      if (cancelled) return
      setAvailSlugResolving(false)
      if (result.success) {
        setAvailResolvedSlug(result.data.slug)
      } else {
        setAvailError(result.error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [availSelectedCourseId])

  // Load this course's real slots and derive which template rows are already "on".
  useEffect(() => {
    if (!availResolvedSlug) {
      setAvailExistingSlots([])
      setEnabledRowIds(new Set())
      return
    }
    let cancelled = false
    setAvailSlotsLoading(true)
    setAvailError(null)

    liveSessionsAPI.getManageCourseSlots(availResolvedSlug).then((result) => {
      if (cancelled) return
      setAvailSlotsLoading(false)
      if (result.success) {
        setAvailExistingSlots(result.data)
        const enabled = new Set<string>()
        for (const row of AVAIL_TEMPLATE_ROWS) {
          const hasFutureMatch = result.data.some(
            (slot) => slot.status !== 'unavailable' && slotMatchesTemplateRow(slot, row),
          )
          if (hasFutureMatch) enabled.add(row.id)
        }
        setEnabledRowIds(enabled)
      } else {
        setAvailError(result.error)
      }
    })

    return () => {
      cancelled = true
    }
  }, [availResolvedSlug])

  async function loadAll(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setLoadError(null)

    const result = await liveSessionsAPI.getManageBookings()
    if (result.success) {
      setBookings(result.data)
    } else {
      setLoadError(result.error)
    }

    if (isRefresh) setRefreshing(false)
    else setLoading(false)
  }

  const now = Date.now()

  const stats = useMemo(() => {
    const total = bookings.length
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length
    const requested = bookings.filter((b) => b.status === 'requested').length
    const held = bookings.filter((b) => {
      const end = safeDate(b.slot_ends_at)
      return b.status === 'confirmed' && end !== null && end.getTime() < now
    }).length
    return { total, confirmed, requested, held }
  }, [bookings, now])

  const upcomingCount = useMemo(
    () =>
      bookings.filter((b) => {
        const end = safeDate(b.slot_ends_at)
        const isPast = end !== null && end.getTime() < now
        return !isPast && b.status !== 'rejected' && b.status !== 'cancelled'
      }).length,
    [bookings, now],
  )
  const historyCount = bookings.length - upcomingCount

  const filteredBookings = useMemo(() => {
    let list = bookings.filter((b) => {
      const end = safeDate(b.slot_ends_at)
      const isPast = end !== null && end.getTime() < now
      const isUpcoming = !isPast && b.status !== 'rejected' && b.status !== 'cancelled'
      return activeTab === 'upcoming' ? isUpcoming : !isUpcoming
    })

    if (statusFilter !== 'all') {
      list = list.filter((b) => b.status === statusFilter)
    }

    return [...list].sort((a, b) => {
      const aTime = safeDate(a.slot_starts_at)?.getTime() ?? 0
      const bTime = safeDate(b.slot_starts_at)?.getTime() ?? 0
      return activeTab === 'upcoming' ? aTime - bTime : bTime - aTime
    })
  }, [bookings, activeTab, statusFilter, now])

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, LiveManageBooking[]>()
    for (const booking of filteredBookings) {
      const key = formatDateLabel(booking.slot_starts_at)
      const existing = groups.get(key) ?? []
      existing.push(booking)
      groups.set(key, existing)
    }
    return Array.from(groups.entries())
  }, [filteredBookings])

  function openBooking(booking: LiveManageBooking) {
    setSelectedBooking(booking)
    setActionError(null)
    setEditingRecording(false)
    setRecordingDraft(getOptional(booking, 'recording_url') ?? '')
    setRecordingError(null)
  }

  function closeBookingModal() {
    setSelectedBooking(null)
    setEditingRecording(false)
    setRecordingDraft('')
    setRecordingError(null)
  }

  async function handleConfirm(bookingId: string) {
    setActioning(true)
    setActionError(null)
    const result = await liveSessionsAPI.confirmBooking(bookingId)
    setActioning(false)

    if (!result.success) {
      setActionError(result.error)
      return
    }
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b)))
    setSelectedBooking((prev) => (prev && prev.id === bookingId ? { ...prev, status: 'confirmed' } : prev))
  }

  async function handleReject(bookingId: string) {
    setActioning(true)
    setActionError(null)
    const result = await liveSessionsAPI.rejectBooking(bookingId)
    setActioning(false)

    if (!result.success) {
      setActionError(result.error)
      return
    }
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b)))
    setSelectedBooking((prev) => (prev && prev.id === bookingId ? { ...prev, status: 'rejected' } : prev))
  }

  async function saveRecording(bookingId: string) {
    if (!recordingDraft.trim()) {
      setRecordingError('Enter a meeting link.')
      return
    }

    setSavingRecording(true)
    setRecordingError(null)

    const result = await liveSessionsAPI.setBookingRecording(bookingId, recordingDraft.trim())
    setSavingRecording(false)

    if (!result.success) {
      setRecordingError(result.error)
      return
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, recording_url: result.data.recording_url } : b)),
    )
    setSelectedBooking((prev) =>
      prev && prev.id === bookingId ? { ...prev, recording_url: result.data.recording_url } : prev,
    )
    setEditingRecording(false)
  }

  function toggleTemplateRow(rowId: string) {
    setEnabledRowIds((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  function closeAvailabilityModal() {
    setShowAvailabilityModal(false)
    setAvailError(null)
  }

  async function handleSaveAvailability() {
    if (!availResolvedSlug) {
      setAvailError('Pick a course first — availability is set per course.')
      return
    }

    setSavingAvailability(true)
    setAvailError(null)

    let created = 0
    let deleted = 0
    let skippedBooked = 0
    let failed = 0

    for (const row of AVAIL_TEMPLATE_ROWS) {
      const wantsEnabled = enabledRowIds.has(row.id)
      const targetDates = upcomingDatesForWeekday(row.day, AVAILABILITY_WINDOW_DAYS)
      const matchingExisting = availExistingSlots.filter(
        (slot) => slot.status !== 'unavailable' && slotMatchesTemplateRow(slot, row),
      )

      if (wantsEnabled) {
        // Create any missing dated instances for this weekday/time in the window.
        for (const date of targetDates) {
          const alreadyExists = matchingExisting.some((slot) => {
            const start = new Date(slot.starts_at)
            return (
              start.getFullYear() === date.getFullYear() &&
              start.getMonth() === date.getMonth() &&
              start.getDate() === date.getDate()
            )
          })
          if (alreadyExists) continue

          const result = await liveSessionsAPI.createManageCourseSlot(availResolvedSlug, {
            starts_at: combineDateAndTime(date, row.start),
            ends_at: combineDateAndTime(date, row.end),
          })
          if (result.success) created++
          else failed++
        }
      } else {
        // Remove existing instances for this weekday/time — but never touch booked slots.
        for (const slot of matchingExisting) {
          if (slot.status === 'booked') {
            skippedBooked++
            continue
          }
          const result = await liveSessionsAPI.deleteManageSlot(slot.id)
          if (result.success) deleted++
          else failed++
        }
      }
    }

    setSavingAvailability(false)

    // Refresh what's actually on the server so the grid reflects reality.
    const refreshed = await liveSessionsAPI.getManageCourseSlots(availResolvedSlug)
    if (refreshed.success) setAvailExistingSlots(refreshed.data)

    if (failed > 0) {
      setAvailError(`Saved with some errors — ${failed} slot change${failed === 1 ? '' : 's'} failed. Try again.`)
      return
    }

    const parts: string[] = []
    if (created > 0) parts.push(`${created} slot${created === 1 ? '' : 's'} opened`)
    if (deleted > 0) parts.push(`${deleted} slot${deleted === 1 ? '' : 's'} removed`)
    if (skippedBooked > 0) parts.push(`${skippedBooked} booked slot${skippedBooked === 1 ? '' : 's'} kept as-is`)
    setSaveSummary(
      parts.length > 0
        ? parts.join(', ') + '.'
        : 'No changes needed — availability already matched this pattern.',
    )

    setShowAvailabilityModal(false)
    setShowSavedConfirmation(true)
  }

  const slotsByDay = DAYS_OF_WEEK.map((day) => ({
    day,
    rows: AVAIL_TEMPLATE_ROWS.filter((r) => r.day === day),
  }))

  const availGridReady = Boolean(availResolvedSlug) && !availSlugResolving && !availSlotsLoading

  const modalRecordingUrl = selectedBooking ? getOptional(selectedBooking, 'recording_url') : undefined
  const modalNote = selectedBooking
    ? getOptional(selectedBooking, 'note') ?? getOptional(selectedBooking, 'learner_note')
    : undefined
  const modalFormat = selectedBooking ? getOptional(selectedBooking, 'format') : undefined
  const modalCourseTitle = selectedBooking
    ? getOptional(selectedBooking, 'course_title') ?? getOptional(selectedBooking, 'session_title')
    : undefined

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="bk-page">
        <div className="bk-header-row">
          <div>
            <h2 className="bk-header-title">Bookings</h2>
            <p className="bk-header-subtitle">Manage your 1-on-1 sessions and availability</p>
          </div>
          <button type="button" className="bk-set-availability-btn" onClick={() => setShowAvailabilityModal(true)}>
            <CalendarClock size={17} /> Set availability
          </button>
        </div>

        {loadError && <div className="bk-error-state">{loadError}</div>}

        <div className="bk-stats">
          <div className="bk-stat-card">
            <div className="bk-stat-icon" style={{ background: '#DBEAFE' }}>
              <ClipboardList size={19} color="#2492EB" />
            </div>
            <div>
              <p className="bk-stat-value">{loading ? '—' : stats.total}</p>
              <p className="bk-stat-title">Total bookings</p>
            </div>
          </div>
          <div className="bk-stat-card">
            <div className="bk-stat-icon" style={{ background: '#D1FAE5' }}>
              <CheckCircle2 size={19} color="#059669" />
            </div>
            <div>
              <p className="bk-stat-value">{loading ? '—' : stats.confirmed}</p>
              <p className="bk-stat-title">Confirmed</p>
            </div>
          </div>
          <div className="bk-stat-card">
            <div className="bk-stat-icon" style={{ background: '#FEF3C7' }}>
              <CalendarClock size={19} color="#D97706" />
            </div>
            <div>
              <p className="bk-stat-value">{loading ? '—' : stats.requested}</p>
              <p className="bk-stat-title">Awaiting review</p>
            </div>
          </div>
          <div className="bk-stat-card">
            <div className="bk-stat-icon" style={{ background: '#E5E7EB' }}>
              <CalendarCheck2 size={19} color="#4B5563" />
            </div>
            <div>
              <p className="bk-stat-value">{loading ? '—' : stats.held}</p>
              <p className="bk-stat-title">Sessions held</p>
            </div>
          </div>
        </div>

        <div className="bk-tabs-row">
          <div className="bk-tab-group">
            <button
              type="button"
              className={`bk-tab-pill ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({loading ? '—' : upcomingCount})
            </button>
            <button
              type="button"
              className={`bk-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History ({loading ? '—' : historyCount})
            </button>
          </div>

          <div className="bk-tab-controls">
            <select
              className="bk-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterKey)}
            >
              <option value="all">All status</option>
              <option value="requested">Requested</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              className={`bk-refresh-btn ${refreshing ? 'spinning' : ''}`}
              disabled={refreshing || loading}
              onClick={() => loadAll(true)}
              aria-label="Refresh bookings"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bk-empty-state">Loading bookings…</div>
        ) : groupedByDate.length === 0 ? (
          <div className="bk-empty-state">
            {activeTab === 'upcoming' ? 'No upcoming bookings right now.' : 'No booking history yet.'}
          </div>
        ) : (
          groupedByDate.map(([dateLabel, dayBookings]) => (
            <div key={dateLabel}>
              <p className="bk-date-label">{dateLabel}</p>
              <div className="bk-row-list">
                {dayBookings.map((booking) => (
                  <button
                    type="button"
                    key={booking.id}
                    className="bk-row"
                    onClick={() => openBooking(booking)}
                  >
                    <div className="bk-avatar">{initials(booking.learner_name)}</div>
                    <div className="bk-row-main">
                      <div className="bk-row-name-line">
                        <p className="bk-row-name">{booking.learner_name ?? 'Unknown learner'}</p>
                        <span className={`bk-status-badge ${booking.status}`}>{booking.status}</span>
                      </div>
                      {getOptional(booking, 'course_title') && (
                        <p className="bk-row-sub">{getOptional(booking, 'course_title')}</p>
                      )}
                      <p className="bk-row-meta">
                        <Video size={13} /> {formatTime(booking.slot_starts_at)} · {formatDuration(booking.slot_starts_at, booking.slot_ends_at)}
                      </p>
                    </div>
                    <div className="bk-row-right">
                      <span className="bk-row-time">{formatTime(booking.slot_starts_at)}</span>
                    </div>
                    <ChevronRight size={18} className="bk-row-chevron" />
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Booking detail modal ─────────────────────────────────────────── */}
      {selectedBooking && (
        <div className="bk-modal-overlay" onClick={closeBookingModal}>
          <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bk-modal-header">
              <div>
                <p className="bk-modal-eyebrow">BK-{selectedBooking.id.slice(0, 6).toUpperCase()}</p>
                <h3 className="bk-modal-title">{modalCourseTitle ?? 'Session details'}</h3>
                <p className="bk-modal-subtitle">{selectedBooking.learner_name ?? 'Unknown learner'}</p>
              </div>
              <button type="button" className="bk-modal-close" onClick={closeBookingModal} aria-label="Close">
                <XIcon size={20} />
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="bk-modal-person-row">
                <div>
                  <p className="bk-modal-person-name">{selectedBooking.learner_name ?? 'Unknown learner'}</p>
                  <p className="bk-modal-person-sub">Learner</p>
                </div>
                <span className={`bk-status-badge ${selectedBooking.status}`}>{selectedBooking.status}</span>
              </div>

              <div className="bk-modal-info-grid">
                <div className="bk-modal-info-card">
                  <p className="bk-modal-info-label">Date</p>
                  <p className="bk-modal-info-value">{formatDateLabel(selectedBooking.slot_starts_at)}</p>
                </div>
                <div className="bk-modal-info-card">
                  <p className="bk-modal-info-label">Time</p>
                  <p className="bk-modal-info-value">{formatTime(selectedBooking.slot_starts_at)}</p>
                </div>
                <div className="bk-modal-info-card">
                  <p className="bk-modal-info-label">Duration</p>
                  <p className="bk-modal-info-value">
                    {formatDuration(selectedBooking.slot_starts_at, selectedBooking.slot_ends_at)}
                  </p>
                </div>
                <div className="bk-modal-info-card">
                  <p className="bk-modal-info-label">Format</p>
                  <p className="bk-modal-info-value">{modalFormat ?? 'Video call'}</p>
                </div>
              </div>

              {modalNote && (
                <>
                  <p className="bk-modal-note-label">Learner note</p>
                  <div className="bk-modal-note">{modalNote}</div>
                </>
              )}

              {selectedBooking.status === 'confirmed' && (
                <>
                  {editingRecording ? (
                    <>
                      <div className="bk-modal-link-row">
                        <input
                          type="url"
                          className="bk-modal-link-input"
                          placeholder="https://meet.google.com/..."
                          value={recordingDraft}
                          onChange={(e) => setRecordingDraft(e.target.value)}
                          disabled={savingRecording}
                        />
                        <button
                          type="button"
                          className="bk-modal-link-send"
                          disabled={savingRecording}
                          onClick={() => saveRecording(selectedBooking.id)}
                        >
                          {savingRecording ? 'Saving…' : 'Send'}
                        </button>
                      </div>
                      {recordingError && <p className="bk-modal-error">{recordingError}</p>}
                    </>
                  ) : modalRecordingUrl ? (
                    <a
                      className="bk-modal-link-label"
                      href={modalRecordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Link2 size={15} /> View meeting link
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="bk-modal-link-label"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => setEditingRecording(true)}
                    >
                      <Link2 size={15} /> Get meeting link →
                    </button>
                  )}
                </>
              )}

              {actionError && <p className="bk-modal-error">{actionError}</p>}
            </div>

            <div className="bk-modal-footer">
              {selectedBooking.status === 'requested' ? (
                <>
                  <button
                    type="button"
                    className="bk-modal-btn danger"
                    disabled={actioning}
                    onClick={() => handleReject(selectedBooking.id)}
                  >
                    <XIcon size={16} /> Reject
                  </button>
                  <button
                    type="button"
                    className="bk-modal-btn primary"
                    disabled={actioning}
                    onClick={() => handleConfirm(selectedBooking.id)}
                  >
                    <Check size={16} /> Confirm
                  </button>
                </>
              ) : selectedBooking.status === 'confirmed' ? (
                <>
                  <button
                    type="button"
                    className="bk-modal-btn danger"
                    disabled={actioning}
                    onClick={() => handleReject(selectedBooking.id)}
                  >
                    Cancel booking
                  </button>
                  {modalRecordingUrl && (
                    <a
                      className="bk-modal-btn primary"
                      href={modalRecordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Video size={16} /> Back to meeting
                    </a>
                  )}
                </>
              ) : (
                <button type="button" className="bk-modal-btn secondary" onClick={closeBookingModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Set-availability modal ── generates real dated slots via the slots API ── */}
      {showAvailabilityModal && (
        <div className="bk-modal-overlay" onClick={closeAvailabilityModal}>
          <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bk-modal-header">
              <div>
                <h3 className="bk-modal-title">Set availability</h3>
                <p className="bk-modal-subtitle">Define which time windows learners can book sessions.</p>
              </div>
              <button type="button" className="bk-modal-close" onClick={closeAvailabilityModal} aria-label="Close">
                <XIcon size={20} />
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="bk-avail-notice">
                <CalendarClock size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  Learners can book sessions up to <strong>{AVAILABILITY_WINDOW_DAYS} days</strong> in advance.
                  Availability is set per course — toggling a slot creates or removes real bookable sessions for the
                  next {AVAILABILITY_WINDOW_DAYS} days.
                </span>
              </div>

              <div className="bk-avail-course-field">
                <label className="bk-avail-course-label" htmlFor="avail-course-select">
                  Course
                </label>
                {availCoursesLoading ? (
                  <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Loading your courses…</p>
                ) : availCourses.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
                    Publish a course first to open availability for it.
                  </p>
                ) : (
                  <select
                    id="avail-course-select"
                    className="bk-avail-course-select"
                    value={availSelectedCourseId}
                    onChange={(e) => setAvailSelectedCourseId(e.target.value)}
                    disabled={availSlugResolving || savingAvailability}
                  >
                    {availCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                )}
                {availCoursesError && <p className="bk-modal-error">{availCoursesError}</p>}
              </div>

              {availSelectedCourseId && !availGridReady ? (
                <div className="bk-avail-grid-loading">Loading current availability…</div>
              ) : (
                availSelectedCourseId &&
                slotsByDay.map(({ day, rows }) => (
                  <div className="bk-avail-day" key={day}>
                    <p className="bk-avail-day-label">{day}</p>
                    {rows.map((row) => {
                      const isOn = enabledRowIds.has(row.id)
                      const hasBookedMatch = availExistingSlots.some(
                        (slot) => slot.status === 'booked' && slotMatchesTemplateRow(slot, row),
                      )
                      return (
                        <div key={row.id} className={`bk-avail-slot-row ${isOn ? 'on' : 'off'}`}>
                          <span className="bk-avail-slot-time">
                            {row.start} – {row.end}
                            {hasBookedMatch && <span className="bk-avail-slot-booked-note">Has a booking</span>}
                          </span>
                          <button
                            type="button"
                            className={`bk-avail-toggle ${isOn ? 'on' : ''}`}
                            onClick={() => toggleTemplateRow(row.id)}
                            disabled={savingAvailability}
                            aria-pressed={isOn}
                            aria-label={`Toggle ${day} ${row.start}-${row.end}`}
                          >
                            <span className="bk-avail-toggle-thumb" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}

              {availError && <p className="bk-modal-error">{availError}</p>}
            </div>

            <div className="bk-modal-footer" style={{ alignItems: 'center' }}>
              <span className="bk-avail-duration-note">Session duration: 30, 45, or 60 min</span>
              <button
                type="button"
                className="bk-modal-btn secondary"
                style={{ flex: 'none', padding: '0.8rem 1.2rem' }}
                disabled={savingAvailability}
                onClick={closeAvailabilityModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bk-modal-btn primary"
                style={{ flex: 'none', padding: '0.8rem 1.2rem' }}
                disabled={savingAvailability || !availGridReady}
                onClick={handleSaveAvailability}
              >
                {savingAvailability ? 'Saving…' : 'Save availability'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Saved confirmation modal ─────────────────────────────────────── */}
      {showSavedConfirmation && (
        <div className="bk-modal-overlay" onClick={() => setShowSavedConfirmation(false)}>
          <div className="bk-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bk-confirm-icon">
              <CheckCircle2 size={30} />
            </div>
            <p className="bk-confirm-title">Availability Set</p>
            <p className="bk-confirm-body">
              {saveSummary ?? 'Your learners will book their sessions according to your available time(s).'}
            </p>
            <button type="button" className="bk-confirm-close" onClick={() => setShowSavedConfirmation(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </TrainerShell>
  )
}