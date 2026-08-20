import { useEffect, useState } from 'react'
import {
  Settings as SettingsIcon, User, CreditCard, Bell, Award, Wrench, Check,
  ShieldCheck, ExternalLink, Upload, Eye, EyeOff, AlertTriangle, Camera,
  Loader2, Lock,
} from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminSettingsAPI, adminProfileAPI, NO_OP_ERROR_MESSAGE } from '../../services/adminSettingsApi'
import {
  SETTINGS_SECTIONS, CERTIFICATE_TEMPLATES, SESSION_TIMEOUT_OPTIONS,
  type SystemSettings, type PatchedSystemSettings, type FieldConfig, type FieldGroup,
  type AdminProfile, type AdminSession, type SectionConfig, type SelectOption,
} from '../../types/adminSettings'

// Link out to manage live Paystack credentials — replace with your actual dashboard URL.
const PAYSTACK_DASHBOARD_URL = 'https://dashboard.paystack.com/#/settings/developer'

// ─── Styles ────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .as-page { display: flex; flex-direction: column; background: #F7F7F7; }
  .as-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px 16px 0; background: #F7F7F7; border-bottom: 1px solid #EBEBEB; gap: 1rem; flex-wrap: wrap; }
  .as-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #2B2B2C; }
  .as-subtitle { margin: 0.25rem 0 0; font-size: 0.75rem; color: #99A1AF; }
  .as-save-btn { display: flex; align-items: center; gap: 8px; background: #2492EB; color: #fff; border: none; border-radius: 14px; padding: 0 20px; height: 36px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: 0 1px 3px rgba(36,146,235,0.2), 0 1px 2px -1px rgba(36,146,235,0.2); }
  .as-save-btn.saved { background: #10B981; box-shadow: 0 1px 3px rgba(16,185,129,0.2), 0 1px 2px -1px rgba(16,185,129,0.2); }
  .as-save-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

  .as-body { display: flex; align-items: flex-start; }
  .as-nav { width: 196px; flex-shrink: 0; background: #fff; border-right: 1px solid #EBEBEB; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
  .as-nav-btn { display: flex; align-items: center; gap: 10px; padding: 0 12px; height: 36px; border-radius: 14px; border: none; background: none; color: #616873; font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; }
  .as-nav-btn.active { background: #E9F5FF; color: #2492EB; }

  .as-content { flex: 1; min-width: 0; padding: 0 32px 24px 0; box-sizing: border-box; }
  .as-content-inner { padding: 20px 0 0 24px; max-width: 920px; }

  .as-card { background: #fff; border: 1px solid #EBEBEB; border-radius: 16px; margin-bottom: 20px; }
  .as-card-head { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid #F3F4F6; }
  .as-card-icon { width: 32px; height: 32px; border-radius: 14px; background: #F7F7F7; border: 1px solid #EBEBEB; display: flex; align-items: center; justify-content: center; color: #2492EB; flex-shrink: 0; }
  .as-card-title { margin: 0; font-size: 14px; font-weight: 700; color: #2B2B2C; }
  .as-card-desc { margin: 2px 0 0; font-size: 11px; color: #99A1AF; }
  .as-card-body { padding: 0 24px; }

  .as-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 32px; padding: 16px 0; border-bottom: 1px solid #F3F4F6; }
  .as-row:last-child { border-bottom: none; }
  .as-row-label { max-width: 260px; padding-top: 2px; }
  .as-row-label-title { margin: 0; font-size: 13px; font-weight: 600; color: #2B2B2C; }
  .as-row-label-help { margin: 4px 0 0; font-size: 11px; line-height: 1.6; color: #99A1AF; }
  .as-row-input { flex-shrink: 0; }
  .as-row-input.wide { width: 240px; }
  .as-input { width: 100%; box-sizing: border-box; height: 36px; padding: 0 12px; border: 1px solid #EBEBEB; border-radius: 14px; font-family: inherit; font-size: 13px; color: #2B2B2C; background: #fff; }
  .as-input.readonly { background: #F3F4F6; color: #99A1AF; font-family: 'SF Mono', Menlo, Consolas, monospace; }
  .as-textarea { width: 100%; box-sizing: border-box; min-height: 100px; padding: 10px 12px; border: 1px solid #EBEBEB; border-radius: 14px; background: #F7F7F7; font-family: inherit; font-size: 13px; color: #2B2B2C; resize: vertical; }

  .as-toggle { position: relative; width: 40px; height: 24px; flex-shrink: 0; }
  .as-toggle input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .as-toggle input:disabled { cursor: not-allowed; }
  .as-toggle-track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; transition: background 0.15s; }
  .as-toggle input:checked + .as-toggle-track { background: #2492EB; }
  .as-toggle input:disabled + .as-toggle-track { opacity: 0.5; }
  .as-toggle-thumb { position: absolute; top: 4px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1); }
  .as-toggle input:checked ~ .as-toggle-thumb { transform: translateX(16px); }
  .as-toggle-row { display: flex; align-items: center; gap: 12px; }
  .as-toggle-label { font-size: 12px; font-weight: 600; }
  .as-toggle-label.on { color: #10B981; }
  .as-toggle-label.off { color: #99A1AF; }

  .as-gateway-badge { display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 36px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; }
  .as-gateway-dot { width: 8px; height: 8px; border-radius: 999px; background: #10B981; }
  .as-gateway-text { font-size: 13px; font-weight: 600; color: #10B981; }
  .as-manage-link { display: flex; align-items: center; gap: 6px; padding: 12px 0; font-size: 12px; font-weight: 600; color: #2492EB; text-decoration: none; }

  .as-cert-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; padding: 16px 0; }
  .as-cert-card { position: relative; border: 2px solid #EBEBEB; border-radius: 14px; overflow: hidden; cursor: pointer; background: #fff; text-align: left; padding: 0; }
  .as-cert-card.selected { border-color: #2492EB; box-shadow: 0 4px 6px -1px rgba(36,146,235,0.1), 0 2px 4px -2px rgba(36,146,235,0.1); }
  .as-cert-swatch { height: 64px; display: flex; align-items: center; justify-content: center; }
  .as-cert-swatch.classic_parchment { background: linear-gradient(135deg, rgba(233,213,160,0.13), rgba(233,213,160,0.27)); border-bottom: 2px solid rgba(233,213,160,0.19); }
  .as-cert-swatch.modern_minimal { background: linear-gradient(135deg, rgba(36,146,235,0.13), rgba(36,146,235,0.27)); border-bottom: 2px solid rgba(36,146,235,0.19); }
  .as-cert-swatch.corporate_blue { background: linear-gradient(135deg, rgba(43,57,66,0.13), rgba(43,57,66,0.27)); border-bottom: 2px solid rgba(43,57,66,0.19); }
  .as-cert-swatch.vibrant_gradient { background: linear-gradient(135deg, rgba(139,92,246,0.13), rgba(139,92,246,0.27)); border-bottom: 2px solid rgba(139,92,246,0.19); }
  .as-cert-swatch-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .as-cert-check { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 999px; background: #2492EB; display: flex; align-items: center; justify-content: center; }
  .as-cert-label { padding: 8px 12px; font-size: 11px; font-weight: 600; color: #2B2B2C; }
  .as-cert-card.selected .as-cert-label { color: #2492EB; }
  @media (max-width: 780px) { .as-cert-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

  .as-upload-box { width: 240px; height: 64px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 14px; cursor: pointer; }
  .as-upload-box.empty { background: #FAFAFA; border: 2px dashed #D1D5DB; }
  .as-upload-box.filled { background: rgba(233,245,255,0.4); border: 2px dashed #2492EB; }
  .as-upload-text { font-size: 11px; font-weight: 600; }
  .as-upload-box.empty .as-upload-text { color: #99A1AF; }
  .as-upload-box.filled .as-upload-text { color: #2492EB; }

  .as-maint-toggle-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #fff; border: 2px solid #EBEBEB; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; }
  .as-maint-toggle-left { display: flex; align-items: center; gap: 16px; }
  .as-maint-toggle-icon { width: 48px; height: 48px; border-radius: 14px; background: #F7F7F7; display: flex; align-items: center; justify-content: center; color: #99A1AF; flex-shrink: 0; }
  .as-maint-toggle-title { margin: 0; font-size: 16px; font-weight: 700; color: #2B2B2C; }
  .as-maint-toggle-sub { margin: 2px 0 0; font-size: 12px; color: #99A1AF; }

  .as-preview-card-head { padding: 12px 24px; background: #FAFAFA; border-bottom: 1px solid #F3F4F6; font-size: 12px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; color: #99A1AF; }
  .as-preview-body { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 40px 24px; background: #F7F7F7; }
  .as-preview-icon { width: 56px; height: 56px; border-radius: 16px; background: #FEF3C6; display: flex; align-items: center; justify-content: center; color: #FE9A00; }
  .as-preview-title { margin: 0; font-size: 18px; font-weight: 700; color: #2B2B2C; }
  .as-preview-text { margin: 0; max-width: 380px; font-size: 13px; line-height: 1.6; color: #616873; }
  .as-preview-eta { margin: 0; font-size: 12px; font-weight: 600; color: #99A1AF; }
  .as-preview-contact { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #99A1AF; }
  .as-preview-dot { width: 6px; height: 6px; border-radius: 999px; background: #FFB900; }
  .as-preview-contact a { color: #2492EB; text-decoration: none; }

  .as-profile-head { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: #fff; border: 1px solid #EBEBEB; border-radius: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .as-avatar { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #2492EB, #1A7BD4); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 700; flex-shrink: 0; position: relative; }
  .as-avatar-edit { position: absolute; bottom: -4px; right: -4px; width: 24px; height: 24px; border-radius: 10px; background: #2492EB; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; color: #fff; }
  .as-profile-name { margin: 0; font-size: 18px; font-weight: 700; color: #2B2B2C; }
  .as-profile-email { margin: 4px 0 0; font-size: 12px; color: #99A1AF; }
  .as-profile-role { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; margin-top: 8px; background: #E9F5FF; border: 1px solid #BFDBFE; border-radius: 999px; font-size: 11px; font-weight: 600; color: #2492EB; }
  .as-upload-photo-btn { display: flex; align-items: center; gap: 8px; padding: 0 16px; height: 36px; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; font-size: 12px; font-weight: 600; color: #616873; cursor: pointer; margin-left: auto; }

  .as-password-input-wrap { position: relative; width: 240px; }
  .as-password-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #99A1AF; cursor: pointer; padding: 0; }
  .as-password-btn { height: 36px; padding: 0 20px; background: #2492EB; color: #fff; border: none; border-radius: 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
  .as-password-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .as-session-list { display: flex; flex-direction: column; gap: 8px; width: 240px; }
  .as-session-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; }
  .as-session-device { font-size: 11px; font-weight: 600; color: #2B2B2C; }
  .as-session-location { font-size: 10px; color: #99A1AF; margin-top: 1px; }
  .as-session-current { padding: 2px 8px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 999px; font-size: 10px; font-weight: 600; color: #10B981; }
  .as-session-revoke { border: none; background: none; color: #FF6467; font-size: 10px; font-weight: 600; cursor: pointer; }

  .as-loading, .as-error, .as-empty { padding: 3rem 1.5rem; text-align: center; color: #99A1AF; font-size: 0.875rem; }
  .as-error { color: #DC2626; }
  .as-feedback { margin: 16px 24px 0; padding: 10px 14px; border-radius: 10px; font-size: 13px; }
  .as-feedback.success { background: #F0FDF4; color: #10B981; }
  .as-feedback.error { background: #FEF2F2; color: #DC2626; }
  .as-feedback.info { background: #F7F7F7; color: #616873; }

  @media (max-width: 900px) {
    .as-body { flex-direction: column; }
    .as-nav { width: 100%; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid #EBEBEB; }
    .as-content { padding: 0 16px 16px; }
    .as-content-inner { padding: 16px 0 0; }
    .as-row { flex-direction: column; align-items: stretch; gap: 8px; }
    .as-row-input.wide, .as-password-input-wrap, .as-session-list { width: 100%; }
    .as-cert-grid { grid-template-columns: 1fr; }
  }
`

const SECTION_ICONS: Record<string, typeof SettingsIcon> = {
  general: SettingsIcon,
  profile: User,
  payment: CreditCard,
  notifications: Bell,
  certificates: Award,
  maintenance: Wrench,
}

const NAV_ORDER = ['general', 'profile', 'payment', 'notifications', 'certificates', 'maintenance']

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeToInputValue(v: string | null): string {
  return v ? v.slice(0, 5) : ''
}
function inputValueToTime(v: string): string {
  return v ? `${v}:00` : ''
}
function isoToDatetimeLocal(v: string | null): string {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function datetimeLocalToIso(v: string): string {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}
function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
function apiErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message)
  return 'Something went wrong. Please try again.'
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [values, setValues] = useState<SystemSettings | null>(null)
  const [dirty, setDirty] = useState<PatchedSystemSettings>({})
  const [activeName, setActiveName] = useState<string>('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const res = await adminSettingsAPI.getSettings()
      if (res.success) setValues(res.data)
      else setError(res.error)
      setLoading(false)
    }
    load()
  }, [])

  function currentValue<K extends keyof SystemSettings>(key: K): SystemSettings[K] | undefined {
    if (!values) return undefined
    return (key in dirty ? (dirty as Record<string, unknown>)[key] : values[key]) as SystemSettings[K]
  }

  function handleFieldChange<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setDirty((prev) => ({ ...prev, [key]: value }))
    setFeedback(null)
    setJustSaved(false)
  }

  function isQuietHoursIncomplete(): boolean {
    if (!currentValue('enable_quiet_hours')) return false
    return !currentValue('quiet_hours_from') || !currentValue('quiet_hours_until')
  }

  async function handleSave() {
    if (Object.keys(dirty).length === 0 || activeName === 'profile') return
    if (isQuietHoursIncomplete()) {
      setFeedback({ type: 'error', text: 'Set both quiet-hours times before saving, or turn quiet hours off.' })
      return
    }
    setSaving(true)
    setFeedback(null)
    const result = await adminSettingsAPI.updateSettings({ ...dirty })
    setSaving(false)
    if (result.success) {
      setValues(result.data)
      setDirty({})
      setFeedback({ type: 'success', text: 'Settings saved.' })
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2000)
    } else if (result.error === NO_OP_ERROR_MESSAGE) {
      setFeedback({ type: 'info', text: 'No changes to save.' })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
  }

  const isDirty = Object.keys(dirty).length > 0
  const activeSection = SETTINGS_SECTIONS.find((s: SectionConfig) => s.name === activeName) ?? null

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="as-page">
        <div className="as-header">
          <div>
            <h1 className="as-title">System Configuration</h1>
            <p className="as-subtitle">Global platform settings — changes apply to all users</p>
          </div>
          {activeName !== 'profile' && (
            <button className={`as-save-btn${justSaved ? ' saved' : ''}`} type="button" onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? <Loader2 size={14} className="as-spin" /> : <Check size={14} />}
              {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save changes'}
            </button>
          )}
        </div>

        {loading && <div className="as-loading">Loading settings…</div>}
        {!loading && error && <div className="as-error">{error}</div>}

        {!loading && !error && values && (
          <div className="as-body">
            <div className="as-nav">
              {NAV_ORDER.map((name) => {
                const Icon = SECTION_ICONS[name] ?? SettingsIcon
                const label = name === 'profile' ? 'Profile' : SETTINGS_SECTIONS.find((s: SectionConfig) => s.name === name)?.label ?? name
                return (
                  <button
                    key={name}
                    className={`as-nav-btn${name === activeName ? ' active' : ''}`}
                    onClick={() => setActiveName(name)}
                    type="button"
                  >
                    <Icon size={14} /> {label}
                  </button>
                )
              })}
            </div>

            <div className="as-content">
              <div className="as-content-inner">
                {feedback && activeName !== 'profile' && (
                  <div className={`as-feedback ${feedback.type}`} style={{ margin: '0 0 20px' }}>{feedback.text}</div>
                )}

                {activeName === 'profile' ? (
                  <ProfilePanel />
                ) : activeName === 'maintenance' ? (
                  <MaintenancePanel
                    currentValue={currentValue}
                    onChange={handleFieldChange}
                  />
                ) : activeSection ? (
                  activeSection.groups.map((group: FieldGroup) => (
                    <GroupCard
                      key={group.title}
                      group={group}
                      currentValue={currentValue}
                      onChange={handleFieldChange}
                    />
                  ))
                ) : (
                  <div className="as-empty">No settings section selected.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

// ─── Generic group card (General / Payment / Notifications / Certificates) ─

function GroupCard({
  group, currentValue, onChange,
}: {
  group: FieldGroup
  currentValue: <K extends keyof SystemSettings>(key: K) => SystemSettings[K] | undefined
  onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void
}) {
  const Icon = SECTION_ICONS[group.title.toLowerCase().split(' ')[0]] ?? SettingsIcon

  return (
    <div className="as-card">
      <div className="as-card-head">
        <div className="as-card-icon"><Icon size={15} /></div>
        <div>
          <p className="as-card-title">{group.title}</p>
          {group.description && <p className="as-card-desc">{group.description}</p>}
        </div>
      </div>
      <div className="as-card-body">
        {group.title === 'Payment Gateway' ? (
          <PaymentGatewayGroup currentValue={currentValue} />
        ) : (
          group.fields
            .filter((f: FieldConfig) => !f.showIf || Boolean(currentValue(f.showIf)))
            .map((field: FieldConfig) => (
              <FieldRow key={field.key} field={field} value={currentValue(field.key)} onChange={(v) => onChange(field.key, v as never)} />
            ))
        )}
      </div>
    </div>
  )
}

function PaymentGatewayGroup({ currentValue }: { currentValue: <K extends keyof SystemSettings>(key: K) => SystemSettings[K] | undefined }) {
  return (
    <>
      <div className="as-row">
        <div className="as-row-label">
          <p className="as-row-label-title">Gateway</p>
          <p className="as-row-label-help">Active payment processor for all transactions</p>
        </div>
        <div className="as-gateway-badge">
          <span className="as-gateway-dot" />
          <span className="as-gateway-text">Paystack — Live</span>
        </div>
      </div>
      <div className="as-row">
        <div className="as-row-label">
          <p className="as-row-label-title">Public key</p>
          <p className="as-row-label-help">Used client-side to initialise payment widgets</p>
        </div>
        <div className="as-row-input wide">
          <input className="as-input readonly" readOnly value={(currentValue('paystack_public_key') as string) || '—'} />
        </div>
      </div>
      <div className="as-row">
        <div className="as-row-label">
          <p className="as-row-label-title">Secret key</p>
          <p className="as-row-label-help">Server-side only — never exposed to learners</p>
        </div>
        <div className="as-row-input wide">
          <input className="as-input readonly" readOnly value={(currentValue('paystack_secret_key') as string) || '—'} />
        </div>
      </div>
      <div className="as-row">
        <div className="as-row-label">
          <p className="as-row-label-title">Webhook secret</p>
          <p className="as-row-label-help">Used to verify incoming Paystack event signatures</p>
        </div>
        <div className="as-row-input wide">
          <input className="as-input readonly" readOnly value={(currentValue('paystack_webhook_secret') as string) || '—'} />
        </div>
      </div>
      <a className="as-manage-link" href={PAYSTACK_DASHBOARD_URL} target="_blank" rel="noreferrer">
        <ExternalLink size={13} /> Manage credentials in Paystack dashboard
      </a>
    </>
  )
}

function FieldRow({ field, value, onChange }: { field: FieldConfig; value: unknown; onChange: (v: unknown) => void }) {
  if (field.type === 'certificate_grid') {
    return (
      <div className="as-cert-grid">
        {CERTIFICATE_TEMPLATES.map((tpl: SelectOption) => (
          <button
            key={tpl.value}
            type="button"
            className={`as-cert-card${value === tpl.value ? ' selected' : ''}`}
            onClick={() => onChange(tpl.value)}
          >
            <div className={`as-cert-swatch ${tpl.value}`}>
              <div className="as-cert-swatch-icon" style={{ background: 'rgba(255,255,255,0.5)' }}>
                <Award size={16} />
              </div>
            </div>
            {value === tpl.value && <span className="as-cert-check"><Check size={10} color="#fff" /></span>}
            <div className="as-cert-label">{tpl.label}</div>
          </button>
        ))}
      </div>
    )
  }

  if (field.type === 'file') {
    return (
      <div className="as-row">
        <div className="as-row-label">
          <p className="as-row-label-title">{field.label}</p>
          {field.help && <p className="as-row-label-help">{field.help}</p>}
        </div>
        <FileUploadField currentUrl={(value as string) || ''} onChange={onChange} />
      </div>
    )
  }

  return (
    <div className="as-row">
      <div className="as-row-label">
        <p className="as-row-label-title">{field.label}</p>
        {field.help && <p className="as-row-label-help">{field.help}</p>}
      </div>

      {field.type === 'boolean' ? (
        <div className="as-toggle-row">
          {field.showOnOffLabel && (
            <span className={`as-toggle-label ${value ? 'on' : 'off'}`}>{value ? 'On' : 'Off'}</span>
          )}
          <label className="as-toggle">
            <input type="checkbox" checked={Boolean(value)} disabled={field.disabled} onChange={(e) => onChange(e.target.checked)} />
            <span className="as-toggle-track" />
            <span className="as-toggle-thumb" />
          </label>
        </div>
      ) : field.type === 'select' ? (
        <div className="as-row-input wide">
          <select className="as-input" value={(value as string) || ''} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((opt: SelectOption) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      ) : field.type === 'number' ? (
        <div className="as-row-input wide">
          <input className="as-input" type="number" min={field.min} max={field.max} step={field.step ?? 1}
            value={value == null ? '' : Number(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
        </div>
      ) : field.type === 'time' ? (
        <div className="as-row-input wide">
          <input className="as-input" type="time" value={timeToInputValue(value as string)} onChange={(e) => onChange(inputValueToTime(e.target.value))} />
        </div>
      ) : (
        <div className="as-row-input wide">
          <input className="as-input" type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </div>
  )
}

function FileUploadField({ currentUrl, onChange: _onChange }: { currentUrl: string; onChange: (url: string) => void }) {
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  async function handleFile(file: File) {
    setLocalPreview(URL.createObjectURL(file))
    // TODO: no upload endpoint is documented for signature images — wire this
    // to whatever media-upload route your backend exposes, then call
    // onChange(uploadedUrl). Left unwired until that's confirmed.
    console.warn('Signature upload endpoint not wired yet — selected file was not uploaded.', file.name)
  }

  const filled = Boolean(localPreview || currentUrl)

  return (
    <label className={`as-upload-box ${filled ? 'filled' : 'empty'}`}>
      <input type="file" accept="image/png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <Upload size={14} color={filled ? '#2492EB' : '#99A1AF'} />
      <span className="as-upload-text">{filled ? 'signature.png' : 'Upload signature'}</span>
    </label>
  )
}

// ─── Maintenance panel (fully custom layout) ───────────────────────────────

function MaintenancePanel({
  currentValue, onChange,
}: {
  currentValue: <K extends keyof SystemSettings>(key: K) => SystemSettings[K] | undefined
  onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void
}) {
  const isOn = Boolean(currentValue('maintenance_mode'))
  const message = (currentValue('maintenance_scheduled_message') as string) || ''
  const endTime = currentValue('maintenance_expected_end_time') as string | null

  return (
    <>
      <div className="as-maint-toggle-card">
        <div className="as-maint-toggle-left">
          <div className="as-maint-toggle-icon"><AlertTriangle size={22} /></div>
          <div>
            <p className="as-maint-toggle-title">Maintenance mode</p>
            <p className="as-maint-toggle-sub">
              {isOn ? 'Non-admin users currently see a 503 page. Admin settings remain reachable.' : 'Platform is live and accessible to all users.'}
            </p>
          </div>
        </div>
        <label className="as-toggle">
          <input type="checkbox" checked={isOn} onChange={(e) => onChange('maintenance_mode', e.target.checked as never)} />
          <span className="as-toggle-track" />
          <span className="as-toggle-thumb" />
        </label>
      </div>

      {isOn && (
        <>
          <div className="as-card">
            <div className="as-card-head">
              <div className="as-card-icon"><Wrench size={15} /></div>
              <div>
                <p className="as-card-title">Scheduled message</p>
                <p className="as-card-desc">Shown on the maintenance screen that learners and trainers see</p>
              </div>
            </div>
            <div className="as-card-body">
              <div className="as-row">
                <div className="as-row-label">
                  <p className="as-row-label-title">Message body</p>
                  <p className="as-row-label-help">Plain text — keep it friendly and informative</p>
                </div>
                <div style={{ width: 340 }}>
                  <textarea className="as-textarea" value={message} onChange={(e) => onChange('maintenance_scheduled_message', e.target.value as never)} />
                </div>
              </div>
              <div className="as-row">
                <div className="as-row-label">
                  <p className="as-row-label-title">Expected end time</p>
                  <p className="as-row-label-help">Displayed to users so they know when to return</p>
                </div>
                <div style={{ width: 300 }}>
                  <input className="as-input" type="datetime-local" value={isoToDatetimeLocal(endTime)} onChange={(e) => onChange('maintenance_expected_end_time', datetimeLocalToIso(e.target.value) as never)} />
                </div>
              </div>
            </div>
          </div>

          <div className="as-card">
            <div className="as-preview-card-head">Maintenance screen preview</div>
            <div className="as-preview-body">
              <div className="as-preview-icon"><AlertTriangle size={26} /></div>
              <p className="as-preview-title">TGPL — The Global Project Leaders</p>
              <p className="as-preview-text">{message || 'The platform is currently undergoing scheduled maintenance. We\u2019ll back shortly — thank you for your patience.'}</p>
              {endTime && <p className="as-preview-eta">Expected back: {new Date(endTime).toLocaleString()}</p>}
              <div className="as-preview-contact">
                <span className="as-preview-dot" />
                Need help? Contact <a href="mailto:support@tgpl.academy">support@tgpl.academy</a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}


// ─── Profile panel (unconfirmed backend — see adminSettingsApi.ts comment) ──
 
function ProfilePanel() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [sessions, setSessions] = useState<AdminSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwFeedback, setPwFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const [profileRes, sessionsRes] = await Promise.all([adminProfileAPI.getProfile(), adminProfileAPI.getSessions()])
      if (cancelled) return
      if (profileRes.success) setProfile(profileRes.data)
      else setError(profileRes.error)
      if (sessionsRes.success) setSessions(sessionsRes.data)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])
 
  const pwValid = currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw
 
  async function handleChangePassword() {
    if (!pwValid) return
    setPwSaving(true)
    setPwFeedback(null)
    const res = await adminProfileAPI.changePassword({ current_password: currentPw, new_password: newPw })
    setPwSaving(false)
    if (res.success) { setPwFeedback({ type: 'success', text: 'Password updated.' }); setCurrentPw(''); setNewPw(''); setConfirmPw('') }
    else setPwFeedback({ type: 'error', text: apiErrorMessage(res.error) })
  }
 
  async function handleToggle2FA(enabled: boolean) {
    if (!profile) return
    setProfile({ ...profile, two_factor_enabled: enabled })
    const res = await adminProfileAPI.setTwoFactor(enabled)
    if (!res.success) setProfile({ ...profile, two_factor_enabled: !enabled })
  }
 
  async function handleRevoke(sessionId: string) {
    const prev = sessions
    setSessions((s) => s.filter((sess) => sess.id !== sessionId))
    const res = await adminProfileAPI.revokeSession(sessionId)
    if (!res.success) setSessions(prev)
  }
 
  if (loading) return <div className="as-loading">Loading profile…</div>
  if (error || !profile) return <div className="as-error">{error || 'Could not load profile.'}</div>
 
  return (
    <>
      <div className="as-unavailable-banner" style={{ margin: '0 0 20px' }}>
        <Lock size={13} /> The Profile tab's endpoints aren't confirmed against the backend yet — actions here may not persist.
      </div>
 
      <div className="as-profile-head">
        <div className="as-avatar">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} /> : initials(profile.full_name)}
          <span className="as-avatar-edit"><Camera size={11} /></span>
        </div>
        <div>
          <p className="as-profile-name">{profile.full_name}</p>
          <p className="as-profile-email">{profile.email}</p>
          <span className="as-profile-role"><ShieldCheck size={10} /> {profile.role}</span>
        </div>
        <button className="as-upload-photo-btn" type="button"><Camera size={13} /> Upload photo</button>
      </div>
 
      <div className="as-card">
        <div className="as-card-head">
          <div className="as-card-icon"><User size={15} /></div>
          <div><p className="as-card-title">Personal information</p><p className="as-card-desc">Your name and contact details visible to the platform</p></div>
        </div>
        <div className="as-card-body">
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Full name</p><p className="as-row-label-help">Displayed in admin activity logs and certificates</p></div>
            <div className="as-row-input wide"><input className="as-input" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
          </div>
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Email address</p><p className="as-row-label-help">Used for login and all admin notifications</p></div>
            <div className="as-row-input wide"><input className="as-input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></div>
          </div>
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Phone number</p><p className="as-row-label-help">Used for 2FA and urgent account alerts</p></div>
            <div className="as-row-input wide"><input className="as-input" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
          </div>
        </div>
      </div>
 
      <div className="as-card">
        <div className="as-card-head">
          <div className="as-card-icon"><ShieldCheck size={15} /></div>
          <div><p className="as-card-title">Change password</p><p className="as-card-desc">Use a strong, unique password not used on other services</p></div>
        </div>
        <div className="as-card-body">
          {pwFeedback && <div className={`as-feedback ${pwFeedback.type}`} style={{ margin: '12px 0 0' }}>{pwFeedback.text}</div>}
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Current password</p><p className="as-row-label-help">Required to authorise any password change</p></div>
            <PasswordInput value={currentPw} onChange={setCurrentPw} show={showPw} onToggleShow={() => setShowPw((s) => !s)} placeholder="Enter current password" />
          </div>
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">New password</p><p className="as-row-label-help">Minimum 8 characters with uppercase, number and symbol</p></div>
            <PasswordInput value={newPw} onChange={setNewPw} show={showPw} onToggleShow={() => setShowPw((s) => !s)} placeholder="New password" />
          </div>
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Confirm new password</p><p className="as-row-label-help">Must match the new password exactly</p></div>
            <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showPw} onToggleShow={() => setShowPw((s) => !s)} placeholder="Confirm new password" />
          </div>
          <div className="as-row" style={{ borderBottom: 'none' }}>
            <div />
            <button className="as-password-btn" type="button" disabled={!pwValid || pwSaving} onClick={handleChangePassword}>{pwSaving ? 'Updating…' : 'Update password'}</button>
          </div>
        </div>
      </div>
 
      <div className="as-card">
        <div className="as-card-head">
          <div className="as-card-icon"><ShieldCheck size={15} /></div>
          <div><p className="as-card-title">Security</p><p className="as-card-desc">Two-factor authentication and session management</p></div>
        </div>
        <div className="as-card-body">
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Two-factor authentication</p><p className="as-row-label-help">Adds an OTP step via SMS or authenticator app on every login</p></div>
            <div className="as-toggle-row">
              <span className={`as-toggle-label ${profile.two_factor_enabled ? 'on' : 'off'}`}>{profile.two_factor_enabled ? 'Enabled' : 'Disabled'}</span>
              <label className="as-toggle">
                <input type="checkbox" checked={profile.two_factor_enabled} onChange={(e) => handleToggle2FA(e.target.checked)} />
                <span className="as-toggle-track" />
                <span className="as-toggle-thumb" />
              </label>
            </div>
          </div>
          <div className="as-row">
            <div className="as-row-label"><p className="as-row-label-title">Session timeout</p><p className="as-row-label-help">Automatically log out after this period of inactivity</p></div>
            <div className="as-row-input wide">
              <select className="as-input" value={String(profile.session_timeout_minutes)} onChange={(e) => { const m = Number(e.target.value); setProfile({ ...profile, session_timeout_minutes: m }); adminProfileAPI.setSessionTimeout(m) }}>
                {SESSION_TIMEOUT_OPTIONS.map((opt: SelectOption) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
          <div className="as-row" style={{ borderBottom: 'none' }}>
            <div className="as-row-label"><p className="as-row-label-title">Active sessions</p><p className="as-row-label-help">Devices currently logged into your admin account</p></div>
            <div className="as-session-list">
              {sessions.map((s) => (
                <div className="as-session-item" key={s.id}>
                  <div><div className="as-session-device">{s.device_label}</div><div className="as-session-location">{s.location}</div></div>
                  {s.is_current ? <span className="as-session-current">This device</span> : <button className="as-session-revoke" type="button" onClick={() => handleRevoke(s.id)}>Revoke</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
function PasswordInput({
  value, onChange, show, onToggleShow, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  placeholder: string
}) {
  return (
    <div className="as-password-input-wrap">
      <input
        className="as-input"
        style={{ paddingRight: 36 }}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="button" className="as-password-toggle" onClick={onToggleShow} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}