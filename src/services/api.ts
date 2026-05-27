/**
 * services/api.ts — Axios client + all auth API calls
 *
 * FLOW:
 * - ApiClient wraps axios with two interceptors:
 *     Request:  attaches Bearer token from Zustand store to every request
 *     Response: on 401, attempts silent token refresh (except on auth endpoints
 *               which are in SKIP_REFRESH_ROUTES — those let the caller handle it)
 * - Zustand store is the single source of truth for tokens.
 *   This file never touches localStorage directly — it calls store.setToken()
 *   and store.setRefreshToken() which handle localStorage internally.
 * - authAPI methods map camelCase JS payloads → snake_case for the Django API,
 *   and parse error responses into a consistent { success, error, statusCode, code } shape.
 */

import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'
import { useAuthStore } from '../store/auth'

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  detail?: string
  code?: string
  [key: string]: unknown
}

export interface UserResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'learner' | 'trainer' | 'admin'
  is_active: boolean
  is_email_verified: boolean
  created_at: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

// ─── Payload Types ────────────────────────────────────────────────────────────

// Internal camelCase shape — mapped to snake_case inside authAPI.signup
export interface SignupPayload {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface PasswordResetPayload {
  email: string
}

export interface PasswordResetConfirmPayload {
  token: string
  new_password: string
}

export interface EmailVerificationPayload {
  token: string
}

export interface EmailVerificationSendPayload {
  email: string
}

// ─── Routes that should NOT trigger a token refresh on 401 ───────────────────
// On these endpoints, a 401/403 is a legitimate auth failure the caller handles.
const SKIP_REFRESH_ROUTES = [
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.SIGNUP,
  API_ENDPOINTS.EMAIL_VERIFICATION_SEND,
  API_ENDPOINTS.EMAIL_VERIFICATION_CONFIRM,
  API_ENDPOINTS.PASSWORD_RESET,
  API_ENDPOINTS.PASSWORD_RESET_CONFIRM,
]

// ─── API Client ───────────────────────────────────────────────────────────────

class ApiClient {
  private axiosInstance: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    // Request interceptor — attach token from Zustand (single source of truth)
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor — handle 401 (expired token) and 403 (forbidden)
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const url = error.config?.url || ''
        const status = error.response?.status

        if (status === 401) {
          // Skip refresh on auth endpoints — let the caller handle the 401
          if (SKIP_REFRESH_ROUTES.some((route) => url.includes(route))) {
            return Promise.reject(error)
          }
          return this.handleTokenExpiry(error)
        }

        if (status === 403) {
          // Also skip on auth endpoints (e.g. email_not_verified returns 403)
          if (SKIP_REFRESH_ROUTES.some((route) => url.includes(route))) {
            return Promise.reject(error)
          }
          console.error('Access forbidden - insufficient permissions')
          window.location.href = '/unauthorized'
        }

        return Promise.reject(error)
      },
    )
  }

  private async handleTokenExpiry(error: AxiosError) {
    const config = error.config

    if (!this.refreshTokenPromise) {
      this.refreshTokenPromise = this.refreshAccessToken()
        .then((newToken) => { this.refreshTokenPromise = null; return newToken })
        .catch(() => {
          this.refreshTokenPromise = null
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return ''
        })
    }

    try {
      const newToken = await this.refreshTokenPromise
      if (newToken && config) {
        config.headers.Authorization = `Bearer ${newToken}`
        return this.axiosInstance(config)
      }
    } catch {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }

  private async refreshAccessToken(): Promise<string> {
    const state = useAuthStore.getState()
    const refreshToken = state.refreshToken
    if (!refreshToken) throw new Error('No refresh token available')

    try {
      const response = await this.axiosInstance.post<TokenResponse>(
        API_ENDPOINTS.REFRESH_TOKEN,
        { refresh: refreshToken },
      )
      const { access, refresh } = response.data
      state.setToken(access)
      state.setRefreshToken(refresh)
      return access
    } catch (error) {
      state.setRefreshToken(null)
      throw error
    }
  }

  public async get<T>(url: string) { return this.axiosInstance.get<T>(url) }
  public async post<T>(url: string, data?: unknown) { return this.axiosInstance.post<T>(url, data) }
  public async put<T>(url: string, data?: unknown) { return this.axiosInstance.put<T>(url, data) }
  public async patch<T>(url: string, data?: unknown) { return this.axiosInstance.patch<T>(url, data) }
  public async delete<T>(url: string) { return this.axiosInstance.delete<T>(url) }
}

