import { AlertTriangle } from 'lucide-react'

interface MaintenanceScreenProps {
  platformName?: string
  message?: string
  endTime?: string | null
  supportEmail?: string
  logoUrl?: string | null
  /** true = full-page live screen with inline styles (no dependency on the admin panel's CSS).
   *  false = compact preview meant to sit inside AdminSettingsPage, which already loads
   *  the as-preview-* classes via its own PAGE_CSS. */
  standalone?: boolean
}

const inlineStyles = {
  wrap: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem', background: '#F7FAFC' } as const,
  card: { width: '100%', maxWidth: 520, padding: '2.5rem 2rem', textAlign: 'center' as const, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 20, boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)' },
  icon: { width: 56, height: 56, borderRadius: 16, background: '#FEF3C6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FE9A00', margin: '0 auto 12px' } as const,
  title: { margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#2B2B2C' } as const,
  text: { margin: '0 0 8px', maxWidth: 380, fontSize: 13, lineHeight: 1.6, color: '#616873', marginLeft: 'auto', marginRight: 'auto' } as const,
  eta: { margin: '0 0 8px', fontSize: 12, fontWeight: 600, color: '#99A1AF' } as const,
  contact: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#99A1AF' } as const,
  dot: { width: 6, height: 6, borderRadius: 999, background: '#FFB900' } as const,
  logo: { maxWidth: 160, maxHeight: 64, objectFit: 'contain' as const, marginBottom: '1rem' },
}

export default function MaintenanceScreen({
  platformName = 'TGPL — The Global Project Leaders',
  message,
  endTime,
  supportEmail = 'support@tgpl.academy',
  logoUrl,
  standalone = false,
}: MaintenanceScreenProps) {
  const formattedEnd = endTime ? new Date(endTime).toLocaleString() : null
  const fallbackMessage = 'The platform is currently undergoing scheduled maintenance. We\u2019ll be back shortly — thank you for your patience.'

  if (standalone) {
    return (
      <main style={inlineStyles.wrap}>
        <section style={inlineStyles.card}>
          {logoUrl && <img src={logoUrl} alt={platformName} style={inlineStyles.logo} />}
          <div style={inlineStyles.icon}><AlertTriangle size={26} /></div>
          <p style={inlineStyles.title}>{platformName}</p>
          <p style={inlineStyles.text}>{message || fallbackMessage}</p>
          {formattedEnd && <p style={inlineStyles.eta}>Expected back: {formattedEnd}</p>}
          <div style={inlineStyles.contact}>
            <span style={inlineStyles.dot} />
            Need help? Contact <a href={`mailto:${supportEmail}`} style={{ color: '#2492EB', textDecoration: 'none' }}>{supportEmail}</a>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="as-preview-body">
      {logoUrl && <img src={logoUrl} alt={platformName} style={{ maxWidth: 160, maxHeight: 64, objectFit: 'contain' }} />}
      <div className="as-preview-icon"><AlertTriangle size={26} /></div>
      <p className="as-preview-title">{platformName}</p>
      <p className="as-preview-text">{message || fallbackMessage}</p>
      {formattedEnd && <p className="as-preview-eta">Expected back: {formattedEnd}</p>}
      <div className="as-preview-contact">
        <span className="as-preview-dot" />
        Need help? Contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
      </div>
    </div>
  )
}