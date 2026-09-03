// pages/admin/AdminActivityPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Search, ChevronLeft, ChevronRight,
  UserPlus, UserX, ShieldCheck, Undo2, Activity as ActivityIcon,
} from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import {
  adminDashboardAPI,
  type RecentActivityItem,
} from '../../services/adminDashboardApi'


const ADMIN_DASHBOARD_ROUTE = '/admin/dashboard'


const ACTIVITY_FETCH_LIMIT =    200
const PAGE_SIZE = 20


const ACTIVITY_TYPE_META: Record<string, { Icon: typeof UserPlus; bg: string; color: string; label: string }> = {
  invite: { Icon: UserPlus, bg: '#DBEAFE', color: '#2492EB', label: 'Invites' },
  suspension: { Icon: UserX, bg: '#FEE2E2', color: '#DC2626', label: 'Suspensions' },
  role_change: { Icon: ShieldCheck, bg: '#EDE9FE', color: '#7C3AED', label: 'Role Changes' },
  refund: { Icon: Undo2, bg: '#FEF3C7', color: '#D97706', label: 'Refunds' },
}
const ACTIVITY_FALLBACK_META = { Icon: ActivityIcon, bg: '#F3F4F6', color: '#6B7280' }
const ACTIVITY_CATEGORY_META: Record<RecentActivityItem['category'], string> = {
  payments: 'Payments',
  content: 'Content',
  platform: 'Platform',
}

function activityMeta(targetType: string) {
  return ACTIVITY_TYPE_META[targetType] ?? { ...ACTIVITY_FALLBACK_META, label: prettifyType(targetType) }
}

