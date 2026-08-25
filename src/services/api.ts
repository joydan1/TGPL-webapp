import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api'
import { useAuthStore } from '../store/auth'

// ─── Response Types ───────────────────────────────────────────────────────────

export interface ApiErrorResponse {
  detail?: string
  code?: string
  [key: string]: unknown
}

export interface UserResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'learner' | 'trainer' | 'admin'
  is_active: boolean
  is_email_verified: boolean
  created_at: string
  learner_profile: LearnerProfile | null
  trainer_profile: TrainerProfile | null
  phone: string | null
  country: string | null
  bio: string | null
  avatar_url: string | null
}

export interface LearnerProfile {
  id?: string
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
  completion_status?: 'incomplete' | 'partial' | 'complete'
  created_at?: string
  updated_at?: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

// ─── Payload Types ────────────────────────────────────────────────────────────
export interface SignupPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'learner' | 'trainer' | 'admin'
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

export interface EmailVerificationPayload {
  token: string
}

export interface EmailVerificationSendPayload {
  email: string
}

export interface LearnerProfilePayload {
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
}

export interface UpdateSettingsProfilePayload {
  first_name?: string
  last_name?: string
  phone?: string
  country?: string
  bio?: string
}
// ─── Payment Types ────────────────────────────────────────────────────────────

export interface CheckoutResponse {
  is_free: false
  reference: string
  payment_id: string
  access_code: string
  authorization_url: string
  amount_kobo: number
}

export interface FreeCourseCheckoutResponse {
  is_free: true
  reference: string
  payment_id: string
}

export interface PaymentStatusResponse {
  reference: string
  status: 'pending' | 'succeeded' | 'failed'
  amount_kobo: number
  amount_naira: string
  paid_at: string | null
  is_terminal: boolean
  failure_reason: string | null
  course: {
    slug: string
    title: string
    trainer_name: string
  }
  created_at: string
}

export interface PaymentConfigResponse {
  public_key: string
  callback_url_pattern: string
}

// ─── Explicit API result types ────────────────────────────────────────────────

export type LoginResult =
  | { success: true; access: string; refresh: string; user: UserResponse }
  | { success: false; error: string; statusCode?: number; code?: string }

export type CheckoutResult =
  | { success: true; data: CheckoutResponse | FreeCourseCheckoutResponse }
  | { success: false; error: string; statusCode?: number }


  
// ─── Routes that should NOT trigger a token refresh on 401 ───────────────────

const SKIP_REFRESH_ROUTES = [
  API_ENDPOINTS.LOGIN,
  API_ENDPOINTS.SIGNUP,
  API_ENDPOINTS.EMAIL_VERIFICATION_SEND,
  API_ENDPOINTS.EMAIL_VERIFICATION_CONFIRM,
  API_ENDPOINTS.PASSWORD_RESET,
  API_ENDPOINTS.PASSWORD_RESET_CONFIRM,
]

const SKIP_FORBIDDEN_REDIRECT_PATTERNS = [
  /\/v1\/courses\//,
]

// ─── API Client ───────────────────────────────────────────────────────────────

class ApiClient {
  private axiosInstance: AxiosInstance
  private refreshTokenPromise: Promise<string> | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error),
    )

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const url = error.config?.url || ''
        const status = error.response?.status

        if (status === 401) {
          if (SKIP_REFRESH_ROUTES.some((route) => url.includes(route))) {
            return Promise.reject(error)
          }
          return this.handleTokenExpiry(error)
        }

        if (status === 403) {
          if (
            SKIP_REFRESH_ROUTES.some((route) => url.includes(route)) ||
            SKIP_FORBIDDEN_REDIRECT_PATTERNS.some((pattern) => pattern.test(url))
          ) {
            return Promise.reject(error)
          }
          console.error('Access forbidden - insufficient permissions')
          window.location.href = '/unauthorized'
        }

        return Promise.reject(error)
      },
    )
  }

  private async handleTokenExpiry(error: AxiosError) {
    const config = error.config

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

  private async refreshAccessToken(): Promise<string> {
    const state = useAuthStore.getState()
    const refreshToken = state.refreshToken
    if (!refreshToken) throw new Error('No refresh token available')

    try {
      const response = await this.axiosInstance.post<TokenResponse>(
        API_ENDPOINTS.REFRESH_TOKEN,
        { refresh: refreshToken },
      )
      const { access, refresh } = response.data
      state.setToken(access)
      state.setRefreshToken(refresh)
      return access
    } catch (error) {
      state.setRefreshToken(null)
      throw error
    }
  }

  public async get<T>(url: string, config?: any) { return this.axiosInstance.get<T>(url, config) }
  public async post<T>(url: string, data?: unknown, config?: any) { return this.axiosInstance.post<T>(url, data, config) }
  public async put<T>(url: string, data?: unknown, config?: any) { return this.axiosInstance.put<T>(url, data, config) }
  public async patch<T>(url: string, data?: unknown, config?: any) { return this.axiosInstance.patch<T>(url, data, config) }
  public async delete<T>(url: string, config?: any) { return this.axiosInstance.delete<T>(url, config) }
}

export const apiClient = new ApiClient()

// ─── Error parser helper ──────────────────────────────────────────────────────

export function parseApiError(error: unknown, fallback: string): { message: string; statusCode?: number; code?: string } {
  const err = error as AxiosError<ApiErrorResponse>
  const data = err.response?.data
  const statusCode = err.response?.status
  const code = data?.code

  let message = fallback
  if (data) {
    if (data.detail && typeof data.detail === 'string') {
      message = data.detail
    } else {
      const firstKey = Object.keys(data).find((k) => k !== 'code')
      if (firstKey) {
        const val = data[firstKey]
        if (Array.isArray(val)) message = val[0]
        else if (typeof val === 'string') message = val
      }
    }
  }

  return { message, statusCode, code }
}

function simplifyFileError(message: string, statusCode?: number): string {
  const lower = message.toLowerCase()

  if (statusCode === 413 || lower.includes('too large') || lower.includes('exceed') || lower.includes('size limit')) {
    return 'File is too large.'
  }
  if (
    lower.includes('extension') ||
    lower.includes('content-type') ||
    lower.includes('content type') ||
    lower.includes('mismatch') ||
    lower.includes('not allowed') ||
    lower.includes('file type')
  ) {
    return 'File type not allowed.'
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Upload link expired.'
  }
  if (statusCode && statusCode >= 500) {
    return 'Upload failed — please try again.'
  }
  return 'Upload failed.'
}

