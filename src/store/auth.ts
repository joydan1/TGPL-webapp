import { create } from 'zustand'
import type { User } from '../types/index'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  setLoading: (isLoading: boolean) => void
  clearError: () => void
  setError: (error: string | null) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  setLoading: (isLoading) => set({ isLoading }),
  clearError: () => set({ error: null }),
  setError: (error) => set({ error }),
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setToken: (token) => set({ token }),
  login: (user, token) => set({ user, token, isAuthenticated: true, error: null }),
  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    }),
}))
