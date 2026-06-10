export const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'https://tgpl-webapp-backend-staging.up.railway.app/api'
export const API_ENDPOINTS = {
  // Auth
  SIGNUP: '/v1/auth/signup/',
  LOGIN: '/v1/auth/login/',
  LOGOUT: '/v1/auth/logout/',
  ME: '/v1/auth/me/',
  REFRESH_TOKEN: '/v1/auth/token/refresh/',
  EMAIL_VERIFICATION_SEND: '/v1/auth/email-verification/send/',
  EMAIL_VERIFICATION_CONFIRM: '/v1/auth/email-verification/confirm/',
  PASSWORD_RESET: '/v1/auth/password-reset/',
  PASSWORD_RESET_CONFIRM: '/v1/auth/password-reset/confirm/',
LEARNER_PROFILE: '/v1/users/me/learner-profile/',
  // Test endpoints — dev only
  ...(import.meta.env.DEV && {
    TEST_LEARNER: '/v1/auth/_test/learner-only/',
    TEST_TRAINER: '/v1/auth/_test/trainer-only/',
    TEST_ADMIN: '/v1/auth/_test/admin-only/',
  }),
} as const