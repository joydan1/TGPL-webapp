export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'https://tgpl-backend-staging.onrender.com/api'

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/v1/auth/signup/',
  LOGIN: '/v1/auth/login/',
  LOGOUT: '/v1/auth/logout/',
  ME: '/v1/auth/me/',
  REFRESH_TOKEN: '/v1/auth/token/refresh/',
  PASSWORD_RESET: '/v1/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/v1/auth/password-reset/confirm/',

  // Test endpoints (remove in production)
  TEST_LEARNER: '/v1/auth/_test/learner-only/',
  TEST_TRAINER: '/v1/auth/_test/trainer-only/',
  TEST_ADMIN: '/v1/auth/_test/admin-only/',
} as const