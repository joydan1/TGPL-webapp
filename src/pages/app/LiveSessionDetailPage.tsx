import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Calendar, Clock, Star, Radio, BookOpen, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient } from '../../services/api'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'
import type { LiveSessionSummary } from './LiveSessionsPage'


interface LiveSessionDetail extends LiveSessionSummary {
  description?: string
  agenda?: string[]
  audience_note?: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtFullDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const datePart = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  return isToday ? `Today, ${datePart}` : datePart
}

function fmtTimeWithZone(iso: string): string {
  const timePart = new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${timePart} WAT (UTC+1)`
}

function durationMins(startIso: string, endIso: string): number | null {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (isNaN(start) || isNaN(end) || end <= start) return null
  return Math.round((end - start) / 60000)
}

function initials(name: string): string {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

// ── Small components ───────────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <span className="lsd-star-row">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={10}
          color={i < rounded ? '#FBBF24' : '#E5E7EB'}
          fill={i < rounded ? '#FBBF24' : '#E5E7EB'}
        />
      ))}
    </span>
  )
}

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  /* Header */
  .lsd-header { height: 61px; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(1rem, 4vw, 3rem); border-bottom: 1px solid #F3F4F6; background: #fff; box-sizing: border-box; }
  .lsd-header-left { display: flex; align-items: center; gap: 0.625rem; }
  .lsd-back-circle { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #E5E7EB; background: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; padding: 0; }
  .lsd-back-circle:hover { background: #F9FAFB; }
  .lsd-header-label { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; color: #2B3942; }
  .lsd-live-pill { display: inline-flex; align-items: center; gap: 0.3rem; background: #FB2C36; color: #fff; font-family: 'Sora', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; padding: 0.3rem 0.7rem; border-radius: 2rem; }

  .lsd-content { padding: 16px clamp(1rem, 4vw, 3rem) 100px; display: flex; flex-direction: column; width: 100%; box-sizing: border-box; }

  /* Title / status */
  .lsd-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 16px; line-height: 22px; color: #2B3942; }
  .lsd-status-row { display: flex; align-items: center; gap: 6px; padding-top: 4px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 11px; line-height: 16px; color: #FB2C36; }
  .lsd-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #FB2C36; opacity: 0.54; animation: lsd-pulse 1.4s ease-in-out infinite; }
  @keyframes lsd-pulse { 0%,100% { opacity: 0.54; } 50% { opacity: 0.2; } }
  .lsd-status-row.upcoming { color: #6A7282; }
  .lsd-status-row.upcoming .lsd-status-dot { background: #99A1AF; opacity: 1; animation: none; }

  .lsd-section-margin { padding-top: 16px; }

  /* Trainer card */
  .lsd-trainer-card { box-sizing: border-box; display: flex; align-items: center; padding: 16px; gap: 16px; background: #fff; border: 1px solid #F3F4F6; box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1); border-radius: 16px; }
  .lsd-avatar-img { width: 56px; height: 56px; border-radius: 16px; object-fit: cover; flex-shrink: 0; }
  .lsd-avatar-fallback { width: 56px; height: 56px; border-radius: 16px; background: #DBEAFE; color: #2492EB; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 18px; flex-shrink: 0; }
  .lsd-trainer-name { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 13px; line-height: 20px; color: #2B3942; }
  .lsd-trainer-title { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 11px; line-height: 16px; color: #6A7282; padding-top: 2px; }
  .lsd-trainer-rating { display: flex; align-items: center; gap: 4px; padding-top: 4px; font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; line-height: 15px; color: #99A1AF; }
  .lsd-star-row { display: inline-flex; align-items: center; gap: 1px; }

  /* Info card (date/time/duration) */
  .lsd-info-card { box-sizing: border-box; display: flex; flex-direction: column; background: #fff; border: 1px solid #F3F4F6; box-shadow: 0px 1px 3px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1); border-radius: 16px; overflow: hidden; }
  .lsd-info-row { box-sizing: border-box; display: flex; align-items: center; padding: 12px 16px; gap: 12px; }
  .lsd-info-row + .lsd-info-row { border-top: 1px solid #F3F4F6; }
  .lsd-info-icon { width: 28px; height: 28px; border-radius: 8px; background: #EFF6FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lsd-info-label { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; line-height: 15px; color: #99A1AF; }
  .lsd-info-value { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; line-height: 18px; color: #2B3942; margin-top: 1px; }

  /* Linked course */
  .lsd-linked-course { box-sizing: border-box; display: flex; align-items: center; padding: 12px 16px; gap: 12px; background: rgba(239,246,255,0.6); border: 1px solid #DBEAFE; border-radius: 16px; cursor: pointer; }
  .lsd-linked-course:hover { background: rgba(239,246,255,0.9); }
  .lsd-linked-icon { width: 32px; height: 32px; border-radius: 12px; background: rgba(36,146,235,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lsd-linked-eyebrow { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 10px; line-height: 15px; letter-spacing: 0.25px; text-transform: uppercase; color: #2492EB; }
  .lsd-linked-title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; line-height: 18px; color: #2B3942; }
  .lsd-linked-module { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; line-height: 15px; color: #6A7282; }

  /* Section labels */
  .lsd-section-label { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 11px; line-height: 16px; letter-spacing: 1.1px; text-transform: uppercase; color: #99A1AF; }
  .lsd-desc { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 12.5px; line-height: 21px; color: #364153; padding-top: 8px; }

  /* Agenda */
  .lsd-agenda-list { padding-top: 8px; display: flex; flex-direction: column; }
  .lsd-agenda-item { display: flex; align-items: flex-start; gap: 10px; padding-top: 8px; }
  .lsd-agenda-item:first-child { padding-top: 0; }
  .lsd-agenda-icon { width: 20px; height: 20px; border-radius: 50%; background: rgba(36,146,235,0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .lsd-agenda-text { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 12px; line-height: 16px; color: #364153; padding-top: 2px; }

  /* Audience card */
  .lsd-audience-card { box-sizing: border-box; padding: 12px 16px; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 12px; }
  .lsd-audience-label { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 10px; line-height: 15px; letter-spacing: 1px; text-transform: uppercase; color: #99A1AF; }
  .lsd-audience-text { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 12px; line-height: 20px; color: #4A5565; padding-top: 4px; }

  /* Sticky footer */
  .lsd-sticky-bar { position: fixed; left: 260px; right: 0; bottom: 0; padding: 1rem clamp(1rem, 4vw, 3rem); background: linear-gradient(0deg, #fff 65%, rgba(255,255,255,0)); z-index: 5; display: flex; box-sizing: border-box; }
  .lsd-sticky-inner { width: 100%; display: flex; }
  .lsd-join-btn { width: 245px; height: 48px; border: none; border-radius: 0.75rem; background: #FB2C36; color: #fff; font-family: 'Sora', sans-serif; font-size: 0.875rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 8px 20px #FFC9C9; }
  .lsd-join-btn:hover { background: #E0212E; }
  .lsd-join-btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
  .lsd-remind-btn { width: 245px; height: 48px; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; background: #fff; color: #374151; font-family: 'Sora', sans-serif; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  .lsd-remind-btn:hover { background: #F9FAFB; }

  @media (max-width: 900px) {
    .lsd-sticky-bar { left: 0; }
  }
  @media (max-width: 640px) {
    .lsd-join-btn, .lsd-remind-btn { width: 100%; }
  }
`

export default function LiveSessionDetailPage() {
  const navigate = useNavigate()
  const { id: sessionId } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState('live')
  const [session, setSession] = useState<LiveSessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reminded, setReminded] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('No session ID in URL')
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<LiveSessionDetail>(`/v1/live/sessions/${sessionId}/`)
        setSession(response.data)
      } catch (err) {
        console.error('Failed to fetch session details:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }
    if (!isAuthenticated) return
    fetchSession()
  }, [isAuthenticated, sessionId])

  if (loading) {
    return (
      <>
        <style>{SHELL_CSS + PAGE_CSS}</style>
        <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
          <div className="lsd-header">
            <div className="lsd-header-left">
              <button className="lsd-back-circle" onClick={() => navigate(RouteBuilder.liveSessions())}>
                <ChevronLeft size={14} color="#2B3942" />
              </button>
              <span className="lsd-header-label">Session details</span>
            </div>
          </div>
          <div className="lsd-content"><div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading session...</div></div>
        </AppShell>
      </>
    )
  }

  if (error || !session) {
    return (
      <>
        <style>{SHELL_CSS + PAGE_CSS}</style>
        <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
          <div className="lsd-header">
            <div className="lsd-header-left">
              <button className="lsd-back-circle" onClick={() => navigate(RouteBuilder.liveSessions())}>
                <ChevronLeft size={14} color="#2B3942" />
              </button>
              <span className="lsd-header-label">Session details</span>
            </div>
          </div>
          <div className="lsd-content">
            <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error || 'Session not found'}</div>
          </div>
        </AppShell>
      </>
    )
  }

  const isLive = session.status === 'live'
  const mins = durationMins(session.starts_at, session.ends_at)

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="lsd-header">
          <div className="lsd-header-left">
            <button className="lsd-back-circle" onClick={() => navigate(RouteBuilder.liveSessions())}>
              <ChevronLeft size={14} color="#2B3942" />
            </button>
            <span className="lsd-header-label">Session details</span>
          </div>
          {isLive && <span className="lsd-live-pill"><Radio size={9} /> Live</span>}
        </div>

        <div className="lsd-content">
          <div>
            <div className="lsd-title">{session.title}</div>
            <div className={`lsd-status-row${isLive ? '' : ' upcoming'}`}>
              <span className="lsd-status-dot" />
              {isLive ? 'Session is live right now' : `Starts ${fmtFullDate(session.starts_at)} at ${fmtTimeWithZone(session.starts_at)}`}
            </div>
          </div>

          <div className="lsd-section-margin">
            <div className="lsd-trainer-card">
              {session.trainer_avatar_url ? (
                <img src={session.trainer_avatar_url} alt={session.trainer_name} className="lsd-avatar-img" />
              ) : (
                <div className="lsd-avatar-fallback">{initials(session.trainer_name)}</div>
              )}
              <div>
                <div className="lsd-trainer-name">{session.trainer_name}</div>
                {session.trainer_title && <div className="lsd-trainer-title">{session.trainer_title}</div>}
                {typeof session.trainer_rating === 'number' && (
                  <div className="lsd-trainer-rating">
                    <StarRow rating={session.trainer_rating} />
                    {session.trainer_rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lsd-section-margin">
            <div className="lsd-info-card">
              <div className="lsd-info-row">
                <div className="lsd-info-icon"><Calendar size={13} color="#2492EB" /></div>
                <div>
                  <div className="lsd-info-label">Date</div>
                  <div className="lsd-info-value">{fmtFullDate(session.starts_at)}</div>
                </div>
              </div>
              <div className="lsd-info-row">
                <div className="lsd-info-icon"><Clock size={13} color="#2492EB" /></div>
                <div>
                  <div className="lsd-info-label">Time</div>
                  <div className="lsd-info-value">{fmtTimeWithZone(session.starts_at)}</div>
                </div>
              </div>
              {mins !== null && (
                <div className="lsd-info-row">
                  <div className="lsd-info-icon"><Clock size={13} color="#2492EB" /></div>
                  <div>
                    <div className="lsd-info-label">Duration</div>
                    <div className="lsd-info-value">{mins} min</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {session.course_title && (
            <div className="lsd-section-margin">
              <div className="lsd-linked-course" onClick={() => navigate(RouteBuilder.course(session.course_id))}>
                <div className="lsd-linked-icon"><BookOpen size={15} color="#2492EB" /></div>
                <div>
                  <div className="lsd-linked-eyebrow">Linked course</div>
                  <div className="lsd-linked-title">{session.course_title}</div>
                  {session.module_title && <div className="lsd-linked-module">{session.module_title}</div>}
                </div>
              </div>
            </div>
          )}

          {session.description && (
            <div className="lsd-section-margin">
              <div className="lsd-section-label">About this session</div>
              <div className="lsd-desc">{session.description}</div>
            </div>
          )}

          {session.agenda && session.agenda.length > 0 && (
            <div className="lsd-section-margin">
              <div className="lsd-section-label">What's covered</div>
              <div className="lsd-agenda-list">
                {session.agenda.map((item, i) => (
                  <div key={i} className="lsd-agenda-item">
                    <div className="lsd-agenda-icon"><CheckCircle2 size={11} color="#2492EB" /></div>
                    <div className="lsd-agenda-text">{item}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.audience_note && (
            <div className="lsd-section-margin">
              <div className="lsd-audience-card">
                <div className="lsd-audience-label">Who this is for</div>
                <div className="lsd-audience-text">{session.audience_note}</div>
              </div>
            </div>
          )}
        </div>

        <div className="lsd-sticky-bar">
          <div className="lsd-sticky-inner">
            {isLive ? (
              <button
                className="lsd-join-btn"
                disabled={!session.join_url}
                onClick={() => session.join_url && window.open(session.join_url, '_blank')}
              >
                <Radio size={16} /> Join session now
              </button>
            ) : (
              <button className="lsd-remind-btn" onClick={() => setReminded((r) => !r)}>
                {reminded ? 'Reminder set ✓' : 'Remind me'}
              </button>
            )}
          </div>
        </div>
      </AppShell>
    </>
  )
}