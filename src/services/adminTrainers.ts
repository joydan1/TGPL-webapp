// ─── Admin Trainers API ───────────────────────────────────────────────────

import apiClient, { parseApiError } from '../services/api'
import type { ApiResult } from './adminCoursesApi'
import type { ListTrainersParams, PaginatedTrainers } from '../types/adminTrainer'

const BASE = '/v1/admin/trainers'

export const adminTrainersAPI = {
  listTrainers: async (params: ListTrainersParams = {}): Promise<ApiResult<PaginatedTrainers>> => {
    try {
      const response = await apiClient.get<PaginatedTrainers>(`${BASE}/`, { params })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load trainers')
      return { success: false as const, error: message, statusCode }
    }
  },
}