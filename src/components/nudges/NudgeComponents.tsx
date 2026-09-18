// components/nudges/NudgeComponents.tsx
import {
  History, AlertTriangle, Radio, CalendarClock, Award, X, Play, Send, Video, CalendarPlus,
} from 'lucide-react'

export const NUDGE_CSS = `
  .nudge-tag { display: inline-flex; align-items: center; padding: 2px 6px; border-radius: 999px; font-family: 'Sora'; font-weight: 700; font-size: 9px; line-height: 14px; letter-spacing: 0.225px; text-transform: uppercase; }

  .nudge-card { display: flex; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 16px; box-sizing: border-box; }
  .nudge-icon-wrap { width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .nudge-body { flex: 1; min-width: 0; }
  .nudge-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
  .nudge-title { font-family: 'Sora'; font-weight: 700; font-size: 13px; line-height: 18px; margin: 0; }
  .nudge-desc { font-family: 'Sora'; font-weight: 400; font-size: 12px; line-height: 16px; margin: 2px 0 0; }
  .nudge-dismiss { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 999px; display: flex; flex-shrink: 0; opacity: 0.6; }
  .nudge-dismiss:hover { opacity: 1; }
  .nudge-actions { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
  .nudge-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; font-family: 'Sora'; font-weight: 700; font-size: 11px; line-height: 16px; border: none; cursor: pointer; }
  .nudge-btn.ghost { background: none; font-weight: 600; padding: 0; }

  .nudge-resume-row { display: flex; align-items: center; gap: 8px; }
  .nudge-resume-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: 'Sora'; font-weight: 700; font-size: 11px; color: #2492EB; }

  /* Toast overlay wrapper — used by LiveSessionNudge / BookingReminderNudge when floated */
  .nudge-toast-overlay { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 500; width: min(878px, calc(100vw - 32px)); box-shadow: 0px 18px 33px 10px rgba(0,0,0,0.2); border-radius: 16px; background: #fff; }
`

interface NudgeBaseProps {
  onDismiss?: () => void
}

// ── InactivityNudge — insert above the progress card ───────────────────────
interface InactivityNudgeProps extends NudgeBaseProps {
  daysInactive: number
  firstName: string
  onResume: () => void
}

