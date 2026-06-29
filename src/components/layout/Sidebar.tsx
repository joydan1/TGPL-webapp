import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NAV_ITEMS } from './navItems'

interface SidebarProps {
  activeNav: string
  onNav: (key: string) => void
  initials: string
  userName: string
  userEmail: string
}

export default function Sidebar({ activeNav, onNav, initials, userName, userEmail }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
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
              onClick={() => onNav(key)}
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-text">
            <div className="user-name">{userName}</div>
            <div className="user-email">{userEmail}</div>
          </div>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="mobile-tabbar">
        <div className="mobile-tabbar-inner">
          {NAV_ITEMS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`tab-item${activeNav === key ? ' active' : ''}`}
              onClick={() => onNav(key)}
            >
              <Icon size={20} />
              <span>{label === 'Live Classes' ? 'Live' : label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}