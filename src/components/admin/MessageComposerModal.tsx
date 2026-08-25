import { useState } from 'react'
import { X, Send } from 'lucide-react'
import type { AdminUser } from '../../types/adminUser'

export const MESSAGE_MODAL_CSS = `
  .mc-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .mc-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 440px; }
  .mc-inner { padding: 1.5rem; }
  .mc-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
  .mc-title { margin: 0; font-size: 1.1rem; font-weight: 800; color: #111827; }
  .mc-sub { margin: 0.2rem 0 0; font-size: 0.82rem; color: #9CA3AF; }
  .mc-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.2rem; }
  .mc-textarea { width: 100%; min-height: 120px; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.85rem; font-size: 0.9rem; font-family: inherit; resize: vertical; margin-bottom: 1.25rem; }
  .mc-textarea:focus { outline: none; border-color: #2492EB; }
  .mc-actions { display: flex; gap: 0.6rem; }
  .mc-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .mc-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .mc-btn.send { border: none; background: #2492EB; color: #fff; }
  .mc-btn.send:disabled { opacity: 0.5; cursor: not-allowed; }
`

interface MessageComposerModalProps {
  user: AdminUser
  onClose: () => void
}

export default function MessageComposerModal({ user, onClose }: MessageComposerModalProps) {
  const [message, setMessage] = useState('')

  function handleSend() {
    if (!message.trim()) return
    // No backend endpoint for admin -> user messaging exists (confirmed —
    // this is intentionally frontend-only, per backend). Hand off to the
    // admin's own email client instead of pretending to send anything.
    const subject = encodeURIComponent('Message from TGPL Admin')
    const body = encodeURIComponent(message)
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`
    onClose()
  }

  return (
    <div className="mc-overlay" onClick={onClose}>
      <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-inner">
          <div className="mc-head">
            <div>
              <h3 className="mc-title">Message {user.name}</h3>
              <p className="mc-sub">{user.email}</p>
            </div>
            <button className="mc-close" onClick={onClose} aria-label="Close" type="button">
              <X size={18} />
            </button>
          </div>

          <textarea
            className="mc-textarea"
            placeholder={`Write a message to ${user.name}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="mc-actions">
            <button className="mc-btn cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="mc-btn send" onClick={handleSend} disabled={!message.trim()} type="button">
              <Send size={15} /> Open in email
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}