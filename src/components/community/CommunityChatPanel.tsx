// components/community/CommunityChatPanel.tsx
//
// One shared chat UI for Learner / Trainer / Admin. The `role` prop drives
// the only thing that actually differs between the three Figma exports:
// which items show up in each message's context menu. Everything else
// (bubbles, reactions, rules panel, composer) is identical across roles.
//
// This component owns no data fetching — it's handed a thread + handlers by
// whichever page renders it (CommunityPage / TrainerCommunityPage /
// AdminCommunityPage), same division of responsibility as Ring/SmallRing in
// DashboardPage.tsx.

import { useEffect, useRef, useState } from 'react'
import {
  Hash, ShieldCheck, ChevronDown, ChevronUp, Pin, Reply, Copy, Trash2,
  ShieldAlert, Smile, Send,
} from 'lucide-react'
import type { CommunityMessage, CommunityRole, CommunityThread } from '../../types/community'

export const COMMUNITY_CHAT_CSS = `
  .cc-panel { display: flex; flex-direction: column; min-height: 0; height: 100%; background: #F7F7F7; }

  .cc-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; background: #fff; border-bottom: 1px solid #EBEBEB; flex-shrink: 0; }
  .cc-header-left { display: flex; align-items: center; gap: 12px; }
  .cc-hash { width: 36px; height: 36px; border-radius: 14px; background: #E9F5FF; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-title { font-weight: 700; font-size: 17px; margin: 0; color: #2B2B2C; }
  .cc-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #99A1AF; margin-top: 2px; }
  .cc-live-dot { width: 6px; height: 6px; border-radius: 999px; background: #10B981; flex-shrink: 0; }
  .cc-rules-btn { display: flex; align-items: center; gap: 6px; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; padding: 7px 12px; font-weight: 600; font-size: 12px; color: #616873; cursor: pointer; }

  .cc-rules-panel { background: #E9F5FF; border-bottom: 1px solid #BFDFFD; padding: 16px 24px; flex-shrink: 0; }
  .cc-rules-eyebrow { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 11px; letter-spacing: 0.06em; color: #2492EB; text-transform: uppercase; margin: 0 0 10px; }
  .cc-rules-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .cc-rules-list li { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: #2B2B2C; }
  .cc-rules-num { flex-shrink: 0; width: 18px; height: 18px; border-radius: 999px; background: #fff; color: #2492EB; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin-top: 1px; }

  .cc-messages { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 18px; }
  .cc-state-note { text-align: center; color: #99A1AF; font-size: 13px; padding: 3rem 1rem; }
  .cc-state-note.error { color: #DC2626; }

  .cc-msg-row { display: flex; align-items: flex-start; gap: 12px; max-width: 640px; }
  .cc-msg-row.own { margin-left: auto; flex-direction: row-reverse; }

  .cc-avatar { width: 36px; height: 36px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 12px; flex-shrink: 0; background: #2492EB; }

  .cc-msg-col { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .cc-msg-row.own .cc-msg-col { align-items: flex-end; }

  .cc-msg-meta { display: flex; align-items: baseline; gap: 6px; padding: 0 4px; }
  .cc-msg-name { font-weight: 600; font-size: 12px; color: #2B2B2C; }
  .cc-msg-role { font-weight: 500; font-size: 10px; }
  .cc-msg-role.learner { color: #6B7280; }
  .cc-msg-role.trainer, .cc-msg-role.admin { color: #2492EB; }
  .cc-msg-time { font-size: 10px; color: #B0B8C4; }

  .cc-bubble-wrap { position: relative; }
  .cc-bubble { padding: 10px 16px; border-radius: 16px 16px 16px 8px; background: #fff; font-size: 13px; line-height: 1.6; color: #2B2B2C; word-break: break-word; }
  .cc-msg-row.own .cc-bubble { border-radius: 16px 16px 8px 16px; background: #2492EB; color: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

  .cc-reactions { display: flex; align-items: center; gap: 6px; padding: 0 4px; flex-wrap: wrap; }
  .cc-reaction { display: flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; border: 1px solid #EBEBEB; background: #fff; font-size: 11px; font-weight: 600; color: #616873; cursor: pointer; }
  .cc-reaction.mine { background: #E9F5FF; border-color: #BFDFFD; color: #2492EB; }

  .cc-menu-btn { opacity: 0; position: absolute; top: 2px; background: #fff; border: 1px solid #EBEBEB; border-radius: 999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #99A1AF; transition: opacity .12s; }
  .cc-msg-row:not(.own) .cc-menu-btn { right: -32px; }
  .cc-msg-row.own .cc-menu-btn { left: -32px; }
  .cc-bubble-wrap:hover .cc-menu-btn, .cc-menu-btn.open { opacity: 1; }

  .cc-menu { position: absolute; top: 30px; width: 210px; background: #fff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); padding: 6px 0; z-index: 20; }
  .cc-msg-row:not(.own) .cc-menu { right: -32px; }
  .cc-msg-row.own .cc-menu { left: -32px; }
  .cc-menu-item { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 16px; background: none; border: none; font-size: 13px; font-weight: 500; color: #2B2B2C; cursor: pointer; text-align: left; }
  .cc-menu-item:hover { background: #F7F7F7; }
  .cc-menu-item.danger { color: #DC2626; }
  .cc-menu-divider { height: 1px; background: #F3F4F6; margin: 4px 0; }

  .cc-composer-wrap { padding: 8px 24px 20px; background: #F7F7F7; flex-shrink: 0; }
  .cc-composer { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 16px; padding: 12px 16px; position: relative; }
  .cc-composer-avatar { width: 32px; height: 32px; border-radius: 999px; background: #2492EB; color: #fff; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-composer-input { flex: 1; border: none; outline: none; font-family: inherit; font-size: 13px; color: #2B2B2C; background: none; resize: none; min-height: 20px; max-height: 120px; }
  .cc-composer-input::placeholder { color: #B0B8C4; }
  .cc-emoji-btn { width: 32px; height: 32px; border-radius: 14px; border: none; background: none; color: #99A1AF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .cc-emoji-btn:hover { background: #F7F7F7; }
  .cc-send-btn { width: 32px; height: 32px; border-radius: 14px; border: none; background: #D1D5DB; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .cc-send-btn.active { background: #2492EB; cursor: pointer; }
  .cc-send-btn:disabled { cursor: not-allowed; }
  .cc-composer-hint { text-align: center; font-size: 10px; color: #B0B8C4; margin-top: 8px; display: flex; justify-content: center; gap: 4px; align-items: center; }
  .cc-kbd { background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 4px; padding: 1px 6px; font-family: 'Consolas', monospace; font-size: 9px; }

  .cc-emoji-panel { position: absolute; bottom: 64px; right: 16px; width: 260px; max-height: 220px; overflow-y: auto; background: #fff; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); padding: 12px; z-index: 20; }
  .cc-emoji-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
  .cc-emoji-grid button { border: none; background: none; font-size: 18px; cursor: pointer; padding: 4px; border-radius: 6px; }
  .cc-emoji-grid button:hover { background: #F7F7F7; }
`

