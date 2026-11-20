import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

const DISMISS_KEY = 'tgpl_install_prompt_dismissed_at'
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000

function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches === true
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Boolean(at) && Date.now() - at < SNOOZE_MS
  } catch {
    return false
  }
}

export const INSTALL_PROMPT_CSS = `
  .install-prompt { position: fixed; right: 1.25rem; bottom: 1.25rem; width: 360px; max-width: calc(100vw - 2.5rem); z-index: 251; display: flex; align-items: flex-start; gap: 0.75rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 0.875rem; font-family: inherit; }
  .install-prompt-icon { width: 36px; height: 36px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .install-prompt-body { flex: 1; min-width: 0; }
  .install-prompt-title { font-size: 0.875rem; font-weight: 700; color: #111; }
  .install-prompt-text { font-size: 0.8125rem; color: #6B7280; margin-top: 2px; line-height: 1.4; }
  .install-prompt-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.625rem; }
  .install-prompt-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; border-radius: 0.6rem; padding: 0.5rem 0.875rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; }
  .install-prompt-btn.primary { background: #2492EB; border-color: #2492EB; color: #fff; }
  .install-prompt-close { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.125rem; display: flex; flex-shrink: 0; }
  @media (max-width: 640px) { .install-prompt { top: calc(60px + env(safe-area-inset-top, 0px) + 0.75rem); left: 50%; right: auto; bottom: auto; width: calc(100vw - 2rem); max-width: 340px; transform: translateX(-50%); } }
`

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(recentlyDismissed)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    if (installed) return

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const handleInstalled = () => {
      setPromptEvent(null)
      setInstalled(true)
      setHidden(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [installed])

  function snooze() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // Storage can be unavailable; hide it for this session.
    }
    setHidden(true)
  }

  async function install() {
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    setPromptEvent(null)
  }

  if (hidden || installed) return null

  const showIOSInstructions = isIOSDevice() && !promptEvent
  if (!showIOSInstructions && !promptEvent) return null

  return (
    <>
      <style>{INSTALL_PROMPT_CSS}</style>
      <div className="install-prompt" role="region" aria-label="Install TGPL app">
        <div className="install-prompt-icon"><Download size={18} /></div>
        <div className="install-prompt-body">
          <div className="install-prompt-title">Install TGPL</div>
          <div className="install-prompt-text">
            {showIOSInstructions
              ? 'Tap Share, then choose Add to Home Screen to install the app.'
              : 'Add TGPL to your device for faster, app-like access.'}
          </div>
          {promptEvent && (
            <div className="install-prompt-actions">
              <button className="install-prompt-btn primary" type="button" onClick={install}>Install app</button>
              <button className="install-prompt-btn" type="button" onClick={snooze}>Not now</button>
            </div>
          )}
          {showIOSInstructions && (
            <div className="install-prompt-actions">
              <button className="install-prompt-btn" type="button" onClick={snooze}>Got it</button>
            </div>
          )}
        </div>
        <button className="install-prompt-close" type="button" onClick={snooze} aria-label="Dismiss"><X size={16} /></button>
      </div>
    </>
  )
}
