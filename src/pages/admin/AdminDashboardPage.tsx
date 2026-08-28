// pages/admin/AdminDashboardPage.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, BookOpen, GraduationCap, CreditCard, ChevronDown, Download,
  Banknote, FileText, Activity as ActivityIcon, TrendingUp, TrendingDown,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AdminShell from '../../layouts/AdminShell'
import { adminUsersAPI } from '../../services/adminUsersApi'
import { adminCoursesAPI } from '../../services/adminCoursesApi'
import {
  adminDashboardAPI,
  type DashboardPeriod,
  type RecentActivityItem,
  type EnrollmentTrendPoint,
} from '../../services/adminDashboardApi'
import {
  adminRevenueAPI,
  type MonthlyRevenuePoint,
} from '../../services/adminRevenueApi'

const ADMIN_ACTIVITY_ROUTE = '/admin/activity'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  total_users: number | null
  active_courses: number | null
  revenue_naira: number | null
}

interface TopCourse {
  id: string
  title: string
  enrollments: number
  color: string
}

const TOP_COURSE_COLORS = ['#7C3AED', '#2492EB', '#16A34A', '#F59E0B', '#DC2626']

const DASHBOARD_ACTIVITY_LIMIT = 50

const RANGE_OPTIONS: { label: string; period: DashboardPeriod; approx?: boolean }[] = [
  { label: 'Last Week', period: 'last_7_days' },
  { label: 'Last Month', period: 'last_30_days' },
  { label: 'Last Quarter', period: 'last_90_days' },
  { label: 'Last Year', period: 'all_time', approx: true },
]


// The dashboard overview endpoint now tags each recent_activity item with a
// `category` field — payments | content | platform — instead of us guessing
// a bucket from target_type text. There's deliberately no "certificates"
// category (issuance is automatic/high-volume, kept out of the curated
// feed). "platform" is a catch-all (invites, suspensions, role changes) and
// doesn't have a confirmed tab treatment yet per Dan — until that's settled,
// it's shown as its own tab like the other two.
const ACTIVITY_CATEGORY_META: Record<
  string,
  { Icon: typeof Banknote; bg: string; color: string; label: string }
> = {
  payments: { Icon: Banknote, bg: '#F0FDF4', color: '#10B981', label: 'Payments' },
  content: { Icon: FileText, bg: '#F5F3FF', color: '#8B5CF6', label: 'Content' },
  platform: { Icon: ActivityIcon, bg: '#F3F4F6', color: '#6B7280', label: 'Platform' },
}
const ACTIVITY_CATEGORY_FALLBACK = { Icon: ActivityIcon, bg: '#F3F4F6', color: '#6B7280', label: 'Other' }

function activityCategoryMeta(category: string) {
  return ACTIVITY_CATEGORY_META[category] ?? { ...ACTIVITY_CATEGORY_FALLBACK, label: prettifyType(category) }
}

function prettifyType(targetType: string) {
  return targetType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}



function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvField).join(',')
}

