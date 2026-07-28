// pages/trainer/bookings/TrainerBookingsPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { Users, Clock, CheckCircle2, Check, X as XIcon, Video } from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import {
  liveSessionsAPI,
  type LiveManageBooking,
} from '../../../../services/api'

const PAGE_CSS = `
  .bk-page { padding: 1rem; background: #F5F5F5; }

  .bk-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .bk-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .bk-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .bk-stat-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .bk-stat-title { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .bk-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .bk-section-title { margin: 1.5rem 0 0.85rem; font-size: 1.1rem; font-weight: 700; color: #111827; }

  .bk-empty-state { background: #fff; border-radius: 1rem; padding: 2rem 1rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.12); }
  .bk-error-state { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 1rem; padding: 1rem; font-size: 0.875rem; }

  .bk-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .bk-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }
  .bk-card-body { display: flex; align-items: flex-start; gap: 0.85rem; padding: 1.1rem; }
  .bk-avatar { width: 42px; height: 42px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 700; }
  .bk-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .bk-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .bk-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; text-transform: capitalize; }
  .bk-status-badge.requested { background: #FEF3C7; color: #D97706; }
  .bk-status-badge.confirmed { background: #DCFCE7; color: #16A34A; }
  .bk-status-badge.rejected { background: #FEE2E2; color: #DC2626; }
  .bk-status-badge.cancelled { background: #F3F4F6; color: #6B7280; }
  .bk-session-title { margin: 0.35rem 0 0; color: #2563EB; font-weight: 600; font-size: 0.875rem; }
  .bk-meta { margin: 0.35rem 0 0; color: #9CA3AF; font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem; }

  .bk-actions { display: flex; border-top: 1px solid #F3F4F6; }
  .bk-action-btn { flex: 1; border: none; background: none; cursor: pointer; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.875rem; font-weight: 700; }
  .bk-action-btn.confirm { color: #16A34A; border-right: 1px solid #F3F4F6; }
  .bk-action-btn.reject { color: #DC2626; }
  .bk-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (min-width: 640px) {
    .bk-page { padding: 1.5rem; }
    .bk-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .bk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (min-width: 1024px) {
    .bk-page { padding: 1.5rem 2rem 2rem; }
  }
`

/** Safe against missing/null names — some bookings may not have full learner data yet */
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

