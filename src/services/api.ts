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
  learner_profile?: LearnerProfile | null   
}

export interface LearnerProfile {
  id?: string
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
  completion_status?: 'incomplete' | 'partial' | 'complete'
  created_at?: string
  updated_at?: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

// ─── Payload Types ────────────────────────────────────────────────────────────

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

export interface LearnerProfilePayload {
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
}

// ─── Routes that should NOT trigger a token refresh on 401 ───────────────────
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

    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const url = error.config?.url || ''
        const status = error.response?.status

        if (status === 401) {
          if (SKIP_REFRESH_ROUTES.some((route) => url.includes(route))) {
            return Promise.reject(error)
          }
          return this.handleTokenExpiry(error)
        }

        if (status === 403) {
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
        .then((newToken) => { 
          this.refreshTokenPromise = null
          return newToken 
        })
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

  sendVerificationEmail: async (payload: EmailVerificationSendPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.EMAIL_VERIFICATION_SEND, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to send verification email')
      return { success: false, error: message }
    }
  },

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

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<UserResponse>(API_ENDPOINTS.ME)
      return { success: true, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get user')
      return { success: false, error: message }
    }
  },

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

  requestPasswordReset: async (payload: PasswordResetPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Password reset request failed')
      return { success: false, error: message }
    }
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, payload)
      return { success: true }
    } catch (error) {
      const { message } = parseApiError(error, 'Password reset failed')
      return { success: false, error: message }
    }
  },

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

export const learnerProfileAPI = {
  getLearnerProfile: async () => {
    try {
      const response = await apiClient.get<LearnerProfile>('/api/v1/users/me/learner-profile/')
      return { success: true, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get learner profile')
      return { success: false, error: message }
    }
  },

  updateLearnerProfile: async (payload: LearnerProfilePayload) => {
    try {
      const response = await apiClient.patch<LearnerProfile>(
        '/api/v1/users/me/learner-profile/',
        payload,
      )
      return { success: true, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to update learner profile')
      return { success: false, error: message }
    }
  },
}

export default apiClient