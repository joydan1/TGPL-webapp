// types/adminSettings.ts
//
// Field availability:
// Every FieldConfig carries `available`. `true` means the key exists on the
// real backend schema (GET/PATCH /api/v1/admin/settings/, confirmed against
// Swagger on 2026-08-18). `false` means the field only exists in the Figma
// design / the (stale) JOY_COMPLETE_ADMIN_SETTINGS_GUIDE.md — it renders
// disabled with a "Not available yet" badge and is NEVER included in the
// PATCH payload. Flip to `true` once backend confirms + ships the field.

export interface SystemSettings {
  // ── Confirmed on backend ──────────────────────────────────────────────
  updated_at: string | null
  updated_by_name: string | null

  platform_name: string
  platform_url: string
  support_email: string
  max_concurrent_users: number

  email_provider: string // "resend" | "sendgrid" | "postmark"
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

  // ── NOT confirmed on backend — Figma/guide only, UI renders disabled ──
  default_timezone: string
  locale: string

  paystack_public_key: string
  paystack_secret_key: string
  paystack_webhook_secret: string
  currency: string
  enable_tax: boolean
  tax_label: string
  tax_rate: number

  enable_notifications_sms: boolean
  enable_notifications_slack: boolean
  slack_webhook_url: string
  slack_channel: string
  enable_quiet_hours: boolean
  quiet_hours_from: string | null
  quiet_hours_until: string | null

  certificate_template: string
  certificate_director_signature: string
  certificate_cosignature: string
  certificate_verification_url_prefix: string
  certificate_sample_url: string

  maintenance_mode: boolean
  maintenance_scheduled_message: string
  maintenance_expected_end_time: string | null
}

export type PatchedSystemSettings = Partial<Omit<SystemSettings, 'updated_at' | 'updated_by_name'>> & {
  reason?: string
}

export interface AdminProfile {
  full_name: string
  email: string
  phone: string
  role: string
  avatar_url: string | null
  two_factor_enabled: boolean
  session_timeout_minutes: number
}

export interface AdminSession {
  id: string
  device_label: string
  location: string
  is_current: boolean
}

export interface AuditLogEntry {
  id: string
  field_name: string
  changed_by: string
  changed_at: string
  old_value: string
  new_value: string
  reason: string | null
}

export interface AuditLogPage {
  count: number
  next: string | null
  previous: string | null
  results: AuditLogEntry[]
}

// ── Field-level config ───────────────────────────────────────────────────

export type FieldType =
  | 'text' | 'url' | 'email' | 'phone' | 'password' | 'number' | 'boolean'
  | 'select' | 'time' | 'datetime' | 'textarea' | 'color' | 'certificate_grid' | 'file'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  key: keyof SystemSettings
  label: string
  help?: string
  type: FieldType
  options?: SelectOption[]
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  showIf?: keyof SystemSettings
  showOnOffLabel?: boolean
  /** false = confirmed absent from the live backend schema; renders disabled + badge, never sent in PATCH */
  available: boolean
}

export interface FieldGroup {
  title: string
  description?: string
  fields: FieldConfig[]
  /** Whole-group banner shown once when every field in the group is unavailable */
  unavailableBanner?: string
}

export interface SectionConfig {
  name: string
  label: string
  groups: FieldGroup[]
}

export const EMAIL_PROVIDER_OPTIONS: SelectOption[] = [
  { value: 'resend', label: 'Resend' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'postmark', label: 'Postmark' },
]

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Lagos', label: 'Africa/Lagos' },
  { value: 'Africa/Accra', label: 'Africa/Accra' },
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi' },
  { value: 'Africa/Johannesburg', label: 'Africa/Johannesburg' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
]

export const LOCALE_OPTIONS: SelectOption[] = [
  { value: 'en-NG', label: 'English (Nigeria)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-FR', label: 'French (France)' },
]

export const CURRENCY_OPTIONS: SelectOption[] = [
  { value: 'NGN', label: 'NGN — Nigerian Naira' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export const CERTIFICATE_TEMPLATES: SelectOption[] = [
  { value: 'classic_parchment', label: 'Classic Parchment' },
  { value: 'modern_minimal', label: 'Modern Minimal' },
  { value: 'corporate_blue', label: 'Corporate Blue' },
  { value: 'vibrant_gradient', label: 'Vibrant Gradient' },
]

export const SESSION_TIMEOUT_OPTIONS: SelectOption[] = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '240', label: '4 hours' },
  { value: '1440', label: '24 hours' },
]

