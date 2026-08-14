export type EmailProviderEnum = 'resend' | 'sendgrid' | 'postmark'

export const EMAIL_PROVIDER_OPTIONS: { value: EmailProviderEnum; label: string }[] = [
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'postmark', label: 'Postmark' },
]

export interface SystemSettings {
  platform_name: string
  platform_url: string
  support_email: string
  max_concurrent_users: number
  email_provider: EmailProviderEnum
  email_from_name: string
  email_from_address: string
  enable_live_sessions: boolean
  enable_tutor_booking: boolean
  enable_assignments: boolean
  enable_certificates: boolean
  enable_notifications_email: boolean
  enable_notifications_inapp: boolean
  enable_refunds: boolean
  inactivity_threshold_days: number
  assignment_late_threshold_hours: number
  primary_color: string
  secondary_color: string
  logo_url: string | null
  favicon_url: string | null
  updated_at: string
  updated_by_name: string
}

export const READONLY_SETTINGS_KEYS = ['updated_at', 'updated_by_name'] as const

// Partial update body — any subset of editable fields, plus an optional audit reason.
export type PatchedSystemSettings = Partial<Omit<SystemSettings, 'updated_at' | 'updated_by_name'>> & {
  reason?: string
}

// Sections endpoint returns field *keys* only (no per-field label/type) — the frontend
// infers label/input type from the key name and the value's runtime type.
export interface SettingsSectionMeta {
  name: string
  label: string
  fields: (keyof SystemSettings)[]
}

export interface SettingsSectionsResponse {
  sections: SettingsSectionMeta[]
}

export interface SettingsAuditEntry {
  id: string
  field_name: string
  changed_by: string
  changed_at: string
  old_value: string
  new_value: string
  reason: string
}

export interface PaginatedSettingsAuditEntryList {
  count: number
  next: string | null
  previous: string | null
  results: SettingsAuditEntry[]
}

export interface SettingsAuditLogParams {
  changed_by?: string
  field_name?: string
  page?: number
  page_size?: number
}