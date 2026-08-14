export type TransactionStatus = 'successful' | 'pending' | 'failed' | 'refunded'
export type PaymentMethod = 'card' | 'ussd' | 'bank_transfer' | 'paystack'
export type EnrollmentState = 'enrolled' | 'not_enrolled'

export interface TimelineStep {
  label: string
  time: string | null // null renders as "—"
  state: 'done' | 'pending' | 'error'
}

export interface TransactionDetail {
  id: string
  tgpl_ref: string
  status: TransactionStatus
  amount_naira: number
  date: string
  method: PaymentMethod
  learner_name: string
  learner_email: string
  learner_avatar_color: string
  enrollment_state: EnrollmentState
  course_title: string
  timeline: TimelineStep[]
  gateway: string
  gateway_ref: string
  response_message: string
}

export interface AdminTransactionRow {
  ref: string
  learner_name: string
  learner_email: string
  learner_avatar_color: string
  course_title: string
  amount_naira: number
  method: PaymentMethod
  status: TransactionStatus
  date: string
  detail: TransactionDetail
}

export interface RevenueSummary {
  total_revenue: number
  total_revenue_txn_count: number
  successful_count: number
  pending_count: number
  refunds_naira: number
  refunds_count: number
}

// TODO: replace all of this with adminRevenueAPI.listTransactions() /
// getSummary() once GET /api/v1/admin/payments/ (or similar) exists.

export const MOCK_REVENUE_SUMMARY: RevenueSummary = {
  total_revenue: 204_500,
  total_revenue_txn_count: 5,
  successful_count: 5,
  pending_count: 2,
  refunds_naira: 90_000,
  refunds_count: 1,
}

function successfulDetail(overrides: Partial<TransactionDetail>): TransactionDetail {
  return {
    id: '',
    tgpl_ref: '',
    status: 'successful',
    amount_naira: 0,
    date: '',
    method: 'card',
    learner_name: '',
    learner_email: '',
    learner_avatar_color: '#2968f0',
    enrollment_state: 'enrolled',
    course_title: '',
    gateway: 'Paystack',
    gateway_ref: '',
    response_message: 'Transaction successful',
    timeline: [
      { label: 'Payment initiated', time: '09:12:04', state: 'done' },
      { label: 'Gateway processed', time: '09:12:06', state: 'done' },
      { label: 'Payment completed', time: '09:12:07', state: 'done' },
      { label: 'Enrollment activated', time: '09:12:08', state: 'done' },
    ],
    ...overrides,
  }
}

function pendingDetail(overrides: Partial<TransactionDetail>): TransactionDetail {
  return {
    id: '',
    tgpl_ref: '',
    status: 'pending',
    amount_naira: 0,
    date: '',
    method: 'card',
    learner_name: '',
    learner_email: '',
    learner_avatar_color: '#7C3AED',
    enrollment_state: 'not_enrolled',
    course_title: '',
    gateway: 'Paystack',
    gateway_ref: '',
    response_message: 'Awaiting 3DS authentication',
    timeline: [
      { label: 'Payment initiated', time: '10:44:01', state: 'done' },
      { label: 'Gateway processed', time: '10:44:03', state: 'done' },
      { label: '3DS verification', time: null, state: 'pending' },
      { label: 'Enrollment pending', time: null, state: 'pending' },
    ],
    ...overrides,
  }
}

function failedDetail(overrides: Partial<TransactionDetail>): TransactionDetail {
  return {
    id: '',
    tgpl_ref: '',
    status: 'failed',
    amount_naira: 0,
    date: '',
    method: 'ussd',
    learner_name: '',
    learner_email: '',
    learner_avatar_color: '#F59E0B',
    enrollment_state: 'not_enrolled',
    course_title: '',
    gateway: 'Paystack',
    gateway_ref: '',
    response_message: 'Insufficient funds',
    timeline: [
      { label: 'Payment initiated', time: '08:30:15', state: 'done' },
      { label: 'Gateway processed', time: '08:30:17', state: 'done' },
      { label: 'Payment failed', time: '08:30:18', state: 'error' },
      { label: 'Enrollment blocked', time: '08:30:18', state: 'error' },
    ],
    ...overrides,
  }
}

