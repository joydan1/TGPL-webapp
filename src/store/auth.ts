import { create } from 'zustand'
import type { User } from '../types/index'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  setLoading: (isLoading: boolean) => void
  clearError: () => void
  setError: (error: string | null) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  login: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setLoading: (isLoading) => set({ isLoading }),
  clearError: () => set({ error: null }),
  setError: (error) => set({ error }),

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),

  // Single source of truth — store owns localStorage for tokens
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },

  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem('refreshToken', token)
    } else {
      localStorage.removeItem('refreshToken')
    }
    set({ refreshToken: token })
  },

  login: (user, token, refreshToken) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }
    set({
      user,
      token,
      refreshToken: refreshToken ?? null,
      isAuthenticated: true,
      error: null,
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      error: null,
    })
  },

  hydrate: () => {
    const token = localStorage.getItem('token')
    const refreshToken = localStorage.getItem('refreshToken')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ token, refreshToken, user, isAuthenticated: true })
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    }
  },
}))