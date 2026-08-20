import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { useAuth } from '../../hooks/useAuth'
import { notificationsAPI } from '../../services/api'
import NotificationPanel, { NOTIF_CSS } from './NotificationPanel'

interface NavbarProps {
  initials: string
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

export default function Navbar({ initials }: NavbarProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasUnread, setHasUnread] = useState(false)
  const avatarUrl = user?.avatar_url ?? null

  useEffect(() => {
    if (!user) return

    let cancelled = false

    async function syncUnreadBadge() {
      const result = await notificationsAPI.getUnreadCount()
      if (!cancelled && result.success) {
        setHasUnread(result.count > 0)
      }
    }

    syncUnreadBadge()
    return () => {
      cancelled = true
    }
  }, [user])

  async function handleLogout() {
    setProfileOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const term = searchTerm.trim()
    const base = RouteBuilder.courseCatalogPage()
    navigate(term ? `${base}?search=${encodeURIComponent(term)}` : base)
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
            <input
              type="text"
              placeholder="Search anything"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <div
              className="topbar-bell"
              onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
              style={{ cursor: 'pointer' }}
            >
              <Bell size={20} />
              {hasUnread && <div className="bell-dot" />}
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