import { apiClient } from './api'

async function adminRequest<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    const response = await request
    return response.data
  } catch (error) {
    if ((error as { response?: { status?: number } })?.response?.status === 403) {
      window.dispatchEvent(new Event('admin-permissions-stale'))
    }
    throw error
  }
}

export interface AdminPage<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface MissingCertificateRow {
  user_id: string
  learner: string
  course_id: string
  course: string
  eligibility_status: string
  completed_at: string
  missing_since: string
  action: string
}

export interface IssueMissingCertificateResponse {
  certificate_id: string
  serial: string
  issued_at: string
  status: 'issued' | 'already_issued' | string
}

export interface EligibilityChecklistItem {
  requirement: string
  satisfied: boolean
  [key: string]: unknown
}

export interface DeadLetterRow {
  id: string
  status: string
  event_type: string
  provider?: string | null
  reference?: string | null
  learner_email?: string | null
  course?: string | null
  failure_reason?: string | null
  attempts?: number
  first_failed_at?: string | null
  last_failed_at?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  resolution_note?: string
  created_at?: string
  updated_at?: string
  payload?: { redacted_keys?: string[]; [key: string]: unknown }
  error_traceback?: string | null
  [key: string]: unknown
}

export interface DeadLetterActionResult {
  id?: string
  outcome: 'retried' | 'dismissed' | 'already_resolved' | 'not_eligible' | 'failed' | string
  reason?: string | null
  [key: string]: unknown
}

export interface DeadLetterSummary {
  counts_by_status: Record<string, number>
  total: number
  unresolved: number
  oldest_unresolved_at: string | null
  oldest_unresolved_age_seconds: number | null
}

export interface SystemStatusComponent {
  status: 'ok' | 'degraded' | 'down' | string
  message: string
  [key: string]: unknown
}

export interface SystemStatusResponse {
  overall?: 'ok' | 'degraded' | 'down' | string
  checked_at?: string
  cache_ttl_seconds?: number
  overall_status?: 'ok' | 'degraded' | 'down' | string
  status?: 'ok' | 'degraded' | 'down' | string
  message?: string
  components: Record<string, SystemStatusComponent>
  [key: string]: unknown
}

export const adminOperationsAPI = {
  listMissingCertificates: async (page: number, pageSize = 20) => {
    return adminRequest(apiClient.get<AdminPage<MissingCertificateRow>>(
      '/v1/admin/certificates/missing/',
      { params: { page, page_size: pageSize } },
    ))
  },

  issueMissingCertificate: async (learnerId: string, courseId: string) => {
    return adminRequest(apiClient.post<IssueMissingCertificateResponse>(
      '/v1/admin/certificates/missing/issue/',
      { learner_id: learnerId, course_id: courseId },
    ))
  },

  listDeadLetters: async (params: { page: number; page_size: number; status?: string; event_type?: string; date_from?: string; date_to?: string }) => {
    return adminRequest(apiClient.get<AdminPage<DeadLetterRow>>(
      '/v1/admin/payments/dead-letter/',
      { params },
    ))
  },

  getDeadLetterSummary: async () => {
    return adminRequest(apiClient.get<DeadLetterSummary>('/v1/admin/payments/dead-letter/summary/'))
  },

  getDeadLetter: async (id: string) => {
    return adminRequest(apiClient.get<DeadLetterRow>(`/v1/admin/payments/dead-letter/${id}/`))
  },

  retryDeadLetter: async (id: string) => {
    return adminRequest(apiClient.post<DeadLetterActionResult>(`/v1/admin/payments/dead-letter/${id}/retry/`))
  },

  retryDeadLetters: async (ids: string[]) => {
    return adminRequest(apiClient.post<{
      requested: number
      results: DeadLetterActionResult[]
    }>('/v1/admin/payments/dead-letter/retry/', { ids }))
  },

  dismissDeadLetter: async (id: string, note: string) => {
    return adminRequest(apiClient.post<DeadLetterActionResult>(
      `/v1/admin/payments/dead-letter/${id}/dismiss/`,
      { note },
    ))
  },

  getSystemStatus: async () => {
    return adminRequest(apiClient.get<SystemStatusResponse>('/v1/admin/system/status/'))
  },
}