/** Safe against missing/null slot timestamps */
function formatSlotTime(startsAt?: string | null, endsAt?: string | null) {
  if (!startsAt || !endsAt) return 'Time unavailable'
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Time unavailable'
  const dateStr = start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${startTime}–${endTime}`
}

export default function TrainerBookingsPage() {
  const [bookings, setBookings] = useState<LiveManageBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setLoadError(null)

    const result = await liveSessionsAPI.getManageBookings()
    if (result.success) {
      // TEMP DEBUG — remove once the learner/slot shape mismatch is confirmed & fixed.
      // eslint-disable-next-line no-console
      console.log('bookings raw:', JSON.stringify(result.data, null, 2))
      setBookings(result.data)
    } else {
      setLoadError(result.error)
    }

    setLoading(false)
  }

  const stats = useMemo(() => {
    const requested = bookings.filter((b) => b.status === 'requested').length
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length
    return { total: bookings.length, requested, confirmed }
  }, [bookings])

  const requestedBookings = bookings.filter((b) => b.status === 'requested')
  const otherBookings = bookings.filter((b) => b.status !== 'requested')

  async function handleConfirm(bookingId: string) {
    setActioningId(bookingId)
    setActionError(null)
    const result = await liveSessionsAPI.confirmBooking(bookingId)
    setActioningId(null)

    if (!result.success) {
      setActionError(result.error)
      return
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'confirmed' } : b)),
    )
  }

  async function handleReject(bookingId: string) {
    setActioningId(bookingId)
    setActionError(null)
    const result = await liveSessionsAPI.rejectBooking(bookingId)
    setActioningId(null)

    if (!result.success) {
      setActionError(result.error)
      return
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b)),
    )
  }

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="bk-page">
        {loadError && <div className="bk-error-state">{loadError}</div>}
        {actionError && (
          <div className="bk-error-state" style={{ marginTop: loadError ? '0.75rem' : 0 }}>
            {actionError}
          </div>
        )}

        <div className="bk-stats">
          <div className="bk-stat-card">
            <div className="bk-stat-top">
              <div>
                <p className="bk-stat-value">{loading ? '—' : stats.total}</p>
                <p className="bk-stat-title">Total Bookings</p>
              </div>
              <div className="bk-stat-icon" style={{ background: '#DBEAFE' }}>
                <Users size={16} color="#2563EB" />
              </div>
            </div>
          </div>
          <div className="bk-stat-card">
            <div className="bk-stat-top">
              <div>
                <p className="bk-stat-value">{loading ? '—' : stats.requested}</p>
                <p className="bk-stat-title">Requested</p>
              </div>
              <div className="bk-stat-icon" style={{ background: '#FEF3C7' }}>
                <Clock size={16} color="#D97706" />
              </div>
            </div>
          </div>
          <div className="bk-stat-card">
            <div className="bk-stat-top">
              <div>
                <p className="bk-stat-value">{loading ? '—' : stats.confirmed}</p>
                <p className="bk-stat-title">Confirmed</p>
              </div>
              <div className="bk-stat-icon" style={{ background: '#D1FAE5' }}>
                <CheckCircle2 size={16} color="#059669" />
              </div>
            </div>
          </div>
        </div>

        <h3 className="bk-section-title">Requested Bookings</h3>
        {loading ? (
          <div className="bk-empty-state">Loading…</div>
        ) : requestedBookings.length === 0 ? (
          <div className="bk-empty-state">No pending booking requests right now.</div>
        ) : (
          <div className="bk-grid">
            {requestedBookings.map((booking) => (
              <div key={booking.id} className="bk-card">
                <div className="bk-card-body">
                  <div className="bk-avatar">
  {initials(booking.learner_name)}
</div>

<div style={{ minWidth: 0 }}>
  <div className="bk-name-row">
    <p className="bk-name">
      {booking.learner_name ?? 'Unknown learner'}
    </p>

    <span className={`bk-status-badge ${booking.status}`}>
      {booking.status}
    </span>
  </div>
  <p className="bk-meta">
    <Video size={13} />{' '}
    {formatSlotTime(
      booking.slot_starts_at,
      booking.slot_ends_at
    )}
  </p>
</div>
                </div>
                <div className="bk-actions">
                  <button
                    type="button"
                    className="bk-action-btn confirm"
                    disabled={actioningId === booking.id}
                    onClick={() => handleConfirm(booking.id)}
                  >
                    <Check size={16} /> Confirm
                  </button>
                  <button
                    type="button"
                    className="bk-action-btn reject"
                    disabled={actioningId === booking.id}
                    onClick={() => handleReject(booking.id)}
                  >
                    <XIcon size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 className="bk-section-title">Confirmed &amp; Past Bookings</h3>
        {loading ? (
          <div className="bk-empty-state">Loading…</div>
        ) : otherBookings.length === 0 ? (
          <div className="bk-empty-state">No other bookings yet.</div>
        ) : (
          <div className="bk-grid">
            {otherBookings.map((booking) => (
              <div key={booking.id} className="bk-card">
                <div className="bk-card-body">
                  <div className="bk-avatar">
  {initials(booking.learner_name)}
</div>

<div style={{ minWidth: 0 }}>
  <div className="bk-name-row">
    <p className="bk-name">
      {booking.learner_name ?? 'Unknown learner'}
    </p>
    <span className={`bk-status-badge ${booking.status}`}>
      {booking.status}
    </span>
  </div>
  <p className="bk-meta">
    <Video size={13} />{' '}
    {formatSlotTime(
      booking.slot_starts_at,
      booking.slot_ends_at
    )}
  </p>
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TrainerShell>
  )
}