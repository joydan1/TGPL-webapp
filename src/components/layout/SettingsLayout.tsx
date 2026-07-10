import { useNavigate } from 'react-router-dom'
import AppShell, { SHELL_CSS } from './AppShell'
import TrainerShell from '../../layouts/TrainerShell'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'

export const SETTINGS_LAYOUT_CSS = `
  .settings-layout-content { padding: 2rem 2.5rem 6rem; }
  @media (max-width: 640px) {
    .settings-layout-content { padding: 1rem; }
  }
`

interface SettingsLayoutProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  backTo?: string
}

export default function SettingsLayout({ title, subtitle, children, backTo }: SettingsLayoutProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const pageHeader = { title, subtitle, onBack: () => navigate(backTo || ROUTES.SETTINGS) }
  const content = <div className="settings-layout-content">{children}</div>

  return (
    <>
      <style>{SHELL_CSS + SETTINGS_LAYOUT_CSS}</style>
      {user?.role === 'trainer' ? (
        <TrainerShell pageHeader={pageHeader}>{content}</TrainerShell>
      ) : (
        <AppShell activeNav="settings" onNavChange={() => {}} pageHeader={pageHeader}>
          {content}
        </AppShell>
      )}
    </>
  )
}