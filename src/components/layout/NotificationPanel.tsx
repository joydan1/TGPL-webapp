import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, ChevronRight,
  Trophy, MessageSquare, Radio, ClipboardList,
  CalendarCheck, Info,
} from 'lucide-react'
import { RouteBuilder } from '../../constants/routes'
import { NOTIFICATIONS, type Notification, type NotifCategory, TABS, tabCounts } from './notificationsData'

export const NOTIF_CSS = `
  /* ── Bell wrapper ── */
  .bell-wrap { position: relative; }

  /* ── Dropdown (desktop) / Bottom sheet (mobile) ── */
  .notif-dropdown {
    position: absolute; top: calc(100% + 0.75rem); right: 0;
    width: 420px; background: #fff;
    border: 1px solid #E5E7EB; border-radius: 1rem;
    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    z-index: 500; display: flex; flex-direction: column;
    max-height: 600px; overflow: hidden;
  }
  @media (max-width: 640px) {
    .notif-dropdown {
      position: fixed; top: auto; bottom: 0; left: 0; right: 0;
      width: 100%; border-radius: 1.25rem 1.25rem 0 0;
      max-height: 85vh;
    }
  }

  /* ── Header ── */
  .notif-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid #F3F4F6;
  }
  .notif-title { font-size: 1.125rem; font-weight: 700; color: #111; }
  .notif-new-badge {
    background: #2563EB; color: #fff;
    font-size: 0.65rem; font-weight: 800;
    padding: 0.15rem 0.5rem; border-radius: 2rem;
    margin-left: 0.5rem; letter-spacing: 0.04em;
  }
  .notif-close {
    width: 32px; height: 32px; border-radius: 50%; border: none;
    background: #F3F4F6; display: flex; align-items: center;
    justify-content: center; cursor: pointer; color: #6B7280; flex-shrink: 0;
  }
  .notif-close:hover { background: #E5E7EB; }

  /* ── Tabs ── */
  .notif-tabs {
    display: flex; gap: 0.375rem; padding: 0.75rem 1rem;
    overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
    border-bottom: 1px solid #F3F4F6;
  }
  .notif-tabs::-webkit-scrollbar { display: none; }
  .notif-tab {
    display: flex; align-items: center; gap: 0.3rem;
    padding: 0.3rem 0.75rem; border-radius: 2rem;
    border: 1.5px solid #E5E7EB; background: #fff;
    font-size: 0.75rem; font-weight: 600; color: #6B7280;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
  }
  .notif-tab.active { background: #2563EB; border-color: #2563EB; color: #fff; }
  .notif-tab-count { font-size: 0.7rem; font-weight: 700; }

  /* ── Mark all read (inside body) ── */
  .notif-mark-read {
    text-align: center; padding: 0.625rem 0;
    font-size: 0.875rem; font-weight: 600; color: #2563EB;
    cursor: pointer; background: none; border: none; width: 100%;
    border-bottom: 1px solid #F3F4F6;
  }
  .notif-mark-read:hover { opacity: 0.8; }

  /* ── Scrollable list ── */
  .notif-body { overflow-y: auto; flex: 1; }

  .notif-section-label {
    font-size: 0.6875rem; font-weight: 800; letter-spacing: 0.1em;
    color: #9CA3AF; padding: 0.625rem 1.25rem 0.25rem;
    text-transform: uppercase;
  }

  /* ── Individual item ── */
  .notif-item {
    display: flex; align-items: flex-start; gap: 0.875rem;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid #F3F4F6;
    position: relative; cursor: pointer; transition: background 0.12s;
  }
  .notif-item:hover { background: #F9FAFB; }
  .notif-item.unread::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0;
    width: 3px; background: #2563EB; border-radius: 0 2px 2px 0;
  }

  .notif-icon-wrap {
    width: 44px; height: 44px; border-radius: 0.75rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .notif-content { flex: 1; min-width: 0; }
  .notif-item-title {
    font-size: 0.875rem; font-weight: 700; color: #111;
    line-height: 1.3; margin-bottom: 0.2rem;
  }
  .notif-item.read .notif-item-title { font-weight: 500; color: #374151; }
  .notif-item-sub {
    font-size: 0.8rem; color: #6B7280; line-height: 1.45;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .notif-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
  .notif-time { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563EB; }

  /* ── Footer ── */
  .notif-footer {
    border-top: 1px solid #F3F4F6; padding: 0.875rem;
    text-align: center; flex-shrink: 0;
  }
  .notif-see-all {
    background: none; border: none;
    font-size: 0.875rem; font-weight: 600; color: #2563EB;
    cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem;
  }
  .notif-see-all:hover { opacity: 0.8; }
`

