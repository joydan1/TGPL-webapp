// ─── Admin Revenue API ────────────────────────────────────────────────────

import type { AxiosError } from 'axios'
import apiClient, { parseApiError } from './api'
import type {
  AdminPaymentRow,
  AdminPaymentDetail,
  AdminPaymentListParams,
  PaymentActionResponse,
  ResendConfirmationResponse,
  RefundReason,
  PaymentResyncResponse,
} from '../types/adminPayment'

// ─── TYPES ────────────────────────────────────────────────────────────────

export interface RevenueSummary {
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
  summary: RevenueSummary
  status_breakdown: Record<string, number>
}

export interface RevenueOverviewFilters {
  course_id?: string
  trainer_id?: string
  date_from?: string
  date_to?: string
  search?: string
  status?: string
}

export interface MonthlyRevenuePoint {
  month: string
  revenue_kobo: number
  isCurrentMonth: boolean
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number }

// ─── CONSTANTS ────────────────────────────────────────────────────────────

const BASE = '/v1/admin/revenue'

// ─── HELPERS ──────────────────────────────────────────────────────────────

interface ApiErrorResponse {
  detail?: string
  code?: string
  [key: string]: unknown
}

function parseAdminError(error: unknown, fallback: string): { message: string; statusCode?: number } {
  const err = error as AxiosError<ApiErrorResponse>
  const data = err.response?.data
  const statusCode = err.response?.status

  let message = fallback

  if (data?.detail && typeof data.detail === 'string') {
    message = data.detail
  } else if (data) {
    const firstKey = Object.keys(data).find((k) => k !== 'code')
    if (firstKey) {
      const val = data[firstKey]
      if (Array.isArray(val)) message = val[0]
      else if (typeof val === 'string') message = val
    }
  }

  return { message, statusCode }
}

function buildQuery(params?: AdminPaymentListParams): string {
  const query = new URLSearchParams()

  if (params?.course_id) query.set('course_id', params.course_id)
  if (params?.date_from) query.set('date_from', params.date_from)
  if (params?.date_to) query.set('date_to', params.date_to)
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  if (params?.search) query.set('search', params.search)
  if (params?.status) query.set('status', params.status)
  if (params?.trainer_id) query.set('trainer_id', params.trainer_id)

  return query.toString()
}

function buildMonthBuckets(months: number) {
  const now = new Date()
  const buckets = []

  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1)

    const to =
      i === 0
        ? now
        : new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)

    buckets.push({
      from,
      to,
      label: from.toLocaleDateString('en-US', { month: 'short' }),
      isCurrentMonth: i === 0,
    })
  }

  return buckets
}

type ListResponseShape =
  | AdminPaymentRow[]
  | {
      count: number
      next: string | null
      previous: string | null
      results: AdminPaymentRow[]
    }

// ─── API ──────────────────────────────────────────────────────────────────

