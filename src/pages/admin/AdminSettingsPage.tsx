import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, User, Shield, CreditCard, Bell, Award, Wrench, Check } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminSettingsAPI } from '../../services/adminSettingsApi'
import type { SettingsSectionMeta, SystemSettings, PatchedSystemSettings } from '../../types/adminSettings'
import { READONLY_SETTINGS_KEYS, EMAIL_PROVIDER_OPTIONS } from '../../types/adminSettings'

const PAGE_CSS = `
  .as-page { display: flex; flex-direction: column; background: #F7F7F7; }
  .as-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: #F7F7F7; border-bottom: 1px solid #EBEBEB; gap: 1rem; flex-wrap: wrap; }
  .as-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #2B2B2C; }
  .as-subtitle { margin: 0.25rem 0 0; font-size: 0.75rem; color: #99A1AF; }
  .as-header-right { display: flex; align-items: center; gap: 0.6rem; }
  .as-reason-input { border: 1px solid #EBEBEB; border-radius: 12px; padding: 0.5rem 0.85rem; font-size: 0.78rem; font-family: inherit; min-width: 220px; }
  .as-save-btn { display: flex; align-items: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none; border-radius: 14px; padding: 0.6rem 1.25rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .as-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .as-body { display: flex; align-items: flex-start; padding: 0 1.5rem 1.5rem; }
  .as-nav { width: 196px; flex-shrink: 0; background: #fff; border-right: 1px solid #EBEBEB; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
  .as-nav-btn { display: flex; align-items: center; gap: 10px; padding: 0 12px; height: 36px; border-radius: 14px; border: none; background: none; color: #616873; font-family: inherit; font-size: 0.8125rem; font-weight: 600; cursor: pointer; text-align: left; }
  .as-nav-btn.active { background: #E9F5FF; color: #2492EB; }

  .as-panel { flex: 1; background: #fff; border: 1px solid #EBEBEB; border-left: none; min-width: 0; }
  .as-panel-head { display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-bottom: 1px solid #F3F4F6; }
  .as-panel-icon { width: 32px; height: 32px; border-radius: 14px; background: #F7F7F7; border: 1px solid #EBEBEB; display: flex; align-items: center; justify-content: center; color: #2492EB; flex-shrink: 0; }
  .as-panel-title { margin: 0; font-size: 0.875rem; font-weight: 700; color: #2B2B2C; }
  .as-panel-meta { margin: 2px 0 0; font-size: 0.6875rem; color: #99A1AF; }

  .as-fields { padding: 0 24px; }
  .as-row { display: flex; align-items: center; gap: 32px; padding: 16px 0; border-bottom: 1px solid #F3F4F6; }
  .as-row:last-child { border-bottom: none; }
  .as-row-label { width: 260px; max-width: 260px; flex-shrink: 0; }
  .as-row-label-title { margin: 0; font-size: 0.8125rem; font-weight: 600; color: #2B2B2C; }
  .as-row-input { flex: 1; min-width: 0; }
  .as-input { width: 100%; box-sizing: border-box; padding: 8px 12px; height: 36px; background: #fff; border: 1px solid #EBEBEB; border-radius: 14px; font-family: inherit; font-size: 0.8125rem; color: #2B2B2C; }
  .as-readonly-value { font-size: 0.8125rem; color: #99A1AF; }

  .as-color-row { display: flex; align-items: center; gap: 0.6rem; }
  .as-color-swatch { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #EBEBEB; padding: 0; cursor: pointer; }

  .as-toggle { position: relative; width: 40px; height: 22px; flex-shrink: 0; }
  .as-toggle input { position: absolute; opacity: 0; width: 100%; height: 100%; margin: 0; cursor: pointer; }
  .as-toggle-track { position: absolute; inset: 0; background: #E5E7EB; border-radius: 999px; transition: background 0.15s; }
  .as-toggle input:checked + .as-toggle-track { background: #2492EB; }
  .as-toggle-thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
  .as-toggle input:checked ~ .as-toggle-thumb { transform: translateX(18px); }

  .as-loading, .as-error, .as-empty { padding: 3rem 1.5rem; text-align: center; color: #99A1AF; font-size: 0.875rem; }
  .as-error { color: #DC2626; }
  .as-feedback { margin: 1rem 24px 0; padding: 0.6rem 0.85rem; border-radius: 0.6rem; font-size: 0.8rem; }
  .as-feedback.success { background: #F0FDF4; color: #10B981; }
  .as-feedback.error { background: #FEF2F2; color: #DC2626; }

  @media (max-width: 900px) {
    .as-body { flex-direction: column; }
    .as-nav { width: 100%; flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid #EBEBEB; }
    .as-panel { border-left: 1px solid #EBEBEB; }
    .as-row { flex-direction: column; align-items: flex-start; gap: 8px; }
    .as-row-label { width: 100%; max-width: none; }
    .as-header-right { width: 100%; }
    .as-reason-input { flex: 1; min-width: 0; }
  }
`

