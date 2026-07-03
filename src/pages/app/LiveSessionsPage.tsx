import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Calendar, Users, Radio } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient } from '../../services/api'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'

// ── Types ──────────────────────────────────────────────────────────────────
// Confirmed against GET /v1/live/sessions/ and /v1/live/sessions/{id}/:
// id, course_id, title, topic, starts_at, ends_at, status, join_url,
// trainer_name are REAL fields. Everything below "Optional / unconfirmed
// fields" is NOT in the current API response — keep these optional and hide
// the related UI element when a field is missing, since the backend may
// never add some of these.
export interface LiveSessionSummary {
  id: string
  course_id: string
  title: string
  topic: string
  starts_at: string
  ends_at: string
  status: string // 'live' | 'upcoming' | 'past' (past not yet confirmed on this endpoint)
  join_url: string
  trainer_name: string
  // Optional / unconfirmed fields:
  trainer_avatar_url?: string
  trainer_title?: string
  trainer_rating?: number
  watching_count?: number
  course_title?: string
  module_title?: string
}

type TabKey = 'today' | 'upcoming' | 'past'

// ── Helpers ────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDayHeader(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}

function durationMins(startIso: string, endIso: string): number | null {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (isNaN(start) || isNaN(end) || end <= start) return null
  return Math.round((end - start) / 60000)
}

function minutesAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