function prettifyType(targetType: string) {
  return targetType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .aa-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .aa-back { display: flex; align-items: center; gap: 0.4rem; border: none; background: none; color: #6B7280; font-weight: 600; font-size: 0.85rem; cursor: pointer; padding: 0; margin-bottom: 0.9rem; }

  .aa-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
  .aa-title { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .aa-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }

  .aa-search-wrapper { position: relative; width: 280px; max-width: 100%; }
  .aa-search-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; }
  .aa-search-input { width: 100%; box-sizing: border-box; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.6rem 0.9rem 0.6rem 2.4rem; font-size: 0.875rem; color: #111827; }
  .aa-search-input:focus { outline: none; border-color: #2492EB; }

  .aa-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .aa-tabs { display: flex; gap: 0.4rem; padding: 1rem 1.25rem; overflow-x: auto; border-bottom: 1px solid #F3F4F6; }
  .aa-tab { display: flex; align-items: center; gap: 0.4rem; border: none; background: #F9FAFB; color: #6B7280; font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.9rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; }
  .aa-tab.active { background: #EFF6FF; color: #2492EB; }
  .aa-tab-count { background: rgba(0,0,0,0.06); border-radius: 999px; padding: 0.05rem 0.4rem; font-size: 0.72rem; }
  .aa-tab.active .aa-tab-count { background: #DBEAFE; }

  .aa-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .aa-row:first-of-type { border-top: none; }
  .aa-icon { width: 36px; height: 36px; border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .aa-text { flex: 1; min-width: 0; }
  .aa-item-title { margin: 0; font-size: 0.9rem; font-weight: 600; color: #111827; }
  .aa-item-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
  .aa-time { font-size: 0.78rem; color: #9CA3AF; white-space: nowrap; flex-shrink: 0; }

  .aa-empty, .aa-loading, .aa-error { padding: 2.5rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
  .aa-error { color: #DC2626; }

  .aa-pagination { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .aa-pagination-info { font-size: 0.8rem; color: #6B7280; }
  .aa-pagination-controls { display: flex; align-items: center; gap: 0.5rem; }
  .aa-page-btn { display: flex; align-items: center; justify-content: center; gap: 0.3rem; border: 1px solid #E5E7EB; background: #fff; color: #374151; font-weight: 600; font-size: 0.82rem; padding: 0.45rem 0.8rem; border-radius: 0.6rem; cursor: pointer; }
  .aa-page-btn:disabled { color: #D1D5DB; cursor: not-allowed; }

  .aa-footnote { padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; font-size: 0.75rem; color: #9CA3AF; text-align: center; }

  @media (max-width: 640px) {
    .aa-page { padding: 1.25rem; }
    .aa-header { flex-direction: column; }
    .aa-search-wrapper { width: 100%; }
  }
`

export default function AdminActivityPage() {
  const navigate = useNavigate()

  const [activeType, setActiveType] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const [activity, setActivity] = useState<RecentActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce the search box (matches CourseCatalogPage's pattern) — search
  // is client-side over the fetched batch, not a server param yet.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset to page 1 whenever the filter or search changes.
  useEffect(() => {
    setPage(1)
  }, [activeType, debouncedSearch])

  useEffect(() => {
    let cancelled = false

    async function loadActivity() {
      setLoading(true)
      setError(null)

      const result = await adminDashboardAPI.getOverview('all_time', ACTIVITY_FETCH_LIMIT)

      if (cancelled) return

      if (result.success) {
        setActivity(result.data.recent_activity)
      } else {
        setError(result.error || "Couldn't load the activity log")
      }
      setLoading(false)
    }

    loadActivity()
    return () => { cancelled = true }
  }, [])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: activity.length,
      payments: 0,
      content: 0,
      platform: 0,
    }
    for (const item of activity) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
    return counts
  }, [activity])

  const filterTabs = useMemo(() => {
    return [
      { key: 'all', label: 'All', count: typeCounts.all },
      ...(['payments', 'content', 'platform'] as const).map((category) => ({
        key: category,
        label: ACTIVITY_CATEGORY_META[category],
        count: typeCounts[category],
      })),
    ]
  }, [typeCounts])

  const filteredActivity = useMemo(() => {
    return activity.filter((item) => {
      if (activeType !== 'all' && item.category !== activeType) return false
      if (debouncedSearch) {
        const haystack = `${item.description} ${item.actor}`.toLowerCase()
        if (!haystack.includes(debouncedSearch)) return false
      }
      return true
    })
  }, [activity, activeType, debouncedSearch])

  // Client-side pagination over the filtered slice of the single fetch.
  const totalPages = Math.max(1, Math.ceil(filteredActivity.length / PAGE_SIZE))
  const pagedActivity = filteredActivity.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rangeStart = filteredActivity.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredActivity.length)

  const pageLabel = useMemo(
    () => `${rangeStart}–${rangeEnd} of ${filteredActivity.length.toLocaleString()}`,
    [rangeStart, rangeEnd, filteredActivity.length],
  )

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="aa-page">

        <button className="aa-back" type="button" onClick={() => navigate(ADMIN_DASHBOARD_ROUTE)}>
          <ArrowLeft size={15} /> Back to Overview
        </button>

        <div className="aa-header">
          <div>
            <h1 className="aa-title">Activity Log</h1>
            <p className="aa-subtitle">Invites, suspensions, role changes & refunds</p>
          </div>
          <div className="aa-search-wrapper">
            <Search size={16} className="aa-search-icon" />
            <input
              className="aa-search-input"
              type="text"
              placeholder="Search activity…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        <div className="aa-panel">
          <div className="aa-tabs">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                className={`aa-tab${activeType === tab.key ? ' active' : ''}`}
                type="button"
                onClick={() => setActiveType(tab.key)}
              >
                {tab.label}
                <span className="aa-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="aa-loading">Loading…</div>
          ) : error ? (
            <div className="aa-error">{error}</div>
          ) : pagedActivity.length === 0 ? (
            <div className="aa-empty">No activity found{debouncedSearch ? ` for "${searchInput.trim()}"` : ''}.</div>
          ) : (
            pagedActivity.map((item, i) => {
              const { Icon, bg, color } = activityMeta(item.target_type)
              return (
                <div key={`${item.target_id}-${i}`} className="aa-row">
                  <div className="aa-icon" style={{ background: bg }}>
                    <Icon size={17} color={color} />
                  </div>
                  <div className="aa-text">
                    <p className="aa-item-title">{item.description}</p>
                    <p className="aa-item-sub">{item.actor}</p>
                  </div>
                  <span className="aa-time">{formatDateTime(item.created_at)}</span>
                </div>
              )
            })
          )}

          {!loading && !error && filteredActivity.length > 0 && (
            <div className="aa-pagination">
              <span className="aa-pagination-info">{pageLabel}</span>
              <div className="aa-pagination-controls">
                <button
                  className="aa-page-btn"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  className="aa-page-btn"
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {!loading && !error && activity.length >= ACTIVITY_FETCH_LIMIT && (
            <div className="aa-footnote">
              Showing the most recent {ACTIVITY_FETCH_LIMIT} events — older history isn't available until server-side pagination is added.
            </div>
          )}
        </div>

      </div>
    </AdminShell>
  )
}