function humanizeStorageUploadError(status: number): string {
  if (status === 403) return 'Upload link expired.'
  if (status === 413) return 'File is too large.'
  if (status >= 500) return 'Upload failed — please try again.'
  return 'Upload failed.'
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
 signup: async (payload: SignupPayload) => {
  try {
    const response = await apiClient.post<UserResponse>(API_ENDPOINTS.SIGNUP, {
      email: payload.email,
      password: payload.password,
      first_name: payload.firstName,
      last_name: payload.lastName,
      role: payload.role,
    })
    return { success: true as const, data: response.data }
  } catch (error) {
    const { message } = parseApiError(error, 'Signup failed')
    return { success: false as const, error: message }
  }
},

  sendVerificationEmail: async (payload: EmailVerificationSendPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.EMAIL_VERIFICATION_SEND, payload)
      return { success: true as const }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to send verification email')
      return { success: false as const, error: message }
    }
  },

  verifyEmail: async (payload: EmailVerificationPayload) => {
    try {
      const response = await apiClient.post<TokenResponse>(
        API_ENDPOINTS.EMAIL_VERIFICATION_CONFIRM,
        payload,
      )
      const { access, refresh } = response.data
      useAuthStore.getState().setToken(access)
      useAuthStore.getState().setRefreshToken(refresh)
      return { success: true as const, access, refresh }
    } catch (error) {
      const { message } = parseApiError(error, 'Verification failed. Link may be expired or already used.')
      return { success: false as const, error: message }
    }
  },

  login: async (payload: LoginPayload): Promise<LoginResult> => {
    try {
      const response = await apiClient.post<TokenResponse & { user: UserResponse }>(
        API_ENDPOINTS.LOGIN,
        payload,
      )
      const { access, refresh, user } = response.data
      useAuthStore.getState().setToken(access)
      useAuthStore.getState().setRefreshToken(refresh)
      return { success: true as const, access, refresh, user }
    } catch (error) {
      const { message, statusCode, code } = parseApiError(error, 'Invalid email or password')
      return {
        success: false as const,
        error: statusCode === 401 ? 'Invalid email or password' : message,
        statusCode,
        code,
      }
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<UserResponse>(API_ENDPOINTS.ME)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get user')
      return { success: false as const, error: message }
    }
  },

  logout: async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh: refreshToken })
      }
      useAuthStore.getState().logout()
      return { success: true as const }
    } catch (error) {
      useAuthStore.getState().logout()
      const { message } = parseApiError(error, 'Logout failed')
      return { success: false as const, error: message }
    }
  },

  requestPasswordReset: async (payload: PasswordResetPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET, payload)
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Password reset request failed')
      if (statusCode === 429) {
        return { success: false as const, error: 'Too many attempts. Please wait a moment before trying again.' }
      }
      return { success: false as const, error: message }
    }
  },

  confirmPasswordReset: async (payload: PasswordResetConfirmPayload) => {
    try {
      await apiClient.post(API_ENDPOINTS.PASSWORD_RESET_CONFIRM, payload)
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Password reset failed')
      if (statusCode === 429) {
        return { success: false as const, error: 'Too many attempts. Please wait a moment before trying again.' }
      }
      return { success: false as const, error: message }
    }
  },

 changePassword: async (current_password: string, new_password: string) => {
  try {
    await apiClient.post('/v1/auth/password-change/', {
      old_password: current_password,
      new_password,
    })
    // Backend invalidates all refresh tokens on success — the caller must
    // log in again, so clear local auth state right away.
    useAuthStore.getState().logout()
    return { success: true as const }
  } catch (error) {
    const { message, statusCode } = parseApiError(error, 'Failed to change password')
    return { success: false as const, error: message, statusCode }
  }
},

  ...(import.meta.env.DEV && {
    testLearnerOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/learner-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Learner test failed' } }
    },
    testTrainerOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/trainer-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Trainer test failed' } }
    },
    testAdminOnly: async () => {
      try {
        const response = await apiClient.get('/v1/auth/_test/admin-only/')
        return { success: true, data: response.data }
      } catch { return { success: false, error: 'Admin test failed' } }
    },
  }),
  
}

// ─── Payment API ──────────────────────────────────────────────────────────────

