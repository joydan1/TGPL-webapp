import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react'
import {
  Plus, Search, MoreVertical, Layers, Globe, Pencil, TrendingUp,
  Eye, Tag, UserCog, Archive, Trash2, AlertCircle, X as XIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminShell from '../../layouts/AdminShell'
import {
  type AdminCourseRow, type CourseStatus, type CatalogStats,
  type ArchiveCoursePayload,
} from '../../types/adminCourse'
import { adminCoursesAPI } from '../../services/adminCoursesApi'
import CourseDetailModal, { COURSE_DETAIL_MODAL_CSS } from '../../components/admin/CourseDetailModal'
import SetPriceModal, { SET_PRICE_MODAL_CSS } from '../../components/admin/SetPriceModal'
import ArchiveCourseModal, { ARCHIVE_COURSE_MODAL_CSS } from '../../components/admin/ArchiveCourseModal'
import DeleteCourseModal, { DELETE_COURSE_MODAL_CSS } from '../../components/admin/DeleteCourseModal'
import AssignTrainerModal, { ASSIGN_TRAINER_MODAL_CSS } from '../../components/admin/AssignTrainerModal'

// ─── Styles ────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .cc-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .cc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .cc-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .cc-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .cc-create-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.7rem 1.2rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; white-space: nowrap; }

  .cc-error-banner { display: flex; align-items: center; gap: 0.6rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.85rem; }
  .cc-error-banner button { margin-left: auto; background: none; border: none; color: #B91C1C; cursor: pointer; display: flex; flex-shrink: 0; }

  .cc-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .cc-stat-card { background: #fff; border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .cc-stat-icon { width: 44px; height: 44px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-stat-value { margin: 0; font-size: 1.5rem; font-weight: 800; color: #111827; }
  .cc-stat-value.loading { color: #D1D5DB; }
  .cc-stat-label { margin: 0.15rem 0 0; font-size: 0.82rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .cc-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .cc-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .cc-status-tabs { display: flex; gap: 0.4rem; background: #F9FAFB; border-radius: 0.75rem; padding: 0.3rem; overflow-x: auto; max-width: 100%; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .cc-status-tabs::-webkit-scrollbar { display: none; }
  .cc-status-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1.1rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .cc-status-tab.active { background: #2492EB; color: #fff; }
  .cc-search-wrap { flex: 1 1 220px; min-width: 0; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; }
  .cc-search-wrap input { flex: 1; min-width: 0; background: none; border: none; outline: none; font-size: 0.875rem; color: #111; }
  .cc-search-wrap input::placeholder { color: #9CA3AF; }

  .cc-table-wrap { overflow-x: auto; overflow-y: visible; -webkit-overflow-scrolling: touch; position: relative; min-height: 120px; }
  .cc-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .cc-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .cc-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #111827; vertical-align: middle; }
  .cc-table tr:last-child td { border-bottom: none; }
  .cc-table tr.pending { opacity: 0.5; pointer-events: none; }

  .cc-course-cell { display: flex; align-items: center; gap: 0.7rem; }
  .cc-course-icon { width: 38px; height: 38px; border-radius: 0.6rem; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-course-title { font-weight: 600; color: #111827; white-space: nowrap; }
  .cc-course-sub { font-size: 0.75rem; color: #9CA3AF; }

  .cc-trainer-cell { display: flex; align-items: center; gap: 0.55rem; }
  .cc-trainer-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.68rem; flex-shrink: 0; }

  .cc-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .cc-status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .cc-status-badge.published { background: #F0FDF4; color: #10B981; border: 1px solid #BBF7D0; }
.cc-status-badge.published .cc-status-dot { background: #10B981; }
  .cc-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .cc-status-badge.draft .cc-status-dot { background: #D97706; }
  .cc-status-badge.archived { background: #F3F4F6; color: #6B7280; }
  .cc-status-badge.archived .cc-status-dot { background: #9CA3AF; }

  .cc-row-menu-wrap { position: relative; text-align: right; }
  .cc-row-menu-btn { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.4rem; border-radius: 0.5rem; display: inline-flex; }
  .cc-row-menu-btn:hover { background: #F3F4F6; color: #374151; }
  .cc-row-menu { position: fixed; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 190px; padding: 0.4rem; z-index: 200; text-align: left; }
  .cc-row-menu-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.55rem; border: none; background: none; font-size: 0.85rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; }
  .cc-row-menu-item:hover { background: #F9FAFB; }
  .cc-row-menu-item:disabled { opacity: 0.5; cursor: not-allowed; }
  .cc-row-menu-item.danger { color: #DC2626; }
  .cc-row-menu-item.danger:hover { background: #FEF2F2; }
  .cc-row-menu-divider { height: 1px; background: #F3F4F6; margin: 0.3rem 0.2rem; }
  .cc-row-menu-backdrop { position: fixed; inset: 0; z-index: 150; }

  .cc-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; }
  .cc-footer-text { font-size: 0.82rem; color: #6B7280; }
  .cc-pagination { display: flex; align-items: center; gap: 0.5rem; }
  .cc-page-btn { border: 1px solid #E5E7EB; background: #fff; color: #374151; font-size: 0.8rem; font-weight: 600; border-radius: 0.5rem; padding: 0.4rem 0.8rem; cursor: pointer; }
  .cc-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .cc-page-pill { min-width: 30px; height: 30px; padding: 0 0.5rem; border-radius: 0.5rem; background: #2492EB; color: #fff; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; }


  .cc-empty { padding: 3rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
  .cc-loading-row td { color: #9CA3AF; text-align: center; padding: 2.5rem 1.25rem; }

  @media (max-width: 900px) {
    .cc-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .cc-page { padding: 1.25rem; }
    .cc-header { flex-direction: column; align-items: stretch; }
    .cc-create-btn { width: 100%; }
    .cc-toolbar { flex-direction: column; align-items: stretch; }
    .cc-search-wrap { flex-basis: auto; }
    .cc-footer { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 420px) {
    .cc-stats-grid { grid-template-columns: 1fr; }
  }
`

// ─── Helpers ───────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

// price_kobo / revenue_kobo are in kobo (1 naira = 100 kobo) per the live
// schema — everything downstream must convert before formatting.
function formatNaira(kobo: number) {
  const naira = kobo / 100
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(1)}K`
  return naira === 0 ? 'Nil' : `₦${naira.toLocaleString()}`
}

function apiErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return 'Something went wrong. Please try again.'
}

const STATUS_TABS: { key: 'all' | CourseStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Draft' },
  { key: 'archived',  label: 'Archived' },
]

const ROW_MENU_WIDTH = 190
const ROW_MENU_MARGIN = 8
const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

export default function AdminCoursesPage() {
  const navigate = useNavigate()

  // ── List data ──
  const [courses, setCourses] = useState<AdminCourseRow[]>([])
  const [count, setCount] = useState(0)
  const [next, setNext] = useState<string | null>(null)
  const [previous, setPrevious] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  // ── Stats ──
  const [stats, setStats] = useState<CatalogStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // ── Filters ──
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // ── Row action state ──
  const [actionError, setActionError] = useState<string | null>(null)
  const [actioningSlug, setActioningSlug] = useState<string | null>(null)

  // ── Row menu ──
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const menuBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const menuRef = useRef<HTMLDivElement | null>(null)

  // ── Modals ──
  const [viewingCourse, setViewingCourse] = useState<AdminCourseRow | null>(null)
  const [pricingCourse, setPricingCourse] = useState<AdminCourseRow | null>(null)
  const [assigningCourse, setAssigningCourse] = useState<AdminCourseRow | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<AdminCourseRow | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<AdminCourseRow | null>(null)

  // Debounce search input → debouncedSearch, and reset to page 1 whenever
  // the effective query (search or status) changes.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    const res = await adminCoursesAPI.aggregateCatalogStats()
    if (res.success) {
      setStats(res.data)
    } else {
      // Stats failing shouldn't block the table — just leave tiles blank.
      setStats(null)
    }
    setStatsLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    let cancelled = false
    setListLoading(true)
    setListError(null)

    adminCoursesAPI.listCourses({
      page,
      page_size: PAGE_SIZE,
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }).then((res) => {
      if (cancelled) return
      if (res.success) {
        setCourses(res.data.results)
        setCount(res.data.count)
        setNext(res.data.next)
        setPrevious(res.data.previous)
      } else {
        setListError(apiErrorMessage(res.error))
      }
      setListLoading(false)
    })

    return () => { cancelled = true }
  }, [page, debouncedSearch, statusFilter])

  
  useEffect(() => {
    if (!openMenuId) return
    function close() {
      setOpenMenuId(null)
      setMenuPos(null)
    }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [openMenuId])

  // Flip the row menu above its button (or clamp to viewport) if it doesn't
  // fit below — fixes menus near the bottom of the page getting clipped.
  useLayoutEffect(() => {
    if (!openMenuId || !menuPos) return
    const btn = menuBtnRefs.current[openMenuId]
    const menuEl = menuRef.current
    if (!btn || !menuEl) return

    const btnRect = btn.getBoundingClientRect()
    const menuHeight = menuEl.getBoundingClientRect().height
    const spaceBelow = window.innerHeight - btnRect.bottom - ROW_MENU_MARGIN
    const spaceAbove = btnRect.top - ROW_MENU_MARGIN

    let top: number
    if (menuHeight <= spaceBelow) {
      top = btnRect.bottom + 6
    } else if (menuHeight <= spaceAbove) {
      top = btnRect.top - menuHeight - 6
    } else {
      top = spaceBelow >= spaceAbove
        ? Math.max(ROW_MENU_MARGIN, window.innerHeight - menuHeight - ROW_MENU_MARGIN)
        : ROW_MENU_MARGIN
    }

    if (Math.abs(top - menuPos.top) > 0.5) {
      setMenuPos((prev) => (prev ? { ...prev, top } : prev))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuId, menuPos?.left])

  function toggleRowMenu(slug: string) {
    if (openMenuId === slug) {
      setOpenMenuId(null)
      setMenuPos(null)
      return
    }
    const btn = menuBtnRefs.current[slug]
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const left = Math.min(
        rect.right - ROW_MENU_WIDTH,
        window.innerWidth - ROW_MENU_WIDTH - ROW_MENU_MARGIN
      )
      setMenuPos({ top: rect.bottom + 6, left: Math.max(ROW_MENU_MARGIN, left) })
    }
    setOpenMenuId(slug)
  }

  function closeRowMenu() {
    setOpenMenuId(null)
    setMenuPos(null)
  }

  function handleViewCourse(course: AdminCourseRow) {
    closeRowMenu()
    setViewingCourse(course)
  }

  function handleSetPrice(course: AdminCourseRow) {
    closeRowMenu()
    setPricingCourse(course)
  }

  function handleAssignTrainer(course: AdminCourseRow) {
    closeRowMenu()
    setAssigningCourse(course)
  }

  function handleArchive(course: AdminCourseRow) {
    closeRowMenu()
    setArchivingCourse(course)
  }

  function handleDelete(course: AdminCourseRow) {
    closeRowMenu()
    setDeletingCourse(course)
  }

  async function confirmSetPrice(course: AdminCourseRow, priceKobo: number | null) {
    setActioningSlug(course.slug)
    setActionError(null)
    const res = await adminCoursesAPI.updateCourse(course.slug, {
      is_free: priceKobo === null,
      price_kobo: priceKobo ?? 0,
    })
    setActioningSlug(null)
    if (res.success) {
      setCourses((prev) => prev.map((c) => (c.slug === course.slug ? { ...c, ...res.data } : c)))
      setPricingCourse(null)
    } else {
      setActionError(apiErrorMessage(res.error))
    }
  }

  async function confirmArchive(course: AdminCourseRow, payload: ArchiveCoursePayload) {
    setActioningSlug(course.slug)
    setActionError(null)
    const res = await adminCoursesAPI.archiveCourse(course.slug, payload)
    setActioningSlug(null)
    if (res.success) {
      setCourses((prev) => prev.map((c) => (c.slug === course.slug ? { ...c, ...res.data } : c)))
      setArchivingCourse(null)
      fetchStats()
    } else {
      
      setActionError(apiErrorMessage(res.error))
    }
  }

  async function confirmDelete(course: AdminCourseRow) {
    setActioningSlug(course.slug)
    setActionError(null)
    const res = await adminCoursesAPI.deleteCourse(course.slug)
    setActioningSlug(null)
    if (res.success) {
      setCourses((prev) => prev.filter((c) => c.slug !== course.slug))
      setCount((prev) => Math.max(0, prev - 1))
      setDeletingCourse(null)
      fetchStats()
    } else {
     
      setActionError(apiErrorMessage(res.error))
    }
  }

  async function confirmAssignTrainer(course: AdminCourseRow, trainerId: string) {
    setActioningSlug(course.slug)
    setActionError(null)
    const res = await adminCoursesAPI.assignTrainer(course.slug, trainerId)
    setActioningSlug(null)
    if (res.success) {
      setCourses((prev) => prev.map((c) => (c.slug === course.slug ? { ...c, ...res.data } : c)))
      setAssigningCourse(null)
    } else {
      setActionError(apiErrorMessage(res.error))
    }
  }

function handleCreateCourse() {
  navigate('/admin/courses/create')
}

  const openCourse = courses.find((c) => c.slug === openMenuId) ?? null
  const pageStart = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const pageEnd = Math.min(page * PAGE_SIZE, count)

  return (
    <AdminShell>
      <style>
        {PAGE_CSS + COURSE_DETAIL_MODAL_CSS + SET_PRICE_MODAL_CSS
          + ARCHIVE_COURSE_MODAL_CSS + DELETE_COURSE_MODAL_CSS + ASSIGN_TRAINER_MODAL_CSS}
      </style>
      <div className="cc-page">

        <div className="cc-header">
          <div>
            <h1 className="cc-title">Course Catalog</h1>
            <p className="cc-subtitle">{count} course{count === 1 ? '' : 's'}</p>
          </div>
          <button className="cc-create-btn" type="button" onClick={handleCreateCourse}>
            <Plus size={17} /> Create course
          </button>
        </div>

        {actionError && (
          <div className="cc-error-banner">
            <AlertCircle size={16} />
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss">
              <XIcon size={14} />
            </button>
          </div>
        )}

        <div className="cc-stats-grid">
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#E9F5FF' }}>
  <Layers size={20} color="#2492EB" />
</div>
            <div>
              <p className={`cc-stat-value${statsLoading ? ' loading' : ''}`}>{statsLoading ? '—' : stats?.total_courses ?? 0}</p>
              <p className="cc-stat-label">Total courses</p>
            </div>
          </div>
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#F0FDF4' }}>
  <Globe size={20} color="#10B981" />
</div>
            <div>
              <p className={`cc-stat-value${statsLoading ? ' loading' : ''}`}>{statsLoading ? '—' : stats?.published ?? 0}</p>
              <p className="cc-stat-label">Published</p>
            </div>
          </div>
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#FFF7E6' }}>
  <Pencil size={20} color="#FE9A00" />
</div>
            <div>
              <p className={`cc-stat-value${statsLoading ? ' loading' : ''}`}>{statsLoading ? '—' : stats?.draft ?? 0}</p>
              <p className="cc-stat-label">Draft</p>
            </div>
          </div>
          <div className="cc-stat-card">
           <div className="cc-stat-icon" style={{ background: '#F5F3FF' }}>
  <TrendingUp size={20} color="#8B5CF6" />
</div>
            <div>
              <p className={`cc-stat-value${statsLoading ? ' loading' : ''}`}>{statsLoading ? '—' : formatNaira(stats?.total_revenue_kobo ?? 0)}</p>
              <p className="cc-stat-label">Total revenue</p>
            </div>
          </div>
        </div>

        <div className="cc-panel">
          <div className="cc-toolbar">
            <div className="cc-status-tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`cc-status-tab${statusFilter === tab.key ? ' active' : ''}`}
                  onClick={() => setStatusFilter(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="cc-search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search by title, slug, or trainer email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" disabled />
                  </th>
                  <th>Course</th>
                  <th>Trainer</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th>Revenue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {listLoading && (
                  <tr className="cc-loading-row"><td colSpan={8}>Loading courses…</td></tr>
                )}

                {!listLoading && listError && (
                  <tr className="cc-loading-row"><td colSpan={8}>{listError}</td></tr>
                )}

                {!listLoading && !listError && courses.map((course) => (
                  <tr key={course.slug} className={actioningSlug === course.slug ? 'pending' : ''}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="cc-course-cell">
                        <div className="cc-course-icon">
                          <Layers size={18} />
                        </div>
                        <div>
                          <div className="cc-course-title">{course.title}</div>
                          <div className="cc-course-sub">
                            {course.completion_percentage}% avg. completion
                            {!course.is_final_assignment_set && ' · No capstone set'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cc-trainer-cell">
                        <div className="cc-trainer-avatar" style={{ background: '#059669' }}>
                          {initials(course.trainer.full_name)}
                        </div>
                        {course.trainer.full_name}
                      </div>
                    </td>
                    <td>{course.is_free ? 'Free' : formatNaira(course.price_kobo)}</td>
                    <td>
                      <span className={`cc-status-badge ${course.status}`}>
                        <span className="cc-status-dot" />
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </td>
                    <td>{course.enrollment_count}</td>
                    <td>{formatNaira(course.revenue_kobo)}</td>
                    <td>
                      <div className="cc-row-menu-wrap">
                        <button
                          ref={(el) => { menuBtnRefs.current[course.slug] = el }}
                          className="cc-row-menu-btn"
                          onClick={() => toggleRowMenu(course.slug)}
                          aria-label="Row actions"
                          aria-haspopup="true"
                          aria-expanded={openMenuId === course.slug}
                          type="button"
                          disabled={actioningSlug === course.slug}
                        >
                          <MoreVertical size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!listLoading && !listError && courses.length === 0 && (
              <div className="cc-empty">No courses match your filters.</div>
            )}
          </div>

          <div className="cc-footer">
            <span className="cc-footer-text">
              {count === 0 ? 'No courses' : `Showing ${pageStart}–${pageEnd} of ${count} courses`}
            </span>
            <div className="cc-pagination">
              <button
                className="cc-page-btn"
                type="button"
                disabled={!previous || listLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="cc-page-pill">{page}</span>
              <button
                className="cc-page-btn"
                type="button"
                disabled={!next || listLoading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {openMenuId && openCourse && menuPos && (
        <>
          <div className="cc-row-menu-backdrop" onClick={closeRowMenu} />
          <div ref={menuRef} className="cc-row-menu" role="menu" style={{ top: menuPos.top, left: menuPos.left }}>
            <button className="cc-row-menu-item" onClick={() => handleViewCourse(openCourse)} type="button">
              <Eye size={15} /> View course
            </button>
            <button className="cc-row-menu-item" onClick={() => handleSetPrice(openCourse)} type="button">
              <Tag size={15} /> Set price
            </button>
            <button className="cc-row-menu-item" onClick={() => handleAssignTrainer(openCourse)} type="button">
              <UserCog size={15} /> Assign trainer
            </button>
            <div className="cc-row-menu-divider" />
            <button
              className="cc-row-menu-item"
              onClick={() => handleArchive(openCourse)}
              type="button"
              disabled={openCourse.status === 'archived'}
            >
              <Archive size={15} /> Archive
            </button>
            <button className="cc-row-menu-item danger" onClick={() => handleDelete(openCourse)} type="button">
              <Trash2 size={15} /> Delete course
            </button>
          </div>
        </>
      )}

      {viewingCourse && (
        <CourseDetailModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
          onEdit={() => navigate(`/admin/courses/${viewingCourse.slug}/edit`)}
          onSetPrice={() => { setPricingCourse(viewingCourse); setViewingCourse(null) }}
          onArchive={() => { setArchivingCourse(viewingCourse); setViewingCourse(null) }}
          onDelete={() => { setDeletingCourse(viewingCourse); setViewingCourse(null) }}
        />
      )}

      {pricingCourse && (
        <SetPriceModal
          course={pricingCourse}
          onClose={() => setPricingCourse(null)}
          onConfirm={(newPriceKobo: number | null) => confirmSetPrice(pricingCourse, newPriceKobo)}
        />
      )}

      {assigningCourse && (
        <AssignTrainerModal
          course={assigningCourse}
          onClose={() => setAssigningCourse(null)}
          onConfirm={(trainerId: string) => confirmAssignTrainer(assigningCourse, trainerId)}
        />
      )}

      {archivingCourse && (
        <ArchiveCourseModal
          course={archivingCourse}
          onClose={() => setArchivingCourse(null)}
          onConfirm={(payload: ArchiveCoursePayload) => confirmArchive(archivingCourse, payload)}
        />
      )}

      {deletingCourse && (
        <DeleteCourseModal
          course={deletingCourse}
          onClose={() => setDeletingCourse(null)}
          onConfirm={() => confirmDelete(deletingCourse)}
        />
      )}
    </AdminShell>
  )
}