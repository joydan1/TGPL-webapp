// Types for the admin revenue/payments endpoints (Swagger: admin-revenue tag).

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded'
  | 'abandoned'

export type RefundReason = 'learner_request' | 'duplicate_charge' | 'course_cancelled' | 'other'

export interface LearnerBrief {
  id: string
  email: string
  full_name: string
}

export interface CourseBrief {
  id: string
  title: string
  slug: string
}

export interface TrainerBrief {
  id: string
  full_name: string
}

export interface PaymentEnrollment {
  id: string
  source: string
  status: string
  activated_at: string | null
  access_expires_at: string | null
}

export interface PaymentDetailsInfo {
  payment_method?: string
  reference_id?: string
  channel?: string
  card_type?: string
  last_4_digits?: string
  authorization_url?: string
  bank?: string
  account_name?: string
  ussd_code?: string
  [key: string]: unknown
}

export interface PaymentAuditEntry {
  action: string
  timestamp: string
  actor: string | null
  note: string
}

export interface AdminPaymentRow {
  id: string
  reference: string
  amount_kobo: number
  currency: string
  status: PaymentStatus
  payment_method: string
  learner: LearnerBrief
  course: CourseBrief
  trainer: TrainerBrief
  paid_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminPaymentDetail extends AdminPaymentRow {
  enrollment: PaymentEnrollment | null
  payment_details: PaymentDetailsInfo | null
  audit_log: PaymentAuditEntry[]
  failure_reason: string | null
  refund_reason: string | null
  refund_note: string | null
}

export interface RevenueSummaryData {
  total_revenue_kobo: number
  refunded_amount_kobo: number
  successful_count: number
  pending_count: number
  failed_count: number
  refunded_count: number
  other_count: number
  total_count: number
}

export interface RevenueOverview {
  summary: RevenueSummaryData
  status_breakdown: Record<string, number>
}

export interface AdminPaymentListParams {
  course_id?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
  search?: string
  status?: PaymentStatus | 'all'
  trainer_id?: string
}

export interface PaymentActionResponse {
  status: string
  payment_id: string
  payment_status: string
  changed: boolean
  detail: string
}

export interface ResendConfirmationResponse {
  status: string
  payment_id: string
  sent_to: string
  sent_at: string
}
export interface PaymentResyncResponse {
  status: 'already_succeeded' | 'synced' | string
  payment_status: PaymentStatus
  enrollment_id: string | null
  enrollment_created: boolean
  reason: string
  upstream_status: string
}