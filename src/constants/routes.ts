/**
 * TGPL WebApp Routes
 * Central configuration for all application routes
 * Used throughout the app for navigation and routing
 */

export const ROUTES = {
  // ===========================
  // PUBLIC ROUTES (No auth required)
  // ===========================
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password/:token',
  GET_STARTED: '/getstarted',
  CONTACT: '/contact',
  ABOUT: '/about',
  SERVICES: '/services',
  FOUNDER: '/founder',

  // ===========================
  // LEARNER ROUTES (Authenticated learners only)
  // ===========================
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  COURSES: '/courses',
  COURSE_DETAIL: '/courses/:id',
  COURSE_LEARN: '/courses/:id/learn/:lessonId',
  COURSE_ASSIGNMENTS: '/courses/:id/assignments',
  ASSIGNMENT_DETAIL: '/assignments/:id',
  ASSIGNMENT_SUBMIT: '/assignments/:id/submit',
  ASSIGNMENT_FEEDBACK: '/assignments/:id/feedback',
  LIVE_SESSIONS: '/live-sessions',
  LIVE_SESSION_JOIN: '/live-sessions/:id/join',
  TUTOR_BOOKING: '/tutor-booking',
  TUTOR_AVAILABILITY: '/tutors/:tutorId/availability',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',
  PROGRESS: '/progress',
  CERTIFICATES: '/certificates',
  CERTIFICATE_DETAIL: '/certificates/:id',

  // ===========================
  // TRAINER ROUTES (Authenticated trainers only)
  // ===========================
  TRAINER_DASHBOARD: '/trainer/dashboard',
  TRAINER_COURSES: '/trainer/courses',
  TRAINER_COURSE_CREATE: '/trainer/courses/create',
  TRAINER_COURSE_EDIT: '/trainer/courses/:id/edit',
  TRAINER_COURSE_MANAGE: '/trainer/courses/:id/manage',
  TRAINER_COURSE_MODULES: '/trainer/courses/:id/modules',
  TRAINER_MODULE_EDIT: '/trainer/modules/:id/edit',
  TRAINER_ASSIGNMENTS: '/trainer/assignments',
  TRAINER_ASSIGNMENT_DETAIL: '/trainer/assignments/:id',
  TRAINER_SUBMISSIONS: '/trainer/submissions',
  TRAINER_SUBMISSION_DETAIL: '/trainer/submissions/:id',
  TRAINER_SUBMISSION_GRADE: '/trainer/submissions/:id/grade',
  TRAINER_LEARNERS: '/trainer/learners',
  TRAINER_LEARNER_DETAIL: '/trainer/learners/:id',
  TRAINER_LIVE_SESSIONS: '/trainer/live-sessions',
  TRAINER_LIVE_SESSION_CREATE: '/trainer/live-sessions/create',
  TRAINER_LIVE_SESSION_EDIT: '/trainer/live-sessions/:id/edit',
  TRAINER_AVAILABILITY: '/trainer/availability',
  TRAINER_BOOKINGS: '/trainer/bookings',
  TRAINER_ANALYTICS: '/trainer/analytics',

  // ===========================
  // ADMIN ROUTES (Authenticated admins only)
  // ===========================
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_USERS_CREATE: '/admin/users/create',
  ADMIN_USER_DETAIL: '/admin/users/:id',
  ADMIN_USER_EDIT: '/admin/users/:id/edit',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_COURSE_CREATE: '/admin/courses/create',
  ADMIN_COURSE_DETAIL: '/admin/courses/:id',
  ADMIN_COURSE_EDIT: '/admin/courses/:id/edit',
  ADMIN_TRAINERS: '/admin/trainers',
  ADMIN_TRAINER_DETAIL: '/admin/trainers/:id',
  ADMIN_LEARNERS: '/admin/learners',
  ADMIN_LEARNER_DETAIL: '/admin/learners/:id',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_PAYMENTS: '/admin/payments',
  ADMIN_PAYMENT_DETAIL: '/admin/payments/:id',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_SYSTEM_HEALTH: '/admin/system-health',

  // ===========================
  // ERROR PAGES
  // ===========================
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/401',
  FORBIDDEN: '/403',
  SERVER_ERROR: '/500',
  ERROR: '/error',
} as const

/**
 * Helper function to get route with dynamic parameters
 * Example: getRoute(ROUTES.COURSE_DETAIL, { id: '123' })
 * Returns: '/courses/123'
 */
export const getRoute = (
  route: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return route

  let result = route
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`:${key}`, String(value))
  })
  return result
}

/**
 * Route Groups - useful for checking route types
 */