function downloadCsv(filename: string, sections: string[][]) {
  const csv = sections.map((rows) => rows.join('\n')).join('\n\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .ad-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .ad-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .ad-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .ad-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .ad-header-actions { display: flex; align-items: center; gap: 0.75rem; }

  .ad-range-wrapper { position: relative; }
  .ad-range-select { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.6rem 1rem; font-size: 0.875rem; font-weight: 600; color: #111827; cursor: pointer; }
  .ad-range-menu { position: absolute; top: calc(100% + 6px); right: 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12); z-index: 10; min-width: 170px; overflow: hidden; }
  .ad-range-option { display: block; width: 100%; text-align: left; border: none; background: none; padding: 0.65rem 0.9rem; font-size: 0.85rem; font-weight: 600; color: #374151; cursor: pointer; }
  .ad-range-option:hover { background: #F9FAFB; }
  .ad-range-option.active { color: #2492EB; background: #EFF6FF; }
  .ad-range-note { margin: 0.35rem 0 0; font-size: 0.72rem; color: #9CA3AF; text-align: right; }

  .ad-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.6rem 1.1rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  .ad-export-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .ad-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .ad-stat-card { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); }
  .ad-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .ad-stat-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .ad-stat-title { margin: 0.3rem 0 0.4rem; color: #6B7280; font-size: 0.8rem; }
  .ad-stat-change { font-size: 0.78rem; font-weight: 700; color: #16A34A; display: flex; align-items: center; gap: 0.2rem; }
  .ad-stat-change.negative { color: #DC2626; }
  .ad-stat-change.muted { color: #9CA3AF; font-weight: 600; }
  .ad-stat-skeleton { height: 1.6rem; width: 60%; background: #F3F4F6; border-radius: 0.4rem; }
  .ad-stat-icon { width: 38px; height: 38px; border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .ad-charts { display: grid; grid-template-columns: 2fr 1.3fr 1.3fr; gap: 1rem; margin-bottom: 1.25rem; align-items: stretch; }
  .ad-panel { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); }
  .ad-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
  .ad-panel-title { margin: 0; font-size: 1rem; font-weight: 700; color: #111827; }
  .ad-panel-sub { margin: 0.2rem 0 0; color: #9CA3AF; font-size: 0.78rem; }
  .ad-panel-badge { background: #EFF6FF; color: #2492EB; font-weight: 800; font-size: 0.78rem; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; text-align: center; }
  .ad-panel-badge.negative { background: #FEF2F2; color: #DC2626; }
  .ad-panel-badge-sub { font-weight: 500; font-size: 0.68rem; display: block; color: #6B7280; }
  .ad-panel-empty { color: #9CA3AF; font-size: 0.85rem; text-align: center; padding: 1.5rem 0; }

  .ad-top-course-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem 0; }
  .ad-top-course-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .ad-top-course-name { flex: 1; min-width: 0; font-size: 0.82rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ad-top-course-count { font-size: 0.82rem; font-weight: 700; color: #111827; flex-shrink: 0; }
  .ad-top-course-bar-track { height: 6px; border-radius: 999px; background: #F3F4F6; margin-top: 0.3rem; overflow: hidden; }
  .ad-top-course-bar-fill { height: 100%; border-radius: 999px; }

  .ad-activity-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }
  .ad-activity-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; padding: 1.25rem 1.25rem 0; }
  .ad-activity-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827; }
  .ad-activity-sub { margin: 0.2rem 0 0; color: #9CA3AF; font-size: 0.8rem; }
  .ad-view-all { border: none; background: none; color: #7C3AED; font-weight: 700; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.2rem; }

  .ad-tabs { display: flex; gap: 0.4rem; padding: 1rem 1.25rem; overflow-x: auto; }
  .ad-tab { display: flex; align-items: center; gap: 0.4rem; border: none; background: #F9FAFB; color: #6B7280; font-weight: 700; font-size: 0.82rem; padding: 0.5rem 0.9rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; }
  .ad-tab.active { background: #EFF6FF; color: #2492EB; }
  .ad-tab-count { background: rgba(0,0,0,0.06); border-radius: 999px; padding: 0.05rem 0.4rem; font-size: 0.72rem; }
  .ad-tab.active .ad-tab-count { background: #DBEAFE; }

  .ad-activity-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .ad-activity-icon { width: 36px; height: 36px; border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ad-activity-text { flex: 1; min-width: 0; }
  .ad-activity-item-title { margin: 0; font-size: 0.9rem; font-weight: 600; color: #111827; }
  .ad-activity-item-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; text-transform: capitalize; }
  .ad-activity-time { font-size: 0.78rem; color: #9CA3AF; white-space: nowrap; flex-shrink: 0; }

  @media (max-width: 1200px) {
    .ad-charts { grid-template-columns: 1fr; }
  }
  @media (max-width: 900px) {
    .ad-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .ad-page { padding: 1.25rem; }
    .ad-stats { grid-template-columns: 1fr; }
  }
`

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatTrendDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<string>('all')

  const [selectedRangeLabel, setSelectedRangeLabel] = useState('Last Month')
  const [isRangeOpen, setIsRangeOpen] = useState(false)
  const rangeWrapperRef = useRef<HTMLDivElement>(null)
  const selectedRangeOption = RANGE_OPTIONS.find((r) => r.label === selectedRangeLabel)!

  // ── Range-independent stats: users, active courses, revenue, top courses ──
  const [stats, setStats] = useState<DashboardStats>({
    total_users: null,
    active_courses: null,
    revenue_naira: null,
  })
  const [topCourses, setTopCourses] = useState<TopCourse[]>([])
  const [statsError, setStatsError] = useState<string | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // ── Range-dependent overview: enrollments, enrollment trend, activity ──
  const [totalEnrollments, setTotalEnrollments] = useState<number | null>(null)
  const [enrollmentTrend, setEnrollmentTrend] = useState<EnrollmentTrendPoint[]>([])
  const [growthRate, setGrowthRate] = useState<number | null>(null)
  const [activity, setActivity] = useState<RecentActivityItem[]>([])
  const [overviewError, setOverviewError] = useState<string | null>(null)
  const [loadingOverview, setLoadingOverview] = useState(true)


  const [revenueMonthly, setRevenueMonthly] = useState<MonthlyRevenuePoint[]>([])
  const [revenueError, setRevenueError] = useState<string | null>(null)
  const [loadingRevenueMonthly, setLoadingRevenueMonthly] = useState(true)

  const [isExporting, setIsExporting] = useState(false)

  // Close the range dropdown on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rangeWrapperRef.current && !rangeWrapperRef.current.contains(e.target as Node)) {
        setIsRangeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Static stats — fetched once. No period param exists for these yet.
  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      setLoadingStats(true)
      setStatsError(null)

      const [usersResult, catalogResult, coursesResult] = await Promise.all([
        adminUsersAPI.getCount(),
        adminCoursesAPI.aggregateCatalogStats(),
        adminCoursesAPI.listCourses({ page_size: 5 }),
      ])

      if (cancelled) return

      const errors: string[] = []

      const totalUsers = usersResult.success ? usersResult.data : null
      if (!usersResult.success) errors.push('users')

      let activeCourses: number | null = null
      let revenueNaira: number | null = null
      if (catalogResult.success) {
        activeCourses = catalogResult.data.published
        revenueNaira = catalogResult.data.total_revenue_kobo / 100
      } else {
        errors.push('courses')
      }

      let derivedTopCourses: TopCourse[] = []
      if (coursesResult.success) {
        derivedTopCourses = [...coursesResult.data.results]
          .sort((a, b) => b.enrollment_count - a.enrollment_count)
          .slice(0, 5)
          .map((course, i) => ({
            id: course.id,
            title: course.title,
            enrollments: course.enrollment_count,
            color: TOP_COURSE_COLORS[i % TOP_COURSE_COLORS.length],
          }))
      } else {
        errors.push('courses')
      }

      setStats({ total_users: totalUsers, active_courses: activeCourses, revenue_naira: revenueNaira })
      setTopCourses(derivedTopCourses)
      if (errors.length) setStatsError(`Couldn't load: ${[...new Set(errors)].join(', ')}`)
      setLoadingStats(false)
    }

    loadStats()
    return () => { cancelled = true }
  }, [])

  // Range-dependent overview — refetches whenever the dropdown changes.
  useEffect(() => {
    let cancelled = false

    async function loadOverview() {
      setLoadingOverview(true)
      setOverviewError(null)

      const result = await adminDashboardAPI.getOverview(selectedRangeOption.period, DASHBOARD_ACTIVITY_LIMIT)

      if (cancelled) return

      if (result.success) {
        setTotalEnrollments(result.data.total_enrollments)
        setEnrollmentTrend(result.data.enrollment_trends.data)
        setGrowthRate(result.data.enrollment_trends.summary.growth_rate_percent)
        setActivity(result.data.recent_activity)
        setActiveTab('all')
      } else {
        setOverviewError(result.error || "Couldn't load enrollments/activity")
      }
      setLoadingOverview(false)
    }

    loadOverview()
    return () => { cancelled = true }
  }, [selectedRangeOption.period])

  // Revenue trend — fetched once on mount, not tied to the range dropdown.
  useEffect(() => {
    let cancelled = false

    async function loadRevenueTrend() {
      setLoadingRevenueMonthly(true)
      setRevenueError(null)

      const result = await adminRevenueAPI.getMonthlyRevenueTrend(7)

      if (cancelled) return

      if (result.success) {
        setRevenueMonthly(result.data)
      } else {
        setRevenueError(result.error || "Couldn't load revenue trend")
      }
      setLoadingRevenueMonthly(false)
    }

    loadRevenueTrend()
    return () => { cancelled = true }
  }, [])

  const activityTabs = useMemo(() => {
    const counts: Record<string, number> = { all: activity.length }
    for (const item of activity) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
    const tabs = [{ key: 'all', label: 'All', count: counts.all }]
    for (const category of Object.keys(counts)) {
      if (category === 'all') continue
      tabs.push({ key: category, label: activityCategoryMeta(category).label, count: counts[category] })
    }
    return tabs
  }, [activity])

  const filteredActivity = activeTab === 'all'
    ? activity
    : activity.filter((item) => item.category === activeTab)

  const maxTopCourseEnrollments = topCourses.length
    ? Math.max(...topCourses.map((c) => c.enrollments))
    : 1

  const enrollmentChartData = enrollmentTrend.map((p) => ({
    date: formatTrendDate(p.date),
    value: p.new_enrollments,
  }))

  const revenueGrowthRate = useMemo(() => {
    const complete = revenueMonthly.filter((m) => !m.isCurrentMonth)
    if (complete.length < 2) return null
    const [prev, latest] = complete.slice(-2)
    if (prev.revenue_kobo === 0) return null
    return ((latest.revenue_kobo - prev.revenue_kobo) / prev.revenue_kobo) * 100
  }, [revenueMonthly])

  function handleExport() {
    setIsExporting(true)
    try {
      const sections: string[][] = []

      sections.push([
        csvRow(['Dashboard Overview']),
        csvRow(['Range', selectedRangeLabel + (selectedRangeOption.approx ? ' (approx.)' : '')]),
        csvRow(['Exported at', new Date().toISOString()]),
      ])

      sections.push([
        csvRow(['Summary']),
        csvRow(['Metric', 'Value']),
        csvRow(['Total users', stats.total_users ?? '']),
        csvRow(['Active courses', stats.active_courses ?? '']),
        csvRow(['Total enrollments', totalEnrollments ?? '']),
        csvRow(['Enrollment growth rate (%)', growthRate ?? '']),
        csvRow(['Revenue (₦)', stats.revenue_naira ?? '']),
      ])

      if (enrollmentTrend.length) {
        sections.push([
          csvRow(['Enrollment Trend']),
          csvRow(['Date', 'New enrollments', 'Total enrollments']),
          ...enrollmentTrend.map((p) => csvRow([p.date, p.new_enrollments, p.total_enrollments])),
        ])
      }

      if (revenueMonthly.length) {
        sections.push([
          csvRow(['Revenue Trend']),
          csvRow(['Month', 'Revenue (₦)', 'Current month']),
          ...revenueMonthly.map((m) => csvRow([m.month, m.revenue_kobo / 100, m.isCurrentMonth ? 'Yes' : 'No'])),
        ])
      }

      if (topCourses.length) {
        sections.push([
          csvRow(['Top Courses']),
          csvRow(['Title', 'Enrollments']),
          ...topCourses.map((c) => csvRow([c.title, c.enrollments])),
        ])
      }

      if (activity.length) {
        sections.push([
          csvRow(['Recent Activity']),
          csvRow(['Description', 'Actor', 'Category', 'Type', 'Date']),
          ...activity.map((a) => csvRow([a.description, a.actor, a.category, a.target_type, a.created_at])),
        ])
      }

      const dateStamp = new Date().toISOString().slice(0, 10)
      const rangeSlug = selectedRangeOption.period
      downloadCsv(`tgpl-dashboard-${rangeSlug}-${dateStamp}.csv`, sections)
    } finally {
      setIsExporting(false)
    }
  }

  const exportDisabled = loadingStats && loadingOverview && loadingRevenueMonthly

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="ad-page">

        <div className="ad-header">
          <div>
            <h1 className="ad-title">Overview</h1>
            <p className="ad-subtitle">
              {statsError || overviewError || revenueError
                ? [statsError, overviewError, revenueError].filter(Boolean).join(' · ')
                : 'Real-time data'}
            </p>
          </div>
          <div className="ad-header-actions">
            <div className="ad-range-wrapper" ref={rangeWrapperRef}>
              <button
                className="ad-range-select"
                type="button"
                onClick={() => setIsRangeOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={isRangeOpen}
              >
                {selectedRangeLabel} <ChevronDown size={16} />
              </button>
              {isRangeOpen && (
                <div className="ad-range-menu" role="listbox">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      role="option"
                      aria-selected={option.label === selectedRangeLabel}
                      className={`ad-range-option${option.label === selectedRangeLabel ? ' active' : ''}`}
                      onClick={() => {
                        setSelectedRangeLabel(option.label)
                        setIsRangeOpen(false)
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="ad-range-note">
                {selectedRangeOption.approx
                  ? 'Approximate — shown as all-time'
                  : 'Applies to enrollments & activity only'}
              </p>
            </div>
            <button
              className="ad-export-btn"
              type="button"
              onClick={handleExport}
              disabled={exportDisabled || isExporting}
              title={exportDisabled ? 'Waiting for dashboard data to load' : 'Download a CSV of the current view'}
            >
              <Download size={16} /> {isExporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="ad-stats">
          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                {loadingStats ? (
                  <div className="ad-stat-skeleton" />
                ) : (
                  <p className="ad-stat-value">{stats.total_users?.toLocaleString() ?? '—'}</p>
                )}
                <p className="ad-stat-title">Total users</p>
              </div>
              <div className="ad-stat-icon" style={{ background: '#DBEAFE' }}>
                <Users size={18} color="#2492EB" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                {loadingStats ? (
                  <div className="ad-stat-skeleton" />
                ) : (
                  <p className="ad-stat-value">{stats.active_courses?.toLocaleString() ?? '—'}</p>
                )}
                <p className="ad-stat-title">Active Courses</p>
              </div>
              <div className="ad-stat-icon" style={{ background: '#EDE9FE' }}>
                <BookOpen size={18} color="#7C3AED" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                {loadingOverview ? (
                  <div className="ad-stat-skeleton" />
                ) : (
                  <p className="ad-stat-value">{totalEnrollments?.toLocaleString() ?? '—'}</p>
                )}
                <p className="ad-stat-title">Total Enrollments</p>
                {growthRate != null && !loadingOverview && (
                  <span className={`ad-stat-change${growthRate < 0 ? ' negative' : ''}`}>
                    {growthRate < 0 ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                    {Math.abs(growthRate).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="ad-stat-icon" style={{ background: '#FEF3C7' }}>
                <GraduationCap size={18} color="#D97706" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                {loadingStats ? (
                  <div className="ad-stat-skeleton" />
                ) : (
                  <p className="ad-stat-value">
                    {stats.revenue_naira != null ? formatNaira(stats.revenue_naira) : '—'}
                  </p>
                )}
                <p className="ad-stat-title">Revenue</p>
              </div>
              <div className="ad-stat-icon" style={{ background: '#D1FAE5' }}>
                <CreditCard size={18} color="#059669" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts + Top courses ── */}
        <div className="ad-charts">
          <div className="ad-panel">
            <div className="ad-panel-head">
              <div>
                <h3 className="ad-panel-title">Enrollments Over Time</h3>
                <p className="ad-panel-sub">
                  New enrollments · {selectedRangeLabel}
                  {selectedRangeOption.approx && ' (approx.)'}
                </p>
              </div>
              {growthRate != null && (
                <span className={`ad-panel-badge${growthRate < 0 ? ' negative' : ''}`}>
                  {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1)}%
                  <span className="ad-panel-badge-sub">vs prior period</span>
                </span>
              )}
            </div>
            {loadingOverview ? (
              <p className="ad-panel-empty">Loading…</p>
            ) : enrollmentChartData.length === 0 ? (
              <p className="ad-panel-empty">No enrollment data for this period.</p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={enrollmentChartData} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2492EB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="ad-panel">
            <div className="ad-panel-head">
              <div>
                <h3 className="ad-panel-title">Revenue Over Time</h3>
                <p className="ad-panel-sub">Monthly (₦) · succeeded payments</p>
              </div>
              {revenueGrowthRate != null && (
                <span className={`ad-panel-badge${revenueGrowthRate < 0 ? ' negative' : ''}`}>
                  {revenueGrowthRate >= 0 ? '+' : ''}{revenueGrowthRate.toFixed(0)}%
                </span>
              )}
            </div>
            {loadingRevenueMonthly ? (
              <p className="ad-panel-empty">Loading…</p>
            ) : revenueMonthly.length === 0 ? (
              <p className="ad-panel-empty">{revenueError || 'No revenue data available.'}</p>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={revenueMonthly} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₦${(v / 100_000_000).toFixed(0)}M`}
                  />
                  <Tooltip formatter={(value) => [formatNaira(Number(value) / 100), 'Revenue']} />
                  <Bar dataKey="revenue_kobo" radius={[6, 6, 0, 0]}>
                    {revenueMonthly.map((entry) => (
                      <Cell key={entry.month} fill={entry.isCurrentMonth ? '#F97316' : '#FDBA74'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="ad-panel">
            <div className="ad-panel-head">
              <div>
                <h3 className="ad-panel-title">Top Courses</h3>
                <p className="ad-panel-sub">By total enrollments</p>
              </div>
            </div>
            {loadingStats ? (
              <p className="ad-panel-empty">Loading…</p>
            ) : topCourses.length === 0 ? (
              <p className="ad-panel-empty">No course data available.</p>
            ) : (
              topCourses.map((course) => (
                <div key={course.id} className="ad-top-course-row" style={{ display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="ad-top-course-dot" style={{ background: course.color }} />
                    <span className="ad-top-course-name">{course.title}</span>
                    <span className="ad-top-course-count">{course.enrollments.toLocaleString()}</span>
                  </div>
                  <div className="ad-top-course-bar-track">
                    <div
                      className="ad-top-course-bar-fill"
                      style={{
                        width: `${(course.enrollments / maxTopCourseEnrollments) * 100}%`,
                        background: course.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="ad-activity-panel">
          <div className="ad-activity-head">
            <div>
              <h3 className="ad-activity-title">Recent Activity</h3>
              <p className="ad-activity-sub">{selectedRangeLabel}{selectedRangeOption.approx && ' (approx.)'}</p>
            </div>
            <button className="ad-view-all" type="button" onClick={() => navigate(ADMIN_ACTIVITY_ROUTE)}>
              View all <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>

          <div className="ad-tabs">
            {activityTabs.map((tab) => (
              <button
                key={tab.key}
                className={`ad-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="ad-tab-count">{tab.count}</span>
              </button>
            ))}
          </div>

          {loadingOverview ? (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
              Loading…
            </div>
          ) : filteredActivity.length === 0 ? (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
              No activity in this category yet.
            </div>
          ) : (
            filteredActivity.map((item, i) => {
              const { Icon, bg, color } = activityCategoryMeta(item.category)
              return (
                <div key={`${item.target_id}-${i}`} className="ad-activity-row">
                  <div className="ad-activity-icon" style={{ background: bg }}>
                    <Icon size={17} color={color} />
                  </div>
                  <div className="ad-activity-text">
                    <p className="ad-activity-item-title">{item.description}</p>
                    <p className="ad-activity-item-sub">{prettifyType(item.target_type)}</p>
                  </div>
                  <span className="ad-activity-time">{timeAgo(item.created_at)}</span>
                </div>
              )
            })
          )}
        </div>

      </div>
    </AdminShell>
  )
}