export const paymentAPI = {
  getConfig: async () => {
    try {
      const response = await apiClient.get<PaymentConfigResponse>('/v1/payments/config/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to load payment configuration')
      return { success: false as const, error: message }
    }
  },

  checkout: async (courseSlug: string): Promise<CheckoutResult> => {
    try {
      const response = await apiClient.post<CheckoutResponse | FreeCourseCheckoutResponse>(
        '/v1/payments/checkout/',
        { course_slug: courseSlug },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to initiate payment')
      return { success: false as const, error: message, statusCode }
    }
  },

  getStatus: async (reference: string) => {
    try {
      const response = await apiClient.get<PaymentStatusResponse>(`/v1/payments/${reference}/`)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get payment status')
      return { success: false as const, error: message }
    }
  },
}

// ─── Learner Profile API ──────────────────────────────────────────────────────

export const learnerProfileAPI = {
  getLearnerProfile: async () => {
    try {
      const response = await apiClient.get<LearnerProfile>('/v1/users/me/learner-profile/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get learner profile')
      return { success: false as const, error: message }
    }
  },
  updateSettingsProfile: async (payload: UpdateSettingsProfilePayload) => {
    try {
      const response = await apiClient.patch<UserResponse>('/v1/auth/me/', payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update profile')
      return { success: false as const, error: message, statusCode }
    }
  },
  updateLearnerProfile: async (payload: LearnerProfilePayload) => {
    try {
      const response = await apiClient.patch<LearnerProfile>(
        '/v1/users/me/learner-profile/',
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to update learner profile')
      return { success: false as const, error: message }
    }
  },
}

// ─── Course Types ─────────────────────────────────────────────────────────────

export interface EnrollmentStatusResponse {
  enrolled: boolean
  source?: string
  enrolled_at?: string | null
  access_expires_at?: string | null
}

export type LessonStatus = 'completed' | 'current' | 'available' | 'locked'

export interface ProgressLesson {
  id: string
  title: string
  duration_display: string
  status: LessonStatus
}

export interface ProgressModule {
  id: string
  title: string
  order: number
  lessons: ProgressLesson[]
}

export interface CourseProgressOverall {
  lessons_completed: number
  lessons_total: number
  percent: number
  next_incomplete_lesson: {
    id: string
    module_id: string
    title: string
  } | null
  estimated_seconds_remaining: number
}

export interface CourseProgressModuleSummary {
  module_id: string
  lessons_completed: number
  lessons_total: number
}

export interface CourseProgressResponse {
  overall: CourseProgressOverall
  modules: CourseProgressModuleSummary[]
  completed_lesson_ids: string[]
}

export interface LessonResource {
  id: string
  title: string
  resource_type: 'template' | 'worksheet' | 'slides' | 'document' | 'other'
  file_format: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'image' | 'other' | null
  file_size: number
  created_at: string
  download_url?: string
}

export interface AdjacentLesson {
  id: string
  title: string
  duration_display: string
}

export interface LessonAssignmentSummary {
  id: string
  title: string
  module_title?: string
  due_at?: string | null
  status?: 'not_started' | 'in_progress' | 'graded' | string
}

export interface LessonDetailResponse {
  id: string
  title: string
  module: { id: string; title: string; order: number }
  course: { slug: string; title: string }
  video_url: string
  duration_seconds: number
  duration_display: string
  status: LessonStatus
  notes?: string | null
  resources?: LessonResource[]
  downloadable_resources?: LessonResource[]
  assignments?: LessonAssignmentSummary[]
  previous_lesson: AdjacentLesson | null
  next_lesson: (AdjacentLesson & { thumbnail?: string | null }) | null
  resume_position_seconds: number | null
}

export interface LessonCompleteRawResponse {
  lesson_id: string
  completed_at: string
}

export interface LessonCompleteResponse extends LessonCompleteRawResponse {
  course_progress_percentage_before?: number
  course_progress_percentage_after?: number
  lessons_completed?: number
  lessons_total?: number
  next_lesson?: (AdjacentLesson & { thumbnail?: string | null }) | null
}

export interface SavePositionResponse {
  lesson_id: string
  position_seconds: number
  updated_at: string
}

export interface LearnCourseHeader {
  id: string
  slug: string
  title: string
  category: string
  status: string
}

export interface LearnCourseProgress {
  percent: number
  lessons_completed: number
  lessons_total: number
  total_duration_seconds: number
  estimated_seconds_remaining: number
  next_incomplete_lesson: {
    id: string
    module_id: string
    title: string
  } | null
}

export interface LearnModuleLessonSummary {
  id: string
  title: string
  order: number
  duration_seconds: number
  is_completed: boolean
  is_next: boolean
  is_preview: boolean
}

export interface LearnModuleAssignmentSummary {
  id: string
  title: string
  deadline: string | null
  order: number
  my_submission_status: string
}

export interface LearnModule {
  id: string
  title: string
  order: number
  lessons_completed: number
  lessons_total: number
  is_current: boolean
  lessons: LearnModuleLessonSummary[]
  assignments: LearnModuleAssignmentSummary[]
}

export interface CourseLearnViewResponse {
  course: LearnCourseHeader
  progress: LearnCourseProgress
  modules: LearnModule[]
}


// ─── Course Detail (public) ────────────────────────────────────────────────

export interface CoursePublicTrainer {
  id: string
  name: string
  credential: string | null
}

export interface CourseDetailResponse {
  id: string
  slug: string
  title: string
  trainer: CoursePublicTrainer
  
}


// ─── Courses API ──────────────────────────────────────────────────────────────

export const coursesAPI = {
  getEnrollmentStatus: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<EnrollmentStatusResponse>(
        `/v1/courses/${courseSlug}/enrollment-status/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to check enrollment status')
      return { success: false as const, error: message, statusCode }
    }
  },

  getCourseDetail: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<CourseDetailResponse>(`/v1/courses/${courseSlug}/`)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load course')
      return { success: false as const, error: message, statusCode }
    }
  },

  enrollFree: async (courseSlug: string) => {
    try {
      const response = await apiClient.post<{ enrolled: boolean }>(
        `/v1/courses/${courseSlug}/enroll/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to enroll in free course')
      return { success: false as const, error: message, statusCode }
    }
  },

  getCourseProgress: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<CourseProgressResponse>(
        `/v1/courses/${courseSlug}/progress/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load course progress')
      return { success: false as const, error: message, statusCode }
    }
  },

  getCourseLearnView: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<CourseLearnViewResponse>(
        `/v1/courses/${courseSlug}/learn/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load course learning view')
      return { success: false as const, error: message, statusCode }
    }
  },

  getLesson: async (courseSlug: string, lessonId: string) => {
    try {
      const response = await apiClient.get<LessonDetailResponse>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load lesson')
      return { success: false as const, error: message, statusCode }
    }
  },

  completeLesson: async (courseSlug: string, lessonId: string) => {
    try {
      const beforeResponse = await apiClient.get<CourseProgressResponse>(
        `/v1/courses/${courseSlug}/progress/`,
      )
      const response = await apiClient.post<LessonCompleteResponse>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/complete/`,
      )
      const afterResponse = await apiClient.get<CourseProgressResponse>(
        `/v1/courses/${courseSlug}/progress/`,
      )
      return {
        success: true as const,
        data: {
          ...response.data,
          course_progress_percentage_before: beforeResponse.data.overall.percent,
          course_progress_percentage_after:  afterResponse.data.overall.percent,
          lessons_completed: afterResponse.data.overall.lessons_completed,
          lessons_total:     afterResponse.data.overall.lessons_total,
          next_lesson:       response.data.next_lesson ?? null,
        },
      }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to mark lesson complete')
      return { success: false as const, error: message, statusCode }
    }
  },

  saveLessonNotes: async (courseSlug: string, lessonId: string, notes: string) => {
    try {
      const response = await apiClient.put<{
        lesson_id: string
        content: string
        updated_at: string
      }>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/note/`,
        { content: notes },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to save notes')
      return { success: false as const, error: message, statusCode }
    }
  },

  getResourceDownloadUrl: async (courseSlug: string, lessonId: string, resourceId: string) => {
    try {
      const response = await apiClient.get<{ download_url: string; expires_in: number }>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/resources/${resourceId}/download/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to get download URL')
      return { success: false as const, error: message, statusCode }
    }
  },

  savePosition: async (courseSlug: string, lessonId: string, positionSeconds: number) => {
    try {
      const response = await apiClient.put<SavePositionResponse>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/position/`,
        { position_seconds: positionSeconds },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to save position')
      return { success: false as const, error: message, statusCode }
    }
  },
}
export type TrainerSessionStatus = 'upcoming' | 'live' | 'ended' | 'cancelled'

export interface TrainerSession {
  id: string
  course_id: string
  course_slug: string
  course_title: string
  title: string
  topic: string
  starts_at: string
  ends_at: string
  duration_minutes: number
  status: TrainerSessionStatus
  join_url: string | null
}

export const trainerSessionsAPI = {
  /** GET /v1/trainer/sessions/?status=upcoming|live|past — past includes ended + cancelled */
  getSessions: async (status: 'upcoming' | 'live' | 'past' = 'upcoming', page?: number) => {
    try {
      const query = new URLSearchParams()
      query.set('status', status)
      if (page) query.set('page', String(page))
      const response = await apiClient.get<{
        count: number
        next: string | null
        previous: string | null
        results: TrainerSession[]
      }>(`/v1/trainer/sessions/?${query.toString()}`)
      return { success: true as const, data: response.data.results, count: response.data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load sessions')
      return { success: false as const, error: message, statusCode }
    }
  },
}
// ─── Live Session Types ────────────────────────────────────────────────────
 
export type LiveBookingStatus = 'requested' | 'confirmed' | 'rejected' | 'cancelled'
export type LiveSlotStatus = 'open' | 'booked' | 'unavailable'
 
export interface LiveCourseRef {
  slug: string
  title: string
}
 
export interface LiveLearnerRef {
  id: string
  name: string
  avatar?: string | null
}
 
export interface LiveSlot {
  id: string
  course_id: string
  trainer_id: string
  starts_at: string
  ends_at: string
  status: LiveSlotStatus
}
 
export interface LiveSession {
  id: string
  title: string
  course_id?: string
  topic?: string
  starts_at?: string
  ends_at?: string
  status?: 'upcoming' | 'live' | 'ended' | 'cancelled' | 'scheduled' | 'completed'
  join_url?: string | null
  course?: LiveCourseRef
  date?: string
  start_time?: string
  end_time?: string
  duration_minutes?: number
  meeting_link?: string | null
  recording_url?: string | null
  recording_views?: number
}
 
export type LiveManageBooking = {
  id: string
  slot_id: string
  course_id: string
  status: 'requested' | 'confirmed' | 'rejected' | string
  slot_starts_at: string
  slot_ends_at: string
  recording_url?: string | null
  created_at: string
  learner_name: string
}
 export interface EnrolledCourseOption {
  course_id: string
  course_slug: string
  title: string
  category: string
  thumbnail_url: string
  trainer_name: string
  module_count: number
  completion_percentage: number
  last_accessed_at: string | null
  enrolled_at: string
  source: string
  resume_url: string
}

export interface LearnerLiveSession {
  id: string
  course_id: string
  title: string
  topic: string
  starts_at: string
  ends_at: string
  status: 'upcoming' | 'live' | 'ended' | 'cancelled'
  join_url: string
  trainer_name: string
}
 
export interface JoinSessionResponse {
  join_url: string
}

export interface LiveSlotBooking {
  id: string
  slot_id: string
  course_id: string
  status: LiveBookingStatus
  slot_starts_at: string
  slot_ends_at: string
  recording_url: string | null
  created_at: string
  course_title?: string
  trainer_name?: string
}
export interface CreateSlotPayload {
  starts_at: string
  ends_at: string
  status?: LiveSlotStatus
}
export interface PublishSessionPayload {
  title: string
  topic?: string
  starts_at: string
  ends_at: string
  join_url?: string
}

export const liveSessionsAPI = {
  /** GET /v1/live/manage/bookings/ — bookings on the trainer's slots */
  getManageBookings: async () => {
    try {
      const response = await apiClient.get<LiveManageBooking[] | { results: LiveManageBooking[] }>(
        API_ENDPOINTS.LIVE_MANAGE_BOOKINGS,
      )
      const data = Array.isArray(response.data) ? response.data : response.data.results
      return { success: true as const, data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load live sessions')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/live/manage/bookings/{id}/confirm/ */
  confirmBooking: async (bookingId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.LIVE_MANAGE_BOOKING_CONFIRM(bookingId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to confirm booking')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/live/manage/bookings/{id}/reject/ */
  rejectBooking: async (bookingId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.LIVE_MANAGE_BOOKING_REJECT(bookingId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to reject booking')
      return { success: false as const, error: message, statusCode }
    }
  },
 /** PATCH /v1/live/manage/bookings/{id}/recording/ — set recording link on a 1:1 booking (owner) */
  setBookingRecording: async (bookingId: string, recordingUrl: string) => {
    try {
      const response = await apiClient.patch<LiveManageBooking>(
        API_ENDPOINTS.LIVE_MANAGE_BOOKING_RECORDING(bookingId),
        { recording_url: recordingUrl },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to save recording link')
      return { success: false as const, error: message, statusCode }
    }
  },
  /** GET /v1/live/manage/courses/{slug}/slots/ — owner's availability slots */
  getManageCourseSlots: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<LiveSlot[] | { results: LiveSlot[] }>(
        API_ENDPOINTS.LIVE_MANAGE_COURSE_SLOTS(courseSlug),
      )
      const data = Array.isArray(response.data) ? response.data : response.data.results
      return { success: true as const, data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load availability slots')
      return { success: false as const, error: message, statusCode }
    }
  },
  getEnrolledCoursesForBooking: async () => {
    try {
      const response = await apiClient.get<{ enrolled_courses: EnrolledCourseOption[] }>(
        '/v1/me/dashboard/',
      )
      return { success: true as const, data: response.data.enrolled_courses ?? [] }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load your courses')
      return { success: false as const, error: message, statusCode }
    }
  },
  /** POST /v1/live/manage/courses/{slug}/slots/ — create an availability slot */
  createManageCourseSlot: async (courseSlug: string, payload: CreateSlotPayload) => {
    try {
      const response = await apiClient.post<LiveSlot>(
        API_ENDPOINTS.LIVE_MANAGE_COURSE_SLOTS(courseSlug),
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to create slot')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** PATCH /v1/live/manage/slots/{id}/ */
  updateManageSlot: async (slotId: string, payload: Partial<CreateSlotPayload>) => {
    try {
      const response = await apiClient.patch<LiveSlot>(API_ENDPOINTS.LIVE_MANAGE_SLOT(slotId), payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update slot')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** DELETE /v1/live/manage/slots/{id}/ */
  deleteManageSlot: async (slotId: string) => {
    try {
      await apiClient.delete(API_ENDPOINTS.LIVE_MANAGE_SLOT(slotId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to delete slot')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/live/manage/courses/{slug}/sessions/ — publish a live session */
  publishSession: async (courseSlug: string, payload: PublishSessionPayload) => {
    try {
      const response = await apiClient.post<LiveSession>(
        API_ENDPOINTS.LIVE_MANAGE_COURSE_SESSIONS(courseSlug),
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to publish session')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** PATCH /v1/live/manage/sessions/{id}/ */
  updateSession: async (sessionId: string, payload: Partial<PublishSessionPayload>) => {
    try {
      const response = await apiClient.patch<LiveSession>(
        API_ENDPOINTS.LIVE_MANAGE_SESSION(sessionId),
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update session')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/live/manage/sessions/{id}/cancel/ */
  cancelSession: async (sessionId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.LIVE_MANAGE_SESSION_CANCEL(sessionId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to cancel session')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/live/manage/sessions/{id}/end/ — flip LIVE → ENDED */
  endSession: async (sessionId: string) => {
    try {
      const response = await apiClient.post<LiveSession>(API_ENDPOINTS.LIVE_MANAGE_SESSION_END(sessionId))
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to end session')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/live/manage/sessions/{id}/go-live/ — flip UPCOMING → LIVE, reveals join_url to learners. 409 if already ended/cancelled. */
  goLiveSession: async (sessionId: string) => {
    try {
      const response = await apiClient.post<LiveSession>(API_ENDPOINTS.LIVE_MANAGE_SESSION_GO_LIVE(sessionId))
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(
        error,
        'Failed to go live. The session may have already ended or been cancelled.',
      )
      return { success: false as const, error: message, statusCode }
    }
  },
  
  /** GET /v1/live/courses/{slug}/slots/ — OPEN slots for an enrolled course */
  getCourseSlots: async (courseSlug: string) => {
    try {
      const response = await apiClient.get<LiveSlot[]>(
        API_ENDPOINTS.LIVE_COURSE_SLOTS(courseSlug),
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load available times')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/live/slots/{slot_id}/book/ — request an open slot */
  bookSlot: async (slotId: string) => {
    try {
      const response = await apiClient.post<LiveSlotBooking>(
        API_ENDPOINTS.LIVE_SLOT_BOOK(slotId),
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to book that slot')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/live/bookings/ — the caller's own bookings */
  getMyBookings: async () => {
    try {
      const response = await apiClient.get<LiveSlotBooking[]>(API_ENDPOINTS.LIVE_BOOKINGS)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load your bookings')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/live/sessions/ — learner-facing discover sessions */
  getDiscoverSessions: async () => {
    try {
      const response = await apiClient.get<LearnerLiveSession[]>(API_ENDPOINTS.LIVE_SESSIONS)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load live sessions')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/live/bookings/{id}/cancel/ — cancel the caller's own booking */
  cancelBooking: async (bookingId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.LIVE_BOOKING_CANCEL(bookingId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to cancel booking')
      return { success: false as const, error: message, statusCode }
    }
  },
}
export type CourseDraftStatus = 'draft' | 'published' | 'archived'
export type CourseVisibility = 'public' | 'hidden'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface CourseBasicsPayload {
  title?: string
  subtitle?: string
  category?: string
  language?: string
  level?: CourseLevel
}

export interface CourseDescriptionPayload {
  description?: string
  expected_outcomes?: string[]
  target_audience?: string[]       // short tag, max 80 chars
  audience_description?: string  // longer prose
  prerequisites?: string[]
}

export interface CourseSettingsPayload {
  is_free?: boolean
  price_kobo?: number
  has_certificate?: boolean
}
export interface TrainerCourseListItem {
  id: string
  title: string
  subtitle: string
  status: CourseDraftStatus
  thumbnail_url: string | null
  module_count: number
  lesson_count: number
  updated_at: string
}

export type CourseDraftUpdatePayload = CourseBasicsPayload &
  CourseDescriptionPayload &
  CourseSettingsPayload

export interface CourseDraft {
  id: string
  slug: string
  status: CourseDraftStatus
  title: string
  subtitle?: string
  category?: string
  language?: string
  level?: CourseLevel
  cover_image_url?: string | null
  description?: string
  expected_outcomes?: string[]
  target_audience?: string[]
  audience_description?: string
  prerequisites?: string[]
  is_free?: boolean
  price_kobo?: number
  has_certificate?: boolean
  created_at: string
  updated_at: string
}

 
export interface CourseModule {
  id: string
  title: string
  description?: string | null
  order: number
}

export interface CourseLesson {
  id: string
  module_id: string
  title: string
  body?: string | null
  duration_seconds?: number
  duration_display?: string
  is_preview?: boolean
  order: number
  video_key?: string | null
  video_url?: string | null
  resource_keys?: string[]
}

 
export interface CourseCurriculumModule extends CourseModule {
  lessons: CourseLesson[]
}
 
export interface CourseCurriculumResponse {
  modules: CourseCurriculumModule[]
}
export type UploadTarget = 'course_cover' | 'lesson_video' | 'lesson_resource'
 
export interface PresignUploadPayload {
  target: UploadTarget
  course_id?: string
  lesson_id?: string
  filename: string
  content_type: string
  file_size: number
}
 
export interface PresignUploadResponse {
  upload_url: string
  method: string
  headers: Record<string, string>
  object_key: string
  expires_in: number
}
export interface ConfirmUploadPayload {
  target: UploadTarget
  course_id?: string
  lesson_id?: string
  object_key: string
  file_name: string
  file_size: number
  content_type: string
}
 
export interface ConfirmUploadResponse {
  key: string
  url: string
}
 
// ─── Courses Manage API (trainer course-builder wizard) ───────────────────
 
export const coursesManageAPI = {
  /** POST /v1/courses/manage/ — step 1 of the wizard, creates the draft */
  createDraft: async (payload: CourseBasicsPayload) => {
    try {
      const response = await apiClient.post<CourseDraft>(API_ENDPOINTS.COURSES_MANAGE_CREATE, payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to create course draft')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** GET /v1/courses/manage/{id}/ */
  getDraft: async (courseId: string) => {
    try {
      const response = await apiClient.get<CourseDraft>(API_ENDPOINTS.COURSES_MANAGE_DETAIL(courseId))
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load course draft')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** PATCH /v1/courses/manage/{id}/ — called after every wizard step (2, 4, and final publish) */
  updateDraft: async (courseId: string, payload: CourseDraftUpdatePayload) => {
    try {
      const response = await apiClient.patch<CourseDraft>(API_ENDPOINTS.COURSES_MANAGE_DETAIL(courseId), payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update course draft')
      return { success: false as const, error: message, statusCode }
    }
  },
 /** GET /v1/courses/manage/ — the caller's own courses (all statuses) */
  listMyCourses: async (params?: { status?: CourseDraftStatus; page?: number }) => {
    try {
      const query = new URLSearchParams()
      if (params?.status) query.set('status', params.status)
      if (params?.page) query.set('page', String(params.page))
      const qs = query.toString()

      const response = await apiClient.get<{
        count: number
        next: string | null
        previous: string | null
        results: TrainerCourseListItem[]
      }>(`/v1/courses/manage/${qs ? `?${qs}` : ''}`)

      return { success: true as const, data: response.data.results, count: response.data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load your courses')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/courses/manage/{id}/curriculum/ */
getCurriculum: async (courseId: string) => {
  try {
    const response = await apiClient.get<CourseCurriculumModule[]>(
      API_ENDPOINTS.COURSES_MANAGE_CURRICULUM(courseId),
    )
    return { success: true as const, data: response.data }
  } catch (error) {
    const { message, statusCode } = parseApiError(error, 'Failed to load curriculum')
    return { success: false as const, error: message, statusCode }
  }
},
 
  /** POST /v1/courses/manage/{id}/modules/ */
  createModule: async (courseId: string, title: string) => {
    try {
      const response = await apiClient.post<CourseModule>(API_ENDPOINTS.COURSES_MANAGE_MODULES(courseId), { title })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to create module')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/courses/manage/{id}/modules/reorder/ */
  reorderModules: async (courseId: string, moduleIdsInOrder: string[]) => {
    try {
      await apiClient.post(API_ENDPOINTS.COURSES_MANAGE_MODULES_REORDER(courseId), {
        module_ids: moduleIdsInOrder,
      })
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to reorder modules')
      return { success: false as const, error: message, statusCode }
    }
  },
 
 /** PATCH /v1/courses/manage/modules/{module_id}/ */
  updateModule: async (moduleId: string, payload: Partial<Pick<CourseModule, 'title' | 'description'>>) => {
    try {
      const response = await apiClient.patch<CourseModule>(API_ENDPOINTS.COURSES_MANAGE_MODULE_DETAIL(moduleId), payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update module')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** DELETE /v1/courses/manage/modules/{module_id}/ */
  deleteModule: async (moduleId: string) => {
    try {
      await apiClient.delete(API_ENDPOINTS.COURSES_MANAGE_MODULE_DETAIL(moduleId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to delete module')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/courses/manage/modules/{module_id}/lessons/ */
  createLesson: async (moduleId: string, title: string) => {
    try {
      const response = await apiClient.post<CourseLesson>(
        API_ENDPOINTS.COURSES_MANAGE_MODULE_LESSONS(moduleId),
        { title },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to create lesson')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** POST /v1/courses/manage/modules/{module_id}/lessons/reorder/ */
  reorderLessons: async (moduleId: string, lessonIdsInOrder: string[]) => {
    try {
      await apiClient.post(API_ENDPOINTS.COURSES_MANAGE_MODULE_LESSONS_REORDER(moduleId), {
        lesson_ids: lessonIdsInOrder,
      })
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to reorder lessons')
      return { success: false as const, error: message, statusCode }
    }
  },
 /** POST /v1/courses/manage/{id}/publish/ — validated draft → published */
  publishDraft: async (courseId: string) => {
    try {
      const response = await apiClient.post<CourseDraft>(
        `/v1/courses/manage/${courseId}/publish/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to publish course')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/courses/manage/{id}/unpublish/ — published → draft */
  unpublishDraft: async (courseId: string) => {
    try {
      const response = await apiClient.post<CourseDraft>(
        `/v1/courses/manage/${courseId}/unpublish/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to unpublish course')
      return { success: false as const, error: message, statusCode }
    }
  },

  getLesson: async (lessonId: string) => {
    try {
      const response = await apiClient.get<CourseLesson>(
        API_ENDPOINTS.COURSES_MANAGE_LESSON_DETAIL(lessonId),
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load lesson')
      return { success: false as const, error: message, statusCode }
    }
  },

/** PATCH /v1/courses/manage/lessons/{lesson_id}/ */
  updateLesson: async (
    lessonId: string,
    payload: Partial<Pick<CourseLesson, 'title' | 'body' | 'duration_seconds' | 'is_preview' | 'video_url'>>,
  ) => {
    try {
      const response = await apiClient.patch<CourseLesson>(
        API_ENDPOINTS.COURSES_MANAGE_LESSON_DETAIL(lessonId),
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update lesson')
      return { success: false as const, error: message, statusCode }
    }
  },
 
  /** DELETE /v1/courses/manage/lessons/{lesson_id}/ */
  deleteLesson: async (lessonId: string) => {
    try {
      await apiClient.delete(API_ENDPOINTS.COURSES_MANAGE_LESSON_DETAIL(lessonId))
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to delete lesson')
      return { success: false as const, error: message, statusCode }
    }
  },
 
 uploadFile: async (
    file: File,
    target: UploadTarget,
    ids: { course_id?: string; lesson_id?: string },
  ): Promise<
    | { success: true; data: ConfirmUploadResponse }
    | { success: false; error: string; statusCode?: number }
  > => {
    try {
      const presignRes = await apiClient.post<PresignUploadResponse>(API_ENDPOINTS.COURSES_UPLOADS_PRESIGN, {
        target,
        ...ids,
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        file_size: file.size,
      } as PresignUploadPayload)

      const { upload_url, method, headers, object_key } = presignRes.data

      const uploadRes = await fetch(upload_url, {
        method: method || 'PUT',
        body: file,
        headers:
          headers && Object.keys(headers).length > 0
            ? headers
            : { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadRes.ok) {
        throw new Error(`Upload failed for "${file.name}" (HTTP ${uploadRes.status})`)
      }

      const confirmRes = await apiClient.post<ConfirmUploadResponse>(API_ENDPOINTS.COURSES_UPLOADS_CONFIRM, {
        target,
        ...ids,
        object_key,
        file_name: file.name,
        file_size: file.size,
        content_type: file.type || 'application/octet-stream',
      } as ConfirmUploadPayload)

      return { success: true as const, data: confirmRes.data }
    } catch (error) {
      if (error instanceof Error && !(error as { response?: unknown }).response) {
        return { success: false as const, error: error.message }
      }
      const { message, statusCode } = parseApiError(error, 'Upload failed')
      return { success: false as const, error: message, statusCode }
    }
  },

}
export interface TrainerDashboardSummary {
  active_learners: number
  courses_published: number
}

export const trainerDashboardAPI = {
  /** GET /v1/trainer/dashboard/summary/ */
  getSummary: async () => {
    try {
      const response = await apiClient.get<TrainerDashboardSummary>('/v1/trainer/dashboard/summary/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load dashboard summary')
      return { success: false as const, error: message, statusCode }
    }
  },
}
 // ─── Trainer Review Types ──────────────────────────────────────────────────

export interface TrainerReviewSummary {
  total_reviews: number
  pending_count: number
  average_score: number | null
}

export interface TrainerSubmissionFile {
  id: string
  requirement_id: string | null
  file_name: string
  file_size: number
  content_type: string
  download_url: string
  created_at: string
}

export interface TrainerPendingReview {
  id: string
  learner_id: string
  learner_name: string
  assignment_id: string
  assignment_title: string
  course_id: string
  course_title: string
  attempt_number: number
  state: string
  is_late: boolean
  submitted_at: string
  files: TrainerSubmissionFile[]
}

export interface TrainerCompletedReview {
  id: string
  learner_id: string
  learner_name: string
  assignment_id: string
  assignment_title: string
  course_id: string
  course_title: string
  attempt_number: number
  state: string
  is_late: boolean
  score: number | null
  grade_status: string | null
  graded_at: string
}
export interface RequestRevisionPayload {
  reason?: string
}

export interface GradeWritePayload {
  score?: number | null
  feedback: string
  status: 'pass' | 'fail'
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ─── Trainer Reviews API ────────────────────────────────────────────────────

export const trainerReviewsAPI = {
  /** GET /v1/trainer/reviews/summary/ */
  getSummary: async () => {
    try {
      const response = await apiClient.get<TrainerReviewSummary>(
        '/v1/trainer/reviews/summary/',
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load review summary')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/trainer/reviews/pending/ */
  getPendingReviews: async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<TrainerPendingReview>>(
        '/v1/trainer/reviews/pending/',
      )
      return { success: true as const, data: response.data.results, count: response.data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load pending reviews')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/trainer/reviews/completed/ */
  getCompletedReviews: async () => {
    try {
      const response = await apiClient.get<PaginatedResponse<TrainerCompletedReview>>(
        '/v1/trainer/reviews/completed/',
      )
      return { success: true as const, data: response.data.results, count: response.data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load completed reviews')
      return { success: false as const, error: message, statusCode }
    }
  },

/** POST /v1/assignments/submissions/{submission_id}/request-revision/ */
  requestRevision: async (submissionId: string, payload: RequestRevisionPayload) => {
    try {
      const response = await apiClient.post<TrainerCompletedReview>(
        `/v1/assignments/submissions/${submissionId}/request-revision/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to request revision')
      return { success: false as const, error: message, statusCode }
    }
  },
  /** POST /v1/assignments/submissions/{submission_id}/grade/ */
  gradeSubmission: async (submissionId: string, payload: GradeWritePayload) => {
    try {
      const response = await apiClient.post<TrainerCompletedReview>(
        `/v1/assignments/submissions/${submissionId}/grade/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to submit grade')
      return { success: false as const, error: message, statusCode }
    }
  },
}
// ─── Trainer Profile Types ──────────────────────────────────────────────────

export type TrainerCompletionStatus = 'incomplete' | 'complete'

export interface TrainerProfile {
  id: string
  credential: string | null
  bio: string | null
  subject_areas: string[]
  accepts_bookings: boolean
  completion_status: TrainerCompletionStatus
  created_at: string
}

export interface TrainerProfilePayload {
  credential?: string | null
  bio?: string | null
  subject_areas?: string[]
  accepts_bookings?: boolean
}

// ─── Trainer Profile API ────────────────────────────────────────────────────

export const trainerProfileAPI = {
  /** GET /v1/users/me/trainer-profile/ — auto-creates on first access, never 404s */
  getTrainerProfile: async () => {
    try {
      const response = await apiClient.get<TrainerProfile>('/v1/users/me/trainer-profile/')
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to get trainer profile')
      return { success: false as const, error: message }
    }
  },

  /** PATCH /v1/users/me/trainer-profile/ */
  updateTrainerProfile: async (payload: TrainerProfilePayload) => {
    try {
      const response = await apiClient.patch<TrainerProfile>(
        '/v1/users/me/trainer-profile/',
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message } = parseApiError(error, 'Failed to update trainer profile')
      return { success: false as const, error: message }
    }
  },
}
// ─── Assignment Types ─────────────────────────────────────────────────────────

export type AssignmentStatus = 'not_started' | 'in_progress' | 'graded'

export interface AssignmentScenario {
  id: string
  order: number
  text: string
}

export interface AssignmentDeliverable {
  id: string
  order: number
  text: string
}

export interface GradingCriterion {
  id: string
  label: string
  points: number
}

export interface AssignmentResource {
  id: string
  title: string
  file_type: string
  file_url: string
  size_display: string
  size_tag?: 'SMALL' | 'MEDIUM' | 'LARGE'
}

export interface AssignmentRequirement {
  id: string
  label: string
  allowed_file_types: string[]
  max_bytes: number
  required: boolean
  order: number
  naming_hint: string
}

export interface SubmittedFile {
  id: string
  filename: string
  file_url: string
  uploaded_at: string
}

export interface AssignmentFeedback {
  type: 'revision_requested' | 'graded'
  grader_name: string
  comment: string
  date: string
  score?: number
  
}

export interface AssignmentDetail {
  id: string
  title: string
  course_slug: string
  course_title: string
  module_title: string
  due_at: string
  points: number
   max_attempts: number 
    attempts_used: number 
  grade_status?: 'pass' | 'fail'
  grade_weight_percent: number
  status: AssignmentStatus
  instructions: {
    intro: string
    example_image_url: string | null
    example_image_caption: string | null
    what_youll_do: string[]
    scenarios: AssignmentScenario[]
    deliverables: AssignmentDeliverable[]
    grading_criteria: GradingCriterion[]
  }
  resources: AssignmentResource[]
  // Per-file requirements — each has the requirement_id needed for upload.
  requirements: AssignmentRequirement[]
  submitted_files: SubmittedFile[]
  feedback: AssignmentFeedback | null
  submission_requirements: {
    accepted_file_types: string
    max_file_size: string
    word_count: string | null
    max_files: number
  }
}

interface SubmissionFileRecord {
  id: string
  requirement_id: string
  file_name: string
  file_size: number
  content_type: string
  download_url: string
  created_at: string
}

interface SubmissionAttemptResponse {
  id: string
  assignment_id: string
  attempt_number: number
  state: string
  submitted_at: string | null
  is_late: boolean
  files: SubmissionFileRecord[]
  grade: Record<string, unknown> | null
  created_at: string
}

interface PresignResponse {
  upload_url: string
  method: string
  headers: Record<string, string>
  object_key: string
  expires_in: number
}

// ─── Assignments API (learner-facing) ─────────────────────────────────────────

export const assignmentsAPI = {
  /** GET /v1/assignments/{assignment_id}/ */
  getAssignment: async (assignmentId: string) => {
    try {
      const response = await apiClient.get<AssignmentDetail>(
        `/v1/assignments/${assignmentId}/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load assignment')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/assignments/{assignment_id}/resources/{resource_id}/download/ */
  getResourceDownloadUrl: async (assignmentId: string, resourceId: string) => {
    try {
      const response = await apiClient.get<{ download_url: string; expires_in: number }>(
        `/v1/assignments/${assignmentId}/resources/${resourceId}/download/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to get download URL')
      return { success: false as const, error: message, statusCode }
    }
  },

  submitAssignment: async (
    assignmentId: string,
    files: File[],
    requirements: AssignmentRequirement[],
  ): Promise<
    | { success: true; data: { submitted_files: SubmittedFile[] } }
    | { success: false; error: string; statusCode?: number }
  > => {
    try {
      const resolvedRequirements = requirements.length > 0
        ? requirements
        : [{
            id: 'default-submission-slot',
            label: 'Submission file',
             allowed_file_types: ['pdf', 'docx'],
            max_bytes: 20 * 1024 * 1024,
            required: true,
            order: 1,
            naming_hint: 'Use your name and assignment title in the filename.',
          } as AssignmentRequirement]

      if (files.length > resolvedRequirements.length) {
        return {
          success: false as const,
          error: `Too many files — this assignment only accepts ${resolvedRequirements.length} file(s).`,
        }
      }

      // Step 1 — create / resume submission attempt
      const attemptRes = await apiClient.post<SubmissionAttemptResponse>(
        `/v1/assignments/${assignmentId}/submissions/`,
      )
      const submissionId = attemptRes.data.id

      // Step 2 — presign → upload → confirm per file, auto-mapped to requirements in order.
      // Some assignments legitimately have no requirement slots; in that case the backend rejects
      // a fake/placeholder requirement_id, so we must omit it completely instead of sending null.
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const requirement = resolvedRequirements[i] ?? resolvedRequirements[0]
        const requirementId = requirement?.id ?? null
        const shouldIncludeRequirementId = Boolean(requirementId && requirementId !== 'default-submission-slot')

        try {
          // 2a. presign
          const presignRes = await apiClient.post<PresignResponse>(
            `/v1/assignments/submissions/${submissionId}/files/presign/`,
            {
              ...(shouldIncludeRequirementId ? { requirement_id: requirementId } : {}),
              filename: file.name,
              content_type: file.type || 'application/octet-stream',
              file_size: file.size,
            },
          )
          const { upload_url, method, headers, object_key } = presignRes.data

          // 2b. upload directly to storage, using the method/headers the backend returned.
          // A failure here is a raw fetch() failure (not an Axios/API error), so it's
          // translated through humanizeStorageUploadError() rather than parseApiError().
          const uploadRes = await fetch(upload_url, {
            method: method || 'PUT',
            body: file,
            headers:
              headers && Object.keys(headers).length > 0
                ? headers
                : { 'Content-Type': file.type || 'application/octet-stream' },
          })
          if (!uploadRes.ok) {
            console.error(`Storage upload failed for "${file.name}": HTTP ${uploadRes.status}`)
            throw new Error(humanizeStorageUploadError(uploadRes.status))
          }


          await apiClient.post(
            `/v1/assignments/submissions/${submissionId}/files/confirm/`,
            {
              ...(shouldIncludeRequirementId ? { requirement_id: requirementId } : {}),
              object_key,
              file_name: file.name,
              file_size: file.size,
              content_type: file.type || 'application/octet-stream',
            },
          )
        } catch (fileError) {
  
          if (fileError instanceof Error && !(fileError as { response?: unknown }).response) {
            return { success: false as const, error: `"${file.name}": ${fileError.message}` }
          }
          const { message, statusCode } = parseApiError(fileError, 'Upload failed.')
          return {
            success: false as const,
            error: `"${file.name}": ${simplifyFileError(message, statusCode)}`,
            statusCode,
          }
        }
      }
      

      // Step 3 — finalise and read back the authoritative file records
      const submitRes = await apiClient.post<SubmissionAttemptResponse>(
        `/v1/assignments/submissions/${submissionId}/submit/`,
      )

      const submittedFiles: SubmittedFile[] = submitRes.data.files.map((f) => ({
        id: f.id,
        filename: f.file_name,
        file_url: f.download_url,
        uploaded_at: f.created_at,
      }))

      return { success: true as const, data: { submitted_files: submittedFiles } }
    } catch (error) {
      if (error instanceof Error && !(error as { response?: unknown }).response) {
        return { success: false as const, error: error.message }
      }
      const { message, statusCode } = parseApiError(error, 'Submission failed')
      return { success: false as const, error: message, statusCode }
    }
  },
}

// ─── Trainer Assignments Types ─────────────────────────────────────────────


export interface TrainerGradingCriterion {
  label: string
  max_points: number
}

export interface CreateTrainerAssignmentPayload {
  title: string
  module_id: string
  description?: string
  instructions?: string
  deadline: string
  is_final?: boolean
  max_attempts: number
  accept_late: boolean
  grading_criteria?: TrainerGradingCriterion[]
  order: number
}

export type UpdateTrainerAssignmentPayload = Partial<CreateTrainerAssignmentPayload>

export interface TrainerAssignmentModuleRef {
  id: string
  title: string
}

export interface TrainerAssignmentListItem {
  id: string
  title: string
  module: TrainerAssignmentModuleRef
  deadline: string
  is_final: boolean
  created_at: string
  submission_count: number
  graded_count: number
  pending_grading: number
  deleted_at: string | null
  can_edit: boolean
  can_delete: boolean
}

export interface TrainerAssignmentDetail extends TrainerAssignmentListItem {
  description: string
  instructions: string
  grading_criteria: TrainerGradingCriterion[]
  max_attempts: number
  accept_late: boolean
  requirements?: CreateAssignmentRequirementPayload[]
  created_by: string
}

/** allowed_file_types is a confirmed array field — never a comma-joined string. */
export interface CreateAssignmentRequirementPayload {
  label: string
  allowed_file_types: string[]
  max_bytes: number
  required: boolean
  order: number
  naming_hint: string
}

export interface TrainerAssignmentResource {
  id: string
  title: string
  resource_type: 'template' | 'worksheet' | 'slides' | 'document' | 'other'
  file_format: string | null
  file_size: number
  created_at: string
}

export interface CreateAssignmentResourcePayload {
  title: string
  file: File
  resource_type?: 'template' | 'worksheet' | 'slides' | 'document' | 'other'
}

export const trainerAssignmentsAPI = {
  /** GET /v1/trainer/courses/{slug}/assignments/ */
  list: async (
    courseSlug: string,
    params?: { include_deleted?: boolean; page?: number; page_size?: number },
  ) => {
    try {
      const query = new URLSearchParams()
      if (params?.include_deleted) query.set('include_deleted', 'true')
      if (params?.page) query.set('page', String(params.page))
      if (params?.page_size) query.set('page_size', String(params.page_size))
      const qs = query.toString()

      const response = await apiClient.get<{
        count: number
        next: string | null
        previous: string | null
        results: TrainerAssignmentListItem[]
      }>(`/v1/trainer/courses/${courseSlug}/assignments/${qs ? `?${qs}` : ''}`)

      return { success: true as const, data: response.data.results, count: response.data.count }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load assignments')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/trainer/courses/{slug}/assignments/{id}/ */
  get: async (courseSlug: string, assignmentId: string) => {
    try {
      const response = await apiClient.get<TrainerAssignmentDetail>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load assignment')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/trainer/courses/{slug}/assignments/ */
  create: async (courseSlug: string, payload: CreateTrainerAssignmentPayload) => {
    try {
      const response = await apiClient.post<TrainerAssignmentDetail>(
        `/v1/trainer/courses/${courseSlug}/assignments/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode, code } = parseApiError(error, 'Failed to create assignment')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'Another final assignment already exists for this course. Only one is allowed.',
          statusCode,
          code,
        }
      }
      return { success: false as const, error: message, statusCode, code }
    }
  },

  /** PATCH /v1/trainer/courses/{slug}/assignments/{id}/ */
  update: async (courseSlug: string, assignmentId: string, payload: UpdateTrainerAssignmentPayload) => {
    try {
      const response = await apiClient.patch<TrainerAssignmentDetail>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update assignment')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'This assignment can no longer be edited — learners have already submitted work.',
          statusCode,
        }
      }
      if (statusCode === 400 && message.toLowerCase().includes('deadline')) {
        return {
          success: false as const,
          error: 'Deadline can only be moved forward, not backward.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  /** DELETE /v1/trainer/courses/{slug}/assignments/{id}/ — soft-delete */
  remove: async (courseSlug: string, assignmentId: string) => {
    try {
      await apiClient.delete(`/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/`)
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to delete assignment')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: "This assignment can't be deleted — learners have already submitted work.",
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/trainer/courses/{slug}/assignments/{id}/requirements/
   *  Must be called AFTER the assignment exists — requirements are
   *  per-slot rows keyed to assignmentId, not a field on assignment create/update.
   *  Returns 409 once any submission (even in-progress) exists for the assignment. */
  createRequirement: async (
    courseSlug: string,
    assignmentId: string,
    payload: CreateAssignmentRequirementPayload,
  ) => {
    try {
      const response = await apiClient.post<CreateAssignmentRequirementPayload & { id: string }>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/requirements/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to save a submission requirement')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'Requirements are locked — a submission already exists for this assignment.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/trainer/courses/{slug}/assignments/{id}/requirements/ */
  listRequirements: async (courseSlug: string, assignmentId: string) => {
    try {
      const response = await apiClient.get<(CreateAssignmentRequirementPayload & { id: string })[]>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/requirements/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load submission requirements')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** PATCH /v1/trainer/courses/{slug}/assignments/{id}/requirements/{requirement_id}/
   *  requirement_id is assignment-scoped — a valid id from a different assignment 404s.
   *  Returns 409 once any submission exists for the assignment. */
  updateRequirement: async (
    courseSlug: string,
    assignmentId: string,
    requirementId: string,
    payload: Partial<CreateAssignmentRequirementPayload>,
  ) => {
    try {
      const response = await apiClient.patch<CreateAssignmentRequirementPayload & { id: string }>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/requirements/${requirementId}/`,
        payload,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update a submission requirement')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'Requirements are locked — a submission already exists for this assignment.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  /** DELETE /v1/trainer/courses/{slug}/assignments/{id}/requirements/{requirement_id}/
   *  Returns 409 once any submission exists for the assignment. */
  deleteRequirement: async (
    courseSlug: string,
    assignmentId: string,
    requirementId: string,
  ) => {
    try {
      await apiClient.delete(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/requirements/${requirementId}/`,
      )
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to remove a submission requirement')
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'Requirements are locked — a submission already exists for this assignment.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/trainer/courses/{slug}/assignments/{id}/resources/ — direct
   *  multipart upload (not presign/confirm — the file goes in this request). */
  createResource: async (
    courseSlug: string,
    assignmentId: string,
    payload: CreateAssignmentResourcePayload,
  ) => {
    try {
      const formData = new FormData()
      formData.append('title', payload.title)
      formData.append('file', payload.file)
      if (payload.resource_type) formData.append('resource_type', payload.resource_type)

      const response = await apiClient.post<TrainerAssignmentResource>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/resources/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to upload a resource')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/trainer/courses/{slug}/assignments/{id}/resources/ */
  listResources: async (courseSlug: string, assignmentId: string) => {
    try {
      const response = await apiClient.get<TrainerAssignmentResource[]>(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/resources/`,
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load resources')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** DELETE /v1/trainer/courses/{slug}/assignments/{id}/resources/{resource_id}/ */
  deleteResource: async (courseSlug: string, assignmentId: string, resourceId: string) => {
    try {
      await apiClient.delete(
        `/v1/trainer/courses/${courseSlug}/assignments/${assignmentId}/resources/${resourceId}/`,
      )
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to remove a resource')
      return { success: false as const, error: message, statusCode }
    }
  },
}

export interface ApiNotification {
  id: string
  type: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  created_at: string
}

export interface NotificationListParams {
  is_read?: boolean
  type?: string
  page?: number
  page_size?: number
  search?: string
}

interface NotificationListResponse {
  count: number
  next: string | null
  previous: string | null
  results: ApiNotification[]
}

// ─── Notifications API ───────────────────────────────────────────────────────

export const notificationsAPI = {
  /** GET /v1/notifications/ */
  list: async (params?: NotificationListParams) => {
    try {
      const query = new URLSearchParams()
      if (params?.is_read !== undefined) query.set('is_read', String(params.is_read))
      if (params?.type) query.set('type', params.type)
      if (params?.page) query.set('page', String(params.page))
      if (params?.page_size) query.set('page_size', String(params.page_size))
      if (params?.search) query.set('search', params.search)
      const qs = query.toString()

      const response = await apiClient.get<NotificationListResponse>(
        `/v1/notifications/${qs ? `?${qs}` : ''}`,
      )
      return {
        success: true as const,
        data: response.data.results,
        count: response.data.count,
        next: response.data.next,
      }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load notifications')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** GET /v1/notifications/unread-count/ */
  getUnreadCount: async () => {
    try {
      const response = await apiClient.get<{ unread_count: number }>(`/v1/notifications/unread-count/`)
      return { success: true as const, count: response.data.unread_count ?? 0 }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load unread notification count')
      return { success: false as const, error: message, statusCode, count: 0 }
    }
  },

  /** POST /v1/notifications/{notification_id}/read/ */
  markRead: async (id: string) => {
    try {
      const response = await apiClient.post<ApiNotification>(
        `/v1/notifications/${id}/read/`,
        {},
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to mark notification as read')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/notifications/read-all/ */
  markAllRead: async () => {
    try {
      const response = await apiClient.post<{ marked_count: number }>(
        `/v1/notifications/read-all/`,
        {},
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to mark all notifications as read')
      return { success: false as const, error: message, statusCode }
    }
  },
}

export default apiClient