const EMOJIS = ['😀','😁','🙂','😂','🤣','😍','🥳','😎','🤩','🤗','👍','👎','👏','🙌','🙏','💪','✌️','👌','❤️','🧡','💛','💚','💙','💜','🎉','🎊','🏆','✨','🔥','💯']
const AVATAR_COLORS = ['#0891B2', '#10B981', '#D97706', '#8B5CF6', '#2492EB', '#EC4899']

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function avatarColorFor(name: string): string {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface MessageMenuAction {
  key: string
  label: string
  icon: typeof Reply
  danger?: boolean
}

// The one place role actually changes behavior — mirrors the three Figma
// context-menu exports exactly (Learner: 2/3 items, Trainer: 4, Admin: 5).
function buildMenuActions(msg: CommunityMessage, role: CommunityRole): MessageMenuAction[] {
  const canModerate = role === 'trainer' || role === 'admin'
  const isAdmin = role === 'admin'
  const actions: MessageMenuAction[] = [{ key: 'reply', label: 'Reply', icon: Reply }]

  if (canModerate) actions.push({ key: 'pin', label: 'Pin message', icon: Pin })
  actions.push({ key: 'copy', label: 'Copy text', icon: Copy })

  if (msg.is_mine) {
    actions.push({ key: 'delete-mine', label: 'Delete for everyone', icon: Trash2, danger: true })
  } else if (canModerate) {
    actions.push({ key: 'delete-mod', label: isAdmin ? 'Delete message' : 'Delete for everyone', icon: Trash2, danger: true })
    if (isAdmin) actions.push({ key: 'warn', label: 'Remove & warn user', icon: ShieldAlert, danger: true })
  }

  return actions
}

interface MessageRowProps {
  msg: CommunityMessage
  role: CommunityRole
  onReact: (messageId: string, emoji: string) => void
  onPin: (messageId: string) => void
  onDeleteMine: (messageId: string) => void
  onDeleteModerator: (messageId: string) => void
  onRemoveAndWarn: (messageId: string) => void
}

function MessageRow({ msg, role, onReact, onPin, onDeleteMine, onDeleteModerator, onRemoveAndWarn }: MessageRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = buildMenuActions(msg, role)

  function handleAction(key: string) {
    setMenuOpen(false)
    if (key === 'copy') { navigator.clipboard?.writeText(msg.body); return }
    if (key === 'pin') return onPin(msg.id)
    if (key === 'delete-mine') return onDeleteMine(msg.id)
    if (key === 'delete-mod') return onDeleteModerator(msg.id)
    if (key === 'warn') return onRemoveAndWarn(msg.id)
    // 'reply' — no-op here; wire to a reply/thread feature when that exists.
  }

  return (
    <div className={`cc-msg-row${msg.is_mine ? ' own' : ''}`}>
      <div className="cc-avatar" style={{ background: avatarColorFor(msg.author.name) }}>
        {initialsOf(msg.author.name)}
      </div>
      <div className="cc-msg-col">
        <div className="cc-msg-meta">
          {msg.is_mine && <span className="cc-msg-time">{timeAgo(msg.created_at)}</span>}
          {msg.is_mine && <span className={`cc-msg-role ${msg.author.role}`}>{msg.author.role[0].toUpperCase() + msg.author.role.slice(1)}</span>}
          <span className="cc-msg-name">{msg.is_mine ? 'You' : msg.author.name}</span>
          {!msg.is_mine && <span className={`cc-msg-role ${msg.author.role}`}>{msg.author.role[0].toUpperCase() + msg.author.role.slice(1)}</span>}
          {!msg.is_mine && <span className="cc-msg-time">{timeAgo(msg.created_at)}</span>}
        </div>
        <div className="cc-bubble-wrap">
          <button className={`cc-menu-btn${menuOpen ? ' open' : ''}`} type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Message actions">
            <ChevronDown size={13} />
          </button>
          <div className="cc-bubble">{msg.body}</div>
          {menuOpen && (
            <div className="cc-menu" onMouseLeave={() => setMenuOpen(false)}>
              {actions.map((a) => (
                <div key={a.key}>
                  {(a.key === 'delete-mine' || a.key === 'delete-mod') && <div className="cc-menu-divider" />}
                  <button className={`cc-menu-item${a.danger ? ' danger' : ''}`} type="button" onClick={() => handleAction(a.key)}>
                    <a.icon size={14} />
                    {a.label}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {msg.reactions.length > 0 && (
          <div className="cc-reactions">
            {msg.reactions.map((r) => (
              <button
                className={`cc-reaction${r.reacted_by_me ? ' mine' : ''}`}
                key={r.emoji}
                type="button"
                onClick={() => onReact(msg.id, r.emoji)}
              >
                {r.emoji} {r.count}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export interface CommunityChatPanelProps {
  role: CommunityRole
  currentUserInitials: string
  thread: CommunityThread | null
  loading: boolean
  error: string | null
  sending: boolean
  onSend: (body: string) => void
  onReact: (messageId: string, emoji: string) => void
  onPin: (messageId: string) => void
  onDeleteMine: (messageId: string) => void
  onDeleteModerator: (messageId: string) => void
  onRemoveAndWarn: (messageId: string) => void
}

export default function CommunityChatPanel({
  role, currentUserInitials, thread, loading, error, sending,
  onSend, onReact, onPin, onDeleteMine, onDeleteModerator, onRemoveAndWarn,
}: CommunityChatPanelProps) {
  const [rulesOpen, setRulesOpen] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const emojiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setEmojiOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function submit() {
    const body = draft.trim()
    if (!body || sending) return
    onSend(body)
    setDraft('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="cc-panel">
      <div className="cc-header">
        <div className="cc-header-left">
          <div className="cc-hash"><Hash size={16} /></div>
          <div>
            <p className="cc-title">Community Chat</p>
            <div className="cc-meta">
              <span className="cc-live-dot" />
              {thread ? `${thread.message_count} messages · ${thread.active_member_count} members active` : '—'}
            </div>
          </div>
        </div>
        <button className="cc-rules-btn" type="button" onClick={() => setRulesOpen((v) => !v)}>
          <ShieldCheck size={13} /> Community rules
          {rulesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {rulesOpen && thread && (
        <div className="cc-rules-panel">
          <p className="cc-rules-eyebrow"><Pin size={11} /> Pinned · Community rules</p>
          <ul className="cc-rules-list">
            {thread.rules.map((r, i) => (
              <li key={i}><span className="cc-rules-num">{i + 1}</span>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="cc-messages">
        {loading && <p className="cc-state-note">Loading messages…</p>}
        {!loading && error && <p className="cc-state-note error">{error}</p>}
        {!loading && !error && thread?.messages.length === 0 && (
          <p className="cc-state-note">No messages yet — be the first to say hello.</p>
        )}
        {!loading && !error && thread?.messages.map((msg) => (
          <MessageRow
            msg={msg}
            role={role}
            key={msg.id}
            onReact={onReact}
            onPin={onPin}
            onDeleteMine={onDeleteMine}
            onDeleteModerator={onDeleteModerator}
            onRemoveAndWarn={onRemoveAndWarn}
          />
        ))}
      </div>

      <div className="cc-composer-wrap">
        <div className="cc-composer">
          <div className="cc-composer-avatar">{currentUserInitials}</div>
          <textarea
            className="cc-composer-input"
            placeholder="Send a message to the community… (Enter to send)"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="cc-emoji-btn" type="button" onClick={() => setEmojiOpen((v) => !v)}>
            <Smile size={16} />
          </button>
          <button
            className={`cc-send-btn${draft.trim() ? ' active' : ''}`}
            type="button"
            disabled={!draft.trim() || sending}
            onClick={submit}
          >
            <Send size={14} />
          </button>

          {emojiOpen && (
            <div className="cc-emoji-panel" ref={emojiRef}>
              <div className="cc-emoji-grid">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setDraft((d) => d + e)}>{e}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="cc-composer-hint">
          Press <span className="cc-kbd">Enter</span> to send · <span className="cc-kbd">Shift + Enter</span> for new line
        </div>
      </div>
    </div>
  )
}