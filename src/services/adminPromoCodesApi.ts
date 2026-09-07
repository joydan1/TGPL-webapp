// ─── Admin Promo Codes API ───────────────────────────────────────────────────

import apiClient, { parseApiError } from './api'

// ─── TYPES ────────────────────────────────────────────────────────────────

export type DiscountType = 'percentage' | string 

export interface CreatePromoCodePayload {
  code: string
  discount_type: DiscountType
  discount_value: string 
  max_redemptions?: number
  max_redemptions_per_user?: number
 
  applicable_course_ids?: string[]
  starts_at?: string
  expires_at?: string
}

// Confirmed shape, from the actual POST /admin/promo-codes/ 201 response.
export interface AdminPromoCode {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: string
  starts_at: string | null
  expires_at: string | null
  max_redemptions: number | null
  max_redemptions_per_user: number | null
  is_active: boolean
  created_by_email: string
  created_at: string
  updated_at: string
  redemptions_used: number
  redemptions_remaining: number
  applicable_course_ids: string[] 
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number }

type ListResponseShape =
  | AdminPromoCode[]
  | {
      count: number
      next: string | null
      previous: string | null
      results: AdminPromoCode[]
    }

function normalizePromoCode(code: AdminPromoCode & { applicable_courses?: string[] }): AdminPromoCode {
  return {
    ...code,
    applicable_course_ids: Array.isArray(code.applicable_course_ids)
      ? code.applicable_course_ids
      : Array.isArray(code.applicable_courses)
        ? code.applicable_courses
        : [],
  }
}

// ─── API ──────────────────────────────────────────────────────────────────

export const adminPromoCodesAPI = {
  /** GET /v1/admin/promo-codes/ — list shape (paginated vs raw array) still unconfirmed, handles both */
  listCodes: async (): Promise<ApiResult<AdminPromoCode[]> & { count?: number }> => {
    try {
      const response = await apiClient.get<ListResponseShape>('/v1/admin/promo-codes/')
      const data = response.data
      if (Array.isArray(data)) {
        return { success: true, data: data.map(normalizePromoCode), count: data.length }
      }
      return { success: true, data: data.results.map(normalizePromoCode), count: data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load promo codes')
      return { success: false, error: message, statusCode }
    }
  },

  /** POST /v1/admin/promo-codes/ — confirmed request AND response shape */
  createCode: async (payload: CreatePromoCodePayload): Promise<ApiResult<AdminPromoCode>> => {
    try {
      const response = await apiClient.post<AdminPromoCode>('/v1/admin/promo-codes/', payload)
      return { success: true, data: normalizePromoCode(response.data) }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to create promo code')
      if (statusCode === 400 && message.toLowerCase().includes('duplicate')) {
        return {
          success: false,
          error: 'A code with this name already exists (codes are case-insensitive).',
          statusCode,
        }
      }
      return { success: false, error: message, statusCode }
    }
  },

  
  deactivateCode: async (id: string): Promise<ApiResult<AdminPromoCode>> => {
    try {
      const response = await apiClient.patch<AdminPromoCode>(
        `/v1/admin/promo-codes/${id}/`,
        { is_active: false },
      )
      return { success: true, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to deactivate promo code')
      return { success: false, error: message, statusCode }
    }
  },
}