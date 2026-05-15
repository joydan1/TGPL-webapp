import { useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { authAPI } from '../services/api'
import type { LoginPayload, SignupPayload } from '../services/api'
import type { User } from '../types/index'

export const useAuth = () => {
  const auth = useAuthStore()

  const login = useCallback(
    async (formData: LoginPayload) => {
      try {
        auth.setLoading(true)
        auth.clearError()

        const result = await authAPI.login(formData)

        if (!result.success || !result.access) {
          auth.setError(result.error || 'Login failed')
          return { success: false, error: result.error || 'Login failed' }
        }

        // Fetch user info after successful login
        const userResult = await authAPI.getCurrentUser()
        const userData = userResult.data
        if (!userResult.success || !userData) {
          auth.setError('Failed to fetch user info')
          return { success: false, error: 'Failed to fetch user info' }
        }

        const user: User = {
          id: userData.id as unknown as number,
          email: userData.email,
          name: userData.email.split('@')[0], // Use email prefix as name for now
          role: userData.role,
          createdAt: userData.created_at,
        }

        auth.login(user, result.access)
        return { success: true, user, token: result.access }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed'
        auth.setError(message)
        return { success: false, error: message }
      } finally {
        auth.setLoading(false)
      }
    },
    [auth],
  )

  const signup = useCallback(
    async (formData: SignupPayload) => {
      try {
        auth.setLoading(true)
        auth.clearError()

        const result = await authAPI.signup(formData)

        if (!result.success) {
          auth.setError(result.error || 'Signup failed')
          return { success: false, error: result.error }
        }

        // After signup, automatically log in
        const loginResult = await authAPI.login(formData)
        if (!loginResult.success || !loginResult.access) {
          auth.setError('Signup successful but login failed')
          return { success: false, error: 'Login after signup failed' }
        }

        // Fetch user info
        const userResult = await authAPI.getCurrentUser()
        const userData = userResult.data
        if (!userResult.success || !userData) {
          auth.setError('Failed to fetch user info')
          return { success: false, error: 'Failed to fetch user info' }
        }

        const user: User = {
          id: userData.id as unknown as number,
          email: userData.email,
          name: userData.email.split('@')[0],
          role: userData.role,
          createdAt: userData.created_at,
        }

        auth.login(user, loginResult.access)
        return { success: true, user, token: loginResult.access }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Signup failed'
        auth.setError(message)
        return { success: false, error: message }
      } finally {
        auth.setLoading(false)
      }
    },
    [auth],
  )

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      auth.logout()
    }
  }, [auth])

  const loadCurrentUser = useCallback(async () => {
    try {
      auth.setLoading(true)
      const result = await authAPI.getCurrentUser()
      const userData = result.data

      if (result.success && userData) {
        const user: User = {
          id: userData.id as unknown as number,
          email: userData.email,
          name: userData.email.split('@')[0],
          role: userData.role,
          createdAt: userData.created_at,
        }
        auth.setUser(user)
        return { success: true, user }
      }

      return { success: false, error: 'Failed to load user' }
    } catch (error) {
      console.error('Failed to load user:', error)
      return { success: false, error: 'Failed to load user' }
    } finally {
      auth.setLoading(false)
    }
  }, [auth])

  return {
    // State
    user: auth.user,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    // Methods
    login,
    signup,
    logout,
    loadCurrentUser,
  }
}