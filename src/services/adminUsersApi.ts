// ─── Admin Users API ───────────────────────────────────────────────────────

import apiClient, { parseApiError } from './api'

export type ApiRole = 'learner' | 'trainer' | 'admin'

export interface AdminUserListItem {
  id: string
  full_name: string
  email: string
  role: ApiRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
}

export interface ListUsersParams {
  page?: number
  page_size?: number
  search?: string
  role?: ApiRole
}

export interface PaginatedUsers {
  count: number
  next: string | null
  previous: string | null
  results: AdminUserListItem[]
}

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number; code?: string }

const BASE = '/v1/admin/users'
const MAX_EXPORT_PAGES = 50 // up to 5,000 users at page_size 100

export const adminUsersAPI = {
  listUsers: async (params: ListUsersParams = {}): Promise<ApiResult<PaginatedUsers>> => {
    try {
      const response = await apiClient.get<PaginatedUsers>(`${BASE}/`, { params })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load users')
      return { success: false as const, error: message, statusCode }
    }
  },

  getCount: async (): Promise<ApiResult<number>> => {
    try {
      const response = await apiClient.get<AdminUserListItem[] | PaginatedUsers>(`${BASE}/`, {
        params: { page_size: 1 },
      })
      const data = response.data
      const count = Array.isArray(data) ? data.length : data.count
      return { success: true as const, data: count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load user count')
      return { success: false as const, error: message, statusCode }
    }
  },

 
  listAllMatching: async (
    filters: Omit<ListUsersParams, 'page' | 'page_size'>,
  ): Promise<ApiResult<AdminUserListItem[]>> => {
    const all: AdminUserListItem[] = []
    let page = 1
    for (let i = 0; i < MAX_EXPORT_PAGES; i++) {
      const res = await adminUsersAPI.listUsers({ ...filters, page, page_size: 100 })
      if (!res.success) return res
      all.push(...res.data.results)
      if (!res.data.next) break
      page += 1
    }
    return { success: true as const, data: all }
  },
}