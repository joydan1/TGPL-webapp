import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Radio, Settings, Search, Bell,
  ChevronRight, ChevronDown, PanelLeftClose, PanelLeftOpen,
  Play, Clock, Calendar, Trophy, CheckCircle, Circle, LogOut, User as UserIcon,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient } from '../../services/api'

// ── Types ──────────────────────────────────────────────────────────────────
interface EnrolledCourse {
  course_id: string
  course_slug: string
  title: string
  category: string
  thumbnail_url: string
  trainer_name: string
  module_count: number
  completion_percentage: number
  last_accessed_at: string
  enrolled_at: string
  source: string
  resume_url: string
}

interface DashboardResponse {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    profile_completion_status: string
  }
  continue_learning: string | null
  assignments: {
    active: unknown[]
    upcoming: unknown[]
  }
  live_sessions: {
    live_now: unknown[]
    upcoming: unknown[]
  }
  enrolled_courses: EnrolledCourse[]
  certification_progress: unknown[]
}

// ── Progress ring ──────────────────────────────────────────────────────────
function Ring({ pct, size = 80, stroke = 7, color = '#2563EB' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.2} fontWeight="700" fill="#111">{pct}%</text>
    </svg>
  )
}

function SmallRing({ pct }: { pct: number }) {
  return (
    <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.95)', borderRadius: '50%', padding: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
      <Ring pct={pct} size={44} stroke={4} />
    </div>
  )
}

// ── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    display: flex; flex-direction: column; min-height: 100vh;
    background: #F5F5F5; font-family: inherit;
  }

  .navbar {
    height: 64px; background: #fff; border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; gap: 1rem; position: sticky; top: 0; z-index: 200; width: 100%;
  }
  .navbar-logo img { height: 2.25rem; display: block; }
  .navbar-right { display: flex; align-items: center; gap: 1rem; }

  .search-wrap {
    display: flex; align-items: center; gap: 12px;
    background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;
    padding: 8px 20px; width: 263px; height: 42px;
  }
  .search-wrap input { background: none; border: none; outline: none; font-size: 0.875rem; color: #111; width: 100%; }
  .search-wrap input::placeholder { color: #9CA3AF; }

  .topbar-bell {
    width: 36px; height: 36px; border-radius: 50%;
    background: #F9FAFB; border: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6B7280; position: relative;
  }
  .bell-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #EF4444; border: 1.5px solid #fff; }

  /* ── Profile menu ────────────────────────────────────────────────────── */
  .profile-menu-wrap { position: relative; }
  .profile-trigger {
    display: flex; align-items: center; gap: 0.375rem;
    background: none; border: none; cursor: pointer; padding: 0;
  }
  .topbar-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #2563EB; display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.875rem;
    border: 2px solid #E5E7EB; flex-shrink: 0;
  }
  .profile-chevron { color: #9CA3AF; transition: transform 0.15s ease; }
  .profile-chevron.open { transform: rotate(180deg); }

  .profile-dropdown {
    position: absolute; top: calc(100% + 0.625rem); right: 0;
    background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    width: 220px; padding: 0.5rem; z-index: 300;
  }
  .profile-dropdown-header {
    display: flex; align-items: center; gap: 0.625rem;
    padding: 0.625rem 0.625rem 0.75rem; border-bottom: 1px solid #F3F4F6; margin-bottom: 0.375rem;
  }
  .profile-dropdown-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-item {
    display: flex; align-items: center; gap: 0.625rem; width: 100%;
    padding: 0.625rem 0.625rem; border-radius: 0.6rem; border: none; background: none;
    font-size: 0.8125rem; font-weight: 500; color: #374151; cursor: pointer;
    text-align: left; transition: background 0.15s;
  }
  .profile-dropdown-item:hover { background: #F9FAFB; }
  .profile-dropdown-item.danger { color: #EF4444; }
  .profile-dropdown-item.danger:hover { background: #FEF2F2; }

  .db-body { display: flex; flex: 1; }

  .sidebar {
    width: 220px; min-width: 220px; background: #fff;
    border-right: 1px solid #F3F4F6; display: flex; flex-direction: column;
    position: sticky; top: 64px; height: calc(100vh - 64px);
    flex-shrink: 0; transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s;
    overflow: hidden;
  }
  .sidebar.collapsed { width: 64px; min-width: 64px; }

  .sidebar-top { display: flex; justify-content: flex-end; padding: 0.75rem 0.75rem 0.25rem; }
  .collapse-btn {
    width: 32px; height: 32px; border-radius: 0.5rem;
    background: #fff; border: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6B7280; box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    transition: background 0.15s; flex-shrink: 0;
  }
  .collapse-btn:hover { background: #F3F4F6; }

  .sidebar-nav { flex: 1; padding: 0.5rem 0.625rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden; }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.625rem 0.75rem; border-radius: 0.6rem; cursor: pointer;
    color: #6B7280; font-size: 0.875rem; font-weight: 500;
    white-space: nowrap; transition: background 0.15s, color 0.15s;
  }
  .nav-item:hover { background: #F9FAFB; color: #111; }
  .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
  .nav-item .nav-label { flex: 1; }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }

  .sidebar-user {
    padding: 1rem 0.875rem; border-top: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 0.625rem; overflow: hidden;
  }
  .user-avatar {
    width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
    background: #2563EB; display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.875rem;
  }
  .user-text { overflow: hidden; }
  .user-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .user-text { display: none; }

  .main { flex: 1; min-width: 0; overflow-y: auto; }
  .content { padding: 2rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 1.75rem; max-width: 1100px; }

  .greeting-line { font-size: 0.9375rem; color: #6B7280; }
  .greeting-name { font-size: 1.625rem; font-weight: 700; color: #111; margin-top: 0.125rem; }

  .resume-banner {
    background: linear-gradient(135deg, #2492EB 0%, #1560A8 100%);
    border-radius: 1rem; padding: 1.5rem 1.75rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; color: #fff;
  }
  .resume-label { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.75; margin-bottom: 0.35rem; }
  .resume-module { font-size: 1.0625rem; font-weight: 700; margin-bottom: 0.875rem; }
  .resume-progress-wrap { background: rgba(255,255,255,0.25); border-radius: 99px; height: 8px; width: 100%; max-width: 480px; }
  .resume-progress-fill { height: 100%; background: #fff; border-radius: 99px; }
  .resume-sub { font-size: 0.75rem; opacity: 0.75; margin-top: 0.4rem; }
  .resume-btn {
    display: flex; align-items: center; gap: 0.5rem;
    background: #fff; color: #2563EB; border: none; border-radius: 2rem;
    padding: 0.65rem 1.4rem; font-size: 0.875rem; font-weight: 700;
    cursor: pointer; white-space: nowrap; flex-shrink: 0;
  }
  .resume-btn:hover { opacity: 0.9; }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; }
  .section-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .see-all { font-size: 0.8125rem; color: #2563EB; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.2rem; background: none; border: none; }

  .assignments-wrap { position: relative; }
  .assignments-scroll { display: flex; gap: 0.875rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
  .assignments-scroll::-webkit-scrollbar { display: none; }
  .asgn-next-btn {
    position: absolute; right: -14px; top: 50%; transform: translateY(-50%);
    width: 28px; height: 28px; border-radius: 50%;
    background: #fff; border: 1px solid #E5E7EB; box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #374151; z-index: 2;
  }
  .asgn-next-btn:hover { background: #F9FAFB; }

  .asgn-card { min-width: 200px; max-width: 200px; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; flex-shrink: 0; }
  .asgn-card.active { background: #EFF6FF; border-color: #BFDBFE; }
  .asgn-badge { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 0.25rem; }
  .asgn-badge.active { color: #2563EB; }
  .asgn-badge.upcoming { color: #6B7280; }
  .asgn-title { font-size: 0.875rem; font-weight: 700; color: #111; line-height: 1.3; }
  .asgn-course { font-size: 0.75rem; color: #6B7280; margin-top: 0.125rem; }
  .asgn-due-note { font-size: 0.75rem; color: #6B7280; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.375rem; }
  .asgn-time-upcoming { font-size: 0.75rem; color: #6B7280; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.375rem; }

  .sessions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .session-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 540px; width: 100%; height: 141px; box-sizing: border-box; }
  .live-badge { display: flex; align-items: center; gap: 0.3rem; font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; color: #EF4444; text-transform: uppercase; margin-bottom: 0.3rem; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #EF4444; animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  .session-title { font-size: 0.875rem; font-weight: 700; color: #111; line-height: 1.3; }
  .session-sub { font-size: 0.75rem; color: #6B7280; margin-top: 0.2rem; }
  .session-time { font-size: 0.72rem; color: #6B7280; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.3rem; }
  .join-btn { padding: 0.5rem 1.1rem; border-radius: 2rem; border: none; background: #EF4444; color: #fff; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .join-btn:hover { opacity: 0.9; }
  .remind-btn { padding: 0.5rem 1.1rem; border-radius: 2rem; border: 1.5px solid #E5E7EB; background: #fff; color: #374151; font-size: 0.8125rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .remind-btn:hover { background: #F9FAFB; }

  .course-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; overflow: hidden; width: 260px; flex-shrink: 0; }
  .course-thumb { position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #D0D0D0; }
  .course-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .course-body { padding: 0.75rem 1rem 1rem; }
  .course-tag { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; margin-bottom: 0.2rem; }
  .course-title { font-size: 0.875rem; font-weight: 700; color: #111; line-height: 1.3; }
  .course-last { font-size: 0.72rem; color: #9CA3AF; margin-top: 0.25rem; }
  .course-prog-bar { height: 3px; background: #E5E7EB; border-radius: 99px; margin-top: 0.625rem; }
  .course-prog-fill { height: 100%; background: #2563EB; border-radius: 99px; }

  .cert-section { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.5rem; display: flex; gap: 2rem; align-items: flex-start; }
  .cert-left { flex: 1; }
  .cert-badge { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .cert-badge-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; }
  .cert-name { font-size: 1rem; font-weight: 700; color: #111; margin-bottom: 0.625rem; }
  .cert-desc { font-size: 0.8375rem; color: #6B7280; margin-bottom: 1rem; line-height: 1.55; }
  .cert-desc strong { color: #2563EB; }
  .cert-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8375rem; color: #374151; padding: 0.3rem 0; }
  .cert-item.done { color: #6B7280; }
  .cert-view { display: flex; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.8125rem; color: #2563EB; font-weight: 600; cursor: pointer; background: none; border: none; margin-top: 0.875rem; width: 100%; }
  .cert-right { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  /* ── Mobile tab bar ──────────────────────────────────────────────────── */
  .mobile-tabbar {
    display: none;
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 60px; background: #fff; border-top: 1px solid #F3F4F6;
    z-index: 300;
  }
  .mobile-tabbar-inner {
    display: flex; height: 100%;
  }
  .tab-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; cursor: pointer;
    color: #9CA3AF; font-size: 0.65rem; font-weight: 600;
    border: none; background: none; padding: 0;
  }
  .tab-item.active { color: #2563EB; }
  .tab-item span { font-size: 0.65rem; }

  /* ── Responsive ──────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .sessions-row { grid-template-columns: 1fr; }
    .session-card { height: auto; }
    .content { padding: 1.5rem 1.25rem 2.5rem; }
  }

  @media (max-width: 640px) {
    .sidebar { display: none; }
    .search-wrap { display: none; }
    .session-card { width: 100%; height: auto; }
    .content { padding: 1.25rem 1rem 5rem; }
    .navbar { padding: 0 1rem; }
    .mobile-tabbar { display: block; }
    .resume-banner { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .resume-btn { align-self: flex-start; }
    .course-card { width: 100%; }
  }
`

const ASSIGNMENTS = [
  { id: 1, active: true,  title: 'Stakeholder Map Draft', course: 'Project Management', note: 'Due before the end of program' },
  { id: 2, active: false, title: 'Data Viz Quiz',          course: 'Data Storytelling' },
  { id: 3, active: false, title: 'Data Viz Quiz',          course: 'Data Storytelling' },
  { id: 4, active: false, title: 'Data Viz Quiz',          course: 'Data Storytelling' },
  { id: 5, active: false, title: 'Data Viz Quiz',          course: 'Data Storytelling' },
]

const CERT_ITEMS = [
  { label: 'Complete all 6/8 modules',      done: true },
  { label: 'Pass module quizzes (≥70%)',     done: true },
  { label: 'Submit stakeholder map project', done: false },
  { label: 'Final assessment',               done: false },
]

const NAV_ITEMS = [
  { key: 'home',     label: 'Home',         Icon: Home     },
  { key: 'courses',  label: 'Courses',      Icon: BookOpen },
  { key: 'live',     label: 'Live Classes', Icon: Radio    },
  { key: 'settings', label: 'Settings',     Icon: Settings },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const [profileOpen, setProfileOpen] = useState(false)
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<DashboardResponse>('/v1/me/dashboard/')
        setEnrolledCourses(response.data.enrolled_courses || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading…</p>
      </div>
    )
  }

  const firstName = (user.name || user.email || '').split(' ')[0]
  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  function handleNav(key: string) {
    setActiveNav(key)
    if (key === 'courses') navigate(ROUTES.COURSES)
  }

  async function handleLogout() {
    setProfileOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="db-root">

        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>
          <div className="navbar-right">
            <div className="search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input type="text" placeholder="Search anything" />
            </div>
            <div className="topbar-bell">
              <Bell size={20} />
              <div className="bell-dot" />
            </div>

            {/* Profile menu */}
            <div className="profile-menu-wrap" ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <div className="topbar-avatar">{initials}</div>
                <ChevronDown size={16} className={`profile-chevron${profileOpen ? ' open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-header">
                    <div className="user-avatar">{initials}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="profile-dropdown-name">{user.name || user.email}</div>
                      <div className="profile-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <button
                    className="profile-dropdown-item"
                    onClick={() => {
                      setProfileOpen(false)
                      setActiveNav('settings')
                      navigate(ROUTES.SETTINGS)
                    }}
                  >
                    <UserIcon size={16} />
                    Profile settings
                  </button>
                  <button className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Body */}
        <div className="db-body">

          {/* Sidebar — hidden on mobile */}
          <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-top">
              <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>

            <nav className="sidebar-nav">
              {NAV_ITEMS.map(({ key, label, Icon }) => (
                <div
                  key={key}
                  className={`nav-item${activeNav === key ? ' active' : ''}`}
                  onClick={() => handleNav(key)}
                >
                  <Icon size={18} />
                  <span className="nav-label">{label}</span>
                  {key === 'settings' && !collapsed && (
                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                      <ChevronDown size={14} />
                    </span>
                  )}
                </div>
              ))}
            </nav>

            <div className="sidebar-user">
              <div className="user-avatar">{initials}</div>
              <div className="user-text">
                <div className="user-name">{user.name || user.email}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="main">
            <div className="content">

              <div>
                <div className="greeting-line">{greeting},</div>
                <div className="greeting-name">{firstName} 👋</div>
              </div>

              {/* Resume banner */}
              <div className="resume-banner">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="resume-label">Continue where you left off</div>
                  <div className="resume-module">Module 3 — Stakeholder Mapping</div>
                  <div className="resume-progress-wrap">
                    <div className="resume-progress-fill" style={{ width: '40%' }} />
                  </div>
                  <div className="resume-sub">40% complete · 2h 50m remaining</div>
                </div>
                <button className="resume-btn">
                  <Play size={14} fill="#2563EB" /> Resume
                </button>
              </div>

              {/* Assignments */}
              <div>
                <div className="section-header">
                  <span className="section-title">Assignment(s)</span>
                </div>
                <div className="assignments-wrap">
                  <div className="assignments-scroll" ref={scrollRef}>
                    {ASSIGNMENTS.map((a) => (
                      <div key={a.id} className={`asgn-card${a.active ? ' active' : ''}`}>
                        <div className={`asgn-badge ${a.active ? 'active' : 'upcoming'}`}>
                          {a.active ? '● Active' : '○ Upcoming'}
                        </div>
                        <div className="asgn-title">{a.title}</div>
                        <div className="asgn-course">{a.course}</div>
                        {a.active && (
                          <div className="asgn-due-note"><Clock size={12} />{a.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button className="asgn-next-btn" onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollLeft += 220
                  }}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Sessions */}
              <div className="sessions-row">
                <div>
                  <div className="section-header">
                    <span className="section-title">Live Session</span>
                    <button className="see-all">See all <ChevronRight size={14} /></button>
                  </div>
                  <div className="session-card">
                    <div>
                      <div className="live-badge"><div className="live-dot" /> Live</div>
                      <div className="session-title">Q&A: Stakeholder Communication in Practice</div>
                      <div className="session-sub">Amara Osei</div>
                      <div className="session-time"><Clock size={12} /> Live now</div>
                    </div>
                    <button className="join-btn">Join</button>
                  </div>
                </div>
                <div>
                  <div className="section-header">
                    <span className="section-title">Upcoming Session</span>
                    <button className="see-all">See all <ChevronRight size={14} /></button>
                  </div>
                  <div className="session-card">
                    <div>
                      <div className="session-title">Masterclass: Building Your Lead…</div>
                      <div className="session-sub">Kofi Mensah</div>
                      <div className="session-time"><Calendar size={12} /> Wed, 4 Jun · 3:00 PM WAT</div>
                    </div>
                    <button className="remind-btn">Remind me</button>
                  </div>
                </div>
              </div>

              {/* My Courses */}
              <div>
                <div className="section-header">
                  <span className="section-title">My Courses</span>
                </div>
                {loading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading courses...</div>
                ) : error ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
                ) : enrolledCourses.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>
                    No courses enrolled yet.{' '}
                    <button
                      onClick={() => navigate(RouteBuilder.courseCatalogPage())}
                      style={{ color: '#2563EB', cursor: 'pointer', border: 'none', background: 'none', textDecoration: 'underline', fontWeight: 600 }}
                    >
                      Browse courses
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {enrolledCourses.map((course) => {
                      const lastAccessedDate = new Date(course.last_accessed_at)
                      const now = new Date()
                      const hoursAgo = Math.floor((now.getTime() - lastAccessedDate.getTime()) / (1000 * 60 * 60))
                      const lastAccessedText = hoursAgo === 0 ? 'Just now' : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`

                      return (
                        <div key={course.course_id} className="course-card">
                          <div className="course-thumb">
                            <img
                              src={course.thumbnail_url || '/intro.png'}
                              alt={course.title}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/intro.png' }}
                            />
                            <SmallRing pct={course.completion_percentage} />
                          </div>
                          <div className="course-body">
                            <div className="course-tag">{course.category || 'Course'}</div>
                            <div className="course-title">{course.title}</div>
                            <div className="course-last">Last opened {lastAccessedText}</div>
                            <div className="course-prog-bar">
                              <div className="course-prog-fill" style={{ width: `${course.completion_percentage}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Certificate */}
              <div className="cert-section">
                <div className="cert-left">
                  <div className="cert-badge">
                    <Trophy size={20} color="#F59E0B" />
                    <span className="cert-badge-label">Certificate</span>
                  </div>
                  <div className="cert-name">Project Management</div>
                  <div className="cert-desc">
                    You're <strong>40%</strong> to your Project Management certificate — keep going!
                  </div>
                  {CERT_ITEMS.map((item, i) => (
                    <div key={i} className={`cert-item${item.done ? ' done' : ''}`}>
                      {item.done
                        ? <CheckCircle size={16} color="#00C950" fill="#EFF6FF" />
                        : <Circle size={16} color="#D1D5DB" />
                      }
                      {item.label}
                    </div>
                  ))}
                  <button className="cert-view">
                    View all requirements <ChevronRight size={14} />
                  </button>
                </div>
                <div className="cert-right">
                  <Ring pct={40} size={110} stroke={10} color="#2563EB" />
                </div>
              </div>

            </div>
          </main>
        </div>

        {/* Mobile bottom tab bar  */}
        <div className="mobile-tabbar">
          <div className="mobile-tabbar-inner">
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`tab-item${activeNav === key ? ' active' : ''}`}
                onClick={() => handleNav(key)}
              >
                <Icon size={20} />
                <span>{label === 'Live Classes' ? 'Live' : label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}