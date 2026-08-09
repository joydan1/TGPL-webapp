import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Calendar, Users, Play } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient } from '../../services/api'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'


export interface LiveSessionSummary {
  id: string
  course_id: string
  title: string
  topic: string
  starts_at: string
  ends_at: string
  status: string 
  join_url: string
  trainer_name: string
  // Optional / unconfirmed fields:
  trainer_avatar_url?: string
  trainer_title?: string
  trainer_rating?: number
  watching_count?: number
  course_title?: string
  module_title?: string
  recording_url?: string
  background_image_url?: string
}

type TabKey = 'today' | 'upcoming' | 'past'

// ── Helpers ────────────────────────────────────────────────────────────────
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long' })
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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

const PAGE_CSS = `
  .ls-content { padding: 2rem clamp(1rem, 4vw, 2.5rem) 3rem; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; box-sizing: border-box; }
  .ls-header-title { font-size: 1.625rem; font-weight: 700; color: #111; }
  .ls-header-sub { font-size: 0.875rem; color: #6B7280; margin-top: 0.25rem; }

  .ls-tabs { display: flex; background: #F3F4F6; border-radius: 0.75rem; padding: 4px; gap: 4px; }
  .ls-tab { flex: 1; text-align: center; padding: 0.625rem 1rem; border-radius: 0.6rem; border: none; background: transparent; font-size: 0.875rem; font-weight: 700; color: #6B7280; cursor: pointer; }
  .ls-tab.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

  .avatar-img { border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .avatar-fallback { border-radius: 50%; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }

  .ls-section-label { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 1.1px; text-transform: uppercase; color: #FB2C36; margin-bottom: 0; }
  .ls-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #FB2C36; opacity: 0.88; animation: ls-pulse 1.4s ease-in-out infinite; }
  @keyframes ls-pulse { 0%,100% { opacity: 0.88; } 50% { opacity: 0.35; } }

  .ls-hero { position: relative; width: 100%; height: 152px; margin-top: 8px; box-sizing: border-box; border-radius: 16px; overflow: hidden; background: #2B3942; box-shadow: 0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1); cursor: pointer; }
  .ls-hero-bg-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.2; z-index: 0; }
  .ls-hero-top { position: relative; width: 100%; height: 100%; padding: 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-start; gap: 16px; z-index: 1; box-sizing: border-box; }
  .ls-hero-info { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .ls-hero-avatar-ring { display: flex; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,0.2); flex-shrink: 0; }
  .ls-hero-badges { display: flex; align-items: center; gap: 8px; }
  .ls-badge-live { display: inline-flex; align-items: center; gap: 4px; background: #FB2C36; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 0.45px; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; }
  .ls-badge-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0.88; }
  .ls-badge-cat { color: rgba(255,255,255,0.6); font-size: 10px; font-weight: 600; }
  .ls-hero-title { color: #fff; font-size: 14px; font-weight: 700; line-height: 19px; margin-top: 4px; }
  .ls-hero-meta { display: flex; align-items: center; gap: 12px; color: rgba(255,255,255,0.5); font-size: 10px; margin-top: 4px; }
  .ls-hero-meta-item { display: flex; align-items: center; gap: 4px; }
  .ls-hero-btn { position: relative; z-index: 1; flex-shrink: 0; box-sizing: border-box; width: 132px; height: 40px; border: none; background: #FB2C36; color: #fff; font-size: 14px; font-weight: 700; padding: 10px 24px; border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; white-space: nowrap; box-shadow: 0px 10px 15px -3px rgba(130,24,26,0.3), 0px 4px 6px -4px rgba(130,24,26,0.3); }
  .ls-hero-btn:hover { background: #E0212E; }

  .ls-schedule-label { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 0.75rem; }

  .ls-timeline-row { display: flex; gap: 1.25rem; margin-bottom: 1rem; }
  .ls-timeline-time { width: 64px; flex-shrink: 0; font-size: 0.9375rem; font-weight: 700; color: #111; padding-top: 1rem; }
  .ls-timeline-track { position: relative; flex: 1; min-width: 0; }
  .ls-timeline-track::before { content: ''; position: absolute; left: -0.625rem; top: 0; bottom: -1rem; width: 1px; background: #F3D9D9; }

  .ls-day-header-row { display: flex; align-items: center; gap: 8px; margin: 0.5rem 0 0.75rem; }
  .ls-day-weekday { font-weight: 700; font-size: 12px; line-height: 18px; color: #2B3942; }
  .ls-day-date { font-weight: 500; font-size: 10px; line-height: 15px; color: #99A1AF; }
  .ls-day-divider { flex: 1; height: 1px; background: #F3F4F6; }

  .ls-card { box-sizing: border-box; background: #fff; border: 1px solid #F3F4F6; border-radius: 16px; padding: 16px; box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
  .ls-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); border-color: #D1D5DB; }
  .ls-card.live { border-color: #FCA5A5; background: #FFF9F9; }
  .ls-card-main { flex: 1; min-width: 0; }
  .ls-card-badges { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .ls-cat-badge { font-size: 10px; font-weight: 600; color: #2492EB; background: #EFF6FF; padding: 2px 6px; border-radius: 6px; line-height: 15px; }
  .ls-card-title { font-size: 13px; font-weight: 600; color: #2B3942; line-height: 18px; }
  .ls-card-meta { font-size: 10px; color: #99A1AF; margin-top: 4px; display: flex; align-items: center; gap: 4px; line-height: 15px; }
  .ls-card-tutor { font-size: 10px; color: #99A1AF; margin-top: 2px; line-height: 15px; }
  .ls-join-btn { padding: 0.55rem 1.15rem; border-radius: 2rem; border: none; background: #FB2C36; color: #fff; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .ls-join-btn:hover { background: #E0212E; opacity: 1; }
  .ls-remind-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #E5E7EB; background: #F9FAFB; color: #6A7282; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .ls-remind-btn:hover { background: #F3F4F6; }

  .ls-filter-row { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
  .ls-filter-pill { padding: 0.5rem 1.1rem; border-radius: 2rem; border: none; background: #F3F4F6; color: #374151; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .ls-filter-pill:hover { background: #E5E7EB; }
  .ls-filter-pill.active { background: #2563EB; color: #fff; }
  .ls-filter-pill.active:hover { background: #2563EB; }

  .ls-past-card { box-sizing: border-box; background: #fff; border: 1px solid #F3F4F6; border-radius: 16px; padding: 16px; box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
  .ls-past-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.1); border-color: #D1D5DB; }
  .ls-past-card-avatar { opacity: 0.7; }
  .ls-past-card-main { flex: 1; min-width: 0; }
  .ls-past-card-badges { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
  .ls-past-card-date { font-size: 10px; color: #99A1AF; font-weight: 400; }
  .ls-past-card-title { font-size: 13px; font-weight: 600; color: #4A5565; line-height: 18px; margin-bottom: 4px; }
  .ls-past-card-meta { display: flex; align-items: center; gap: 12px; font-size: 10px; color: #99A1AF; }
  .ls-past-card-meta-item { display: flex; align-items: center; gap: 4px; }
  .ls-recording-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: none; background: #F3F4F6; color: #4A5565; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .ls-recording-btn:hover { background: #E5E7EB; }
  .ls-no-recording { font-size: 10px; color: #99A1AF; font-weight: 500; flex-shrink: 0; white-space: nowrap; }

  .ls-empty { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3.5rem 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
  .ls-empty-icon { width: 56px; height: 56px; border-radius: 50%; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .ls-empty-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .ls-empty-sub { font-size: 0.8125rem; color: #6B7280; max-width: 320px; line-height: 1.6; }

  @media (max-width: 640px) {
    .ls-content { padding: 1.25rem 1rem 5rem; }
    .ls-card { flex-wrap: wrap; }
    .ls-join-btn, .ls-remind-btn { width: 100%; }
    .ls-hero-btn { width: 100%; justify-content: center; }
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
  const [pastCategory, setPastCategory] = useState<string>('all')

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

  const pastCategories = useMemo(() => {
    const seen = new Set<string>()
    pastSessions.forEach((s) => { if (s.topic) seen.add(s.topic) })
    return Array.from(seen)
  }, [pastSessions])

  const filteredPastSessions = useMemo(() => {
    if (pastCategory === 'all') return pastSessions
    return pastSessions.filter((s) => s.topic === pastCategory)
  }, [pastSessions, pastCategory])

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
                        {s.background_image_url && (
                          <img className="ls-hero-bg-image" src={s.background_image_url} alt="" />
                        )}
                        <div className="ls-hero-top">
                          <div className="ls-hero-info">
                            <span className="ls-hero-avatar-ring"><Avatar name={s.trainer_name} url={s.trainer_avatar_url} size={44} /></span>
                            <div>
                              <div className="ls-hero-badges">
                                <span className="ls-badge-live"><span className="ls-badge-live-dot" /> Live</span>
                                {s.topic && <span className="ls-badge-cat">{s.topic}</span>}
                              </div>
                              <div className="ls-hero-title">{s.title}</div>
                              <div className="ls-hero-meta">
                                <span className="ls-hero-meta-item"><Clock size={9} /> Started {started} min ago</span>
                                {typeof s.watching_count === 'number' && (
                                  <span className="ls-hero-meta-item"><Users size={9} /> {s.watching_count} watching</span>
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
                                {s.status === 'live' && <span className="ls-badge-live"><span className="ls-badge-live-dot" /> Live</span>}
                                {s.topic && <span className="ls-cat-badge">{s.topic}</span>}
                              </div>
                              <div className="ls-card-title">{s.title}</div>
                              <div className="ls-card-meta"><Clock size={9} /> {fmtTime(s.starts_at)}{mins ? ` · ${mins} min` : ''}</div>
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
                  <div className="ls-day-header-row">
                    <span className="ls-day-weekday">{fmtWeekday(group.iso)}</span>
                    <span className="ls-day-date">{fmtDateShort(group.iso)}</span>
                    <span className="ls-day-divider" />
                  </div>
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
                          <div className="ls-card-meta"><Clock size={9} /> {fmtTime(s.starts_at)}{mins ? ` · ${mins} min` : ''}</div>
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
            <>
              {pastSessions.length > 0 && (
                <div className="ls-filter-row">
                  <button
                    className={`ls-filter-pill${pastCategory === 'all' ? ' active' : ''}`}
                    onClick={() => setPastCategory('all')}
                  >
                    All courses
                  </button>
                  {pastCategories.map((cat) => (
                    <button
                      key={cat}
                      className={`ls-filter-pill${pastCategory === cat ? ' active' : ''}`}
                      onClick={() => setPastCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {pastLoading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading sessions...</div>
              ) : filteredPastSessions.length === 0 ? (
                <div className="ls-empty">
                  <div className="ls-empty-icon"><Clock size={26} color="#2563EB" /></div>
                  <div className="ls-empty-title">No past sessions yet</div>
                  <div className="ls-empty-sub">Sessions you've attended will be listed here for reference.</div>
                </div>
              ) : (
                filteredPastSessions.map((s) => {
                  const mins = durationMins(s.starts_at, s.ends_at)
                  return (
                    <div key={s.id} className="ls-past-card" onClick={() => goToSession(s.id)} style={{ marginBottom: '0.875rem' }}>
                      <span className="ls-past-card-avatar"><Avatar name={s.trainer_name} url={s.trainer_avatar_url} /></span>
                      <div className="ls-past-card-main">
                        <div className="ls-past-card-badges">
                          {s.topic && <span className="ls-cat-badge">{s.topic}</span>}
                          <span className="ls-past-card-date">{fmtDateShort(s.starts_at)}</span>
                        </div>
                        <div className="ls-past-card-title">{s.title}</div>
                        <div className="ls-past-card-meta">
                          <span className="ls-past-card-meta-item">{s.trainer_name}</span>
                          {mins && <span className="ls-past-card-meta-item">{mins} min</span>}
                          {typeof s.watching_count === 'number' && (
                            <span className="ls-past-card-meta-item"><Users size={9} /> {s.watching_count}</span>
                          )}
                        </div>
                      </div>
                      {s.recording_url ? (
                        <button
                          className="ls-recording-btn"
                          onClick={(e) => { e.stopPropagation(); window.open(s.recording_url, '_blank') }}
                        >
                          <Play size={11} /> Recording
                        </button>
                      ) : (
                        <span className="ls-no-recording">No recording</span>
                      )}
                    </div>
                  )
                })
              )}
            </>
          )}
        </div>
      </AppShell>
    </>
  )
}