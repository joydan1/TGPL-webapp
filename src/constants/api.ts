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
  // Courses
  COURSES_LIST: '/v1/courses/',
  COURSE_DETAIL: (slug: string) => `/v1/courses/${slug}/`,
  COURSE_ENROLL: (slug: string) => `/v1/courses/${slug}/enroll/`,
  COURSE_ASSIGNMENTS: (slug: string) => `/v1/courses/${slug}/assignments/`,
// Courses — trainer "manage" / wizard side
  COURSES_MANAGE_CREATE: '/v1/courses/manage/',
  COURSES_MANAGE_DETAIL: (courseId: string) => `/v1/courses/manage/${courseId}/`,
  COURSES_MANAGE_CURRICULUM: (courseId: string) => `/v1/courses/manage/${courseId}/curriculum/`,
  COURSES_MANAGE_MODULES: (courseId: string) => `/v1/courses/manage/${courseId}/modules/`,
  COURSES_MANAGE_MODULES_REORDER: (courseId: string) => `/v1/courses/manage/${courseId}/modules/reorder/`,
  COURSES_MANAGE_MODULE_DETAIL: (moduleId: string) => `/v1/courses/manage/modules/${moduleId}/`,
  COURSES_MANAGE_MODULE_LESSONS: (moduleId: string) => `/v1/courses/manage/modules/${moduleId}/lessons/`,
  COURSES_MANAGE_MODULE_LESSONS_REORDER: (moduleId: string) =>
    `/v1/courses/manage/modules/${moduleId}/lessons/reorder/`,
  COURSES_MANAGE_LESSON_DETAIL: (lessonId: string) => `/v1/courses/manage/lessons/${lessonId}/`,

   // Courses — uploads (used for cover image, lesson video, lesson resources)
  COURSES_UPLOADS_PRESIGN: '/v1/courses/uploads/presign/',
  COURSES_UPLOADS_CONFIRM: '/v1/courses/uploads/confirm/',
 
LEARNER_PROFILE: '/v1/users/me/learner-profile/',
 // Live sessions — learner side
  LIVE_BOOKINGS: '/v1/live/bookings/',
  LIVE_BOOKING_CANCEL: (bookingId: string) => `/v1/live/bookings/${bookingId}/cancel/`,
  LIVE_COURSE_SLOTS: (courseSlug: string) => `/v1/live/courses/${courseSlug}/slots/`,
  LIVE_SESSIONS: '/v1/live/sessions/',
  LIVE_SESSION_DETAIL: (sessionId: string) => `/v1/live/sessions/${sessionId}/`,
  LIVE_SLOT_BOOK: (slotId: string) => `/v1/live/slots/${slotId}/book/`,
 
  // Live sessions — trainer/manage side
  LIVE_MANAGE_BOOKINGS: '/v1/live/manage/bookings/',
  LIVE_MANAGE_BOOKING_CONFIRM: (bookingId: string) => `/v1/live/manage/bookings/${bookingId}/confirm/`,
  LIVE_MANAGE_BOOKING_REJECT: (bookingId: string) => `/v1/live/manage/bookings/${bookingId}/reject/`,
  LIVE_MANAGE_COURSE_SESSIONS: (courseSlug: string) => `/v1/live/manage/courses/${courseSlug}/sessions/`,
  LIVE_MANAGE_COURSE_SLOTS: (courseSlug: string) => `/v1/live/manage/courses/${courseSlug}/slots/`,
  LIVE_MANAGE_SESSION: (sessionId: string) => `/v1/live/manage/sessions/${sessionId}/`,
  LIVE_MANAGE_SESSION_CANCEL: (sessionId: string) => `/v1/live/manage/sessions/${sessionId}/cancel/`,
  LIVE_MANAGE_SESSION_END: (sessionId: string) => `/v1/live/manage/sessions/${sessionId}/end/`,
  LIVE_MANAGE_SESSION_GO_LIVE: (sessionId: string) => `/v1/live/manage/sessions/${sessionId}/go-live/`,
  LIVE_MANAGE_SLOT: (slotId: string) => `/v1/live/manage/slots/${slotId}/`,
  // Test endpoints — dev only
  ...(import.meta.env.DEV && {
    TEST_LEARNER: '/v1/auth/_test/learner-only/',
    TEST_TRAINER: '/v1/auth/_test/trainer-only/',
    TEST_ADMIN: '/v1/auth/_test/admin-only/',
  }),
} as const