export const ROUTE_GROUPS = {
  PUBLIC: [ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.FORGOT_PASSWORD, ROUTES.RESET_PASSWORD],
  LEARNER: [
    ROUTES.DASHBOARD,
    ROUTES.COURSES,
    ROUTES.PROFILE,
    ROUTES.NOTIFICATIONS,
  ],
  TRAINER: [
    ROUTES.TRAINER_DASHBOARD,
    ROUTES.TRAINER_COURSES,
    ROUTES.TRAINER_LEARNERS,
  ],
  ADMIN: [
    ROUTES.ADMIN_DASHBOARD,
    ROUTES.ADMIN_USERS,
    ROUTES.ADMIN_COURSES,
  ],
} as const

/**
 * Route Metadata - helpful for navigation menus, breadcrumbs, etc
 */
export const ROUTE_METADATA: Record<
  string,
  {
    title: string
    description?: string
    requiresAuth?: boolean
    requiredRole?: 'learner' | 'trainer' | 'admin'
    showInNav?: boolean
  }
> = {
  // Public routes
  [ROUTES.LOGIN]: {
    title: 'Log In',
    description: 'Sign in to your TGPL account',
    requiresAuth: false,
  },
  [ROUTES.SIGNUP]: {
    title: 'Sign Up',
    description: 'Create a new TGPL account',
    requiresAuth: false,
  },

  // Learner routes
  [ROUTES.DASHBOARD]: {
    title: 'Dashboard',
    description: 'Your learning dashboard',
    requiresAuth: true,
    requiredRole: 'learner',
    showInNav: true,
  },
  [ROUTES.COURSES]: {
    title: 'Courses',
    description: 'Browse all available courses',
    requiresAuth: true,
    requiredRole: 'learner',
    showInNav: true,
  },
  [ROUTES.COURSE_DETAIL]: {
    title: 'Course Details',
    description: 'View course information',
    requiresAuth: true,
    requiredRole: 'learner',
  },
  [ROUTES.COURSE_LEARN]: {
    title: 'Learn',
    description: 'Course learning page',
    requiresAuth: true,
    requiredRole: 'learner',
  },
  [ROUTES.PROFILE]: {
    title: 'Profile',
    description: 'Your profile settings',
    requiresAuth: true,
    requiredRole: 'learner',
    showInNav: true,
  },
  [ROUTES.NOTIFICATIONS]: {
    title: 'Notifications',
    description: 'Your notifications',
    requiresAuth: true,
    requiredRole: 'learner',
    showInNav: true,
  },
  [ROUTES.PROGRESS]: {
    title: 'Progress',
    description: 'Your learning progress',
    requiresAuth: true,
    requiredRole: 'learner',
    showInNav: true,
  },

  // Trainer routes
  [ROUTES.TRAINER_DASHBOARD]: {
    title: 'Trainer Dashboard',
    description: 'Trainer dashboard',
    requiresAuth: true,
    requiredRole: 'trainer',
    showInNav: true,
  },
  [ROUTES.TRAINER_COURSES]: {
    title: 'My Courses',
    description: 'Manage your courses',
    requiresAuth: true,
    requiredRole: 'trainer',
    showInNav: true,
  },
  [ROUTES.TRAINER_LEARNERS]: {
    title: 'Learners',
    description: 'Manage your learners',
    requiresAuth: true,
    requiredRole: 'trainer',
    showInNav: true,
  },

  // Admin routes
  [ROUTES.ADMIN_DASHBOARD]: {
    title: 'Admin Dashboard',
    description: 'Admin control panel',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
  [ROUTES.ADMIN_USERS]: {
    title: 'Users',
    description: 'Manage platform users',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
  [ROUTES.ADMIN_COURSES]: {
    title: 'Courses',
    description: 'Manage all courses',
    requiresAuth: true,
    requiredRole: 'admin',
    showInNav: true,
  },
} as const

/**
 * Type-safe route navigation
 * Usage:
 * const to = RouteBuilder.course(123)
 * const to = RouteBuilder.profile()
 */
export const RouteBuilder = {
  login: () => ROUTES.LOGIN,
  signup: () => ROUTES.SIGNUP,
  onboarding: () => ROUTES.ONBOARDING,
  dashboard: () => ROUTES.DASHBOARD,
  courses: () => ROUTES.COURSES,
  course: (id: string | number) => getRoute(ROUTES.COURSE_DETAIL, { id }),
  courseLearn: (courseId: string | number, lessonId: string | number) =>
    getRoute(ROUTES.COURSE_LEARN, { id: courseId, lessonId }),
  courseAssignments: (courseId: string | number) =>
    getRoute(ROUTES.COURSE_ASSIGNMENTS, { id: courseId }),
  assignmentDetail: (id: string | number) =>
    getRoute(ROUTES.ASSIGNMENT_DETAIL, { id }),
  assignmentSubmit: (id: string | number) =>
    getRoute(ROUTES.ASSIGNMENT_SUBMIT, { id }),
  assignmentFeedback: (id: string | number) =>
    getRoute(ROUTES.ASSIGNMENT_FEEDBACK, { id }),
  liveSessions: () => ROUTES.LIVE_SESSIONS,
  liveSessionJoin: (id: string | number) =>
    getRoute(ROUTES.LIVE_SESSION_JOIN, { id }),
  tutorBooking: () => ROUTES.TUTOR_BOOKING,
  tutorAvailability: (tutorId: string | number) =>
    getRoute(ROUTES.TUTOR_AVAILABILITY, { tutorId }),
  profile: () => ROUTES.PROFILE,
  profileEdit: () => ROUTES.PROFILE_EDIT,
  settings: () => ROUTES.SETTINGS,
  notifications: () => ROUTES.NOTIFICATIONS,
  progress: () => ROUTES.PROGRESS,
  certificates: () => ROUTES.CERTIFICATES,
  certificateDetail: (id: string | number) =>
    getRoute(ROUTES.CERTIFICATE_DETAIL, { id }),

  // Trainer routes
  trainerDashboard: () => ROUTES.TRAINER_DASHBOARD,
  trainerCourses: () => ROUTES.TRAINER_COURSES,
  trainerCourseCreate: () => ROUTES.TRAINER_COURSE_CREATE,
  trainerCourseEdit: (id: string | number) =>
    getRoute(ROUTES.TRAINER_COURSE_EDIT, { id }),
  trainerCourseManage: (id: string | number) =>
    getRoute(ROUTES.TRAINER_COURSE_MANAGE, { id }),
  trainerLearners: () => ROUTES.TRAINER_LEARNERS,
  trainerLearnerDetail: (id: string | number) =>
    getRoute(ROUTES.TRAINER_LEARNER_DETAIL, { id }),
  trainerSubmissions: () => ROUTES.TRAINER_SUBMISSIONS,
  trainerSubmissionDetail: (id: string | number) =>
    getRoute(ROUTES.TRAINER_SUBMISSION_DETAIL, { id }),
  trainerSubmissionGrade: (id: string | number) =>
    getRoute(ROUTES.TRAINER_SUBMISSION_GRADE, { id }),
  trainerLiveSessions: () => ROUTES.TRAINER_LIVE_SESSIONS,
  trainerLiveSessionCreate: () => ROUTES.TRAINER_LIVE_SESSION_CREATE,
  trainerAvailability: () => ROUTES.TRAINER_AVAILABILITY,
  trainerBookings: () => ROUTES.TRAINER_BOOKINGS,
  trainerAnalytics: () => ROUTES.TRAINER_ANALYTICS,

  // Admin routes
  adminDashboard: () => ROUTES.ADMIN_DASHBOARD,
  adminUsers: () => ROUTES.ADMIN_USERS,
  adminUserCreate: () => ROUTES.ADMIN_USERS_CREATE,
  adminUserDetail: (id: string | number) =>
    getRoute(ROUTES.ADMIN_USER_DETAIL, { id }),
  adminUserEdit: (id: string | number) =>
    getRoute(ROUTES.ADMIN_USER_EDIT, { id }),
  adminCourses: () => ROUTES.ADMIN_COURSES,
  adminCourseCreate: () => ROUTES.ADMIN_COURSE_CREATE,
  adminCourseDetail: (id: string | number) =>
    getRoute(ROUTES.ADMIN_COURSE_DETAIL, { id }),
  adminCourseEdit: (id: string | number) =>
    getRoute(ROUTES.ADMIN_COURSE_EDIT, { id }),
  adminTrainers: () => ROUTES.ADMIN_TRAINERS,
  adminTrainerDetail: (id: string | number) =>
    getRoute(ROUTES.ADMIN_TRAINER_DETAIL, { id }),
  adminLearners: () => ROUTES.ADMIN_LEARNERS,
  adminLearnerDetail: (id: string | number) =>
    getRoute(ROUTES.ADMIN_LEARNER_DETAIL, { id }),
  adminAnalytics: () => ROUTES.ADMIN_ANALYTICS,
  adminPayments: () => ROUTES.ADMIN_PAYMENTS,
  adminPaymentDetail: (id: string | number) =>
    getRoute(ROUTES.ADMIN_PAYMENT_DETAIL, { id }),
  adminSettings: () => ROUTES.ADMIN_SETTINGS,

  // Error routes
  notFound: () => ROUTES.NOT_FOUND,
  unauthorized: () => ROUTES.UNAUTHORIZED,
  forbidden: () => ROUTES.FORBIDDEN,
  serverError: () => ROUTES.SERVER_ERROR,
} as const