// ── Small components ───────────────────────────────────────────────────────
function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  if (url) {
    return <img src={url} alt={name} className="avatar-img" style={{ width: size, height: size }} />
  }
  return (
    <div className="avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  )
}

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .ls-content { padding: 2rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 1.5rem; max-width: 1100px; }
  .ls-header-title { font-size: 1.625rem; font-weight: 700; color: #111; }
  .ls-header-sub { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

  .ls-tabs { display: flex; background: #F3F4F6; border-radius: 0.75rem; padding: 4px; gap: 4px; }
  .ls-tab { flex: 1; text-align: center; padding: 0.625rem 1rem; border-radius: 0.6rem; border: none; background: transparent; font-size: 0.875rem; font-weight: 700; color: #6B7280; cursor: pointer; }
  .ls-tab.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

  .avatar-img { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .avatar-fallback { border-radius: 50%; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }

  .ls-section-label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #EF4444; margin-bottom: 0.75rem; }
  .ls-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #EF4444; animation: ls-pulse 1.4s ease-in-out infinite; }
  @keyframes ls-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

  .ls-hero { position: relative; border-radius: 1rem; overflow: hidden; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); cursor: pointer; }
  .ls-hero-top { position: relative; padding: 1.5rem 1.75rem 2.25rem; display: flex; align-items: center; gap: 0.875rem; z-index: 1; }
  .ls-hero-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(17,24,39,0.88) 0%, rgba(17,24,39,0.55) 60%, rgba(17,24,39,0.35) 100%); }
  .ls-hero-badges { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
  .ls-badge-live { display: inline-flex; align-items: center; gap: 0.3rem; background: #EF4444; color: #fff; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.06em; padding: 0.2rem 0.55rem; border-radius: 2rem; }
  .ls-badge-cat { color: #D1D5DB; font-size: 0.75rem; font-weight: 600; }
  .ls-hero-title { color: #fff; font-size: 1.375rem; font-weight: 700; }
  .ls-hero-meta { display: flex; align-items: center; gap: 1rem; color: #D1D5DB; font-size: 0.8125rem; margin-top: 0.375rem; }
  .ls-hero-meta-item { display: flex; align-items: center; gap: 0.3rem; }
  .ls-hero-btn { position: relative; z-index: 1; width: 100%; border: none; background: #EF4444; color: #fff; font-size: 0.9375rem; font-weight: 700; padding: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .ls-hero-btn:hover { background: #DC2626; }

  .ls-schedule-label { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 0.75rem; }

  .ls-timeline-row { display: flex; gap: 1.25rem; margin-bottom: 1rem; }
  .ls-timeline-time { width: 64px; flex-shrink: 0; font-size: 0.9375rem; font-weight: 700; color: #111; padding-top: 1rem; }
  .ls-timeline-track { position: relative; flex: 1; }
  .ls-timeline-track::before { content: ''; position: absolute; left: -0.625rem; top: 0; bottom: -1rem; width: 1px; background: #F3D9D9; }

  .ls-day-header { font-size: 0.9375rem; font-weight: 700; color: #111; margin: 0.5rem 0 0.75rem; }
  .ls-day-header .ls-day-date { font-weight: 500; color: #9CA3AF; margin-left: 0.4rem; }

  .ls-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
  .ls-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); border-color: #D1D5DB; }
  .ls-card.live { border-color: #FCA5A5; background: #FFF9F9; }
  .ls-card-main { flex: 1; min-width: 0; }
  .ls-card-badges { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .ls-cat-badge { font-size: 0.7rem; font-weight: 700; color: #2563EB; background: #EFF6FF; padding: 0.15rem 0.55rem; border-radius: 0.4rem; }
  .ls-card-title { font-size: 0.9375rem; font-weight: 700; color: #111; line-height: 1.3; }
  .ls-card-meta { font-size: 0.75rem; color: #6B7280; margin-top: 0.3rem; display: flex; align-items: center; gap: 0.3rem; }
  .ls-card-tutor { font-size: 0.75rem; color: #9CA3AF; margin-top: 0.15rem; }
  .ls-join-btn { padding: 0.55rem 1.15rem; border-radius: 2rem; border: none; background: #EF4444; color: #fff; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .ls-join-btn:hover { opacity: 0.9; }
  .ls-remind-btn { padding: 0.55rem 1.15rem; border-radius: 2rem; border: 1.5px solid #E5E7EB; background: #fff; color: #374151; font-size: 0.8125rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .ls-remind-btn:hover { background: #F9FAFB; }

  .ls-empty { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3.5rem 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
  .ls-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .ls-empty-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .ls-empty-sub { font-size: 0.8125rem; color: #6B7280; max-width: 320px; line-height: 1.6; }

  @media (max-width: 640px) {
    .ls-content { padding: 1.25rem 1rem 5rem; }
    .ls-card { flex-wrap: wrap; }
    .ls-join-btn, .ls-remind-btn { width: 100%; }
  }
`

export default function LiveSessionsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState('live')
  const [tab, setTab] = useState<TabKey>('today')
  const [sessions, setSessions] = useState<LiveSessionSummary[]>([])
  const [pastSessions, setPastSessions] = useState<LiveSessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [pastLoading, setPastLoading] = useState(false)
  const [pastLoaded, setPastLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<LiveSessionSummary[]>('/v1/live/sessions/')
        setSessions(response.data || [])
      } catch (err) {
        console.error('Failed to fetch live sessions:', err)
        setError('Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchSessions()
  }, [user])

  // Past sessions: the documented endpoint only returns live + upcoming, so
  // this assumes a `?status=past` filter exists. If the backend 404s/ignores
  // it, we just show the empty state below instead of failing the page.
  useEffect(() => {
    if (tab !== 'past' || pastLoaded || !user) return
    const fetchPast = async () => {
      try {
        setPastLoading(true)
        const response = await apiClient.get<LiveSessionSummary[]>('/v1/live/sessions/?status=past')
        setPastSessions(response.data || [])
      } catch (err) {
        console.error('Failed to fetch past sessions:', err)
        setPastSessions([])
      } finally {
        setPastLoading(false)
        setPastLoaded(true)
      }
    }
    fetchPast()
  }, [tab, pastLoaded, user])

  function toggleReminder(id: string) {
    setRemindedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function goToSession(id: string) {
    navigate(RouteBuilder.liveSessionDetail(id))
  }

  const now = new Date()

  const { liveNow, todaySchedule, upcomingByDay } = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    const live = sorted.filter((s) => s.status === 'live')
    const today = sorted.filter((s) => s.status !== 'live' ? isSameDay(new Date(s.starts_at), now) : true)
    const upcoming = sorted.filter((s) => s.status !== 'live' && !isSameDay(new Date(s.starts_at), now))

    const grouped: { dateKey: string; iso: string; items: LiveSessionSummary[] }[] = []
    upcoming.forEach((s) => {
      const d = new Date(s.starts_at)
      const key = d.toDateString()
      let group = grouped.find((g) => g.dateKey === key)
      if (!group) {
        group = { dateKey: key, iso: s.starts_at, items: [] }
        grouped.push(group)
      }
      group.items.push(s)
    })

    return { liveNow: live, todaySchedule: today, upcomingByDay: grouped }
  }, [sessions])

  const hasToday = liveNow.length > 0 || todaySchedule.length > 0
  const hasUpcoming = upcomingByDay.length > 0

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="ls-content">
          <div>
            <div className="ls-header-title">Live Sessions</div>
            <div className="ls-header-sub">Join live classes, Q&As, and 1-on-1 sessions with your trainers.</div>
          </div>

          <div className="ls-tabs">
            <button className={`ls-tab${tab === 'today' ? ' active' : ''}`} onClick={() => setTab('today')}>Today</button>
            <button className={`ls-tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
            <button className={`ls-tab${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>Past</button>
          </div>

          {loading && tab !== 'past' && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading sessions...</div>
          )}

          {error && tab !== 'past' && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
          )}

          {!loading && !error && tab === 'today' && (
            <>
              {liveNow.length > 0 && (
                <div>
                  <div className="ls-section-label"><span className="ls-live-dot" /> Live now</div>
                  {liveNow.map((s) => {
                    const started = minutesAgo(s.starts_at)
                    return (
                      <div key={s.id} className="ls-hero" onClick={() => goToSession(s.id)} style={{ marginBottom: '1rem' }}>
                        <div className="ls-hero-overlay" />
                        <div className="ls-hero-top">
                          <Avatar name={s.trainer_name} url={s.trainer_avatar_url} size={44} />
                          <div>
                            <div className="ls-hero-badges">
                              <span className="ls-badge-live"><Radio size={10} /> Live</span>
                              {s.topic && <span className="ls-badge-cat">{s.topic}</span>}
                            </div>
                            <div className="ls-hero-title">{s.title}</div>
                            <div className="ls-hero-meta">
                              <span className="ls-hero-meta-item"><Clock size={12} /> Started {started} min ago</span>
                              {typeof s.watching_count === 'number' && (
                                <span className="ls-hero-meta-item"><Users size={12} /> {s.watching_count} watching</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          className="ls-hero-btn"
                          disabled={!s.join_url}
                          onClick={(e) => { e.stopPropagation(); if (s.join_url) window.open(s.join_url, '_blank') }}
                        >
                          Join now →
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <div>
                <div className="ls-schedule-label">Today's schedule</div>
                {!hasToday ? (
                  <div className="ls-empty">
                    <div className="ls-empty-icon"><Calendar size={26} color="#2563EB" /></div>
                    <div className="ls-empty-title">Nothing scheduled today</div>
                    <div className="ls-empty-sub">Check the Upcoming tab to see what's coming up next.</div>
                  </div>
                ) : (
                  todaySchedule.map((s) => {
                    const mins = durationMins(s.starts_at, s.ends_at)
                    return (
                      <div key={s.id} className="ls-timeline-row">
                        <div className="ls-timeline-time">{fmtTime(s.starts_at)}</div>
                        <div className="ls-timeline-track">
                          <div className={`ls-card${s.status === 'live' ? ' live' : ''}`} onClick={() => goToSession(s.id)}>
                            <Avatar name={s.trainer_name} url={s.trainer_avatar_url} />
                            <div className="ls-card-main">
                              <div className="ls-card-badges">
                                {s.status === 'live' && <span className="ls-badge-live"><Radio size={9} /> Live</span>}
                                {s.topic && <span className="ls-cat-badge">{s.topic}</span>}
                              </div>
                              <div className="ls-card-title">{s.title}</div>
                              <div className="ls-card-meta"><Clock size={12} /> {fmtTime(s.starts_at)}{mins ? ` · ${mins} min` : ''}</div>
                              <div className="ls-card-tutor">Tutor: {s.trainer_name}</div>
                            </div>
                            {s.status === 'live' ? (
                              <button
                                className="ls-join-btn"
                                disabled={!s.join_url}
                                onClick={(e) => { e.stopPropagation(); if (s.join_url) window.open(s.join_url, '_blank') }}
                              >
                                Join now
                              </button>
                            ) : (
                              <button className="ls-remind-btn" onClick={(e) => { e.stopPropagation(); toggleReminder(s.id) }}>
                                {remindedIds.has(s.id) ? 'Reminder set' : 'Remind me'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {!loading && !error && tab === 'upcoming' && (
            !hasUpcoming ? (
              <div className="ls-empty">
                <div className="ls-empty-icon"><Calendar size={26} color="#2563EB" /></div>
                <div className="ls-empty-title">No upcoming sessions yet</div>
                <div className="ls-empty-sub">New sessions from your trainers will show up here as they're scheduled.</div>
              </div>
            ) : (
              upcomingByDay.map((group) => (
                <div key={group.dateKey}>
                  <div className="ls-day-header">{fmtDayHeader(group.iso)}</div>
                  {group.items.map((s) => {
                    const mins = durationMins(s.starts_at, s.ends_at)
                    return (
                      <div key={s.id} className="ls-card" onClick={() => goToSession(s.id)} style={{ marginBottom: '0.875rem' }}>
                        <Avatar name={s.trainer_name} url={s.trainer_avatar_url} />
                        <div className="ls-card-main">
                          <div className="ls-card-badges">
                            {s.topic && <span className="ls-cat-badge">{s.topic}</span>}
                          </div>
                          <div className="ls-card-title">{s.title}</div>
                          <div className="ls-card-meta"><Clock size={12} /> {fmtTime(s.starts_at)}{mins ? ` · ${mins} min` : ''}</div>
                          <div className="ls-card-tutor">Tutor: {s.trainer_name}</div>
                        </div>
                        <button className="ls-remind-btn" onClick={(e) => { e.stopPropagation(); toggleReminder(s.id) }}>
                          {remindedIds.has(s.id) ? 'Reminder set' : 'Remind me'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))
            )
          )}

          {tab === 'past' && (
            pastLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading sessions...</div>
            ) : pastSessions.length === 0 ? (
              <div className="ls-empty">
                <div className="ls-empty-icon"><Clock size={26} color="#2563EB" /></div>
                <div className="ls-empty-title">No past sessions yet</div>
                <div className="ls-empty-sub">Sessions you've attended will be listed here for reference.</div>
              </div>
            ) : (
              pastSessions.map((s) => (
                <div key={s.id} className="ls-card" onClick={() => goToSession(s.id)} style={{ marginBottom: '0.875rem', opacity: 0.85 }}>
                  <Avatar name={s.trainer_name} url={s.trainer_avatar_url} />
                  <div className="ls-card-main">
                    <div className="ls-card-badges">
                      {s.topic && <span className="ls-cat-badge">{s.topic}</span>}
                    </div>
                    <div className="ls-card-title">{s.title}</div>
                    <div className="ls-card-meta"><Calendar size={12} /> {fmtDayHeader(s.starts_at)} · {fmtTime(s.starts_at)}</div>
                    <div className="ls-card-tutor">Tutor: {s.trainer_name}</div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </AppShell>
    </>
  )
}