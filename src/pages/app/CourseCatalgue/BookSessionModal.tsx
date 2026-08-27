import { useEffect, useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { liveSessionsAPI } from '../../../services/api'
import type { EnrolledCourseOption, LiveSlot } from '../../../services/api'

interface BookSessionModalProps {
  onClose: () => void
  onBooked: () => void
}

type Step = 'course' | 'datetime' | 'success'

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function slotDateKey(iso: string): string {
  return dateKey(new Date(iso))
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatSelectedSummary(dayDate: Date, timeIso: string): string {
  const day = ordinal(dayDate.getDate())
  const month = MONTH_LABELS[dayDate.getMonth()]
  const year = dayDate.getFullYear()
  const time = new Date(timeIso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${day} ${month}, ${year} - ${time}`
}

function formatTimeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// Builds a 6-row grid (42 cells) for the given month, Sun-first, with
// leading/trailing cells from adjacent months left blank (null).
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const startOffset = first.getDay() // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const MODAL_CSS = `
  .bm-overlay {
    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
    display: flex; align-items: center; justify-content: center; padding: 1.5rem; z-index: 500;
    box-sizing: border-box;
  }
  .bm-card {
    width: min(100%, 480px); max-height: 90vh; background: #fff; border-radius: 1.25rem;
    padding: 1.75rem; box-shadow: 0 28px 80px rgba(0,0,0,0.18);
    display: flex; flex-direction: column; gap: 1rem; overflow: hidden; box-sizing: border-box;
  }
  .bm-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .bm-head-left { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
  .bm-back {
    width: 2rem; height: 2rem; border: none; border-radius: 999px; background: #F3F4F6;
    color: #374151; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .bm-back:hover { background: #E5E7EB; }
  .bm-titlewrap { min-width: 0; }
  .bm-title {
    margin: 0; font-size: 1.25rem; font-weight: 700; color: #2492EB;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .bm-subtitle { margin: 0.2rem 0 0; font-size: 0.875rem; color: #6B7280; }
  .bm-close {
    width: 2.25rem; height: 2.25rem; border: none; border-radius: 999px; background: #F3F4F6;
    color: #374151; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .bm-close:hover { background: #E5E7EB; }
  .bm-body { color: #4B5563; font-size: 0.95rem; line-height: 1.6; overflow-y: auto; min-height: 0; }

  .bm-course-list { display: flex; flex-direction: column; gap: 0.6rem; }
  .bm-course-row {
    display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem;
    border: 1px solid #E5E7EB; border-radius: 0.75rem; cursor: pointer; background: #fff;
    text-align: left; width: 100%; box-sizing: border-box;
  }
  .bm-course-row:hover { border-color: #93C5FD; background: #F8FAFF; }
  .bm-course-thumb {
    width: 2.75rem; height: 2.75rem; border-radius: 0.625rem; background: #EFF6FF; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; color: #2492EB; font-weight: 700; font-size: 0.8rem;
    overflow: hidden;
  }
  .bm-course-thumb img { width: 100%; height: 100%; object-fit: cover; }
  .bm-course-main { flex: 1; min-width: 0; }
  .bm-course-title { font-size: 0.9375rem; font-weight: 700; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bm-course-sub { font-size: 0.8125rem; color: #6B7280; margin-top: 0.15rem; }
  .bm-empty { text-align: center; color: #9CA3AF; font-size: 0.875rem; padding: 2rem 0; }
  .bm-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.875rem; }
  .bm-skeleton { height: 60px; border-radius: 0.75rem; background: linear-gradient(90deg, #F3F4F6 25%, #ECECEC 37%, #F3F4F6 63%); background-size: 400% 100%; animation: bm-shimmer 1.4s ease infinite; }
  @keyframes bm-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

  /* Calendar */
  .bm-cal { border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.1rem 1.1rem 1.25rem; box-sizing: border-box; }
  .bm-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.9rem; }
  .bm-cal-nav {
    width: 1.75rem; height: 1.75rem; border: none; background: none; color: #9CA3AF;
    cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .bm-cal-nav:hover:not(:disabled) { color: #374151; }
  .bm-cal-nav:disabled { opacity: 0.35; cursor: not-allowed; }
  .bm-cal-month { font-size: 1rem; font-weight: 700; color: #111827; text-align: center; }
  .bm-cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.35rem; }
  .bm-cal-weekday { text-align: center; font-size: 0.7rem; font-weight: 700; color: #9CA3AF; letter-spacing: 0.03em; padding-bottom: 0.4rem; }
  .bm-cal-day {
    aspect-ratio: 1; width: 100%; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem;
    font-size: 0.875rem; border: 1px dashed transparent; background: none; cursor: default; color: #D1D5DB; padding: 0;
  }
  .bm-cal-day.available { color: #111827; cursor: pointer; font-weight: 500; }
  .bm-cal-day.available:hover { background: #EFF6FF; }
  .bm-cal-day.selected { color: #2492EB; font-weight: 700; border: 1px dashed #2492EB; background: #EFF6FF; }
  .bm-cal-day.blank { visibility: hidden; }

  .bm-time-row { display: flex; align-items: center; gap: 1rem; margin-top: 1.1rem; flex-wrap: wrap; }
  .bm-time-label { font-size: 0.9375rem; font-weight: 700; color: #2492EB; flex-shrink: 0; }
  .bm-time-select-wrap { position: relative; flex: 1; min-width: 100px; }
  .bm-time-select {
    width: 100%; text-align: right; border: none; border-bottom: 1px solid #D1D5DB; background: none;
    padding: 0.4rem 0.1rem; font-size: 0.9375rem; font-weight: 600; color: #111827; cursor: pointer;
  }
  .bm-time-dropdown {
    position: absolute; top: calc(100% + 0.35rem); right: 0; width: 100%; max-height: 180px; overflow-y: auto;
    background: #fff; border-radius: 0.75rem; box-shadow: 0 12px 32px rgba(0,0,0,0.15); z-index: 10;
  }
  .bm-time-option {
    width: 100%; text-align: center; padding: 0.7rem; font-size: 0.9375rem; font-weight: 600; color: #111827;
    border: none; background: none; cursor: pointer;
  }
  .bm-time-option:hover { background: #F3F4F6; }
  .bm-time-option.active { background: #E5E7EB; }

  .bm-summary {
    margin-top: 1.1rem; background: #EFF6FF; border-radius: 0.875rem; padding: 0.9rem 1rem; text-align: center;
  }
  .bm-summary-label { font-size: 0.8125rem; font-weight: 700; color: #2492EB; }
  .bm-summary-value { font-size: 0.9375rem; font-style: italic; color: #2492EB; margin-top: 0.2rem; word-break: break-word; }
  .bm-summary-placeholder { font-size: 0.875rem; color: #9CA3AF; }

  .bm-actions-col { display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.25rem; }
  .bm-btn { border: none; border-radius: 999px; padding: 0.9rem 1.25rem; font-weight: 700; cursor: pointer; font-size: 0.9375rem; }
  .bm-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .bm-btn-primary { background: #2492EB; color: #fff; }
  .bm-btn-outline { background: #fff; color: #2492EB; border: 1px solid #2492EB; }
  .bm-btn-full { width: 100%; box-sizing: border-box; }

  .bm-success { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; padding: 1rem 0; }
  .bm-success-icon { width: 4rem; height: 4rem; border-radius: 999px; background: #ECFDF3; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .bm-success-title { font-size: 1.15rem; font-weight: 700; color: #111827; }
  .bm-success-sub { font-size: 0.9rem; color: #6B7280; max-width: 320px; }

  @media (max-width: 560px) {
    .bm-overlay { padding: 0; align-items: flex-end; }
    .bm-card { width: 100%; max-width: 100%; max-height: 92vh; border-radius: 1.25rem 1.25rem 0 0; padding: 1.25rem; }
    .bm-title { font-size: 1.1rem; }
    .bm-cal { padding: 0.875rem 0.75rem 1rem; }
    .bm-cal-day { font-size: 0.8125rem; }
    .bm-time-row { gap: 0.5rem; }
  }
  @media (max-width: 360px) {
    .bm-card { padding: 1rem; }
    .bm-cal-weekday { font-size: 0.625rem; }
  }
`

export default function BookSessionModal({ onClose, onBooked }: BookSessionModalProps) {
  const [step, setStep] = useState<Step>('course')
  const [courses, setCourses] = useState<EnrolledCourseOption[]>([])
  const [slots, setSlots] = useState<LiveSlot[]>([])
  const [selectedCourse, setSelectedCourse] = useState<EnrolledCourseOption | null>(null)

  const [viewYear, setViewYear] = useState(0)
  const [viewMonth, setViewMonth] = useState(0)
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<LiveSlot | null>(null)
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    liveSessionsAPI.getEnrolledCoursesForBooking().then((res) => {
      if (res.success) setCourses(res.data)
      else setError(res.error)
      setLoading(false)
    })
  }, [])

  function chooseCourse(course: EnrolledCourseOption) {
    setSelectedCourse(course)
    setStep('datetime')
    setLoading(true)
    setError(null)
    setSelectedDateKey(null)
    setSelectedSlot(null)
    liveSessionsAPI.getCourseSlots(course.course_slug).then((res) => {
      if (!res.success) {
        setError(res.error)
        setLoading(false)
        return
      }
      // Only open slots are bookable — booked/unavailable rows are excluded.
      const open = res.data.filter((s) => s.status === 'open')
      setSlots(open)
      if (open.length > 0) {
        const first = new Date(open[0].starts_at)
        setViewYear(first.getFullYear())
        setViewMonth(first.getMonth())
      } else {
        const now = new Date()
        setViewYear(now.getFullYear())
        setViewMonth(now.getMonth())
      }
      setLoading(false)
    })
  }

  const slotsByDate = useMemo(() => {
    const map = new Map<string, LiveSlot[]>()
    for (const s of slots) {
      const key = slotDateKey(s.starts_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    }
    return map
  }, [slots])

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const timesForSelectedDate = selectedDateKey ? (slotsByDate.get(selectedDateKey) ?? []) : []

  function selectDate(d: Date) {
    const key = dateKey(d)
    if (!slotsByDate.has(key)) return
    setSelectedDateKey(key)
    const times = slotsByDate.get(key)!
    setSelectedSlot(times[0])
    setTimeDropdownOpen(false)
  }

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11 }
      return m - 1
    })
  }
  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0 }
      return m + 1
    })
  }

  async function confirmBooking() {
    if (!selectedSlot) return
    setSubmitting(true)
    setError(null)
    const res = await liveSessionsAPI.bookSlot(selectedSlot.id)
    setSubmitting(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    setStep('success')
  }

  function goBack() {
    setError(null)
    setStep('course')
    setSelectedDateKey(null)
    setSelectedSlot(null)
  }

  const bookingTrainerName = selectedCourse?.trainer_name || 'your trainer'
  const bookingCourseTitle = selectedCourse?.title || 'this course'
  const bookingSuccessCopy = `Your booking request for ${bookingCourseTitle} with ${bookingTrainerName} has been sent. You’ll see it under Upcoming once approved.`

  return (
    <>
      <style>{MODAL_CSS}</style>
      <div className="bm-overlay" onClick={onClose}>
        <div className="bm-card" onClick={(e) => e.stopPropagation()}>
          <div className="bm-head">
            <div className="bm-head-left">
              {step === 'datetime' && (
                <button type="button" className="bm-back" onClick={goBack} aria-label="Back">
                  <ChevronLeft size={16} />
                </button>
              )}
              <div className="bm-titlewrap">
                {step === 'course' && <h2 className="bm-title">Select a course</h2>}
                {step === 'datetime' && (
                  <>
                    <h2 className="bm-title">Select a date</h2>
                    <p className="bm-subtitle">Pick a date from your tutor's schedule.</p>
                  </>
                )}
                {step === 'success' && <h2 className="bm-title">Booking sent</h2>}
              </div>
            </div>
            <button type="button" className="bm-close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="bm-body">
            {error && <div className="bm-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

            {step === 'course' && (
              loading ? (
                <div className="bm-course-list">
                  {[0, 1, 2].map((i) => <div key={i} className="bm-skeleton" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="bm-empty">You're not enrolled in any course with live sessions yet.</div>
              ) : (
                <div className="bm-course-list">
                  {courses.map((c) => (
                    <button key={c.course_slug} type="button" className="bm-course-row" onClick={() => chooseCourse(c)}>
                      <div className="bm-course-thumb">
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt="" />
                          : c.title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="bm-course-main">
                        <div className="bm-course-title">{c.title}</div>
                        {c.trainer_name && <div className="bm-course-sub">{c.trainer_name}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}

            {step === 'datetime' && (
              loading ? (
                <div className="bm-skeleton" style={{ height: 320 }} />
              ) : slots.length === 0 ? (
                <div className="bm-empty">No open slots right now — check back soon.</div>
              ) : (
                <>
                  <div className="bm-cal">
                    <div className="bm-cal-head">
                      <button type="button" className="bm-cal-nav" onClick={goPrevMonth} aria-label="Previous month">
                        <ChevronLeft size={18} />
                      </button>
                      <span className="bm-cal-month">{MONTH_LABELS[viewMonth]} {viewYear}</span>
                      <button type="button" className="bm-cal-nav" onClick={goNextMonth} aria-label="Next month">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="bm-cal-grid">
                      {WEEKDAY_LABELS.map((w) => (
                        <div key={w} className="bm-cal-weekday">{w}</div>
                      ))}
                      {grid.map((d, i) => {
                        if (!d) return <div key={i} className="bm-cal-day blank" />
                        const key = dateKey(d)
                        const available = slotsByDate.has(key)
                        const isSelected = key === selectedDateKey
                        return (
                          <button
                            key={i}
                            type="button"
                            className={`bm-cal-day${available ? ' available' : ''}${isSelected ? ' selected' : ''}`}
                            onClick={() => selectDate(d)}
                            disabled={!available}
                          >
                            {d.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bm-time-row">
                    <span className="bm-time-label">Select Time:</span>
                    <div className="bm-time-select-wrap">
                      <button
                        type="button"
                        className="bm-time-select"
                        disabled={!selectedDateKey}
                        onClick={() => setTimeDropdownOpen((v) => !v)}
                      >
                        {selectedSlot ? formatTimeLabel(selectedSlot.starts_at) : '—'}
                      </button>
                      {timeDropdownOpen && timesForSelectedDate.length > 0 && (
                        <div className="bm-time-dropdown">
                          {timesForSelectedDate.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              className={`bm-time-option${selectedSlot?.id === s.id ? ' active' : ''}`}
                              onClick={() => { setSelectedSlot(s); setTimeDropdownOpen(false) }}
                            >
                              {formatTimeLabel(s.starts_at)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bm-summary">
                    <div className="bm-summary-label">Selected Appointment Time</div>
                    {selectedDateKey && selectedSlot ? (
                      <div className="bm-summary-value">
                        {formatSelectedSummary(new Date(selectedDateKey), selectedSlot.starts_at)}
                      </div>
                    ) : (
                      <div className="bm-summary-placeholder">Pick a date and time above</div>
                    )}
                  </div>

                  <div className="bm-actions-col">
                    <button
                      type="button"
                      className="bm-btn bm-btn-primary bm-btn-full"
                      onClick={confirmBooking}
                      disabled={!selectedSlot || submitting}
                    >
                      {submitting ? 'Booking…' : 'Book a session'}
                    </button>
                    <button type="button" className="bm-btn bm-btn-outline bm-btn-full" onClick={onClose} disabled={submitting}>
                      Cancel
                    </button>
                  </div>
                </>
              )
            )}

            {step === 'success' && (
              <div className="bm-success">
                <div className="bm-success-icon"><CheckCircle2 size={30} color="#16A34A" /></div>
                <div className="bm-success-title">Booking Request Sent</div>
                <div className="bm-success-sub">
                  {bookingSuccessCopy}
                </div>
                <button
                  type="button"
                  className="bm-btn bm-btn-primary bm-btn-full"
                  style={{ marginTop: '0.75rem' }}
                  onClick={onBooked}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}