export const apiClient = new ApiClient()

// ─── Error parser helper ──────────────────────────────────────────────────────

function parseApiError(error: unknown, fallback: string): { message: string; statusCode?: number; code?: string } {
  const err = error as AxiosError<ApiErrorResponse>
  const data = err.response?.data
  const statusCode = err.response?.status
  const code = data?.code

  let message = fallback
  if (data) {
    if (data.detail && typeof data.detail === 'string') {
      message = data.detail
    } else {
      const firstKey = Object.keys(data).find((k) => k !== 'code')
      if (firstKey) {
        const val = data[firstKey]
        if (Array.isArray(val)) message = val[0]
        else if (typeof val === 'string') message = val
      }
    }
  }

  return { message, statusCode, code }
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  /**
   * POST /api/v1/auth/signup/
   * Maps camelCase payload → snake_case for Django.
   * Returns { success: true } on 201 — no tokens yet (email must be verified first).
   */
  signup: async (payload: SignupPayload) => {
    try {
      const response = await apiClient.post<UserResponse>(API_ENDPOINTS.SIGNUP, {
        email: payload.email,
        password: payload.password,
        first_name: payload.firstName,
        last_name: payload.lastName,
      })
      return { success: true, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Signup failed')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/email-verification/send/
   * Sends or resends the verification email.
   * Used on both the signup confirmation screen and the login page (unverified user).
   */
  sendVerificationEmail: async (payload: EmailVerificationSendPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.EMAIL_VERIFICATION_SEND, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to send verification email')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/email-verification/confirm/
   * Called from the email verification page with the token from the link.
   * On success: API issues JWT tokens — stored in Zustand via store.setToken/setRefreshToken.
   */
  verifyEmail: async (payload: EmailVerificationPayload) => {
    try {
      const response = await apiClient.post<TokenResponse>(
        API_ENDPOINTS.EMAIL_VERIFICATION_CONFIRM,
        payload,
      )
      const { access, refresh } = response.data
      useAuthStore.getState().setToken(access)
      useAuthStore.getState().setRefreshToken(refresh)
      return { success: true, access, refresh }
    } catch (error) {
      const { message } = parseApiError(error, 'Verification failed. Link may be expired or already used.')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/login/
   * On success: stores tokens in Zustand (store handles localStorage).
   * Returns statusCode + code so useAuth can detect email_not_verified (403).
   */
  login: async (payload: LoginPayload) => {
    try {
      const response = await apiClient.post<TokenResponse & { user: UserResponse }>(
        API_ENDPOINTS.LOGIN,
        payload,
      )
      const { access, refresh, user } = response.data
      useAuthStore.getState().setToken(access)
      useAuthStore.getState().setRefreshToken(refresh)
      return { success: true, access, refresh, user }
    } catch (error) {
      const { message, statusCode, code } = parseApiError(error, 'Invalid email or password')
      return { success: false, error: message, statusCode, code }
    }
  },

  /**
   * GET /api/v1/auth/me/
   * Fetches the currently authenticated user's full profile.
   * Called after login and on app boot (loadCurrentUser).
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<UserResponse>(API_ENDPOINTS.ME)
      return { success: true, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get user')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/logout/
   * Blacklists the refresh token server-side.
   * Always clears Zustand store (and therefore localStorage) even if API fails.
   */
  logout: async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken })
      }
      useAuthStore.getState().logout()
      return { success: true }
    } catch (error) {
      useAuthStore.getState().logout()
      const { message } = parseApiError(error, 'Logout failed')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/password-reset/
   * Always returns 200 regardless of whether the email exists (anti-enumeration).
   */
  requestPasswordReset: async (payload: PasswordResetPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Password reset request failed')
      return { success: false, error: message }
    }
  },

  /**
   * POST /api/v1/auth/password-reset/confirm/
   * Called from the reset password page with token (from link) + new_password.
   */
  confirmPasswordReset: async (payload: PasswordResetConfirmPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Password reset failed')
      return { success: false, error: message }
    }
  },

  // Dev-only test endpoints
  ...(import.meta.env.DEV && {
    testLearnerOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/learner-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Learner test failed' } }
    },
    testTrainerOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/trainer-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Trainer test failed' } }
    },
    testAdminOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/admin-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Admin test failed' } }
    },
  }),
}

export default apiClient