const SECTION_ICONS: Record<string, typeof SettingsIcon> = {
  general: SettingsIcon,
  profile: User,
  security: Shield,
  payment: CreditCard,
  notifications: Bell,
  certificates: Award,
  maintenance: Wrench,
}

function iconFor(name: string) {
  return SECTION_ICONS[name.toLowerCase()] ?? SettingsIcon
}

// Sections only give us field keys — no per-field label/type — so both are inferred here.
function humanizeLabel(key: string) {
  const words = key.split('_').map((w) => (w === 'url' || w === 'id' ? w.toUpperCase() : w))
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + (words.length > 1 ? ' ' + words.slice(1).join(' ') : '')
}

type FieldKind = 'boolean' | 'number' | 'color' | 'email' | 'select' | 'text' | 'readonly'

function inferKind(key: string, currentValue: unknown): FieldKind {
  if ((READONLY_SETTINGS_KEYS as readonly string[]).includes(key)) return 'readonly'
  if (key === 'email_provider') return 'select'
  if (typeof currentValue === 'boolean') return 'boolean'
  if (typeof currentValue === 'number') return 'number'
  if (key.includes('color')) return 'color'
  if (key.includes('email')) return 'email'
  return 'text'
}

export default function AdminSettingsPage() {
  const [sections, setSections] = useState<SettingsSectionMeta[]>([])
  const [values, setValues] = useState<SystemSettings | null>(null)
  const [dirty, setDirty] = useState<PatchedSystemSettings>({})
  const [reason, setReason] = useState('')
  const [activeName, setActiveName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const [sectionsResult, valuesResult] = await Promise.all([
        adminSettingsAPI.getSections(),
        adminSettingsAPI.getSettings(),
      ])
      if (sectionsResult.success) {
        setSections(sectionsResult.data.sections)
        setActiveName(sectionsResult.data.sections[0]?.name ?? null)
      } else {
        setError(sectionsResult.error)
      }
      if (valuesResult.success) setValues(valuesResult.data)
      else if (!sectionsResult.success) setError((prev) => prev ?? valuesResult.error)
      setLoading(false)
    }
    load()
  }, [])

  function handleFieldChange<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setDirty((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (Object.keys(dirty).length === 0) return
    setSaving(true)
    setFeedback(null)
    const payload: PatchedSystemSettings = { ...dirty }
    if (reason.trim()) payload.reason = reason.trim()
    const result = await adminSettingsAPI.updateSettings(payload)
    setSaving(false)
    if (result.success) {
      setValues(result.data)
      setDirty({})
      setReason('')
      setFeedback({ type: 'success', text: 'Settings saved.' })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
  }

  const activeSection = sections.find((s) => s.name === activeName) ?? null
  const isDirty = Object.keys(dirty).length > 0

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="as-page">
        <div className="as-header">
          <div>
            <h1 className="as-title">System Configuration</h1>
            <p className="as-subtitle">Global platform settings — changes apply to all users</p>
          </div>
          <div className="as-header-right">
            {isDirty && (
              <input
                className="as-reason-input"
                placeholder="Reason for change (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
            <button className="as-save-btn" type="button" onClick={handleSave} disabled={!isDirty || saving}>
              <Check size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>

        {loading && <div className="as-loading">Loading settings…</div>}
        {!loading && error && <div className="as-error">{error}</div>}

        {!loading && !error && values && (
          <div className="as-body">
            <div className="as-nav">
              {sections.map((section) => {
                const Icon = iconFor(section.name)
                return (
                  <button
                    key={section.name}
                    className={`as-nav-btn${section.name === activeName ? ' active' : ''}`}
                    onClick={() => setActiveName(section.name)}
                    type="button"
                  >
                    <Icon size={14} /> {section.label}
                  </button>
                )
              })}
            </div>

            <div className="as-panel">
              {activeSection ? (
                <>
                  <div className="as-panel-head">
                    <div className="as-panel-icon">
                      {(() => {
                        const Icon = iconFor(activeSection.name)
                        return <Icon size={15} />
                      })()}
                    </div>
                    <div>
                      <p className="as-panel-title">{activeSection.label}</p>
                      <p className="as-panel-meta">Last updated {values.updated_at ? new Date(values.updated_at).toLocaleString() : '—'} by {values.updated_by_name || '—'}</p>
                    </div>
                  </div>

                  {feedback && <div className={`as-feedback ${feedback.type}`}>{feedback.text}</div>}

                  <div className="as-fields">
                    {activeSection.fields.map((key) => {
                      const currentValue = values[key]
                      const kind = inferKind(key, currentValue)
                      const value = (dirty as Record<string, unknown>)[key] ?? currentValue

                      return (
                        <div className="as-row" key={key}>
                          <div className="as-row-label">
                            <p className="as-row-label-title">{humanizeLabel(key)}</p>
                          </div>
                          <div className="as-row-input">
                            {kind === 'readonly' ? (
                              <span className="as-readonly-value">{String(value ?? '—')}</span>
                            ) : kind === 'boolean' ? (
                              <label className="as-toggle">
                                <input
                                  type="checkbox"
                                  checked={Boolean(value)}
                                  onChange={(e) => handleFieldChange(key, e.target.checked as SystemSettings[typeof key])}
                                />
                                <span className="as-toggle-track" />
                                <span className="as-toggle-thumb" />
                              </label>
                            ) : kind === 'number' ? (
                              <input
                                className="as-input"
                                type="number"
                                value={value == null ? '' : Number(value)}
                                onChange={(e) => handleFieldChange(key, Number(e.target.value) as SystemSettings[typeof key])}
                              />
                            ) : kind === 'color' ? (
                              <div className="as-color-row">
                                <input
                                  className="as-color-swatch"
                                  type="color"
                                  value={(value as string) || '#000000'}
                                  onChange={(e) => handleFieldChange(key, e.target.value as SystemSettings[typeof key])}
                                />
                                <input
                                  className="as-input"
                                  type="text"
                                  value={(value as string) || ''}
                                  onChange={(e) => handleFieldChange(key, e.target.value as SystemSettings[typeof key])}
                                />
                              </div>
                            ) : kind === 'select' ? (
                              <select
                                className="as-input"
                                value={(value as string) || ''}
                                onChange={(e) => handleFieldChange(key, e.target.value as SystemSettings[typeof key])}
                              >
                                {EMAIL_PROVIDER_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                className="as-input"
                                type={kind === 'email' ? 'email' : 'text'}
                                value={(value as string) ?? ''}
                                onChange={(e) => handleFieldChange(key, e.target.value as SystemSettings[typeof key])}
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="as-empty">No settings sections available.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}