import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Radio, Settings,
  Search, Bell, ChevronDown,
  PanelLeftClose, PanelLeftOpen,
  LogOut, User as UserIcon,
} from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import NotificationPanel, { NOTIF_CSS } from './NotificationPanel'

export const NAV_ITEMS = [
  { key: 'home',     label: 'Home',         Icon: Home     },
  { key: 'courses',  label: 'Courses',      Icon: BookOpen },
  { key: 'live',     label: 'Live Classes', Icon: Radio    },
  { key: 'settings', label: 'Settings',     Icon: Settings },
]

export const SHELL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root { display: flex; flex-direction: column; min-height: 100vh; background: #F5F5F5; font-family: inherit; }

  /* ── Navbar ── */
  .navbar { height: 64px; background: #fff; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; gap: 1rem; position: sticky; top: 0; z-index: 200; width: 100%; }
  .navbar-logo img { height: 2.25rem; display: block; }
  .navbar-right { display: flex; align-items: center; gap: 1rem; }
  .search-wrap { display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 2rem; padding: 0.45rem 1.1rem; width: 240px; }
  .search-wrap input { background: none; border: none; outline: none; font-size: 0.875rem; color: #111; width: 100%; }
  .search-wrap input::placeholder { color: #9CA3AF; }
  .topbar-bell { width: 36px; height: 36px; border-radius: 50%; background: #F9FAFB; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; position: relative; transition: background 0.15s; }
  .topbar-bell:hover { background: #F3F4F6; }
  .topbar-bell.active { background: #EFF6FF; border-color: #BFDBFE; color: #2563EB; }
  .bell-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #EF4444; border: 1.5px solid #fff; }

  /* ── Profile dropdown ── */
  .profile-menu-wrap { position: relative; }
  .profile-trigger { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; cursor: pointer; padding: 0; }
  .topbar-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; border: 2px solid #E5E7EB; flex-shrink: 0; overflow: hidden; }
  .profile-chevron { color: #9CA3AF; transition: transform 0.15s ease; }
  .profile-chevron.open { transform: rotate(180deg); }
  .profile-dropdown { position: absolute; top: calc(100% + 0.625rem); right: 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 220px; padding: 0.5rem; z-index: 300; }
  .profile-dropdown-header { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.625rem 0.75rem; border-bottom: 1px solid #F3F4F6; margin-bottom: 0.375rem; }
  .profile-dropdown-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.625rem; border-radius: 0.6rem; border: none; background: none; font-size: 0.8125rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; transition: background 0.15s; }
  .profile-dropdown-item:hover { background: #F9FAFB; }
  .profile-dropdown-item.danger { color: #EF4444; }
  .profile-dropdown-item.danger:hover { background: #FEF2F2; }

  /* ── Layout ── */
  .db-body { display: flex; flex: 1; }
  .sidebar { width: 220px; min-width: 220px; background: #fff; border-right: 1px solid #F3F4F6; display: flex; flex-direction: column; position: sticky; top: 64px; height: calc(100vh - 64px); flex-shrink: 0; transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s; overflow: hidden; }
  .sidebar.collapsed { width: 64px; min-width: 64px; }
  .sidebar-top { display: flex; justify-content: flex-end; padding: 0.75rem 0.75rem 0.25rem; }
  .collapse-btn { width: 32px; height: 32px; border-radius: 0.5rem; background: #fff; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: background 0.15s; flex-shrink: 0; }
  .collapse-btn:hover { background: #F3F4F6; }
  .sidebar-nav { flex: 1; padding: 0.5rem 0.625rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden; }
  .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.6rem; cursor: pointer; color: #6B7280; font-size: 0.875rem; font-weight: 500; white-space: nowrap; transition: background 0.15s, color 0.15s; }
  .nav-item:hover { background: #F9FAFB; color: #111; }
  .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
  .nav-item .nav-label { flex: 1; }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }
  .sidebar-user { padding: 1rem 0.875rem; border-top: 1px solid #F3F4F6; display: flex; align-items: center; gap: 0.625rem; overflow: hidden; }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; }
  .user-text { overflow: hidden; }
  .user-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .user-text { display: none; }

  /* ── Main slot ── */
  .main { flex: 1; min-width: 0; overflow-y: auto; }

  /* ── Mobile tab bar ── */
  .mobile-tabbar { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: #fff; border-top: 1px solid #F3F4F6; z-index: 300; }
  .mobile-tabbar-inner { display: flex; height: 100%; }
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #9CA3AF; font-size: 0.65rem; font-weight: 600; border: none; background: none; padding: 0; }
  .tab-item.active { color: #2563EB; }

  @media (max-width: 640px) {
    .sidebar { display: none; }
    .search-wrap { display: none; }
    .navbar { padding: 0 1rem; }
    .mobile-tabbar { display: block; }
  }
`

interface AppShellProps {
  children: React.ReactNode
  activeNav?: string
  onNavChange?: (key: string) => void
}

export default function AppShell({ children, activeNav = 'home', onNavChange }: AppShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [collapsed,    setCollapsed]    = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)

  if (!user) return null

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()

  function handleNav(key: string) {
    onNavChange?.(key)
    if (key === 'home')     navigate(ROUTES.DASHBOARD)
    if (key === 'courses')  navigate(ROUTES.COURSES)
    if (key === 'settings') navigate(ROUTES.SETTINGS)
  }

  async function handleLogout() {
    setProfileOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  function toggleNotif() {
    setNotifOpen(o => !o)
    setProfileOpen(false)   // close profile if open
  }

  function toggleProfile() {
    setProfileOpen(o => !o)
    setNotifOpen(false)     // close notif if open
  }

  return (
    <>
      <style>{SHELL_CSS + NOTIF_CSS}</style>
      <div className="db-root">

        {/* ── Navbar ── */}
        <nav className="navbar">
          <div className="navbar-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>

          <div className="navbar-right">
            <div className="search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input type="text" placeholder="Search anything" />
            </div>

            {/* Bell + notification panel */}
            <div style={{ position: 'relative' }}>
              <div
                className={`topbar-bell${notifOpen ? ' active' : ''}`}
                onClick={toggleNotif}
                role="button"
                aria-label="Open notifications"
                aria-expanded={notifOpen}
              >
                <Bell size={20} />
                <div className="bell-dot" />
              </div>
              {notifOpen && (
                <NotificationPanel onClose={() => setNotifOpen(false)} />
              )}
            </div>

            {/* Profile dropdown */}
            <div className="profile-menu-wrap">
              <button
                className="profile-trigger"
                onClick={toggleProfile}
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
                    onClick={() => { setProfileOpen(false); navigate(ROUTES.SETTINGS) }}
                  >
                    <UserIcon size={16} /> Profile settings
                  </button>
                  <button className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="db-body">

          {/* ── Sidebar ── */}
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

          {/* ── Page content ── */}
          <main className="main">
            {children}
          </main>
        </div>

        {/* ── Mobile tab bar ── */}
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