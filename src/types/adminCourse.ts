export type CourseStatus = 'published' | 'draft' | 'archived'

export interface CourseTrainer {
  id: string
  name: string
  role: string
  avatar_color: string
}

export interface CourseSummary {
  id: string
  title: string
  subtitle: string // e.g. "Welcome video · updated 1 week ago"
  category: string
  trainer: CourseTrainer
  price: number | null // null = free
  status: CourseStatus
  enrolled: number
  revenue: number
  updated_at: string
}

export interface CatalogStats {
  total_courses: number
  published: number
  draft: number
  total_revenue: number
}

export interface CourseLesson {
  id: string
  title: string
  type: 'video' | 'reading' | 'quiz'
  duration?: string
  questions?: number
}

export interface CourseModule {
  id: string
  title: string
  lessons: CourseLesson[]
}

export interface CourseDetailStats {
  avg_rating: number
  completion_rate: number
  total_lessons: number
  video_count: number
  quiz_count: number
  has_certificate: boolean
  language: string
  access: string
  enrollment_trend: number[] // 12 relative bar heights, 0-100, oldest -> newest
  trend_change_pct: number
  modules: CourseModule[]
}

// TODO: replace with adminCoursesAPI.getCourseDetail(id) once
// GET /api/v1/admin/courses/{id}/ (or similar) exists. Deterministic per
// course id so the demo data doesn't jump around between renders.
export function getMockCourseDetail(_course: CourseSummary): CourseDetailStats {
  return {
    avg_rating: 4.7,
    completion_rate: 68,
    total_lessons: 12,
    video_count: 6,
    quiz_count: 3,
    has_certificate: true,
    language: 'English',
    access: 'Lifetime after enroll',
    enrollment_trend: [4, 18, 10, 28, 22, 34, 30, 44, 38, 56, 50, 72],
    trend_change_pct: 12,
    modules: [
      {
        id: 'm1',
        title: 'Module 1 — Foundations',
        lessons: [
          { id: 'l1', title: 'Welcome & course overview', type: 'video', duration: '4:12' },
          { id: 'l2', title: 'Core concepts introduction', type: 'video', duration: '11:38' },
          { id: 'l3', title: 'Key terminology reference', type: 'reading' },
          { id: 'l4', title: 'Module 1 knowledge check', type: 'quiz', questions: 5 },
        ],
      },
      {
        id: 'm2',
        title: 'Module 2 — Core Skills',
        lessons: [
          { id: 'l5', title: 'Planning fundamentals', type: 'video', duration: '9:04' },
          { id: 'l6', title: 'Stakeholder mapping', type: 'video', duration: '7:51' },
          { id: 'l7', title: 'Worksheet: risk register', type: 'reading' },
          { id: 'l8', title: 'Module 2 knowledge check', type: 'quiz', questions: 5 },
        ],
      },
      {
        id: 'm3',
        title: 'Module 3 — Advanced Application',
        lessons: [
          { id: 'l9', title: 'Case study walkthrough', type: 'video', duration: '14:20' },
          { id: 'l10', title: 'Advanced scheduling', type: 'video', duration: '10:15' },
          { id: 'l11', title: 'Final project brief', type: 'reading' },
          { id: 'l12', title: 'Final assessment', type: 'quiz', questions: 10 },
        ],
      },
    ],
  }
}

// TODO: replace with adminUsersAPI.listUsers({ role: 'trainer' }) once that
// filter exists — kept as a separate mock list for now since AdminUsersPage
// owns its own mock user set.
export const MOCK_TRAINERS: CourseTrainer[] = [
  { id: 't1', name: 'Enobong Okposin', role: 'Lead Trainer · Leadership', avatar_color: '#2563EB' },
  { id: 't2', name: 'Amara Osei', role: 'Trainer · Communication', avatar_color: '#7C3AED' },
  { id: 't3', name: 'Chioma Ike', role: 'Trainer · Leadership', avatar_color: '#7C3AED' },
]