export function InactivityNudge({ daysInactive, firstName, onResume, onDismiss }: InactivityNudgeProps) {
  return (
    <div className="nudge-card" style={{ background: '#EBF5FF', border: '1px solid rgba(36,146,235,0.25)' }}>
      <div className="nudge-icon-wrap" style={{ background: 'rgba(36,146,235,0.15)' }}>
        <History size={17} color="#2492EB" />
      </div>
      <div className="nudge-body">
        <div className="nudge-head">
          <div>
            <p className="nudge-title" style={{ color: '#2B3942' }}>Welcome back, {firstName}!</p>
            <p className="nudge-desc" style={{ color: '#4A5565' }}>
              You haven't visited in {daysInactive} days. Pick up where you left off.
            </p>
          </div>
          <div className="nudge-resume-row">
            <button className="nudge-resume-btn" onClick={onResume}>
              Resume <Play size={12} />
            </button>
            {onDismiss && (
              <button className="nudge-dismiss" onClick={onDismiss} aria-label="Dismiss">
                <X size={13} color="#99A1AF" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DeadlineUrgencyNudge — inject into the deadline/assignments section ────
interface DeadlineUrgencyNudgeProps extends NudgeBaseProps {
  assignmentTitle: string
  courseTitle: string
  onSubmitNow: () => void
}

export function DeadlineUrgencyNudge({ assignmentTitle, courseTitle, onSubmitNow, onDismiss }: DeadlineUrgencyNudgeProps) {
  return (
    <div className="nudge-card" style={{ background: '#FEF2F2', border: '1px solid #FFC9C9', alignItems: 'flex-start' }}>
      <div className="nudge-icon-wrap" style={{ background: '#FFE2E2', marginTop: 2 }}>
        <AlertTriangle size={17} color="#FB2C36" />
      </div>
      <div className="nudge-body">
        <div className="nudge-head">
          <p className="nudge-title" style={{ color: '#C10007' }}>Assignment missed</p>
          {onDismiss && (
            <button className="nudge-dismiss" onClick={onDismiss} aria-label="Dismiss">
              <X size={13} color="#FFA2A2" />
            </button>
          )}
        </div>
        <p className="nudge-desc" style={{ color: 'rgba(231,0,11,0.8)' }}>
         {assignmentTitle} ({courseTitle}) — you need to complete all assignments to get your certificate.
         </p>
        <div className="nudge-actions">
          <button className="nudge-btn" style={{ background: '#FB2C36', color: '#fff' }} onClick={onSubmitNow}>
            Submit now <Send size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── LiveSessionNudge — render as a fixed overlay toast, 15 min before start ─
interface LiveSessionNudgeProps extends NudgeBaseProps {
  sessionTitle: string
  trainerName: string
  onJoin: () => void
  asOverlay?: boolean
}

export function LiveSessionNudge({ sessionTitle, trainerName, onJoin, onDismiss, asOverlay = true }: LiveSessionNudgeProps) {
  const card = (
    <div className="nudge-card" style={{ background: '#F7F7F7', alignItems: 'flex-start' }}>
      <div className="nudge-icon-wrap" style={{ background: '#E3F2FF' }}>
        <Radio size={17} color="#2492EB" />
      </div>
      <div className="nudge-body">
        <div className="nudge-head">
          <div>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Sora', fontWeight: 700,
              fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase', color: '#2492EB', marginBottom: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#2492EB' }} /> Starting in 15 min
            </span>
            <p className="nudge-title" style={{ color: '#2492EB' }}>{sessionTitle}</p>
            <p className="nudge-desc" style={{ color: '#616873' }}>with {trainerName} · Live session</p>
          </div>
          {onDismiss && (
            <button className="nudge-dismiss" onClick={onDismiss} aria-label="Dismiss">
              <X size={13} color="#616873" />
            </button>
          )}
        </div>
        <div className="nudge-actions">
          <button className="nudge-btn" style={{ background: '#2492EB', color: '#fff' }} onClick={onJoin}>
            Join now <Video size={11} />
          </button>
        </div>
      </div>
    </div>
  )
  return asOverlay ? <div className="nudge-toast-overlay">{card}</div> : card
}

// ── BookingReminderNudge — day-before reminder, also rendered as overlay ───
// This is the one shown in the dashboard screenshot as a floating toast.
interface BookingReminderNudgeProps extends NudgeBaseProps {
  trainerName: string
  startsAtDisplay: string  // e.g. "tomorrow at 10:00 AM WAT"
  onAddToCalendar: () => void
  onReschedule: () => void
  asOverlay?: boolean
}

export function BookingReminderNudge({
  trainerName, startsAtDisplay, onAddToCalendar, onReschedule, onDismiss, asOverlay = true,
}: BookingReminderNudgeProps) {
  const card = (
    <div className="nudge-card" style={{ background: asOverlay ? '#fff' : '#FAF5FF', alignItems: 'flex-start' }}>
      <div className="nudge-icon-wrap" style={{ background: '#E9F5FF' }}>
        <CalendarClock size={17} color="#2492EB" />
      </div>
      <div className="nudge-body">
        <div className="nudge-head">
          <p className="nudge-title" style={{ color: '#1A7ACC' }}>Tutor session tomorrow</p>
          {onDismiss && (
            <button className="nudge-dismiss" onClick={onDismiss} aria-label="Dismiss">
              <X size={13} color="#616873" />
            </button>
          )}
        </div>
        <p className="nudge-desc" style={{ color: '#2492EB' }}>
          Your session with <strong>{trainerName}</strong> starts {startsAtDisplay}. A link will be sent 30 minutes before.
        </p>
        <div className="nudge-actions">
          <button className="nudge-btn" style={{ background: '#2492EB', color: '#fff' }} onClick={onAddToCalendar}>
            Add to calendar <CalendarPlus size={11} />
          </button>
          <button className="nudge-btn ghost" style={{ color: '#5AADEE' }} onClick={onReschedule}>
            Reschedule
          </button>
        </div>
      </div>
    </div>
  )
  return asOverlay ? <div className="nudge-toast-overlay">{card}</div> : card
}

// ── CertificateNudge — show in the certification snapshot section ──────────
interface CertificateNudgeProps extends NudgeBaseProps {
  courseTitle: string
  lessonsRemaining: number
  percentComplete: number
  onFinishNow: () => void
}

export function CertificateNudge({ courseTitle, lessonsRemaining, percentComplete, onFinishNow, onDismiss }: CertificateNudgeProps) {
  return (
    <div
      className="nudge-card"
      style={{
        background: 'linear-gradient(135deg, #FFFBEB 0%, #FFF7ED 100%)',
        border: '1px solid #FEE685',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', width: 80, height: 80, right: -20, top: -15,
        background: 'rgba(254,230,133,0.3)', borderRadius: 999,
      }} />
      <div className="nudge-icon-wrap" style={{ background: '#FEF3C6', position: 'relative' }}>
        <Award size={17} color="#E17100" />
      </div>
      <div className="nudge-body" style={{ position: 'relative' }}>
        <div className="nudge-head">
          <p className="nudge-title" style={{ color: '#7B3306' }}>So close to your certificate!</p>
          {onDismiss && (
            <button className="nudge-dismiss" onClick={onDismiss} aria-label="Dismiss">
              <X size={13} color="#FFD230" />
            </button>
          )}
        </div>
        <p className="nudge-desc" style={{ color: '#BB4D00' }}>
          You're {lessonsRemaining} lesson{lessonsRemaining === 1 ? '' : 's'} away from earning your {courseTitle} certificate.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#FEE685', borderRadius: 999 }}>
            <div style={{ width: `${percentComplete}%`, height: '100%', background: '#FE9A00', borderRadius: 999 }} />
          </div>
          <span style={{ fontFamily: 'Sora', fontWeight: 700, fontSize: 10, color: '#E17100' }}>{percentComplete}%</span>
        </div>
        <div className="nudge-actions">
          <button className="nudge-btn" style={{ background: '#FE9A00', color: '#fff' }} onClick={onFinishNow}>
            Finish now <Play size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}