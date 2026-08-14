import type { AxiosError } from 'axios'
import { apiClient } from './api'
import type {
  SettingsSectionsResponse,
  SystemSettings,
  PatchedSystemSettings,
  PaginatedSettingsAuditEntryList,
  SettingsAuditLogParams,
} from '../types/adminSettings'

interface ApiErrorResponse {
  detail?: string
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

function buildAuditQuery(params?: SettingsAuditLogParams): string {
  const query = new URLSearchParams()
  if (params?.changed_by) query.set('changed_by', params.changed_by)
  if (params?.field_name) query.set('field_name', params.field_name)
  if (params?.page) query.set('page', String(params.page))
  if (params?.page_size) query.set('page_size', String(params.page_size))
  return query.toString()
}

export const adminSettingsAPI = {
  /** GET /v1/admin/settings/sections/ — panel layout (sidebar + which field keys belong to each) */
  getSections: async () => {
    try {
      const response = await apiClient.get<SettingsSectionsResponse>('/v1/admin/settings/sections/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load settings layout')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/admin/settings/ — never 404s, row exists with defaults */
  getSettings: async () => {
    try {
      const response = await apiClient.get<SystemSettings>('/v1/admin/settings/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load settings')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** PATCH /v1/admin/settings/ — send only changed fields, optional `reason` for the audit log */
  updateSettings: async (changes: PatchedSystemSettings) => {
    try {
      const response = await apiClient.patch<SystemSettings>('/v1/admin/settings/', changes)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to save settings')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/admin/settings/audit-log/ — paginated, newest first */
  getAuditLog: async (params?: SettingsAuditLogParams) => {
    try {
      const qs = buildAuditQuery(params)
      const response = await apiClient.get<PaginatedSettingsAuditEntryList>(
        `/v1/admin/settings/audit-log/${qs ? `?${qs}` : ''}`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseAdminError(error, 'Failed to load settings history')
      return { success: false as const, error: message, statusCode }
    }
  },
}