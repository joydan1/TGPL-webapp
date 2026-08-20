// ─── Admin Courses API ───────────────────────────────────────────────────

import apiClient, { parseApiError } from '../services/api'
import type {
  AdminCourseDetail,
  AdminCourseRow,
  ArchiveCoursePayload,
  CatalogStats,
  ListCoursesParams,
  PaginatedCourses,
  UpdateCoursePayload,
} from '../types/adminCourse'

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; statusCode?: number; code?: string }

export type { ApiResult }

const BASE = '/v1/admin/courses'


const MAX_REVENUE_PAGES = 20 // up to 2,000 courses summed

export const adminCoursesAPI = {
  listCourses: async (params: ListCoursesParams = {}): Promise<ApiResult<PaginatedCourses>> => {
    try {
      const response = await apiClient.get<PaginatedCourses>(`${BASE}/`, { params })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load courses')
      return { success: false as const, error: message, statusCode }
    }
  },

  getCourse: async (slug: string): Promise<ApiResult<AdminCourseDetail>> => {
    try {
      const response = await apiClient.get<AdminCourseDetail>(`${BASE}/${slug}/`)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load course')
      return { success: false as const, error: message, statusCode }
    }
  },

  updateCourse: async (slug: string, payload: UpdateCoursePayload): Promise<ApiResult<AdminCourseDetail>> => {
    try {
      const response = await apiClient.patch<AdminCourseDetail>(`${BASE}/${slug}/`, payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to update course')
      return { success: false as const, error: message, statusCode }
    }
  },

  // Always sends confirm=true — the confirmation UX itself lives in
  // DeleteCourseModal; by the time this is called the admin has already
  // typed "Delete" to confirm.
  deleteCourse: async (slug: string): Promise<ApiResult<null>> => {
    try {
      await apiClient.delete(`${BASE}/${slug}/`, { params: { confirm: true } })
      return { success: true as const, data: null }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to delete course')
      // 409 here means protected payment/enrollment/certificate history —
      // surface that plainly so the admin knows to archive instead.
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'This course has payment, enrollment, or certificate history and can\'t be deleted — archive it instead.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  archiveCourse: async (slug: string, payload: ArchiveCoursePayload): Promise<ApiResult<AdminCourseDetail>> => {
    try {
      const response = await apiClient.post<AdminCourseDetail>(`${BASE}/${slug}/archive/`, payload)
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to archive course')
      // 409 means learners still hold active access — the endpoint exists
      // specifically to prevent silently pulling a course out from under them.
      if (statusCode === 409) {
        return {
          success: false as const,
          error: 'Learners still hold active access to this course, so it can\'t be archived yet.',
          statusCode,
        }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  assignTrainer: async (slug: string, trainerId: string): Promise<ApiResult<AdminCourseDetail>> => {
    try {
      const response = await apiClient.post<AdminCourseDetail>(`${BASE}/${slug}/assign-trainer/`, {
        trainer_id: trainerId,
      })
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to assign trainer')
      if (statusCode === 409) {
        return { success: false as const, error: 'That user is not a trainer.', statusCode }
      }
      return { success: false as const, error: message, statusCode }
    }
  },

  // Total/published/draft come cheaply from `count` on page_size=1 filtered
  // requests. Revenue has no aggregate endpoint at all, so it's summed by
  // paging through every course. Returns the first failing request's error
  // as-is if any of the four calls fail.
  aggregateCatalogStats: async (): Promise<ApiResult<CatalogStats>> => {
    const [totalRes, publishedRes, draftRes] = await Promise.all([
      adminCoursesAPI.listCourses({ page_size: 1 }),
      adminCoursesAPI.listCourses({ page_size: 1, status: 'published' }),
      adminCoursesAPI.listCourses({ page_size: 1, status: 'draft' }),
    ])

    if (!totalRes.success) return totalRes
    if (!publishedRes.success) return publishedRes
    if (!draftRes.success) return draftRes

    let totalRevenueKobo = 0
    let page = 1
    for (let i = 0; i < MAX_REVENUE_PAGES; i++) {
      const pageRes = await adminCoursesAPI.listCourses({ page, page_size: 100 })
      if (!pageRes.success) return pageRes
      totalRevenueKobo += pageRes.data.results.reduce(
        (sum: number, c: AdminCourseRow) => sum + c.revenue_kobo,
        0,
      )
      if (!pageRes.data.next) break
      page += 1
    }

    return {
      success: true as const,
      data: {
        total_courses: totalRes.data.count,
        published: publishedRes.data.count,
        draft: draftRes.data.count,
        total_revenue_kobo: totalRevenueKobo,
      },
    }
  },
}