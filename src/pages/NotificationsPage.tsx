import { useState } from 'react'
import {
  Trophy, MessageSquare, Radio, ClipboardList,
  CalendarCheck, Info,
} from 'lucide-react'
import AppShell, { SHELL_CSS } from '../components/layout/AppShell'
import { NOTIFICATIONS, type Notification, type NotifCategory, TABS, tabCounts } from '../components/layout/notificationsData'

// ── Page-level CSS ────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .np-content {
    padding: 2rem 2.5rem 3rem;
    display: flex; flex-direction: column; gap: 0;
  }

  /* ── Page header ── */
  .np-page-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .np-page-title-row { display: flex; align-items: center; gap: 0.625rem; }
  .np-page-title { font-size: 1.375rem; font-weight: 700; color: #111; }
  .np-new-badge {
    background: #2563EB; color: #fff;
    font-size: 0.7rem; font-weight: 800;
    padding: 0.2rem 0.625rem; border-radius: 2rem;
    letter-spacing: 0.04em;
  }
  .np-mark-all {
    font-size: 0.9375rem; font-weight: 600; color: #2563EB;
    background: none; border: none; cursor: pointer;
  }
  .np-mark-all:hover { opacity: 0.8; }

  /* ── Tabs ── */
  .np-tabs {
    display: flex; gap: 0.5rem; flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }
  .np-tab {
    display: flex; align-items: center; gap: 0.35rem;
    padding: 0.35rem 0.875rem; border-radius: 2rem;
    border: 1.5px solid #E5E7EB; background: #fff;
    font-size: 0.8125rem; font-weight: 600; color: #6B7280;
    cursor: pointer; white-space: nowrap; transition: all 0.12s;
  }
  .np-tab:hover { border-color: #D1D5DB; color: #374151; }
  .np-tab.active { background: #2563EB; border-color: #2563EB; color: #fff; }
  .np-tab-count { font-size: 0.75rem; font-weight: 700; }

  /* ── Section label ── */
  .np-section-label {
    font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em;
    color: #9CA3AF; text-transform: uppercase;
    padding: 0.75rem 0 0.5rem;
  }

  /* ── Notification card ── */
  .np-item {
    display: flex; align-items: flex-start; gap: 1rem;
    padding: 1rem 0; border-bottom: 1px solid #F3F4F6;
    position: relative; cursor: pointer; transition: background 0.12s;
    border-radius: 0.5rem;
  }
  .np-item:hover { background: #F9FAFB; padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }

  /* Red right-border on unread — matching Image 2 */
  .np-item.unread::after {
    content: ''; position: absolute; right: 0; top: 0; bottom: 0;
    width: 3px; background: #EF4444; border-radius: 2px 0 0 2px;
  }

  .np-icon-wrap {
    width: 44px; height: 44px; border-radius: 0.75rem;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 0.1rem;
  }
  .np-body { flex: 1; min-width: 0; }
  .np-item-title {
    font-size: 0.9375rem; font-weight: 700; color: #111;
    line-height: 1.35; margin-bottom: 0.25rem;
  }
  .np-item.read .np-item-title { font-weight: 500; color: #374151; }
  .np-item-sub { font-size: 0.875rem; color: #6B7280; line-height: 1.5; }
  .np-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
  .np-time { font-size: 0.8rem; color: #9CA3AF; white-space: nowrap; }
  .np-dot { width: 8px; height: 8px; border-radius: 50%; background: #2563EB; }

  /* ── Empty state ── */
  .np-empty {
    padding: 4rem 1rem; text-align: center;
    color: #9CA3AF; font-size: 0.9375rem;
  }

  /* ── Swipe hint ── */
  .np-hint {
    text-align: center; font-size: 0.75rem; color: #9CA3AF;
    padding: 1.25rem 0 0.25rem;
  }

  @media (max-width: 900px) { .np-content { padding: 1.5rem 1.25rem 2.5rem; } }
  @media (max-width: 640px) { .np-content { padding: 1.25rem 1rem 5rem; } .np-tabs { gap: 0.375rem; } }
`

// ── Icon map (lucide, matching Image 2) ───────────────────────────────────────
function NotifIcon({ category, bg }: { category: Notification['category']; bg: string }) {
  const p = { size: 20 }
  const icons: Record<Notification['category'], React.ReactNode> = {
    certificate: <Trophy        {...p} color="#F59E0B" />,
    feedback:    <MessageSquare {...p} color="#16A34A" />,
    live:        <Radio         {...p} color="#EF4444" />,
    deadlines:   <ClipboardList {...p} color="#EF4444" />,
    bookings:    <CalendarCheck {...p} color="#2563EB" />,
    system:      <Info          {...p} color="#6B7280" />,
  }
  return (
    <div className="np-icon-wrap" style={{ background: bg }}>
      {icons[category]}
    </div>
  )
}

// ── Full-page item row ─────────────────────────────────────────────────────────
function PageItem({ n, onRead }: { n: Notification; onRead: (id: number) => void }) {
  return (
    <div className={`np-item${n.unread ? ' unread' : ' read'}`} onClick={() => onRead(n.id)}>
      <NotifIcon category={n.category} bg={n.iconBg} />
      <div className="np-body">
        <div className="np-item-title">{n.title}</div>
        <div className="np-item-sub">{n.sub}</div>
      </div>
      <div className="np-meta">
        <span className="np-time">{n.time}</span>
        {n.unread && <div className="np-dot" />}
      </div>
    </div>
  )
}

// ── Page component ─────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [activeTab,      setActiveTab]      = useState<NotifCategory>('all')
  const [notifications,  setNotifications]  = useState<Notification[]>(NOTIFICATIONS)
  const [activeNav,      setActiveNav]      = useState('home')

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => n.category === activeTab)

  const newItems  = filtered.filter(n => n.isNew)
  const oldItems  = filtered.filter(n => !n.isNew)
  const counts    = tabCounts(notifications)

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }
  function markRead(id: number) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
  }

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="np-content">

          {/* Page header */}
          <div className="np-page-header">
            <div className="np-page-title-row">
              <span className="np-page-title">Notifications</span>
              {counts.all > 0 && (
                <span className="np-new-badge">{counts.all} new</span>
              )}
            </div>
            <button className="np-mark-all" onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          {/* Tabs */}
          <div className="np-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`np-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {counts[t.key] > 0 && (
                  <span className="np-tab-count">{counts[t.key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* New section */}
          {newItems.length > 0 && (
            <>
              <div className="np-section-label">New</div>
              {newItems.map(n => (
                <PageItem key={n.id} n={n} onRead={markRead} />
              ))}
            </>
          )}

          {/* Earlier section */}
          {oldItems.length > 0 && (
            <>
              <div className="np-section-label">Earlier</div>
              {oldItems.map(n => (
                <PageItem key={n.id} n={n} onRead={markRead} />
              ))}
            </>
          )}

          {filtered.length === 0 && (
            <div className="np-empty">No notifications here</div>
          )}

          {filtered.length > 0 && (
            <div className="np-hint">Swipe left on a notification to dismiss</div>
          )}

        </div>
      </AppShell>
    </>
  )
}