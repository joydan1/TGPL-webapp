import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'
import LogoutConfirmModal, { LOGOUT_MODAL_CSS } from '../../components/layout/LogoutConfirmModal'

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .settings-content { padding: 2rem 2.5rem 3rem; }
  .settings-heading { font-size: 1.5rem; font-weight: 800; color: #111; }
  .settings-sub { font-size: 0.9375rem; color: #6B7280; margin-top: 0.375rem; }

  .settings-list { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; margin-top: 1.75rem; overflow: hidden; }
  .settings-row { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; cursor: pointer; border: none; background: none; width: 100%; text-align: left; }
  .settings-row:not(:last-child) { border-bottom: 1px solid #F1F3F5; }
  .settings-row:hover { background: #FAFBFC; }
  .settings-row-icon { width: 40px; height: 40px; border-radius: 0.75rem; background: #F3F4F6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4B5563; }
  .settings-row-label { flex: 1; font-size: 1.0625rem; font-weight: 600; color: #111; }
  .settings-row-chevron { color: #C4C9D1; flex-shrink: 0; }

  .settings-row.danger .settings-row-icon { background: #FEF2F2; color: #EF4444; }
  .settings-row.danger .settings-row-label { color: #EF4444; }

  @media (max-width: 640px) {
    .settings-content { padding: 1.25rem 1rem 5rem; }
  }
`

export default function SettingsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  const handleConfirmLogout = async () => {
    setLogoutConfirmOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS + LOGOUT_MODAL_CSS}</style>
      <AppShell activeNav="settings" onNavChange={() => {}}>
        <div className="settings-content">
          <div className="settings-heading">Settings</div>
          <div className="settings-sub">Manage your account preferences</div>

          <div className="settings-list">
            <button className="settings-row" onClick={() => navigate(ROUTES.PROFILE)}>
              <div className="settings-row-icon"><User size={19} /></div>
              <span className="settings-row-label">Profile</span>
              <ChevronRight size={18} className="settings-row-chevron" />
            </button>

            <button className="settings-row" onClick={() => navigate(ROUTES.SETTINGS_SECURITY)}>
              <div className="settings-row-icon"><Shield size={19} /></div>
              <span className="settings-row-label">Security</span>
              <ChevronRight size={18} className="settings-row-chevron" />
            </button>

            <button className="settings-row" onClick={() => navigate(ROUTES.SETTINGS_NOTIFICATIONS)}>
              <div className="settings-row-icon"><Bell size={19} /></div>
              <span className="settings-row-label">Notifications</span>
              <ChevronRight size={18} className="settings-row-chevron" />
            </button>

            <button className="settings-row" onClick={() => navigate(ROUTES.HELP_SUPPORT)}>
              <div className="settings-row-icon"><HelpCircle size={19} /></div>
              <span className="settings-row-label">Help &amp; Support</span>
              <ChevronRight size={18} className="settings-row-chevron" />
            </button>

            <button className="settings-row danger" onClick={() => setLogoutConfirmOpen(true)}>
              <div className="settings-row-icon"><LogOut size={19} /></div>
              <span className="settings-row-label">Log out</span>
            </button>
          </div>
        </div>
      </AppShell>

      {logoutConfirmOpen && (
        <LogoutConfirmModal
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={handleConfirmLogout}
        />
      )}
    </>
  )
}