import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '../../hooks/usePushNotification'

const DISMISS_KEY = 'tgpl_push_prompt_dismissed_at'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000 // ask again after a week

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(at) && Date.now() - at < SNOOZE_MS
  } catch {
    return false
  }
}

export const PUSH_PROMPT_CSS = `
  .push-prompt { position: fixed; right: 1.25rem; bottom: 1.25rem; width: 360px; max-width: calc(100vw - 2.5rem); z-index: 250; display: flex; align-items: flex-start; gap: 0.75rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 0.875rem; font-family: inherit; }
  .push-prompt-icon { width: 36px; height: 36px; border-radius: 50%; background: #EFF6FF; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .push-prompt-body { flex: 1; min-width: 0; }
  .push-prompt-title { font-size: 0.875rem; font-weight: 600; color: #111; }
  .push-prompt-text { font-size: 0.8125rem; color: #6B7280; margin-top: 2px; line-height: 1.4; }
  .push-prompt-error { font-size: 0.75rem; color: #EF4444; margin-top: 0.375rem; line-height: 1.4; }
  .push-prompt-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.625rem; }
  .push-prompt-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; border-radius: 0.6rem; padding: 0.5rem 0.875rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
  .push-prompt-btn:hover { background: #F9FAFB; }
  .push-prompt-btn.primary { background: #2492EB; border-color: #2492EB; color: #fff; }
  .push-prompt-btn.primary:hover { background: #1D80D0; }
  .push-prompt-btn:disabled { opacity: 0.6; cursor: default; }
  .push-prompt-close { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.125rem; display: flex; flex-shrink: 0; }
  .push-prompt-close:hover { color: #374151; }

  /* Phones: full-width card that sits above the top tab bar */
  @media (max-width: 640px) {
    .push-prompt { left: 0.75rem; right: 0.75rem; width: auto; max-width: none; top: calc(60px + env(safe-area-inset-bottom, 0px) + 0.75rem); }
  }
`

/**
 * Asks logged-in users to turn on push notifications. Mount it once, for
 * authenticated users only. Users who already allowed notifications never see
 * it, and their subscription is refreshed silently by the hook.
 */
export default function PushPrompt() {
  const { isSupported, permission, subscribing, error, subscribe, needsHomeScreenInstall } =
    usePushNotifications()
  const [hidden, setHidden] = useState(recentlyDismissed)

  function snooze() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // storage unavailable: just hide it for this session
    }
    setHidden(true)
  }

  if (hidden) return null

  // iPhone/iPad in a normal Safari tab can't do push. It only works from the Home Screen.
  if (needsHomeScreenInstall) {
    return (
      <>
        <style>{PUSH_PROMPT_CSS}</style>
        <div className="push-prompt" role="region" aria-label="Notifications">
          <div className="push-prompt-icon"><Bell size={18} /></div>
          <div className="push-prompt-body">
            <div className="push-prompt-title">Get notifications on your iPhone</div>
            <div className="push-prompt-text">
              Tap Share, choose Add to Home Screen, then open the app from its icon and turn notifications on.
            </div>
            <div className="push-prompt-actions">
              <button className="push-prompt-btn" onClick={snooze}>Got it</button>
            </div>
          </div>
          <button className="push-prompt-close" onClick={snooze} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      </>
    )
  }

  // Already allowed or blocked, or the browser can't do push: nothing to ask.
  if (!isSupported || permission !== 'default') return null

  return (
    <>
      <style>{PUSH_PROMPT_CSS}</style>
      <div className="push-prompt" role="region" aria-label="Notifications">
        <div className="push-prompt-icon"><Bell size={18} /></div>
        <div className="push-prompt-body">
          <div className="push-prompt-title">Turn on notifications</div>
          <div className="push-prompt-text">
            Get alerts for bookings, replies and live classes, even when the app is closed.
          </div>
          {error && <div className="push-prompt-error">{error}</div>}
          <div className="push-prompt-actions">
            <button className="push-prompt-btn primary" onClick={subscribe} disabled={subscribing}>
              {subscribing ? 'Enabling…' : 'Enable'}
            </button>
            <button className="push-prompt-btn" onClick={snooze} disabled={subscribing}>
              Not now
            </button>
          </div>
        </div>
        <button className="push-prompt-close" onClick={snooze} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </>
  )
}