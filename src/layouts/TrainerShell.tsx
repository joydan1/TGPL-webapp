import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Star,
  CalendarDays,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'

type NavItem = {
  key: string
  label: string
  route: string
  Icon: React.ComponentType<{ size?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', route: ROUTES.TRAINER_DASHBOARD, Icon: Home },
  { key: 'courses', label: 'My Courses', route: ROUTES.TRAINER_COURSES, Icon: BookOpen },
  { key: 'reviews', label: 'Reviews', route: ROUTES.TRAINER_SUBMISSIONS, Icon: Star },
  { key: 'live', label: 'Live Classes', route: ROUTES.TRAINER_LIVE_SESSIONS, Icon: CalendarDays },
  { key: 'settings', label: 'Settings', route: ROUTES.SETTINGS, Icon: Settings },
]

const SHELL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .trainer-shell { display: flex; min-height: 100vh; background: #F4F7FB; font-family: Inter, system-ui, sans-serif; }
  .trainer-sidebar { width: 260px; min-width: 260px; background: #fff; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; }
  .trainer-sidebar-top { padding: 1.5rem 1.5rem 0; display: flex; justify-content: space-between; align-items: center; }
  .trainer-sidebar-brand { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.04em; color: #1F2937; }
  .trainer-nav { padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
  .trainer-nav-item { display: flex; align-items: center; gap: 0.9rem; padding: 0.95rem 1.1rem; border-radius: 16px; cursor: pointer; color: #54618C; font-weight: 600; font-size: 0.95rem; transition: background 0.18s ease, color 0.18s ease; }
  .trainer-nav-item:hover { background: #F8FAFF; color: #1D4ED8; }
  .trainer-nav-item.active { background: #EEF2FF; color: #1D4ED8; }
  .trainer-sidebar-spacer { flex: 1; }
  .trainer-sidebar-footer { padding: 1.25rem; border-top: 1px solid #E5E7EB; }
  .trainer-sidebar-footer p { margin: 0; color: #6B7280; font-size: 0.82rem; line-height: 1.5; }
  .trainer-content { flex: 1; display: flex; flex-direction: column; }
  .trainer-header { padding: 1.5rem 2rem 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
  .trainer-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #0F172A; }
  .trainer-subtitle { margin: 0.5rem 0 0; color: #475569; font-size: 0.95rem; }
  .trainer-search { min-width: 320px; max-width: 420px; width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem; border-radius: 14px; background: #fff; border: 1px solid #E5E7EB; }
  .trainer-search input { border: none; outline: none; width: 100%; font-size: 0.95rem; color: #111827; background: transparent; }
  .trainer-main { flex: 1; padding: 0 2rem 2rem 2rem; overflow-y: auto; }
  .trainer-panels { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
  .trainer-card { background: #fff; border-radius: 1rem; padding: 1.25rem 1.25rem 1.5rem; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); }
  .trainer-card-title { margin: 0 0 0.75rem; font-size: 0.9rem; color: #6B7280; letter-spacing: 0.01em; }
  .trainer-card-value { margin: 0; font-size: 2rem; font-weight: 800; color: #111827; }
  .trainer-section { margin-top: 1.75rem; }
  .trainer-section-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
  .trainer-section-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
  .trainer-section-link { color: #2563EB; font-size: 0.9rem; font-weight: 600; background: none; border: none; cursor: pointer; }
  .trainer-live-panel { display: flex; gap: 1rem; align-items: center; justify-content: space-between; padding: 1.5rem; border-radius: 1rem; background: linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%); color: #fff; }
  .trainer-live-meta { max-width: 64%; }
  .trainer-live-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.5rem; color: rgba(255,255,255,0.8); }
  .trainer-live-title { margin: 0; font-size: 1.15rem; font-weight: 700; line-height: 1.3; }
  .trainer-live-detail { margin: 0.5rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.95rem; line-height: 1.5; }
  .trainer-live-button { border: none; background: #fff; color: #1D4ED8; padding: 0.85rem 1.15rem; border-radius: 999px; font-weight: 700; cursor: pointer; box-shadow: 0 12px 30px rgba(37, 99, 235, 0.18); }
  .trainer-review-list { display: grid; gap: 0.85rem; }
  .trainer-review-card { background: #fff; border-radius: 1rem; padding: 1rem 1.15rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid #E5E7EB; }
  .trainer-review-detail { display: grid; gap: 0.2rem; }
  .trainer-review-name { margin: 0; font-size: 0.98rem; font-weight: 700; color: #111827; }
  .trainer-review-course { margin: 0; font-size: 0.85rem; color: #64748B; }
  .trainer-review-action { border: none; background: #2563EB; color: #fff; padding: 0.65rem 1rem; border-radius: 999px; cursor: pointer; font-size: 0.85rem; font-weight: 700; }
  .trainer-active-course { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 1rem; padding: 1.25rem; background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; }
  .trainer-active-course-img { width: 100%; height: 176px; border-radius: 0.9rem; object-fit: cover; }
  .trainer-active-course-info { display: flex; flex-direction: column; justify-content: space-between; }
  .trainer-active-course-meta { color: #64748B; font-size: 0.82rem; letter-spacing: 0.01em; text-transform: uppercase; margin-bottom: 0.75rem; }
  .trainer-course-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #0F172A; }
  .trainer-course-subtitle { margin: 0.85rem 0 0; color: #475569; line-height: 1.6; }
  .trainer-course-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; font-size: 0.9rem; color: #475569; }

  @media (max-width: 1120px) {
    .trainer-sidebar { width: 220px; min-width: 220px; }
    .trainer-panels { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .trainer-active-course { grid-template-columns: 1fr; }
  }
  @media (max-width: 880px) {
    .trainer-shell { flex-direction: column; }
    .trainer-sidebar { width: 100%; min-width: 100%; position: relative; border-right: none; border-bottom: 1px solid #E5E7EB; }
    .trainer-content { width: 100%; }
    .trainer-main { padding: 0 1.25rem 1.5rem 1.25rem; }
    .trainer-sidebar-top { padding: 1rem; }
    .trainer-sidebar-footer { padding: 1rem; }
  }
`

export default function TrainerShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  const activeRoute = NAV_ITEMS.find((item) => location.pathname.startsWith(item.route))?.route || ROUTES.TRAINER_DASHBOARD
  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()

  return (
    <>
      <style>{SHELL_CSS}</style>
      <div className="trainer-shell">
        <aside className="trainer-sidebar">
          <div className="trainer-sidebar-top">
            <div className="trainer-sidebar-brand">TGPL Trainer</div>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#4B5563',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <nav className="trainer-nav" style={{ paddingLeft: collapsed ? 0 : undefined }}>
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.route
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.route)}
                  className={`trainer-nav-item${active ? ' active' : ''}`}
                  style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <item.Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
          <div className="trainer-sidebar-spacer" />
          <div className="trainer-sidebar-footer">
            <p>{initials} · {user.name || user.email}</p>
          </div>
        </aside>
        <div className="trainer-content">
          {children}
        </div>
      </div>
    </>
  )
}
