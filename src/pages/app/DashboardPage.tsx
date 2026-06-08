import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9,22 9,12 15,12 15,22" />
  </svg>
)
const CoursesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
)
const LiveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 010 8.49M7.76 16.24a6 6 0 010-8.49M19.07 4.93a10 10 0 010 14.14M4.93 19.07a10 10 0 010-14.14" />
  </svg>
)
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
)
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9,18 15,12 9,6" />
  </svg>
)
const ChevronDownIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6,9 12,15 18,9" />
  </svg>
)
const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    {collapsed
      ? <polyline points="9,18 15,12 9,6" />
      : <polyline points="15,18 9,12 15,6" />}
  </svg>
)
const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
)
const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
  </svg>
)
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const TrophyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
    <path d="M6 9H4a2 2 0 000 4h2" /><path d="M18 9h2a2 2 0 010 4h-2" />
    <path d="M4 7h16v7a6 6 0 01-6 6H10a6 6 0 01-6-6V7z" />
    <path d="M9 21v2m6-2v2M9 23h6" />
  </svg>
)
const CheckCircleIcon = ({ done }: { done: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={done ? '#2563EB' : '#D1D5DB'} strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" fill={done ? '#EFF6FF' : 'none'} />
    {done && <path d="M9 12l2 2 4-4" stroke="#2563EB" />}
  </svg>
)

function Ring({ pct, size = 80, stroke = 7, color = '#2563EB' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
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

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: #F5F5F5;
    font-family: inherit;
  }

  /* ── Full-width top navbar ── */
  .navbar {
    height: 64px;
    background: #fff;
    border-bottom: 1px solid #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    gap: 1rem;
    position: sticky;
    top: 0;
    z-index: 200;
    width: 100%;
  }
  .navbar-logo img { height: 2.25rem; display: block; }
  .navbar-right { display: flex; align-items: center; gap: 1rem; }

  .search-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 2rem;
    padding: 0.45rem 1.1rem; width: 240px;
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
  .topbar-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: #2563EB; display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.875rem;
    cursor: pointer; border: 2px solid #E5E7EB; overflow: hidden;
  }

  /* ── Body row: sidebar + content ── */
  .db-body {
    display: flex;
    flex: 1;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px;
    min-width: 220px;
    background: #fff;
    border-right: 1px solid #F3F4F6;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 64px;
    height: calc(100vh - 64px);
    flex-shrink: 0;
    transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s;
    overflow: hidden;
  }
  .sidebar.collapsed { width: 64px; min-width: 64px; }

  /* collapse button sits top-right of sidebar */
  .sidebar-top {
    display: flex;
    justify-content: flex-end;
    padding: 0.75rem 0.75rem 0.25rem;
  }
  .collapse-btn {
    width: 32px; height: 32px; border-radius: 0.5rem;
    background: #fff; border: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #6B7280;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .collapse-btn:hover { background: #F3F4F6; }

  .sidebar-nav {
    flex: 1;
    padding: 0.5rem 0.625rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow: hidden;
  }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 0.6rem; cursor: pointer;
    color: #6B7280; font-size: 0.875rem; font-weight: 500;
    white-space: nowrap; transition: background 0.15s, color 0.15s;
  }
  .nav-item:hover { background: #F9FAFB; color: #111; }
  .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
  .nav-item .nav-label { flex: 1; }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }

  .sidebar-user {
    padding: 1rem 0.875rem;
    border-top: 1px solid #F3F4F6;
    display: flex; align-items: center; gap: 0.625rem;
    overflow: hidden;
  }
  .user-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    overflow: hidden; flex-shrink: 0;
    background: #2563EB; display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.875rem;
  }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .user-text { overflow: hidden; }
  .user-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .user-text { display: none; }

  /* ── Main content ── */
  .main {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
  }

  .content {
    padding: 2rem 2.5rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    max-width: 1100px;
  }

  .greeting-line { font-size: 0.9375rem; color: #6B7280; }
  .greeting-name { font-size: 1.625rem; font-weight: 700; color: #111; margin-top: 0.125rem; }

  /* Resume banner */
  .resume-banner {
    background: linear-gradient(135deg, #2492EB 0%, #2390E8 7.14%, #228DE4 14.29%, #218BE1 21.43%, #2189DE 28.57%, #2087DB 35.71%, #1F84D7 42.86%, #1E82D4 50%, #1D7DCE 57.14%, #1B78C7 64.29%, #1A73C1 71.43%, #196EBB 78.57%, #176AB4 85.71%, #1665AE 92.86%, #1560A8 100%);
    border-radius: 1rem; padding: 1.5rem 1.75rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
    color: #fff;
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

  /* Assignments */
  .assignments-wrap { position: relative; }
  .assignments-scroll { display: flex; gap: 0.875rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
  .assignments-scroll::-webkit-scrollbar { display: none; }
  .asgn-next-btn {
    position: absolute; right: -14px; top: 50%; transform: translateY(-50%);
    width: 28px; height: 28px; border-radius: 50%;
    background: #fff; border: 1px solid #E5E7EB;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #374151; z-index: 2;
  }
  .asgn-next-btn:hover { background: #F9FAFB; }

  .asgn-card {
    min-width: 200px; max-width: 200px;
    background: #fff; border: 1px solid #E5E7EB;
    border-radius: 0.875rem; padding: 1rem;
    display: flex; flex-direction: column; gap: 0.25rem; flex-shrink: 0;
  }
  .asgn-card.due { background: #FEF2F2; border-color: #FECACA; }
  .asgn-badge { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 0.25rem; }
  .asgn-badge.due { color: #EF4444; }
  .asgn-badge.upcoming { color: #6B7280; }
  .asgn-title { font-size: 0.875rem; font-weight: 700; color: #111; line-height: 1.3; }
  .asgn-course { font-size: 0.75rem; color: #6B7280; margin-top: 0.125rem; }
  .asgn-time { font-size: 0.75rem; color: #EF4444; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.375rem; font-weight: 500; }
  .asgn-time-upcoming { font-size: 0.75rem; color: #6B7280; display: flex; align-items: center; gap: 0.3rem; margin-top: 0.375rem; }

  /* Sessions */
  .sessions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .session-card {
    background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem;
    padding: 1rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
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

  /* My Courses */
  .course-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; overflow: hidden; width: 260px; flex-shrink: 0; }
  .course-thumb { position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #D0D0D0; }
  .course-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .course-body { padding: 0.75rem 1rem 1rem; }
  .course-tag { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; margin-bottom: 0.2rem; }
  .course-title { font-size: 0.875rem; font-weight: 700; color: #111; line-height: 1.3; }
  .course-last { font-size: 0.72rem; color: #9CA3AF; margin-top: 0.25rem; }
  .course-prog-bar { height: 3px; background: #E5E7EB; border-radius: 99px; margin-top: 0.625rem; }
  .course-prog-fill { height: 100%; background: #2563EB; border-radius: 99px; }

  /* Certificate */
  .cert-section { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.5rem; display: flex; gap: 2rem; align-items: flex-start; }
  .cert-left { flex: 1; }
  .cert-badge { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .cert-badge-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; }
  .cert-name { font-size: 1rem; font-weight: 700; color: #111; margin-bottom: 0.625rem; }
  .cert-desc { font-size: 0.8375rem; color: #6B7280; margin-bottom: 1rem; line-height: 1.55; }
  .cert-desc strong { color: #2563EB; }
  .cert-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8375rem; color: #374151; padding: 0.3rem 0; }
  .cert-item.done { color: #6B7280; text-decoration: line-through; }
  .cert-view { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: #2563EB; font-weight: 600; cursor: pointer; background: none; border: none; margin-top: 0.875rem; }
  .cert-right { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  @media (max-width: 900px) {
    .sessions-row { grid-template-columns: 1fr; }
    .content { padding: 1.5rem 1.25rem 2.5rem; }
  }
  @media (max-width: 640px) {
    .sidebar { display: none; }
    .content { padding: 1.25rem 1rem 2rem; }
    .navbar { padding: 0 1rem; }
  }
`

const ASSIGNMENTS = [
  { id: 1, due: true,  title: 'Stakeholder Map Draft', course: 'Project Management', time: 'Today, 11:59 PM' },
  { id: 2, due: false, title: 'Data Viz Quiz',          course: 'Data Storytelling',  time: 'Mon, 9 Jun' },
  { id: 3, due: false, title: 'Data Viz Quiz',          course: 'Data Storytelling',  time: 'Mon, 9 Jun' },
  { id: 4, due: false, title: 'Data Viz Quiz',          course: 'Data Storytelling',  time: 'Mon, 9 Jun' },
  { id: 5, due: false, title: 'Data Viz Quiz',          course: 'Data Storytelling',  time: 'Mon, 9 Jun' },
]

const CERT_ITEMS = [
  { label: 'Complete all 6/8 modules',      done: true },
  { label: 'Pass module quizzes (≥70%)',     done: true },
  { label: 'Submit stakeholder map project', done: false },
  { label: 'Attend 1 live session',          done: false },
  { label: 'Final assessment',               done: false },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('home')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

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

  const navItems = [
    { key: 'home',     label: 'Home',         Icon: HomeIcon,     action: () => setActiveNav('home') },
    { key: 'courses',  label: 'Courses',      Icon: CoursesIcon,  action: () => { setActiveNav('courses'); navigate(ROUTES.COURSES) } },
    { key: 'live',     label: 'Live Classes', Icon: LiveIcon,     action: () => setActiveNav('live') },
    { key: 'settings', label: 'Settings',     Icon: SettingsIcon, action: () => setActiveNav('settings'), chevron: true },
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="db-root">

        {/* ── Full-width navbar ── */}
        <nav className="navbar">
          <div className="navbar-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>
          <div className="navbar-right">
            <div className="search-wrap">
              <SearchIcon />
              <input type="text" placeholder="Search anything" />
            </div>
            <div className="topbar-bell">
              <BellIcon />
              <div className="bell-dot" />
            </div>
            <div className="topbar-avatar">{initials}</div>
          </div>
        </nav>

        {/* ── Body row ── */}
        <div className="db-body">

          {/* Sidebar */}
          <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-top">
              <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                <CollapseIcon collapsed={collapsed} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {navItems.map(({ key, label, Icon, action, chevron }) => (
                <div
                  key={key}
                  className={`nav-item${activeNav === key ? ' active' : ''}`}
                  onClick={action}
                >
                  <Icon />
                  <span className="nav-label">{label}</span>
                  {chevron && !collapsed && (
                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}><ChevronDownIcon /></span>
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

          {/* Main content */}
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
                <button className="resume-btn"><PlayIcon /> Resume</button>
              </div>

              {/* Assignments */}
              <div>
                <div className="section-header">
                  <span className="section-title">Assignment(s)</span>
                </div>
                <div className="assignments-wrap">
                  <div className="assignments-scroll" ref={scrollRef}>
                    {ASSIGNMENTS.map((a) => (
                      <div key={a.id} className={`asgn-card${a.due ? ' due' : ''}`}>
                        <div className={`asgn-badge ${a.due ? 'due' : 'upcoming'}`}>
                          {a.due ? '● Due today' : '○ Upcoming'}
                        </div>
                        <div className="asgn-title">{a.title}</div>
                        <div className="asgn-course">{a.course}</div>
                        {a.due
                          ? <div className="asgn-time"><ClockIcon />{a.time}</div>
                          : <div className="asgn-time-upcoming"><CalendarIcon />{a.time}</div>
                        }
                      </div>
                    ))}
                  </div>
                  <button className="asgn-next-btn" onClick={() => {
                    if (scrollRef.current) scrollRef.current.scrollLeft += 220
                  }}>
                    <ChevronRightIcon />
                  </button>
                </div>
              </div>

              {/* Sessions */}
              <div className="sessions-row">
                <div>
                  <div className="section-header">
                    <span className="section-title">Live Session</span>
                    <button className="see-all">See all <ChevronRightIcon /></button>
                  </div>
                  <div className="session-card">
                    <div>
                      <div className="live-badge"><div className="live-dot" /> Live</div>
                      <div className="session-title">Q&A: Stakeholder Communication in Practice</div>
                      <div className="session-sub">Amara Osei</div>
                      <div className="session-time"><ClockIcon /> Live now</div>
                    </div>
                    <button className="join-btn">Join</button>
                  </div>
                </div>
                <div>
                  <div className="section-header">
                    <span className="section-title">Upcoming Session</span>
                    <button className="see-all">See all <ChevronRightIcon /></button>
                  </div>
                  <div className="session-card">
                    <div>
                      <div className="session-title">Masterclass: Building Your Lead…</div>
                      <div className="session-sub">Kofi Mensah</div>
                      <div className="session-time"><CalendarIcon /> Wed, 4 Jun · 3:00 PM WAT</div>
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
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div className="course-card">
                    <div className="course-thumb">
                      <img src="/intro.png" alt="Project Management Course" />
                      <SmallRing pct={37} />
                    </div>
                    <div className="course-body">
                      <div className="course-tag">Management</div>
                      <div className="course-title">Project Management Course</div>
                      <div className="course-last">Last opened 2h ago</div>
                      <div className="course-prog-bar">
                        <div className="course-prog-fill" style={{ width: '37%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate */}
              <div className="cert-section">
                <div className="cert-left">
                  <div className="cert-badge">
                    <TrophyIcon />
                    <span className="cert-badge-label">Certificate</span>
                  </div>
                  <div className="cert-name">Project Management</div>
                  <div className="cert-desc">
                    You're <strong>40%</strong> to your Project Management certificate — keep going!
                  </div>
                  {CERT_ITEMS.map((item, i) => (
                    <div key={i} className={`cert-item${item.done ? ' done' : ''}`}>
                      <CheckCircleIcon done={item.done} />
                      {item.label}
                    </div>
                  ))}
                  <button className="cert-view">View all requirements <ChevronRightIcon /></button>
                </div>
                <div className="cert-right">
                  <Ring pct={40} size={110} stroke={10} color="#2563EB" />
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  )
}