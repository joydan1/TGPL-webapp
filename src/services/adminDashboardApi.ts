// services/adminDashboardApi.ts

import apiClient, { parseApiError } from '../services/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export type DashboardPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time'

export type ActivityCategory = 'payments' | 'content' | 'platform'

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


export interface RecentActivityItem {
  description: string
  actor: string
  category: ActivityCategory
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