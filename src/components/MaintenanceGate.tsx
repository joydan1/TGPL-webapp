// src/components/MaintenanceGate.tsx
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { publicSettingsAPI, type PublicSettings } from '../services/publicSettingsApi'
import MaintenanceScreen from './MaintenanceScreen'
import { useAuthStore } from '../store/auth'

const POLL_INTERVAL_MS = 60_000

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const location = useLocation()
  const role = useAuthStore((s) => s.user?.role)

  useEffect(() => {
    let cancelled = false
    async function check() {
      const res = await publicSettingsAPI.getPublicSettings()
      if (!cancelled && res.success) setSettings(res.data)
    }
    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const bypassesMaintenance = location.pathname.startsWith('/admin') || role === 'admin'

  if (settings?.maintenance_mode && !bypassesMaintenance) {
    return (
      <MaintenanceScreen
        platformName={settings.platform_name}
        message={settings.maintenance_scheduled_message}
        endTime={settings.maintenance_expected_end_time}
        supportEmail={settings.support_email}
        logoUrl={settings.logo_url}
        standalone
      />
    )
  }

  return <>{children}</>
}