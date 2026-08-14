import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  X, ChevronRight, Loader2,
  Trophy, MessageSquare, Radio, ClipboardList,
  CalendarCheck, Info,
} from 'lucide-react'
import { RouteBuilder } from '../../constants/routes'
import { notificationsAPI } from '../../services/api'
import {
  type Notification, type NotifCategory, TABS, tabCounts, mapApiNotification,
} from './notificationsData'

const PANEL_PAGE_SIZE = 10

export const NOTIF_CSS = `
  /* ── Bell wrapper ── */
  .bell-wrap { position: relative; }

  /* ── Backdrop (mobile only) ── */
  .notif-backdrop {
    display: none;
  }
  @media (max-width: 640px) {
    .notif-backdrop {
      display: block;
      position: fixed; inset: 0;
      background: rgba(17,24,39,0.45);
      z-index: 490;
      animation: notifBackdropIn 0.18s ease-out;
    }
  }
  @keyframes notifBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

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
      width: 100%; border: none; border-radius: 1.25rem 1.25rem 0 0;
      max-height: min(85vh, 85dvh);
      box-shadow: 0 -8px 32px rgba(0,0,0,0.18);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      animation: notifSheetIn 0.22s cubic-bezier(.32,.72,0,1);
    }
  }
  @keyframes notifSheetIn {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  /* ── Drag handle (mobile only) ── */
  .notif-drag-handle { display: none; }
  @media (max-width: 640px) {
    .notif-drag-handle {
      display: flex; justify-content: center;
      padding: 0.625rem 0 0.25rem; flex-shrink: 0;
    }
    .notif-drag-handle span {
      width: 36px; height: 4px; border-radius: 2px; background: #E5E7EB;
    }
  }

  /* ── Header ── */
  .notif-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.25rem 0.75rem;
    border-bottom: 1px solid #F3F4F6;
    flex-shrink: 0;
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
    border-bottom: 1px solid #F3F4F6; flex-shrink: 0;
  }
  .notif-mark-read:hover { opacity: 0.8; }
  .notif-mark-read:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Scrollable list ── */
  .notif-body {
    overflow-y: auto; flex: 1; min-height: 0;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

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

  /* ── Loading / error / empty ── */
  .notif-loading {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 2.5rem 1rem; color: #9CA3AF; font-size: 0.875rem;
  }
  .notif-spin { animation: notif-spin 0.8s linear infinite; }
  @keyframes notif-spin { to { transform: rotate(360deg); } }
  .notif-error {
    margin: 0.75rem 1.25rem; padding: 0.75rem 1rem;
    background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C;
    border-radius: 0.75rem; font-size: 0.8rem;
  }

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

  @media (max-width: 640px) {
    .notif-item { padding: 1rem 1.25rem; } /* slightly bigger tap targets on touch */
  }
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
  onOpen,
  fullText = false,
}: {
  n: Notification
  onOpen: (n: Notification) => void
  fullText?: boolean
}) {
  return (
    <div
      className={`notif-item${n.unread ? ' unread' : ' read'}`}
      onClick={() => onOpen(n)}
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
  const location = useLocation()
  const isTrainer = location.pathname.startsWith('/trainer')

  const [activeTab, setActiveTab] = useState<NotifCategory>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fetch a first page as soon as the panel opens.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const result = await notificationsAPI.list({ page: 1, page_size: PANEL_PAGE_SIZE })
      if (cancelled) return
      if (!result.success) {
        setError(result.error || 'Failed to load notifications.')
        setLoading(false)
        return
      }
      setNotifications(result.data.map(mapApiNotification))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Close on outside click/tap
  useEffect(() => {
    function onOutside(e: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onOutside)
      document.addEventListener('touchstart', onOutside)
    }, 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [onClose])

  // Lock background scroll while the panel is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab)

  const newItems = filtered.filter(n => n.unread)
  const oldItems = filtered.filter(n => !n.unread)
  const counts   = tabCounts(notifications)

  async function markAllRead() {
    setMarkingAll(true)
    const result = await notificationsAPI.markAllRead()
    setMarkingAll(false)
    if (!result.success) {
      setError(result.error || 'Failed to mark all as read.')
      return
    }
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  async function openNotification(n: Notification) {
    if (n.unread) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))
      const result = await notificationsAPI.markRead(n.id)
      if (!result.success) {
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: true } : x))
      }
    }
    onClose()
    if (n.actionUrl) navigate(n.actionUrl)
  }

  function goToAll() {
    onClose()
    navigate(isTrainer ? RouteBuilder.trainerNotifications() : RouteBuilder.notifications())
  }

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} />
      <div className="notif-dropdown" ref={panelRef}>
        {/* Drag handle — mobile bottom-sheet affordance only */}
        <div className="notif-drag-handle"><span /></div>

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
        <button className="notif-mark-read" onClick={markAllRead} disabled={markingAll || counts.all === 0}>
          {markingAll ? 'Marking…' : 'Mark all read'}
        </button>

        {error && <div className="notif-error">{error}</div>}

        {/* List */}
        <div className="notif-body">
          {loading ? (
            <div className="notif-loading">
              <Loader2 size={16} className="notif-spin" /> Loading…
            </div>
          ) : (
            <>
              {newItems.length > 0 && (
                <>
                  <div className="notif-section-label">New</div>
                  {newItems.map(n => <NotifItem key={n.id} n={n} onOpen={openNotification} />)}
                </>
              )}
              {oldItems.length > 0 && (
                <>
                  <div className="notif-section-label">Earlier</div>
                  {oldItems.map(n => <NotifItem key={n.id} n={n} onOpen={openNotification} />)}
                </>
              )}
              {filtered.length === 0 && !error && (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
                  You're all caught up
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="notif-footer">
          <button className="notif-see-all" onClick={goToAll}>
            See all notifications <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  )
}