export const adminRevenueAPI = {
  // ─── OVERVIEW ───
  getOverview: async (
    filters: RevenueOverviewFilters = {},
  ): Promise<ApiResult<RevenueOverview>> => {
    try {
      const response = await apiClient.get<RevenueOverview>(`${BASE}/`, {
        params: filters,
      })

      return { success: true, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load revenue overview')
      return { success: false, error: message, statusCode }
    }
  },

  // ─── TREND ───
  getMonthlyRevenueTrend: async (
    months = 7,
  ): Promise<ApiResult<MonthlyRevenuePoint[]>> => {
    const buckets = buildMonthBuckets(months)

    try {
      const responses = await Promise.all(
        buckets.map(({ from, to }) =>
          apiClient.get<RevenueOverview>(`${BASE}/`, {
            params: {
              date_from: from.toISOString(),
              date_to: to.toISOString(),
            },
          }),
        ),
      )

      return {
        success: true,
        data: responses.map((r, i) => ({
          month: buckets[i].label,
          revenue_kobo: r.data.summary.total_revenue_kobo,
          isCurrentMonth: buckets[i].isCurrentMonth,
        })),
      }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load revenue trend')
      return { success: false, error: message, statusCode }
    }
  },

  // ─── PAYMENTS ───
  listTransactions: async (params?: AdminPaymentListParams) => {
    try {
      const qs = buildQuery(params)

      const response = await apiClient.get<ListResponseShape>(
        `/v1/admin/payments/${qs ? `?${qs}` : ''}`,
      )

      const data = response.data

      if (Array.isArray(data)) {
        return { success: true as const, data, count: data.length }
      }

      return { success: true as const, data: data.results, count: data.count }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load transactions')
      return { success: false as const, error: message, statusCode }
    }
  },

  getTransaction: async (paymentId: string) => {
    try {
      const response = await apiClient.get<AdminPaymentDetail>(
        `/v1/admin/payments/${paymentId}/`,
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load transaction')
      return { success: false as const, error: message, statusCode }
    }
  },

  getRevenueSummary: async (params?: AdminPaymentListParams) => {
    try {
      const qs = buildQuery(params)

      const response = await apiClient.get<RevenueOverview>(
        `/v1/admin/revenue/${qs ? `?${qs}` : ''}`,
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load revenue summary')
      return { success: false as const, error: message, statusCode }
    }
  },

  // ─── ACTIONS ───
  refund: async (paymentId: string, reason: RefundReason, note?: string) => {
    try {
      const response = await apiClient.post<PaymentActionResponse>(
        `/v1/admin/payments/${paymentId}/refund/`,
        { reason, note: note ?? '' },
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to issue refund')
      return { success: false as const, error: message, statusCode }
    }
  },

  markRefundedExternal: async (
    paymentId: string,
    opts?: { refund_date?: string; note?: string },
  ) => {
    try {
      const response = await apiClient.post<PaymentActionResponse>(
        `/v1/admin/payments/${paymentId}/mark-refunded/`,
        {
          refund_date: opts?.refund_date,
          note: opts?.note ?? '',
        },
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(
        error,
        'Failed to mark payment refunded',
      )
      return { success: false as const, error: message, statusCode }
    }
  },

  resendConfirmation: async (paymentId: string) => {
    try {
      const response = await apiClient.post<ResendConfirmationResponse>(
        `/v1/admin/payments/${paymentId}/resend-confirmation/`,
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(
        error,
        'Failed to resend confirmation email',
      )
      return { success: false as const, error: message, statusCode }
    }
  },

  updateStatus: async (
    paymentId: string,
    status: 'succeeded' | 'failed',
    note?: string,
  ) => {
    try {
      const response = await apiClient.post<PaymentActionResponse>(
        `/v1/admin/payments/${paymentId}/update-status/`,
        { status, note: note ?? '' },
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(
        error,
        'Failed to correct payment status',
      )
      return { success: false as const, error: message, statusCode }
    }
  },

  resyncFromPaystack: async (paymentId: string) => {
    try {
      const response = await apiClient.post<PaymentResyncResponse>(
        `/v1/admin/payments/${paymentId}/resync-from-paystack/`,
      )

      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(
        error,
        'Could not reach Paystack — nothing was changed.',
      )

      return { success: false as const, error: message, statusCode }
    }
  },

  exportTransactions: async (
    params?: AdminPaymentListParams & { format?: 'csv' | 'json' },
  ) => {
    try {
      const query = new URLSearchParams(buildQuery(params))
      query.set('format', params?.format ?? 'csv')

      const response = await apiClient.get<Blob>(
        `/v1/admin/payments/export/?${query.toString()}`,
        { responseType: 'blob' },
      )

      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `tgpl-transactions.${params?.format ?? 'csv'}`

      document.body.appendChild(a)
      a.click()
      a.remove()

      window.URL.revokeObjectURL(url)

      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseAdminError(
        error,
        'Failed to export transactions',
      )
      return { success: false as const, error: message, statusCode }
    }
  },
}