export const SETTINGS_SECTIONS: SectionConfig[] = [
  {
    name: 'general',
    label: 'General',
    groups: [
      {
        title: 'General',
        description: 'Core platform identity and regional defaults',
        fields: [
          { key: 'platform_name', label: 'Platform name', help: 'Shown in emails, certificates and the browser tab', type: 'text', available: true },
          { key: 'platform_url', label: 'Platform URL', help: 'The public base URL of the platform', type: 'url', available: true },
          { key: 'support_email', label: 'Support email', help: 'Learners and trainers contact this address for help', type: 'email', available: true },
          { key: 'max_concurrent_users', label: 'Max concurrent users', help: 'Upper bound before new sign-ins are throttled', type: 'number', min: 1, available: true },
          { key: 'default_timezone', label: 'Default timezone', help: 'Used for scheduling, cohorts and notification delivery', type: 'select', options: TIMEZONE_OPTIONS, available: false },
          { key: 'locale', label: 'Locale', help: 'Number and date formatting for the platform', type: 'select', options: LOCALE_OPTIONS, available: false },
        ],
      },
      {
        title: 'Email Configuration',
        description: 'Provider and sender identity for outgoing platform email',
        fields: [
          { key: 'email_provider', label: 'Email provider', type: 'select', options: EMAIL_PROVIDER_OPTIONS, available: true },
          { key: 'email_from_name', label: 'Email from name', type: 'text', available: true },
          { key: 'email_from_address', label: 'Email from address', type: 'email', available: true },
        ],
      },
      {
        title: 'Feature Flags',
        description: 'Global on/off switches for major platform features',
        fields: [
          { key: 'enable_live_sessions', label: 'Enable live sessions', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_tutor_booking', label: 'Enable tutor booking', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_assignments', label: 'Enable assignments', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_certificates', label: 'Enable certificates', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_notifications_email', label: 'Enable email notifications', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_notifications_inapp', label: 'Enable in-app notifications', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_refunds', label: 'Enable refunds', type: 'boolean', disabled: true, showOnOffLabel: true, available: true },
        ],
      },
      {
        title: 'Thresholds & Nudges',
        description: 'Numeric thresholds that drive reminders and nudges',
        fields: [
          { key: 'inactivity_threshold_days', label: 'Inactivity threshold (days)', type: 'number', min: 1, available: true },
          { key: 'assignment_late_threshold_hours', label: 'Assignment late threshold (hours)', type: 'number', min: 0, available: true },
        ],
      },
      {
        title: 'Theme & Branding',
        description: 'Platform-wide colours and logo assets',
        fields: [
          { key: 'primary_color', label: 'Primary color', type: 'color', available: true },
          { key: 'secondary_color', label: 'Secondary color', type: 'color', available: true },
          { key: 'logo_url', label: 'Logo', type: 'file', available: true },
          { key: 'favicon_url', label: 'Favicon', type: 'file', available: true },
        ],
      },
    ],
  },
  {
    name: 'payment',
    label: 'Payment',
    groups: [
      {
        title: 'Payment Gateway',
        description: 'Credentials are read-only here — edit in the Paystack dashboard',
        fields: [], // custom-rendered
        unavailableBanner: "Payment settings aren't available on the backend yet — nothing here is saved.",
      },
      {
        title: 'Currency & Tax',
        description: 'Applies to all course pricing and invoices',
        fields: [
          { key: 'currency', label: 'Currency', type: 'select', options: CURRENCY_OPTIONS, available: false },
          { key: 'enable_tax', label: 'Enable tax', type: 'boolean', available: false },
          { key: 'tax_label', label: 'Tax label', type: 'text', showIf: 'enable_tax', available: false },
          { key: 'tax_rate', label: 'Tax rate (%)', type: 'number', min: 0, max: 100, step: 0.1, showIf: 'enable_tax', available: false },
        ],
      },
    ],
  },
  {
    name: 'notifications',
    label: 'Notifications',
    groups: [
      {
        title: 'Notification channels',
        description: 'Global on/off for each delivery channel',
        fields: [
          { key: 'enable_notifications_email', label: 'Email notifications', help: 'Transactional and marketing emails', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_notifications_sms', label: 'SMS notifications', help: 'OTPs and critical alerts via SMS', type: 'boolean', disabled: true, showOnOffLabel: true, available: false },
          { key: 'enable_notifications_inapp', label: 'In-app notifications', help: 'Bell icon alerts inside the learner and admin portals', type: 'boolean', showOnOffLabel: true, available: true },
          { key: 'enable_notifications_slack', label: 'Slack integration', help: 'Post admin alerts to a configured Slack channel', type: 'boolean', showOnOffLabel: true, available: false },
          { key: 'slack_webhook_url', label: 'Slack webhook URL', type: 'text', showIf: 'enable_notifications_slack', available: false },
          { key: 'slack_channel', label: 'Slack channel', type: 'text', showIf: 'enable_notifications_slack', available: false },
        ],
      },
      {
        title: 'Quiet hours',
        description: 'Suppress non-critical notifications during this window',
        fields: [
          { key: 'enable_quiet_hours', label: 'Enable quiet hours', type: 'boolean', available: false },
          { key: 'quiet_hours_from', label: 'From', type: 'time', showIf: 'enable_quiet_hours', available: false },
          { key: 'quiet_hours_until', label: 'Until', type: 'time', showIf: 'enable_quiet_hours', available: false },
        ],
        unavailableBanner: "Quiet hours aren't available on the backend yet — nothing here is saved.",
      },
    ],
  },
  {
    name: 'certificates',
    label: 'Certificates',
    groups: [
      {
        title: 'Certificate template',
        fields: [{ key: 'certificate_template', label: '', type: 'certificate_grid', available: false }],
        unavailableBanner: "Certificate configuration isn't available on the backend yet — nothing here is saved.",
      },
      {
        title: 'Signatures',
        fields: [
          { key: 'certificate_director_signature', label: 'Director signature', type: 'file', available: false },
          { key: 'certificate_cosignature', label: 'Co-signatory', type: 'file', available: false },
        ],
      },
      {
        title: 'Verification',
        fields: [
          { key: 'certificate_verification_url_prefix', label: 'Verification URL prefix', type: 'url', available: false },
          { key: 'certificate_sample_url', label: 'Sample URL', type: 'url', available: false },
        ],
      },
    ],
  },
  {
    name: 'maintenance',
    label: 'Maintenance',
    groups: [], // fully custom-rendered
  },
]