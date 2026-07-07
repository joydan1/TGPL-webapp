import AppShell from '../../components/layout/AppShell'

export default function HelpSupportPage() {
  return (
    <AppShell activeNav="settings">
      <div style={{ padding: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Help & Support</h1>
        <p style={{ marginTop: '0.5rem', color: '#6B7280' }}>Find answers, contact support, and view help resources.</p>
      </div>
    </AppShell>
  )
}
