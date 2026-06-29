import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import NotificationPanel, { NOTIF_CSS } from './NotificationPanel'

interface NavbarProps {
  initials: string
}

export default function Navbar({ initials }: NavbarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)

  async function handleLogout() {
    setProfileOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  if (!user) return null

  return (
    <>
      <style>{NOTIF_CSS}</style>
      <nav className="navbar">
        <div className="navbar-logo">
          <img src="/Logo.png" alt="The Global Project Leaders" />
        </div>
        <div className="navbar-right">
          <div className="search-wrap">
            <Search size={16} color="#9CA3AF" />
            <input type="text" placeholder="Search anything" />
          </div>

          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <div
              className="topbar-bell"
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
              style={{ cursor: 'pointer' }}
            >
              <Bell size={20} />
              <div className="bell-dot" />
            </div>
            {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
          </div>

          {/* Profile */}
          <div className="profile-menu-wrap">
            <button
              className="profile-trigger"
              onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
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
    </>
  )
}