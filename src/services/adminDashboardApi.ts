// services/adminDashboardApi.ts
// ─── Admin Dashboard API ───────────────────────────────────────────────────
// GET /api/v1/admin/dashboard/overview/ confirmed by backend (Mark) on
// 2026-08-27 — see conversation notes for the full response sample. Query
// params (`period`, `activity_limit`) and the response shape below match
// that confirmation exactly.

import apiClient, { parseApiError } from '../services/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time'

export interface EnrollmentTrendPoint {
  date: string
  new_enrollments: number
  total_enrollments: number
}

export interface EnrollmentTrendSummary {
  period_start: string
  period_end: string
  total_new_enrollments: number
  growth_rate_percent: number
}

// CONFIRMED (Mark, 2026-08-27): recent_activity is curated for governance
// only — invites, suspensions, role changes, refunds — not a general
// activity feed. Only 'invite' is a confirmed literal target_type value so
// far; suspension/role_change/refund are still best-guess snake_case pending
// confirmation. This deliberately does NOT match the Figma mock's
// signup/payment/certificate/content categories — that mock's sample data
// isn't representative of what this endpoint actually returns.
// `actor` is a name, or "System" for non-admin-initiated actions.
// `description` is already human-readable — display as-is, don't rebuild
// text from target_type/target_id.
export interface RecentActivityItem {
  description: string
  actor: string
  target_type: string
  target_id: string
  created_at: string
}

export interface DashboardOverview {
  total_enrollments: number
  enrollment_trends: {
    period: DashboardPeriod
    data: EnrollmentTrendPoint[]
    summary: EnrollmentTrendSummary
  }
  recent_activity: RecentActivityItem[]
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number; code?: string }

const BASE = '/v1/admin/dashboard'

// ─── API ────────────────────────────────────────────────────────────────────

export const adminDashboardAPI = {
  /** GET /v1/admin/dashboard/overview/?period=&activity_limit= — confirmed. */
  getOverview: async (period: DashboardPeriod, activityLimit = 20): Promise<ApiResult<DashboardOverview>> => {
    try {
      const response = await apiClient.get<DashboardOverview>(`${BASE}/overview/`, {
        params: { period, activity_limit: activityLimit },
      })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load dashboard overview')
      return { success: false as const, error: message, statusCode }
    }
  },

}