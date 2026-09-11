// src/services/publicSettingsApi.ts
import { apiClient, parseApiError } from './api'

export interface PublicSettings {
  platform_name: string
  platform_url: string
  support_email: string
  primary_color: string
  secondary_color: string
  logo_url: string | null
  favicon_url: string | null
  default_timezone: string
  locale: string
  maintenance_mode: boolean
  maintenance_scheduled_message: string
  maintenance_expected_end_time: string | null
}

type ApiResult<T> = { success: true; data: T } | { success: false; error: string; statusCode?: number }

export const publicSettingsAPI = {
  async getPublicSettings(): Promise<ApiResult<PublicSettings>> {
    try {
      const res = await apiClient.get<PublicSettings>('/v1/settings/public/')
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to load platform settings')
      return { success: false, error: message, statusCode }
    }
  },
}