
export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrendPeriod = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time'


export interface EnrollmentTrendPoint {
  date: string
  new_enrollments: number
  total_enrollments: number
}

export interface EnrollmentTrendsSummary {
  period_start: string
  period_end: string
  total_new_enrollments: number
  total_enrollments_all_time: number
  growth_rate_percent: number
}

export interface EnrollmentTrendsResponse {
  course_slug: string
  course_title: string
  period: TrendPeriod
  data: EnrollmentTrendPoint[]
  summary: EnrollmentTrendsSummary
}


export interface CourseTrainerRef {
  id: string
  full_name: string
  email: string
}


export interface AdminCourseRow {
  id: string
  title: string
  slug: string
  trainer: CourseTrainerRef
  status: CourseStatus
  is_archived: boolean
  is_free: boolean
  price_kobo: number
  enrollment_count: number
  completion_count: number
  completion_percentage: number
  revenue_kobo: number
  is_final_assignment_set: boolean
  has_live_sessions: boolean
  created_at: string
}

export interface CourseArchiveInfo {
  archived_at: string
  archived_by_email: string
  reason: string
  note: string
}

// GET/PATCH /api/v1/admin/courses/{slug}/ — superset of the list row.
export interface AdminCourseDetail extends AdminCourseRow {
  subtitle: string
  description: string
  category: string
  level: CourseLevel
  language: string
  has_certificate: boolean
  has_live_support: boolean
  module_count: number
  lesson_count: number
  assignment_count: number
  live_session_count: number
  certificate_count: number
  in_progress_count: number
  archived_at: string | null
  archive: CourseArchiveInfo | null
  updated_at: string
}

export interface PaginatedCourses {
  count: number
  next: string | null
  previous: string | null
  results: AdminCourseRow[]
}

export interface ListCoursesParams {
  page?: number
  page_size?: number
  search?: string
  status?: CourseStatus
  trainer_id?: string
}

export interface UpdateCoursePayload {
  title?: string
  subtitle?: string
  description?: string
  status?: 'draft' | 'published'
  is_free?: boolean
  price_kobo?: number
  has_certificate?: boolean
  has_live_support?: boolean
  category?: string
  level?: CourseLevel
  language?: string
}

export type ArchiveReason =
  | 'low_completion'
  | 'outdated_content'
  | 'trainer_departed'
  | 'policy_violation'
  | 'other'

export interface ArchiveCoursePayload {
  reason: ArchiveReason
  note?: string
}
export interface CatalogStats {
  total_courses: number
  published: number
  draft: number
  total_revenue_kobo: number
}