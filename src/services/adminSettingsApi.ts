// services/adminSettingsApi.ts
import { apiClient, parseApiError } from './api' // adjust path/names to match your actual client
import type {
  SystemSettings, PatchedSystemSettings, AdminProfile, AdminSession, AuditLogPage,
} from '../types/adminSettings'

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number }

const NO_OP_MESSAGE = 'No settings were changed.'

export const adminSettingsAPI = {
  async getSettings(): Promise<ApiResult<SystemSettings>> {
    try {
      const res = await apiClient.get<SystemSettings>('/v1/admin/settings/')
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to load settings')
      return { success: false, error: message, statusCode }
    }
  },

  // payload should already be filtered to backend-confirmed keys only (see
  // AdminSettingsPage's `available` filtering before calling this).
  async updateSettings(payload: PatchedSystemSettings): Promise<ApiResult<SystemSettings>> {
    try {
      const res = await apiClient.patch<SystemSettings>('/v1/admin/settings/', payload)
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to update settings')
      if (statusCode === 409) {
        return { success: false, error: NO_OP_MESSAGE, statusCode: 409 }
      }
      return { success: false, error: message, statusCode }
    }
  },

  async getAuditLog(params?: { field_name?: string; page?: number; page_size?: number }): Promise<ApiResult<AuditLogPage>> {
    try {
      const res = await apiClient.get<AuditLogPage>('/v1/admin/settings/audit-log/', { params })
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to load audit log')
      return { success: false, error: message, statusCode }
    }
  },
}

export const NO_OP_ERROR_MESSAGE = NO_OP_MESSAGE

export const adminProfileAPI = {
  async getProfile(): Promise<ApiResult<AdminProfile>> {
    try {
      const res = await apiClient.get<AdminProfile>('/v1/auth/me/')
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to load profile')
      return { success: false, error: message, statusCode }
    }
  },

  async updateProfile(payload: Partial<Pick<AdminProfile, 'full_name' | 'email' | 'phone'>>): Promise<ApiResult<AdminProfile>> {
    try {
      const res = await apiClient.patch<AdminProfile>('/v1/auth/me/', payload)
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to update profile')
      return { success: false, error: message, statusCode }
    }
  },
 async uploadAvatar(file: File): Promise<ApiResult<{ avatar_url: string }>> {
    try {
      const form = new FormData()
      form.append('avatar', file)
      const res = await apiClient.post<{ avatar_url: string }>('/v1/auth/me/avatar/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to upload photo')
      return { success: false, error: message, statusCode }
    }
  },
  async changePassword(payload: { current_password: string; new_password: string }): Promise<ApiResult<{ message: string }>> {
    try {
      const res = await apiClient.post<{ message: string }>('/v1/auth/password-change/', payload)
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to change password')
      return { success: false, error: message, statusCode }
    }
  },
  async setTwoFactor(enabled: boolean): Promise<ApiResult<{ two_factor_enabled: boolean }>> {
    try {
      const res = await apiClient.patch<{ two_factor_enabled: boolean }>('/admin/profile/two-factor/', { enabled })
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to update two-factor settings')
      return { success: false, error: message, statusCode }
    }
  },

  async setSessionTimeout(minutes: number): Promise<ApiResult<{ session_timeout_minutes: number }>> {
    try {
      const res = await apiClient.patch<{ session_timeout_minutes: number }>('/admin/profile/', { session_timeout_minutes: minutes })
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to update session timeout')
      return { success: false, error: message, statusCode }
    }
  },

  async getSessions(): Promise<ApiResult<AdminSession[]>> {
    try {
      const res = await apiClient.get<AdminSession[]>('/admin/profile/sessions/')
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to load sessions')
      return { success: false, error: message, statusCode }
    }
  },

  async revokeSession(sessionId: string): Promise<ApiResult<{ revoked: boolean }>> {
    try {
      const res = await apiClient.delete<{ revoked: boolean }>(`/admin/profile/sessions/${sessionId}/`)
      return { success: true, data: res.data }
    } catch (err) {
      const { message, statusCode } = parseApiError(err, 'Failed to revoke session')
      return { success: false, error: message, statusCode }
    }
  },
}