// ── Icon map (same icons used in full page) ────────────────────────────────
export function notifIcon(category: Notification['category'], bg: string) {
  const iconProps = { size: 20 }
  const map: Record<Notification['category'], React.ReactNode> = {
    certificate: <Trophy    {...iconProps} color="#F59E0B" />,
    feedback:    <MessageSquare {...iconProps} color="#16A34A" />,
    live:        <Radio     {...iconProps} color="#EF4444" />,
    deadlines:   <ClipboardList {...iconProps} color="#EF4444" />,
    bookings:    <CalendarCheck {...iconProps} color="#2563EB" />,
    system:      <Info      {...iconProps} color="#6B7280" />,
  }
  return (
    <div className="notif-icon-wrap" style={{ background: bg }}>
      {map[category]}
    </div>
  )
}

// ── Shared NotifItem (used in panel AND full page) ─────────────────────────
export function NotifItem({
  n,
  onRead,
  fullText = false,
}: {
  n: Notification
  onRead: (id: number) => void
  fullText?: boolean
}) {
  return (
    <div
      className={`notif-item${n.unread ? ' unread' : ' read'}`}
      onClick={() => onRead(n.id)}
    >
      {notifIcon(n.category, n.iconBg)}
      <div className="notif-content">
        <div className="notif-item-title">{n.title}</div>
        <div
          className="notif-item-sub"
          style={fullText ? { whiteSpace: 'normal', overflow: 'visible', textOverflow: 'unset' } : {}}
        >
          {n.sub}
        </div>
      </div>
      <div className="notif-meta">
        <span className="notif-time">{n.time}</span>
        {n.unread && <div className="notif-dot" />}
      </div>
    </div>
  )
}

// ── Compact dropdown panel ─────────────────────────────────────────────────
interface NotificationPanelProps {
  onClose: () => void
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab]       = useState<NotifCategory>('all')
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onDown), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', onDown) }
  }, [onClose])

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab)

  const newItems = filtered.filter(n => n.isNew)
  const oldItems = filtered.filter(n => !n.isNew)
  const counts   = tabCounts(notifications)

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }
  function markRead(id: number) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  function goToAll() {
    onClose()
    navigate(RouteBuilder.notifications())
  }

  return (
    <div className="notif-dropdown" ref={panelRef}>
      {/* Header */}
      <div className="notif-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="notif-title">Notifications</span>
          {counts.all > 0 && <span className="notif-new-badge">{counts.all}</span>}
        </div>
        <button className="notif-close" onClick={onClose} aria-label="Close notifications">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="notif-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`notif-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {counts[t.key] > 0 && (
              <span className="notif-tab-count">{counts[t.key]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Mark all read */}
      <button className="notif-mark-read" onClick={markAllRead}>
        Mark all read
      </button>

      {/* List */}
      <div className="notif-body">
        {newItems.length > 0 && (
          <>
            <div className="notif-section-label">New</div>
            {newItems.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
          </>
        )}
        {oldItems.length > 0 && (
          <>
            <div className="notif-section-label">Earlier</div>
            {oldItems.map(n => <NotifItem key={n.id} n={n} onRead={markRead} />)}
          </>
        )}
        {filtered.length === 0 && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
            No notifications here
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="notif-footer">
        <button className="notif-see-all" onClick={goToAll}>
          See all notifications <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}