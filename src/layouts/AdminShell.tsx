import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Users, BookOpen, CreditCard, Settings as SettingsIcon,
  Search, Bell, ChevronDown, ChevronLeft,
  PanelLeftClose, PanelLeftOpen,
  LogOut, User as UserIcon,
} from 'lucide-react'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import NotificationPanel, { NOTIF_CSS } from '../components/layout/NotificationPanel'
import LogoutConfirmModal, { LOGOUT_MODAL_CSS } from '../components/layout/LogoutConfirmModal'
import { useState } from 'react'

export const ADMIN_SHELL_CSS = `
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
  .sidebar-nav { flex: 1; padding: 0.5rem 0.625rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow-y: auto; }
  .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.6rem; cursor: pointer; color: #6B7280; font-size: 0.875rem; font-weight: 500; white-space: nowrap; transition: background 0.15s, color 0.15s; }
  .nav-item:hover { background: #F9FAFB; color: #111; }
  .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
  .nav-item .nav-label { flex: 1; }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }

  /* ── Switch role ── */
  .switch-role-wrap { position: relative; padding: 0.75rem 0.875rem; border-top: 1px solid #F3F4F6; }
  .switch-role-btn { width: 100%; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.55rem 0.75rem; cursor: pointer; color: #374151; font-size: 0.8125rem; font-weight: 600; transition: background 0.15s; }
  .switch-role-btn:hover { background: #F3F4F6; }
  .sidebar.collapsed .switch-role-btn .switch-role-label { display: none; }
  .sidebar.collapsed .switch-role-btn { justify-content: center; }
  .switch-role-menu { position: absolute; bottom: calc(100% + 0.4rem); left: 0.875rem; right: 0.875rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 0.4rem; z-index: 300; }
  .switch-role-option { display: block; width: 100%; text-align: left; background: none; border: none; padding: 0.6rem 0.7rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 500; color: #374151; cursor: pointer; }
  .switch-role-option:hover { background: #F9FAFB; }

  .sidebar-user { padding: 1rem 0.875rem; border-top: 1px solid #F3F4F6; display: flex; align-items: center; gap: 0.625rem; overflow: hidden; }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; }
  .user-text { overflow: hidden; }
  .user-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .user-text { display: none; }

  /* ── Main slot ── */
  .main { flex: 1; min-width: 0; overflow-y: auto; }

  @media (max-width: 640px) {
    .sidebar { display: none; }
    .search-wrap { display: none; }
    .navbar { padding: 0 1rem; }
    .navbar-logo img { height: 1.35rem; width: auto; }
  }
`

interface AdminShellProps {
  children: React.ReactNode
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', route: ROUTES.ADMIN_DASHBOARD, Icon: LayoutGrid },
  { key: 'users',     label: 'Users',     route: '/admin/users',         Icon: Users },
  { key: 'courses',   label: 'Courses',   route: '/admin/courses',       Icon: BookOpen },
  { key: 'revenue',   label: 'Revenue',   route: '/admin/revenue',       Icon: CreditCard },
  { key: 'settings',  label: 'Settings',  route: '/admin/settings',      Icon: SettingsIcon },
]

const ROLE_SWITCH_OPTIONS = [
  { key: 'learner', label: 'Continue as Learner', route: ROUTES.DASHBOARD },
  { key: 'trainer', label: 'Continue as Trainer',  route: ROUTES.TRAINER_DASHBOARD },
]

export default function AdminShell({ children }: AdminShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [collapsed,         setCollapsed]         = useState(false)
  const [profileOpen,       setProfileOpen]       = useState(false)
  const [notifOpen,         setNotifOpen]         = useState(false)
  const [roleMenuOpen,      setRoleMenuOpen]      = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  if (!user) return null

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const activeRoute = navItems.find((item) => location.pathname.startsWith(item.route))?.route || ROUTES.ADMIN_DASHBOARD

  function requestLogout() {
    setProfileOpen(false)
    setLogoutConfirmOpen(true)
  }

  async function handleLogout() {
    setLogoutConfirmOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  function toggleNotif() {
    setNotifOpen((o) => !o)
    setProfileOpen(false)
  }

  function toggleProfile() {
    setProfileOpen((o) => !o)
    setNotifOpen(false)
  }

  function handleRoleSwitch(route: string) {
    setRoleMenuOpen(false)
    navigate(route)
  }

  return (
    <>
      <style>{ADMIN_SHELL_CSS + NOTIF_CSS + LOGOUT_MODAL_CSS}</style>
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
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </div>

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
                    onClick={() => { setProfileOpen(false); navigate(ROUTES.PROFILE) }}
                  >
                    <UserIcon size={16} /> Profile
                  </button>
                  <button className="profile-dropdown-item danger" onClick={requestLogout}>
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
              {navItems.map(({ key, label, route, Icon }) => {
                const active = activeRoute === route
                return (
                  <div
                    key={key}
                    className={`nav-item${active ? ' active' : ''}`}
                    onClick={() => navigate(route)}
                  >
                    <Icon size={18} />
                    <span className="nav-label">{label}</span>
                  </div>
                )
              })}
            </nav>

            {/* ── Switch role ── */}
            <div className="switch-role-wrap">
              {roleMenuOpen && (
                <div className="switch-role-menu">
                  {ROLE_SWITCH_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      className="switch-role-option"
                      onClick={() => handleRoleSwitch(opt.route)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button className="switch-role-btn" onClick={() => setRoleMenuOpen((o) => !o)}>
                <ChevronLeft size={15} />
                <span className="switch-role-label">Switch role</span>
              </button>
            </div>

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

        {logoutConfirmOpen && (
          <LogoutConfirmModal
            onCancel={() => setLogoutConfirmOpen(false)}
            onConfirm={handleLogout}
          />
        )}

      </div>
    </>
  )
}