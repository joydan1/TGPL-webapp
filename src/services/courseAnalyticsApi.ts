// ─── Course Analytics API ─────────────────────────────────────────────────
// Lives under /trainer/courses/ in the URL, but the endpoint itself
// explicitly allows admins to call it for any course, not just their own.

import apiClient, { parseApiError } from './api'
import type { EnrollmentTrendsResponse, TrendPeriod } from '../types/adminCourse'

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number; code?: string }

export const courseAnalyticsAPI = {
  getEnrollmentTrends: async (
    courseSlug: string,
    period: TrendPeriod = 'last_30_days',
  ): Promise<ApiResult<EnrollmentTrendsResponse>> => {
    try {
      const response = await apiClient.get<EnrollmentTrendsResponse>(
        `/v1/trainer/courses/${courseSlug}/analytics/enrollment-trends/`,
        { params: { period } },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load enrollment trend')
      return { success: false as const, error: message, statusCode }
    }
  },
}