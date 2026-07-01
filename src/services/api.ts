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
  learner_profile?: LearnerProfile | null
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

// ─── Routes where a 403 is an EXPECTED, recoverable response that the calling
// page already handles gracefully (e.g. "this lesson isn't the free preview,
// please enrol", "this course isn't available to you yet") — the global
// hard-redirect must not hijack these. Covers the whole courses namespace:
// course detail, lessons, enrollment-status, progress, etc.
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

  public async get<T>(url: string) { return this.axiosInstance.get<T>(url) }
  public async post<T>(url: string, data?: unknown) { return this.axiosInstance.post<T>(url, data) }
  public async put<T>(url: string, data?: unknown) { return this.axiosInstance.put<T>(url, data) }
  public async patch<T>(url: string, data?: unknown) { return this.axiosInstance.patch<T>(url, data) }
  public async delete<T>(url: string) { return this.axiosInstance.delete<T>(url) }
}

export const apiClient = new ApiClient()

// ─── Error parser helper ──────────────────────────────────────────────────────

function parseApiError(error: unknown, fallback: string): { message: string; statusCode?: number; code?: string } {
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

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authAPI = {
  signup: async (payload: SignupPayload) => {
    try {
      const response = await apiClient.post<UserResponse>(API_ENDPOINTS.SIGNUP, {
        email: payload.email,
        password: payload.password,
        first_name: payload.firstName,
        last_name: payload.lastName,
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
}

export interface AdjacentLesson {
  id: string
  title: string
  duration_display: string
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
  notes: string | null
  resources: LessonResource[]
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
      const response = await apiClient.patch<{ notes: string }>(
        `/v1/courses/${courseSlug}/lessons/${lessonId}/notes/`,
        { notes },
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

// One entry per file the learner must upload for this assignment.
// This comes straight from the backend's `requirements` array on the
// assignment-detail response, and its `id` is the `requirement_id`
// that MUST be sent on every presign/confirm call for a file that
// satisfies it.
export interface AssignmentRequirement {
  id: string
  label: string
  allowed_file_types: string
  max_bytes: number
  required: boolean
  order: number
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

// Internal shapes — not exported (only used inside assignmentsAPI).
// These mirror the ACTUAL backend response shapes from the Swagger spec,
// not the previous (incorrect) guesses.

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

// ─── Assignments API ──────────────────────────────────────────────────────────

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

  /**
   * Full presigned-upload flow:
   *   1. POST /assignments/{id}/submissions/                            → submission_id
   *   2. For each file (matched to a requirement, in order):
   *      a. POST /assignments/submissions/{sid}/files/presign/          → { upload_url, method, headers, object_key, expires_in }
   *      b. Upload  →  upload_url, using the `method` and `headers` the backend gave us
   *      c. POST /assignments/submissions/{sid}/files/confirm/          → records the file server-side
   *   3. POST /assignments/submissions/{sid}/submit/                    → finalises, returns the submission
   *      with its authoritative `files` array (id, download_url, etc.) — this is what we
   *      use to build the SubmittedFile[] we hand back to the UI.
   *
   * `requirements` should be `assignment.requirements` sorted by `order`. Files are
   * auto-mapped to requirements in the order they were added (files[0] → requirements[0], etc).
   */
  submitAssignment: async (
    assignmentId: string,
    files: File[],
    requirements: AssignmentRequirement[],
  ): Promise<
    | { success: true; data: { submitted_files: SubmittedFile[] } }
    | { success: false; error: string; statusCode?: number }
  > => {
    try {
      if (files.length > requirements.length) {
        return {
          success: false as const,
          error: `Too many files — this assignment only accepts ${requirements.length} file(s).`,
        }
      }

      // Step 1 — create / resume submission attempt
      const attemptRes = await apiClient.post<SubmissionAttemptResponse>(
        `/v1/assignments/${assignmentId}/submissions/`,
      )
      const submissionId = attemptRes.data.id

      // Step 2 — presign → upload → confirm per file, auto-mapped to requirements in order
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const requirementId = requirements[i].id

        // 2a. presign
        const presignRes = await apiClient.post<PresignResponse>(
          `/v1/assignments/submissions/${submissionId}/files/presign/`,
          {
            requirement_id: requirementId,
            filename: file.name,
            content_type: file.type || 'application/octet-stream',
            file_size: file.size,
          },
        )
        const { upload_url, method, headers, object_key } = presignRes.data

        // 2b. upload directly to storage, using the method/headers the backend returned
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

        // 2c. confirm
        await apiClient.post(
          `/v1/assignments/submissions/${submissionId}/files/confirm/`,
          {
            requirement_id: requirementId,
            object_key,
            file_name: file.name,
            file_size: file.size,
            content_type: file.type || 'application/octet-stream',
          },
        )
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

export default apiClient