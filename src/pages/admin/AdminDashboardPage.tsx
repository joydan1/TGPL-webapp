// pages/admin/AdminDashboardPage.tsx
import { useMemo, useState } from 'react'
import {
  Users, BookOpen, GraduationCap, CreditCard, ChevronDown, Download,
  UserPlus, CheckCircle2, BookMarked,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import AdminShell from '../../layouts/AdminShell'


interface AdminDashboardSummary {
  total_users: number
  total_users_change_pct: number
  active_courses: number
  active_courses_note: string
  total_enrollments: number
  total_enrollments_change_pct: number
  revenue_naira: number
  revenue_change_pct: number
}

const MOCK_SUMMARY: AdminDashboardSummary = {
  total_users: 1842,
  total_users_change_pct: 12,
  active_courses: 1,
  active_courses_note: '1 published this month',
  total_enrollments: 1223,
  total_enrollments_change_pct: 23,
  revenue_naira: 234500,
  revenue_change_pct: 10,
}

const MOCK_ENROLLMENTS_OVER_TIME = [
  { month: 'Jan', value: 520 },
  { month: 'Feb', value: 610 },
  { month: 'Mar', value: 590 },
  { month: 'Apr', value: 700 },
  { month: 'May', value: 780 },
  { month: 'Jun', value: 720 },
  { month: 'Jul', value: 810 },
]
const ENROLLMENTS_CHANGE_PCT = 23

const MOCK_REVENUE_OVER_TIME = [
  { month: 'Jan', value: 18_000_000 },
  { month: 'Feb', value: 24_000_000 },
  { month: 'Mar', value: 21_000_000 },
  { month: 'Apr', value: 34_000_000 },
  { month: 'May', value: 48_000_000 },
  { month: 'Jun', value: 45_000_000 },
  { month: 'Jul', value: 62_000_000 },
]
const REVENUE_CHANGE_PCT = 25

interface TopCourse {
  id: string
  title: string
  enrollments: number
  color: string
}

const MOCK_TOP_COURSES: TopCourse[] = [
  { id: '1', title: 'Project Management', enrollments: 1240, color: '#7C3AED' },
  { id: '2', title: 'Leadership Essentials', enrollments: 980, color: '#2563EB' },
  { id: '3', title: 'Agile & Scrum Mastery', enrollments: 847, color: '#16A34A' },
  { id: '4', title: 'Communication Skills', enrollments: 631, color: '#F59E0B' },
  { id: '5', title: 'Risk Management', enrollments: 512, color: '#DC2626' },
]

type ActivityCategory = 'signup' | 'payment' | 'certificate' | 'content'

interface ActivityItem {
  id: string
  category: ActivityCategory
  title: string
  subtitle: string
  time_ago: string
}

const MOCK_ACTIVITY: ActivityItem[] = [
  { id: '1', category: 'signup',      title: 'Kwame Asante signed up as Learner',          subtitle: 'Signup',      time_ago: '2 min ago' },
  { id: '2', category: 'payment',     title: '₦129,000 payment received — Leadership Essentials', subtitle: 'Payment', time_ago: '8 min ago' },
  { id: '3', category: 'certificate', title: 'Fatima Al-Hassan earned PM Pro certificate', subtitle: 'Certificate', time_ago: '14 min ago' },
  { id: '4', category: 'content',     title: 'Amara Osei published new module: Sprint Planning', subtitle: 'Content', time_ago: '31 min ago' },
  { id: '5', category: 'signup',      title: 'Yemi Adewale signed up as Trainer',          subtitle: 'Signup',      time_ago: '45 min ago' },
  { id: '6', category: 'payment',     title: '₦89,000 payment received — Agile & Scrum',   subtitle: 'Payment',     time_ago: '1 hr ago' },
  { id: '7', category: 'certificate', title: 'James Okafor earned Scrum Master certificate', subtitle: 'Certificate', time_ago: '1 hr ago' },
  { id: '8', category: 'content',     title: 'Course review flagged for moderation',       subtitle: 'Content',     time_ago: '2 hr ago' },
]

const ACTIVITY_ICON: Record<ActivityCategory, { Icon: typeof UserPlus; bg: string; color: string }> = {
  signup:      { Icon: UserPlus,     bg: '#DBEAFE', color: '#2563EB' },
  payment:     { Icon: CreditCard,   bg: '#D1FAE5', color: '#059669' },
  certificate: { Icon: CheckCircle2, bg: '#FEF3C7', color: '#D97706' },
  content:     { Icon: BookMarked,   bg: '#EDE9FE', color: '#7C3AED' },
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .ad-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .ad-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .ad-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .ad-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .ad-header-actions { display: flex; align-items: center; gap: 0.75rem; }
  .ad-range-select { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.6rem 1rem; font-size: 0.875rem; font-weight: 600; color: #111827; cursor: pointer; }
  .ad-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.6rem 1.1rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; }

  .ad-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .ad-stat-card { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); }
  .ad-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .ad-stat-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .ad-stat-title { margin: 0.3rem 0 0.4rem; color: #6B7280; font-size: 0.8rem; }
  .ad-stat-change { font-size: 0.78rem; font-weight: 700; color: #16A34A; }
  .ad-stat-icon { width: 38px; height: 38px; border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .ad-charts { display: grid; grid-template-columns: 2fr 1.3fr 1.3fr; gap: 1rem; margin-bottom: 1.25rem; align-items: stretch; }
  .ad-panel { background: #fff; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); }
  .ad-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem; }
  .ad-panel-title { margin: 0; font-size: 1rem; font-weight: 700; color: #111827; }
  .ad-panel-sub { margin: 0.2rem 0 0; color: #9CA3AF; font-size: 0.78rem; }
  .ad-panel-badge { background: #EFF6FF; color: #2563EB; font-weight: 800; font-size: 0.78rem; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; text-align: center; }
  .ad-panel-badge-sub { font-weight: 500; font-size: 0.68rem; display: block; color: #6B7280; }

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
  .ad-tab.active { background: #EFF6FF; color: #2563EB; }
  .ad-tab-count { background: rgba(0,0,0,0.06); border-radius: 999px; padding: 0.05rem 0.4rem; font-size: 0.72rem; }
  .ad-tab.active .ad-tab-count { background: #DBEAFE; }

  .ad-activity-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.9rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .ad-activity-icon { width: 36px; height: 36px; border-radius: 0.65rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ad-activity-text { flex: 1; min-width: 0; }
  .ad-activity-item-title { margin: 0; font-size: 0.9rem; font-weight: 600; color: #111827; }
  .ad-activity-item-sub { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; }
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

const ACTIVITY_TABS: { key: 'all' | ActivityCategory; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'signup',      label: 'Signups' },
  { key: 'payment',     label: 'Payments' },
  { key: 'certificate', label: 'Certificates' },
  { key: 'content',     label: 'Content' },
]

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'all' | ActivityCategory>('all')

  // Swap these three consts for real fetches (e.g. adminDashboardAPI.getSummary())
  // once the backend endpoint exists — shapes are already API-ready.
  const summary = MOCK_SUMMARY
  const topCourses = MOCK_TOP_COURSES
  const activity = MOCK_ACTIVITY

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activity.length }
    for (const item of activity) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
    return counts
  }, [activity])

  const filteredActivity = activeTab === 'all'
    ? activity
    : activity.filter((item) => item.category === activeTab)

  const maxTopCourseEnrollments = Math.max(...topCourses.map((c) => c.enrollments))

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="ad-page">

        <div className="ad-header">
          <div>
            <h1 className="ad-title">Overview</h1>
            <p className="ad-subtitle">July 2026 · Real-time data</p>
          </div>
          <div className="ad-header-actions">
            <button className="ad-range-select" type="button">
              Last Month <ChevronDown size={16} />
            </button>
            <button className="ad-export-btn" type="button">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="ad-stats">
          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                <p className="ad-stat-value">{summary.total_users.toLocaleString()}</p>
                <p className="ad-stat-title">Total users</p>
                <span className="ad-stat-change">+{summary.total_users_change_pct}% vs last month</span>
              </div>
              <div className="ad-stat-icon" style={{ background: '#DBEAFE' }}>
                <Users size={18} color="#2563EB" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                <p className="ad-stat-value">{summary.active_courses.toLocaleString()}</p>
                <p className="ad-stat-title">Active Courses</p>
                <span className="ad-stat-change">{summary.active_courses_note}</span>
              </div>
              <div className="ad-stat-icon" style={{ background: '#EDE9FE' }}>
                <BookOpen size={18} color="#7C3AED" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                <p className="ad-stat-value">{summary.total_enrollments.toLocaleString()}</p>
                <p className="ad-stat-title">Total Enrollments</p>
                <span className="ad-stat-change">+{summary.total_enrollments_change_pct}% vs last month</span>
              </div>
              <div className="ad-stat-icon" style={{ background: '#FEF3C7' }}>
                <GraduationCap size={18} color="#D97706" />
              </div>
            </div>
          </div>

          <div className="ad-stat-card">
            <div className="ad-stat-top">
              <div>
                <p className="ad-stat-value">{formatNaira(summary.revenue_naira)}</p>
                <p className="ad-stat-title">Revenue</p>
                <span className="ad-stat-change">+{summary.revenue_change_pct}% vs last month</span>
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
                <p className="ad-panel-sub">New student enrollments per month</p>
              </div>
              <span className="ad-panel-badge">
                +{ENROLLMENTS_CHANGE_PCT}%
                <span className="ad-panel-badge-sub">this month</span>
              </span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={MOCK_ENROLLMENTS_OVER_TIME} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="ad-panel">
            <div className="ad-panel-head">
              <div>
                <h3 className="ad-panel-title">Revenue Over Time</h3>
                <p className="ad-panel-sub">Monthly (₦)</p>
              </div>
              <span className="ad-panel-badge">+{REVENUE_CHANGE_PCT}%</span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={MOCK_REVENUE_OVER_TIME} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip formatter={(value) => [formatNaira(Number(value)), 'Revenue']} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {MOCK_REVENUE_OVER_TIME.map((entry, index) => (
                    <Cell
                      key={entry.month}
                      fill={index === MOCK_REVENUE_OVER_TIME.length - 1 ? '#F97316' : '#FDBA74'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="ad-panel">
            <div className="ad-panel-head">
              <div>
                <h3 className="ad-panel-title">Top Courses</h3>
                <p className="ad-panel-sub">By total enrollments</p>
              </div>
            </div>
            {topCourses.map((course) => (
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
            ))}
          </div>
        </div>

        {/* ── Recent activity ── */}
        <div className="ad-activity-panel">
          <div className="ad-activity-head">
            <div>
              <h3 className="ad-activity-title">Recent Activity</h3>
              <p className="ad-activity-sub">Live platform event stream</p>
            </div>
            <button className="ad-view-all" type="button">
              View all <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>

          <div className="ad-tabs">
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`ad-tab${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="ad-tab-count">{tabCounts[tab.key] ?? 0}</span>
              </button>
            ))}
          </div>

          {filteredActivity.length === 0 ? (
            <div style={{ padding: '2rem 1.25rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
              No activity in this category yet.
            </div>
          ) : (
            filteredActivity.map((item) => {
              const { Icon, bg, color } = ACTIVITY_ICON[item.category]
              return (
                <div key={item.id} className="ad-activity-row">
                  <div className="ad-activity-icon" style={{ background: bg }}>
                    <Icon size={17} color={color} />
                  </div>
                  <div className="ad-activity-text">
                    <p className="ad-activity-item-title">{item.title}</p>
                    <p className="ad-activity-item-sub">{item.subtitle}</p>
                  </div>
                  <span className="ad-activity-time">{item.time_ago}</span>
                </div>
              )
            })
          )}
        </div>

      </div>
    </AdminShell>
  )
}