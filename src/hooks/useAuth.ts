// @ts-nocheck
import { useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { authAPI, learnerProfileAPI } from '../services/api'

import type {
  LoginPayload,
  SignupPayload,
  EmailVerificationPayload,
  PasswordResetPayload,
  PasswordResetConfirmPayload,
  LearnerProfilePayload,
  LoginResult,
} from '../services/api'

import type { User } from '../types/index'

export type AuthResult =
  | { success: true; user?: User; token?: string }
  | { success: false; error?: string; statusCode?: number; code?: string }

const mapUser = (userData: any): User => ({
  id: parseInt(userData.id, 10),
  email: userData.email,
  name: `${userData.first_name} ${userData.last_name}`.trim(),
  role: userData.role,
  createdAt: userData.created_at,
  learner_profile: userData.learner_profile || null,
})

export const useAuth = () => {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)

  const login = useCallback(async (formData: LoginPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result: LoginResult = await authAPI.login(formData)

      if (!result.success) {
        const errorMsg = result.error || 'Login failed'
        store.setError(errorMsg)

        return {
          success: false,
          error: errorMsg,
          statusCode: result.statusCode,
          code: result.code,
        }
      }

      const userResult = await authAPI.getCurrentUser()

      if (!userResult.success || !userResult.data) {
        store.setError('Failed to fetch user info')
        return { success: false, error: 'Failed to fetch user info' }
      }

      const user = mapUser(userResult.data)

      store.login(user, result.access, result.refresh)

      return {
        success: true,
        user,
        token: result.access,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const signup = useCallback(async (formData: SignupPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.signup(formData)

      if (!result.success) {
        const errorMsg = result.error || 'Signup failed'
        store.setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const verifyEmail = useCallback(async (payload: EmailVerificationPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.verifyEmail(payload)

      if (!result.success) {
        const errorMsg = result.error || 'Verification failed'
        store.setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const requestPasswordReset = useCallback(async (payload: PasswordResetPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.requestPasswordReset(payload)

      if (!result.success) {
        const errorMsg = result.error || 'Request failed'
        store.setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const confirmPasswordReset = useCallback(async (payload: PasswordResetConfirmPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.confirmPasswordReset(payload)

      if (!result.success) {
        const errorMsg = result.error || 'Reset failed'
        store.setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reset failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const loadCurrentUser = useCallback(async (): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)

      const result = await authAPI.getCurrentUser()

      if (result.success && result.data) {
        const user = mapUser(result.data)
        store.setUser(user)
        return { success: true, user }
      }

      return { success: false, error: 'Failed to load user' }
    } catch (error) {
      return { success: false, error: 'Failed to load user' }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const updateLearnerProfile = useCallback(async (payload: LearnerProfilePayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()

    try {
      store.setLoading(true)
      store.clearError()

      const result = await learnerProfileAPI.updateLearnerProfile(payload)

      if (!result.success) {
        const errorMsg = result.error || 'Failed to update profile'
        store.setError(errorMsg)
        return { success: false, error: errorMsg }
      }

      const userResult = await authAPI.getCurrentUser()

      if (userResult.success && userResult.data) {
        const user = mapUser(userResult.data)
        store.setUser(user)
        return { success: true, user }
      }

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    useAuthStore.getState().clearError()
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    loadCurrentUser,
    updateLearnerProfile,
    clearError,
  }
}