function refundedDetail(overrides: Partial<TransactionDetail>): TransactionDetail {
  return {
    id: '',
    tgpl_ref: '',
    status: 'refunded',
    amount_naira: 0,
    date: '',
    method: 'paystack',
    learner_name: '',
    learner_email: '',
    learner_avatar_color: '#DC2626',
    enrollment_state: 'not_enrolled',
    course_title: '',
    gateway: 'Paystack',
    gateway_ref: '',
    response_message: 'Refunded to original payment method',
    timeline: [
      { label: 'Payment initiated', time: '11:02:00', state: 'done' },
      { label: 'Gateway processed', time: '11:02:02', state: 'done' },
      { label: 'Payment completed', time: '11:02:03', state: 'done' },
      { label: 'Refund issued', time: '11:02:03', state: 'done' },
    ],
    ...overrides,
  }
}

function buildRow(
  ref: string,
  learner_name: string,
  learner_email: string,
  learner_avatar_color: string,
  course_title: string,
  amount_naira: number,
  method: PaymentMethod,
  status: TransactionStatus,
  date: string,
  detailOverrides: Partial<TransactionDetail>,
): AdminTransactionRow {
  const tgpl_ref = `TGPL-${ref}`
  const base = { id: ref, tgpl_ref, amount_naira, date, method, learner_name, learner_email, learner_avatar_color, course_title, ...detailOverrides }

  const detail =
    status === 'successful' ? successfulDetail(base)
    : status === 'pending' ? pendingDetail(base)
    : status === 'failed' ? failedDetail(base)
    : refundedDetail(base)

  return { ref, learner_name, learner_email, learner_avatar_color, course_title, amount_naira, method, status, date, detail }
}

export const MOCK_TRANSACTIONS: AdminTransactionRow[] = [
  buildRow('240724-001', 'Emeka Okafor', 'emeka@example.com', '#2563EB', 'Advanced Agile Methodologies', 85_000, 'card', 'successful', '2026-07-24', { gateway_ref: 'PAY-8X2KL9' }),
  buildRow('240724-003', 'Taiwo Adeyinka', 'taiwo@example.com', '#7C3AED', 'PMP Exam Prep', 120_000, 'card', 'pending', '2026-07-24', { gateway_ref: 'PAY-5Q1RT8' }),
  buildRow('240724-010', 'Rotimi Akintola', 'rotimi@example.com', '#2563EB', 'Advanced Agile Methodologies', 85_000, 'ussd', 'pending', '2026-07-24', { gateway_ref: 'PAY-7N3VD2' }),
  buildRow('230724-002', 'Chidinma Eze', 'chidinma@example.com', '#059669', 'Leadership Essentials', 75_000, 'bank_transfer', 'successful', '2026-07-23', { gateway_ref: 'PAY-2M9FC1' }),
  buildRow('220724-004', 'Bola Fashola', 'bola@example.com', '#F59E0B', 'Scrum for Product Teams', 65_000, 'ussd', 'failed', '2026-07-22', { gateway_ref: 'PAY-9W4XK3' }),
  buildRow('210724-006', 'Dele Babatunde', 'dele@example.com', '#2563EB', 'Microsoft Project Mastery', 95_000, 'card', 'successful', '2026-07-21', { gateway_ref: 'PAY-4L8HY6' }),
  buildRow('200724-005', 'Ngozi Okonkwo', 'ngozi@example.com', '#DC2626', 'Risk & Stakeholder Management', 90_000, 'paystack', 'refunded', '2026-07-20', { gateway_ref: 'PAY-1K6QW4' }),
  buildRow('190724-007', 'Kemi Adeleke', 'kemi@example.com', '#059669', 'Communication Skills', 55_000, 'bank_transfer', 'successful', '2026-07-19', { gateway_ref: 'PAY-3P7ZS9' }),
  buildRow('180724-008', 'Femi Coker', 'femi@example.com', '#7C3AED', 'Leadership Essentials', 75_000, 'card', 'failed', '2026-07-18', { gateway_ref: 'PAY-6T2BN5' }),
  buildRow('170724-009', 'Aisha Sule', 'aisha@example.com', '#F59E0B', 'PMP Exam Prep', 120_000, 'paystack', 'successful', '2026-07-17', { gateway_ref: 'PAY-8R5MC7' }),
]