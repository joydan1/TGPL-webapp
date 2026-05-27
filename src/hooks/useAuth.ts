/**
 * useAuth — custom hook that wraps the Zustand auth store and authAPI.
 *
 * FLOW:
 * - All auth state (user, token, isLoading, error) lives in useAuthStore (Zustand).
 * - This hook exposes stable action functions (login, signup, etc.) that call
 *   authAPI, then update the store based on the result.
 * - IMPORTANT: Every useCallback uses `useAuthStore.getState()` inside the
 *   callback body instead of depending on `auth = useAuthStore()`. This makes
 *   every function stable (empty deps []) — preventing the infinite-loop bug
 *   where `auth` re-created on every render caused useEffect to re-fire endlessly.
 * - State values (user, isLoading, error, isAuthenticated) are still read from
 *   `useAuthStore()` at the top so the component re-renders when they change.
 */

import { useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { authAPI } from '../services/api'
import type {
  LoginPayload,
  SignupPayload,
  EmailVerificationPayload,
  PasswordResetPayload,
  PasswordResetConfirmPayload,
} from '../services/api'
import type { User } from '../types/index'

// Shared result type used by all auth actions
export type AuthResult =
  | { success: true; user?: User; token?: string }
  | { success: false; error?: string; statusCode?: number; code?: string }

export const useAuth = () => {
  // Read reactive state from the store — component re-renders when these change
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading = useAuthStore((s) => s.isLoading)
  const error = useAuthStore((s) => s.error)

  /**
   * LOGIN
   * 1. Sets loading, clears any previous error
   * 2. Calls POST /api/v1/auth/login/ via authAPI
   * 3. On success: fetches full user profile from /auth/me/, builds User object,
   *    calls store.login() which persists token + user to localStorage + Zustand
   * 4. On failure: sets error in store, returns { success: false, statusCode, code }
   *    so the page can detect specific cases like email_not_verified (403)
   */
  const login = useCallback(async (formData: LoginPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.login(formData)

      if (!result.success || !result.access) {
        const errorMsg = result.error || 'Login failed'
        store.setError(errorMsg)
        return { success: false, error: errorMsg, statusCode: result.statusCode, code: result.code }
      }

      const userResult = await authAPI.getCurrentUser()
      const userData = userResult.data

      if (!userResult.success || !userData) {
        store.setError('Failed to fetch user info')
        return { success: false, error: 'Failed to fetch user info' }
      }

      const user: User = {
        id: userData.id as unknown as number,
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        role: userData.role,
        createdAt: userData.created_at,
      }

      store.login(user, result.access, result.refresh)
      return { success: true, user, token: result.access }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      store.setError(message)
      return { success: false, error: message }
    } finally {
      store.setLoading(false)
    }
  }, []) // stable — accesses store via getState(), not closure

  /**
   * SIGNUP
   * 1. Sets loading, clears error
   * 2. Calls POST /api/v1/auth/signup/ — sends first_name, last_name (mapped in authAPI)
   * 3. On success: returns { success: true } — NO tokens issued yet.
   *    The page switches to the "check your email" screen.
   * 4. User must verify email first, then login separately to get tokens.
   */
  const signup = useCallback(async (formData: SignupPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      store.clearError()

      const result = await authAPI.signup(formData)

      if (!result.success) {
        store.setError(result.error || 'Signup failed')
        return { success: false, error: result.error }
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

  /**
   * VERIFY EMAIL
   * 1. Called from the email verification page (user clicks link in email)
   * 2. Calls POST /api/v1/auth/email-verification/confirm/ with token from URL
   * 3. On success: API auto-issues JWT tokens — stored in Zustand via authAPI
   * 4. Page can then redirect user to dashboard / onboarding
   */
  const verifyEmail = useCallback(async (payload: EmailVerificationPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      store.clearError()
      const result = await authAPI.verifyEmail(payload)
      if (!result.success) {
        store.setError(result.error || 'Verification failed')
        return { success: false, error: result.error }
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

  /**
   * REQUEST PASSWORD RESET
   * 1. Calls POST /api/v1/auth/password-reset/ with email
   * 2. API always returns 200 (anti-enumeration — doesn't reveal if email exists)
   * 3. Page shows "check your email" regardless of outcome
   */
  const requestPasswordReset = useCallback(async (payload: PasswordResetPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      store.clearError()
      const result = await authAPI.requestPasswordReset(payload)
      if (!result.success) {
        store.setError(result.error || 'Request failed')
        return { success: false, error: result.error }
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

  /**
   * CONFIRM PASSWORD RESET
   * 1. Called from the reset password page (user clicked link in email)
   * 2. Calls POST /api/v1/auth/password-reset/confirm/ with token + new_password
   * 3. On success: page redirects to login with a success message
   */
  const confirmPasswordReset = useCallback(async (payload: PasswordResetConfirmPayload): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      store.clearError()
      const result = await authAPI.confirmPasswordReset(payload)
      if (!result.success) {
        store.setError(result.error || 'Reset failed')
        return { success: false, error: result.error }
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

  /**
   * LOGOUT
   * 1. Calls POST /api/v1/auth/logout/ with the refresh token to blacklist it server-side
   * 2. authAPI.logout() always calls store.logout() — even if the API call fails —
   *    so tokens and user are cleared from Zustand + localStorage regardless
   */
  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
      // authAPI.logout already clears store on failure — nothing extra needed
    }
  }, [])

  /**
   * LOAD CURRENT USER
   * 1. Called on app boot (in App.tsx or a route guard) after hydrating the token
   * 2. Calls GET /api/v1/auth/me/ using the stored token
   * 3. On success: updates the user object in the store (refreshes any stale data)
   * 4. On failure: the token is likely expired or invalid — caller should redirect to login
   */
  const loadCurrentUser = useCallback(async (): Promise<AuthResult> => {
    const store = useAuthStore.getState()
    try {
      store.setLoading(true)
      const result = await authAPI.getCurrentUser()
      const userData = result.data

      if (result.success && userData) {
        const user: User = {
          id: userData.id as unknown as number,
          email: userData.email,
          name: `${userData.first_name} ${userData.last_name}`.trim(),
          role: userData.role,
          createdAt: userData.created_at,
        }
        store.setUser(user)
        return { success: true, user }
      }

      return { success: false, error: 'Failed to load user' }
    } catch (error) {
      console.error('Failed to load user:', error)
      return { success: false, error: 'Failed to load user' }
    } finally {
      store.setLoading(false)
    }
  }, [])

  /**
   * CLEAR ERROR
   * Stable — accesses store via getState() so it never changes reference.
   * Safe to put in useEffect dependency arrays without causing re-fire loops.
   */
  const clearError = useCallback(() => {
    useAuthStore.getState().clearError()
  }, [])

  return {
    // Reactive state
    user,
    isAuthenticated,
    isLoading,
    error,
    // Actions
    login,
    signup,
    verifyEmail,
    requestPasswordReset,
    confirmPasswordReset,
    logout,
    loadCurrentUser,
    clearError,
  }
}