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

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .lsd-content { padding: 2rem 2.5rem 6.5rem; display: flex; flex-direction: column; gap: 1.25rem; max-width: 900px; }
  .lsd-top { display: flex; align-items: center; justify-content: space-between; }
  .lsd-back { display: flex; align-items: center; gap: 0.4rem; background: none; border: none; font-size: 0.9375rem; font-weight: 700; color: #111; cursor: pointer; padding: 0; }
  .lsd-back:hover { opacity: 0.75; }
  .lsd-live-pill { display: inline-flex; align-items: center; gap: 0.3rem; background: #EF4444; color: #fff; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; padding: 0.3rem 0.7rem; border-radius: 2rem; }

  .lsd-title { font-size: 1.5rem; font-weight: 700; color: #111; }
  .lsd-status-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8125rem; color: #EF4444; font-weight: 600; margin-top: 0.375rem; }
  .lsd-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #EF4444; animation: lsd-pulse 1.4s ease-in-out infinite; }
  @keyframes lsd-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .lsd-status-row.upcoming { color: #6B7280; }
  .lsd-status-row.upcoming .lsd-status-dot { background: #9CA3AF; animation: none; }

  .lsd-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.25rem 1.5rem; }

  .lsd-trainer-row { display: flex; align-items: center; gap: 0.875rem; }
  .lsd-avatar-img { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .lsd-avatar-fallback { width: 52px; height: 52px; border-radius: 50%; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.125rem; flex-shrink: 0; }
  .lsd-trainer-name { font-size: 1rem; font-weight: 700; color: #111; }
  .lsd-trainer-title { font-size: 0.8125rem; color: #6B7280; margin-top: 0.1rem; }
  .lsd-trainer-rating { display: flex; align-items: center; gap: 0.25rem; margin-top: 0.3rem; font-size: 0.8125rem; color: #6B7280; }

  .lsd-info-list { display: flex; flex-direction: column; }
  .lsd-info-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 0; }
  .lsd-info-row + .lsd-info-row { border-top: 1px solid #F3F4F6; }
  .lsd-info-icon { width: 36px; height: 36px; border-radius: 0.6rem; background: #EFF6FF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lsd-info-label { font-size: 0.75rem; color: #9CA3AF; }
  .lsd-info-value { font-size: 0.9375rem; font-weight: 700; color: #111; margin-top: 0.1rem; }

  .lsd-linked-course { background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 1rem; padding: 1.125rem 1.5rem; display: flex; align-items: center; gap: 0.875rem; cursor: pointer; }
  .lsd-linked-course:hover { background: #E4F0FE; }
  .lsd-linked-icon { width: 40px; height: 40px; border-radius: 0.6rem; background: #DBEAFE; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lsd-linked-eyebrow { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #2563EB; }
  .lsd-linked-title { font-size: 0.9375rem; font-weight: 700; color: #111; margin-top: 0.1rem; }
  .lsd-linked-module { font-size: 0.8125rem; color: #6B7280; margin-top: 0.1rem; }

  .lsd-section-label { font-size: 0.75rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 0.625rem; }
  .lsd-desc { font-size: 0.9375rem; color: #374151; line-height: 1.6; }

  .lsd-agenda-item { display: flex; align-items: center; gap: 0.625rem; font-size: 0.9375rem; color: #374151; padding: 0.5rem 0; }

  .lsd-audience-card { background: #F9FAFB; border-left: 3px solid #E5E7EB; border-radius: 0.5rem; padding: 1rem 1.25rem; }
  .lsd-audience-label { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: #9CA3AF; margin-bottom: 0.3rem; }
  .lsd-audience-text { font-size: 0.875rem; color: #374151; line-height: 1.55; }

  .lsd-sticky-bar { position: fixed; left: 260px; right: 0; bottom: 0; padding: 1.25rem 2.5rem; background: linear-gradient(0deg, #fff 60%, rgba(255,255,255,0)); z-index: 5; }
  .lsd-sticky-inner { max-width: 900px; margin: 0 auto; }
  .lsd-join-btn { width: 100%; border: none; border-radius: 0.875rem; padding: 1.1rem; background: #EF4444; color: #fff; font-size: 0.9375rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 6px 20px rgba(239,68,68,0.35); }
  .lsd-join-btn:hover { background: #DC2626; }
  .lsd-join-btn:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
  .lsd-remind-btn { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.875rem; padding: 1.05rem; background: #fff; color: #374151; font-size: 0.9375rem; font-weight: 700; cursor: pointer; }
  .lsd-remind-btn:hover { background: #F9FAFB; }

  @media (max-width: 900px) {
    .lsd-sticky-bar { left: 0; }
  }
  @media (max-width: 640px) {
    .lsd-content { padding: 1.25rem 1rem 6.5rem; }
    .lsd-sticky-bar { padding: 1rem; }
  }
`

export default function LiveSessionDetailPage() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const { user, isAuthenticated } = useAuth()
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
      if (!sessionId) return
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
    if (user) fetchSession()
  }, [user, sessionId])

  if (loading) {
    return (
      <>
        <style>{SHELL_CSS + PAGE_CSS}</style>
        <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
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
          <div className="lsd-content">
            <button className="lsd-back" onClick={() => navigate(RouteBuilder.liveSessions())}><ChevronLeft size={18} /> Session details</button>
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
        <div className="lsd-content">
          <div className="lsd-top">
            <button className="lsd-back" onClick={() => navigate(RouteBuilder.liveSessions())}><ChevronLeft size={18} /> Session details</button>
            {isLive && <span className="lsd-live-pill"><Radio size={10} /> Live</span>}
          </div>

          <div>
            <div className="lsd-title">{session.title}</div>
            <div className={`lsd-status-row${isLive ? '' : ' upcoming'}`}>
              <span className="lsd-status-dot" />
              {isLive ? 'Session is live right now' : `Starts ${fmtFullDate(session.starts_at)} at ${fmtTimeWithZone(session.starts_at)}`}
            </div>
          </div>

          <div className="lsd-card">
            <div className="lsd-trainer-row">
              {session.trainer_avatar_url ? (
                <img src={session.trainer_avatar_url} alt={session.trainer_name} className="lsd-avatar-img" />
              ) : (
                <div className="lsd-avatar-fallback">{initials(session.trainer_name)}</div>
              )}
              <div>
                <div className="lsd-trainer-name">{session.trainer_name}</div>
                {session.trainer_title && <div className="lsd-trainer-title">{session.trainer_title}</div>}
                {typeof session.trainer_rating === 'number' && (
                  <div className="lsd-trainer-rating"><Star size={13} color="#F59E0B" fill="#F59E0B" /> {session.trainer_rating.toFixed(1)}</div>
                )}
              </div>
            </div>
          </div>

          <div className="lsd-card lsd-info-list">
            <div className="lsd-info-row">
              <div className="lsd-info-icon"><Calendar size={16} color="#2563EB" /></div>
              <div>
                <div className="lsd-info-label">Date</div>
                <div className="lsd-info-value">{fmtFullDate(session.starts_at)}</div>
              </div>
            </div>
            <div className="lsd-info-row">
              <div className="lsd-info-icon"><Clock size={16} color="#2563EB" /></div>
              <div>
                <div className="lsd-info-label">Time</div>
                <div className="lsd-info-value">{fmtTimeWithZone(session.starts_at)}</div>
              </div>
            </div>
            {mins !== null && (
              <div className="lsd-info-row">
                <div className="lsd-info-icon"><Clock size={16} color="#2563EB" /></div>
                <div>
                  <div className="lsd-info-label">Duration</div>
                  <div className="lsd-info-value">{mins} min</div>
                </div>
              </div>
            )}
          </div>

          {session.course_title && (
            <div className="lsd-linked-course" onClick={() => navigate(RouteBuilder.course(session.course_id))}>
              <div className="lsd-linked-icon"><BookOpen size={18} color="#2563EB" /></div>
              <div>
                <div className="lsd-linked-eyebrow">Linked course</div>
                <div className="lsd-linked-title">{session.course_title}</div>
                {session.module_title && <div className="lsd-linked-module">{session.module_title}</div>}
              </div>
            </div>
          )}

          {session.description && (
            <div>
              <div className="lsd-section-label">About this session</div>
              <div className="lsd-desc">{session.description}</div>
            </div>
          )}

          {session.agenda && session.agenda.length > 0 && (
            <div>
              <div className="lsd-section-label">What's covered</div>
              {session.agenda.map((item, i) => (
                <div key={i} className="lsd-agenda-item"><CheckCircle2 size={16} color="#2563EB" /> {item}</div>
              ))}
            </div>
          )}

          {session.audience_note && (
            <div className="lsd-audience-card">
              <div className="lsd-audience-label">Who this is for</div>
              <div className="lsd-audience-text">{session.audience_note}</div>
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