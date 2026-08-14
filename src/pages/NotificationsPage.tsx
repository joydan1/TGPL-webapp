import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import TrainerShell from '../layouts/TrainerShell'
import {
  Trophy, MessageSquare, Radio, ClipboardList,
  CalendarCheck, Info, Loader2,
} from 'lucide-react'
import AppShell, { SHELL_CSS } from '../components/layout/AppShell'
import { notificationsAPI } from '../services/api'
import {
  type Notification, type NotifCategory, TABS, tabCounts, mapApiNotification,
} from '../components/layout/notificationsData'

const PAGE_SIZE = 20

// ── Page-level CSS ────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .np-content {
    padding: 2rem 2.5rem 3rem;
    display: flex; flex-direction: column; gap: 0;
  }

  .np-page-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  .np-page-title-row { display: flex; align-items: center; gap: 0.625rem; }
  .np-page-title { font-size: 1.375rem; font-weight: 700; color: #111; }
  .np-new-badge {
    background: #2492EB; color: #fff;
    font-size: 0.7rem; font-weight: 800;
    padding: 0.2rem 0.625rem; border-radius: 2rem;
    letter-spacing: 0.04em;
  }
  .np-mark-all {
    font-size: 0.9375rem; font-weight: 600; color: #2492EB;
    background: none; border: none; cursor: pointer;
  }
  .np-mark-all:hover { opacity: 0.8; }
  .np-mark-all:disabled { opacity: 0.5; cursor: not-allowed; }

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
  .np-tab.active { background: #2492EB; border-color: #2492EB; color: #fff; }
  .np-tab-count { font-size: 0.75rem; font-weight: 700; }

  .np-section-label {
    font-size: 0.75rem; font-weight: 800; letter-spacing: 0.1em;
    color: #9CA3AF; text-transform: uppercase;
    padding: 0.75rem 0 0.5rem;
  }

  .np-item {
    display: flex; align-items: flex-start; gap: 1rem;
    padding: 1rem 0; border-bottom: 1px solid #F3F4F6;
    position: relative; cursor: pointer; transition: background 0.12s;
    border-radius: 0.5rem;
  }
  .np-item:hover { background: #F9FAFB; padding-left: 0.5rem; padding-right: 0.5rem; margin: 0 -0.5rem; }

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
  .np-dot { width: 8px; height: 8px; border-radius: 50%; background: #2492EB; }

  .np-empty {
    padding: 4rem 1rem; text-align: center;
    color: #9CA3AF; font-size: 0.9375rem;
  }
  .np-error {
    padding: 1rem 1.25rem; text-align: center;
    color: #B91C1C; background: #FEF2F2; border: 1px solid #FECACA;
    border-radius: 0.85rem; font-size: 0.875rem; margin-bottom: 1.25rem;
  }
  .np-loading {
    display: flex; align-items: center; justify-content: center;
    gap: 0.5rem; padding: 3rem 1rem; color: #9CA3AF; font-size: 0.9rem;
  }
  .np-spin { animation: np-spin 0.8s linear infinite; }
  @keyframes np-spin { to { transform: rotate(360deg); } }

  .np-loadmore-wrap { display: flex; justify-content: center; padding: 1.25rem 0 0.25rem; }
  .np-loadmore-btn {
    padding: 0.6rem 1.5rem; border-radius: 2rem; border: 1px solid #E5E7EB;
    background: #fff; color: #374151; font-size: 0.85rem; font-weight: 600;
    cursor: pointer;
  }
  .np-loadmore-btn:hover { background: #F9FAFB; }
  .np-loadmore-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 900px) { .np-content { padding: 1.5rem 1.25rem 2.5rem; } }
  @media (max-width: 640px) { .np-content { padding: 1.25rem 1rem 5rem; } .np-tabs { gap: 0.375rem; } }
`

function NotifIcon({ category, bg }: { category: Notification['category']; bg: string }) {
  const p = { size: 20 }
  const icons: Record<Notification['category'], React.ReactNode> = {
    certificate: <Trophy        {...p} color="#F59E0B" />,
    feedback:    <MessageSquare {...p} color="#16A34A" />,
    live:        <Radio         {...p} color="#EF4444" />,
    deadlines:   <ClipboardList {...p} color="#EF4444" />,
    bookings:    <CalendarCheck {...p} color="#2492EB" />,
    system:      <Info          {...p} color="#6B7280" />,
  }
  return (
    <div className="np-icon-wrap" style={{ background: bg }}>
      {icons[category]}
    </div>
  )
}

function PageItem({ n, onOpen }: { n: Notification; onOpen: (n: Notification) => void }) {
  return (
    <div className={`np-item${n.unread ? ' unread' : ' read'}`} onClick={() => onOpen(n)}>
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

export default function NotificationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isTrainer = location.pathname.startsWith('/trainer')

  const [activeTab, setActiveTab] = useState<NotifCategory>('all')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeNav, setActiveNav] = useState('home')

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    const result = await notificationsAPI.list({ page: pageNum, page_size: PAGE_SIZE })

    if (!result.success) {
      setError(result.error || 'Failed to load notifications.')
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const mapped = result.data.map(mapApiNotification)
    setNotifications((prev) => (append ? [...prev, ...mapped] : mapped))
    setHasMore(Boolean(result.next))
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    setPage(1)
    loadPage(1, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadMore() {
    const next = page + 1
    setPage(next)
    loadPage(next, true)
  }

  async function markAllRead() {
    setMarkingAll(true)
    const result = await notificationsAPI.markAllRead()
    setMarkingAll(false)
    if (!result.success) {
      setError(result.error || 'Failed to mark all as read.')
      return
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  async function openNotification(n: Notification) {
    if (n.unread) {
      // Optimistic — flip locally right away, reconcile silently if the API call fails.
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))
      const result = await notificationsAPI.markRead(n.id)
      if (!result.success) {
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: true } : x)))
      }
    }
    if (n.actionUrl) navigate(n.actionUrl)
  }

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeTab)

  const newItems = filtered.filter((n) => n.unread)
  const oldItems = filtered.filter((n) => !n.unread)
  const counts = tabCounts(notifications)

  const body = (
    <div className="np-content">

      <div className="np-page-header">
        <div className="np-page-title-row">
          <span className="np-page-title">Notifications</span>
          {counts.all > 0 && (
            <span className="np-new-badge">{counts.all} new</span>
          )}
        </div>
        <button className="np-mark-all" onClick={markAllRead} disabled={markingAll || counts.all === 0}>
          {markingAll ? 'Marking…' : 'Mark all read'}
        </button>
      </div>

      <div className="np-tabs">
        {TABS.map((t) => (
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

      {error && <div className="np-error">{error}</div>}

      {loading ? (
        <div className="np-loading">
          <Loader2 size={18} className="np-spin" /> Loading notifications…
        </div>
      ) : (
        <>
          {newItems.length > 0 && (
            <>
              <div className="np-section-label">New</div>
              {newItems.map((n) => (
                <PageItem key={n.id} n={n} onOpen={openNotification} />
              ))}
            </>
          )}

          {oldItems.length > 0 && (
            <>
              <div className="np-section-label">Earlier</div>
              {oldItems.map((n) => (
                <PageItem key={n.id} n={n} onOpen={openNotification} />
              ))}
            </>
          )}

          {filtered.length === 0 && !error && (
            <div className="np-empty">You're all caught up</div>
          )}

          {hasMore && (
            <div className="np-loadmore-wrap">
              <button className="np-loadmore-btn" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      {isTrainer ? (
        <TrainerShell>{body}</TrainerShell>
      ) : (
        <AppShell activeNav={activeNav} onNavChange={setActiveNav}>{body}</AppShell>
      )}
    </>
  )
}