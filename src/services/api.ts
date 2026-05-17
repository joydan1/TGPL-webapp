import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL } from '../constants/api'
import { useAuthStore } from '../store/auth'

/**
 * API Response Types
 */
export interface ApiErrorResponse {
  detail?: string
  [key: string]: unknown
}

export interface UserResponse {
  id: string
  email: string
  role: 'learner' | 'trainer' | 'admin'
  is_active: boolean
  is_email_verified: boolean
  created_at: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

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

export interface RefreshTokenPayload {
  refresh: string
}

/**
 * API Client with Token Management
 */
class ApiClient {
  private axiosInstance: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor: Add token to headers
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Get token from localStorage (more reliable than store)
        const token = localStorage.getItem('token') || useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor: Handle token expiry and refresh
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        // Handle 401 - Token expired, try to refresh
        if (error.response?.status === 401) {
          return this.handleTokenExpiry(error)
        }

        // Handle 403 - Forbidden (user role doesn't have access)
        if (error.response?.status === 403) {
          console.error('Access forbidden - insufficient permissions')
          window.location.href = '/unauthorized'
        }

        return Promise.reject(error)
      },
    )
  }

  /**
   * Handle token expiry by refreshing
   */
  private async handleTokenExpiry(error: AxiosError) {
    const config = error.config

    // Prevent multiple refresh attempts
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

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    const state = useAuthStore.getState()
    const refreshToken = localStorage.getItem('refreshToken')

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await this.axiosInstance.post<TokenResponse>(
        '/v1/auth/token/refresh/',
        { refresh: refreshToken },
      )

      const { access, refresh } = response.data
      state.setToken(access)
      localStorage.setItem('refreshToken', refresh)

      return access
    } catch (error) {
      localStorage.removeItem('refreshToken')
      throw error
    }
  }

  /**
   * Generic request methods
   */
  public async get<T>(url: string) {
    return this.axiosInstance.get<T>(url)
  }

  public async post<T>(url: string, data?: unknown) {
    return this.axiosInstance.post<T>(url, data)
  }

  public async put<T>(url: string, data?: unknown) {
    return this.axiosInstance.put<T>(url, data)
  }

  public async patch<T>(url: string, data?: unknown) {
    return this.axiosInstance.patch<T>(url, data)
  }

  public async delete<T>(url: string) {
    return this.axiosInstance.delete<T>(url)
  }
}

export const apiClient = new ApiClient()

/**
 * AUTH API ENDPOINTS
 */
export const authAPI = {
  /**
   * Sign up a new learner account
   */
  signup: async (payload: SignupPayload) => {
    try {
      const response = await apiClient.post<UserResponse>(
        '/v1/auth/signup/',
        payload,
      )
      return { success: true, data: response.data }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>

      const data = err.response?.data

      let message = 'Signup failed'

      if (data) {
        // Handle Django-style field errors
        const firstKey = Object.keys(data)[0]
        const firstError = data[firstKey]

        if (Array.isArray(firstError)) {
          message = firstError[0]
        } else if (typeof firstError === 'string') {
          message = firstError
        } else if (data.detail) {
          message = data.detail
        }
      }

      return {
        success: false,
        error: message,
      }
    }
  },

  /**
   * Log in with email and password
   */
  login: async (payload: LoginPayload) => {
    try {
      const response = await apiClient.post<TokenResponse & { user: any }>(
        '/v1/auth/login/',
        payload,
      )

      const { access, refresh, user } = response.data

      localStorage.setItem('refreshToken', refresh)

      return {
        success: true,
        access,
        refresh,
        user,
      }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>

      const message = err.response?.data?.detail || 'Invalid credentials'

      return {
        success: false,
        error: message,
      }
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<UserResponse>('/v1/auth/me/')
      return { success: true, data: response.data }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>
      return {
        success: false,
        error: err.response?.data?.detail || 'Failed to get user',
      }
    }
  },

  /**
   * Log out (blacklist refresh token)
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await apiClient.post('/v1/auth/logout/', { refresh: refreshToken })
      }
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      return { success: true }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>
      const message = err.response?.data?.detail || 'Logout failed'
      return { success: false, error: message }
    }
  },

  /**
   * Request password reset email
   */
  requestPasswordReset: async (payload: PasswordResetPayload) => {
    try {
      await apiClient.post('/v1/auth/password-reset/', payload)
      return { success: true }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>
      return {
        success: false,
        error: err.response?.data?.detail || 'Password reset request failed',
      }
    }
  },

  /**
   * Confirm password reset with token
   */
  confirmPasswordReset: async (payload: PasswordResetConfirmPayload) => {
    try {
      await apiClient.post('/v1/auth/password-reset/confirm/', payload)
      return { success: true }
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>
      return {
        success: false,
        error: err.response?.data?.detail || 'Password reset confirmation failed',
      }
    }
  },

  /**
   * Test endpoints (for development/debugging)
   */
  testLearnerOnly: async () => {
    try {
      const response = await apiClient.get('/v1/auth/_test/learner-only/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: 'Learner test failed' }
    }
  },

  testTrainerOnly: async () => {
    try {
      const response = await apiClient.get('/v1/auth/_test/trainer-only/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: 'Trainer test failed' }
    }
  },

  testAdminOnly: async () => {
    try {
      const response = await apiClient.get('/v1/auth/_test/admin-only/')
      return { success: true, data: response.data }
    } catch (error) {
      return { success: false, error: 'Admin test failed' }
    }
  },
}

export default apiClient