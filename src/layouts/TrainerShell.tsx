import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home, BookOpen, Star, Radio, Settings,
  Search, Bell, ChevronDown, ChevronLeft,
  PanelLeftClose, PanelLeftOpen, MessageCircle,
  LogOut, User as UserIcon, Shield, HelpCircle, Award, Calendar,
} from 'lucide-react'
import { ROUTES } from '../constants/routes'
import { useAuth } from '../hooks/useAuth'
import { trainerReviewsAPI } from '../services/api'
import NotificationPanel, { NOTIF_CSS } from '../components/layout/NotificationPanel'
import LogoutConfirmModal, { LOGOUT_MODAL_CSS } from '../components/layout/LogoutConfirmModal'
import { useState, useEffect } from 'react'


export const SETTINGS_SUBITEMS = [
  { key: 'profile',       label: 'Profile',         Icon: UserIcon,   route: ROUTES.PROFILE },
  { key: 'trainerProfile', label: 'Trainer Profile', Icon: Award,      route: ROUTES.TRAINER_PROFILE },
  { key: 'security',      label: 'Security',        Icon: Shield,     route: ROUTES.SETTINGS_SECURITY },
  { key: 'notifications', label: 'Notifications',   Icon: Bell,       route: ROUTES.SETTINGS_NOTIFICATIONS },
  { key: 'help',          label: 'Help & Support',  Icon: HelpCircle, route: ROUTES.HELP_SUPPORT },
  { key: 'logout',        label: 'Log out',         Icon: LogOut,     route: null, danger: true },
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

  /* ── Page header (replaces navbar content on sub-pages like Settings) ── */
  .navbar-page-header { display: flex; align-items: center; gap: 0.875rem; }
  .navbar-page-back { background: none; border: none; cursor: pointer; color: #111; padding: 0.25rem; display: flex; align-items: center; flex-shrink: 0; }
  .navbar-page-back:hover { color: #2563EB; }
  .navbar-page-title { font-size: 1.0625rem; font-weight: 700; color: #111; line-height: 1.2; }
  .navbar-page-subtitle { font-size: 0.75rem; color: #6B7280; line-height: 1.2; margin-top: 1px; }

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
  .nav-item .nav-badge { background: #F59E0B; color: #fff; font-size: 0.68rem; font-weight: 700; border-radius: 999px; min-width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; padding: 0 5px; flex-shrink: 0; }
  .nav-item .nav-chevron { transition: transform 0.18s ease; flex-shrink: 0; }
  .nav-item .nav-chevron.open { transform: rotate(180deg); }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-badge { display: none; }
  .sidebar.collapsed .nav-chevron { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }

  /* ── Settings accordion sub-items ── */
  .nav-subitems { display: flex; flex-direction: column; gap: 2px; background: #F9FAFB; border-radius: 0.6rem; padding: 0.25rem; margin: 2px 0 0.25rem; overflow: hidden; }
  .sidebar.collapsed .nav-subitems { display: none; }
  .nav-subitem { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.75rem 0.625rem 1.875rem; border-radius: 0.5rem; cursor: pointer; color: #4B5563; font-size: 0.8125rem; font-weight: 500; white-space: nowrap; background: none; border: none; width: 100%; text-align: left; transition: background 0.15s; }
  .nav-subitem:hover { background: #F1F3F5; color: #111; }
  .nav-subitem.danger { color: #EF4444; }
  .nav-subitem.danger:hover { background: #FEF2F2; }

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
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #9CA3AF; font-size: 0.65rem; font-weight: 600; border: none; background: none; padding: 0; position: relative; }
  .tab-item.active { color: #2492EB; }
  .tab-item .tab-badge { position: absolute; top: 2px; right: calc(50% - 18px); background: #F59E0B; color: #fff; font-size: 0.6rem; font-weight: 700; border-radius: 999px; min-width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; padding: 0 3px; }

  @media (max-width: 640px) {
  .sidebar { display: none; }
  .search-wrap { display: none; }
  .navbar { padding: 0 1rem; }
  .navbar-logo img { height: 1.35rem; width: auto; }
  .navbar-page-subtitle { display: none; }
  .mobile-tabbar { display: block; }
  .main { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)); }  
}
`

interface TrainerShellProps {
  children: React.ReactNode
  /** When set, replaces the logo/search/bell/profile row with a back button + title/subtitle. */
  pageHeader?: { title: string; subtitle?: string; onBack: () => void }
}

function Avatar({ avatarUrl, initials, className }: { avatarUrl: string | null; initials: string; className: string }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (avatarUrl && !imgFailed) {
    return (
      <div className={className}>
        <img
          src={avatarUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }

  return <div className={className}>{initials}</div>
}

export default function TrainerShell({ children, pageHeader }: TrainerShellProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [collapsed,           setCollapsed]           = useState(false)
  const [profileOpen,         setProfileOpen]         = useState(false)
  const [notifOpen,           setNotifOpen]           = useState(false)
  const [settingsOpen,        setSettingsOpen]        = useState(false)
  const [logoutConfirmOpen,   setLogoutConfirmOpen]   = useState(false)
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadPendingCount() {
      const result = await trainerReviewsAPI.getSummary()
      if (!cancelled && result.success) {
        setPendingReviewsCount(result.data.pending_count)
      }
    }
    loadPendingCount()
    return () => { cancelled = true }
  }, [])

  const navItems = [
    { key: 'home',     label: 'Home',         route: ROUTES.TRAINER_DASHBOARD,    Icon: Home    },
    { key: 'courses',  label: 'My Courses',   route: ROUTES.TRAINER_COURSES,      Icon: BookOpen },
    {key: 'community',  label: 'Community', route: ROUTES.TRAINER_COMMUNITY, Icon: MessageCircle },
    { key: 'reviews',  label: 'Reviews',      route: ROUTES.TRAINER_REVIEWS,      Icon: Star,   badge: pendingReviewsCount || undefined },
    { key: 'live',     label: 'Live Classes', route: ROUTES.TRAINER_LIVE_CLASSES, Icon: Radio },
     { key: 'bookings', label: 'Bookings',     route: ROUTES.TRAINER_BOOKINGS,    Icon: Calendar },
    { key: 'settings', label: 'Settings',     route: ROUTES.SETTINGS,             Icon: Settings },
  ]

  if (!user) return null

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const avatarUrl = user.avatar_url ?? null
  const activeRoute = navItems.find((item) => location.pathname.startsWith(item.route))?.route || ROUTES.TRAINER_DASHBOARD

  function handleNav(key: string, route: string) {
    if (key === 'settings') {
      setSettingsOpen((o) => !o)
      return
    }
    navigate(route)
  }

  function handleSubitemClick(sub: typeof SETTINGS_SUBITEMS[number]) {
    if (sub.key === 'logout') {
      requestLogout()
      return
    }
    if (sub.route) navigate(sub.route)
  }

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
    setNotifOpen(o => !o)
    setProfileOpen(false)   // close profile if open
  }

  function toggleProfile() {
    setProfileOpen(o => !o)
    setNotifOpen(false)     // close notif if open
  }

  return (
    <>
      <style>{SHELL_CSS + NOTIF_CSS + LOGOUT_MODAL_CSS}</style>
      <div className="db-root">

        {/* ── Navbar ── */}
        <nav className="navbar">
          {pageHeader ? (
            <div className="navbar-page-header">
              <button className="navbar-page-back" onClick={pageHeader.onBack} aria-label="Back">
                <ChevronLeft size={22} />
              </button>
              <div>
                <div className="navbar-page-title">{pageHeader.title}</div>
                {pageHeader.subtitle && (
                  <div className="navbar-page-subtitle">{pageHeader.subtitle}</div>
                )}
              </div>
            </div>
          ) : (
            <>
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
                    <Avatar avatarUrl={avatarUrl} initials={initials} className="topbar-avatar" />
                    <ChevronDown size={16} className={`profile-chevron${profileOpen ? ' open' : ''}`} />
                  </button>
                  {profileOpen && (
                    <div className="profile-dropdown" role="menu">
                      <div className="profile-dropdown-header">
                        <Avatar avatarUrl={avatarUrl} initials={initials} className="user-avatar" />
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
            </>
          )}
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
             {navItems.map(({ key, label, route, Icon, badge }) => {
  const active = activeRoute === route
  return (
    <div key={key}>
      <div
        className={`nav-item${active ? ' active' : ''}`}
        onClick={() => handleNav(key, route)}
      >
        <Icon size={18} />
        <span className="nav-label">{label}</span>
        {!!badge && <span className="nav-badge">{badge}</span>}
        {key === 'settings' && (
          <ChevronDown size={16} className={`nav-chevron${settingsOpen ? ' open' : ''}`} />
        )}
      </div>
      {key === 'settings' && settingsOpen && (
        <div className="nav-subitems">
          {SETTINGS_SUBITEMS.map((sub) => (
            <button
              key={sub.key}
              className={`nav-subitem${sub.danger ? ' danger' : ''}`}
              onClick={() => handleSubitemClick(sub)}
            >
              <sub.Icon size={15} />
              {sub.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})}
            </nav>
            <div className="sidebar-user">
              <Avatar avatarUrl={avatarUrl} initials={initials} className="user-avatar" />
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
          {navItems.map(({ key, label, route, Icon, badge }) => (
              <button
                key={key}
                className={`tab-item${activeRoute === route ? ' active' : ''}`}
                onClick={() => key === 'settings' ? navigate(ROUTES.SETTINGS) : navigate(route)}
              >
                {!!badge && <span className="tab-badge">{badge}</span>}
                <Icon size={20} />
                <span>{label === 'Live Classes' ? 'Live' : label === 'My Courses' ? 'Courses' : label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Logout confirmation modal ── */}
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