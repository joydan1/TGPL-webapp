// ─── Admin Trainer types (types/adminTrainer.ts) ──────────────────────────

export interface AdminTrainerRow {
  id: string
  full_name: string
  email: string
  bio: string
  avatar_url: string | null
  courses_taught: number
  active_students: number
  is_active: boolean
}

export interface PaginatedTrainers {
  count: number
  next: string | null
  previous: string | null
  results: AdminTrainerRow[]
}

export interface ListTrainersParams {
  is_active?: boolean
  ordering?:
    | 'first_name'
    | '-first_name'
    | 'courses_taught'
    | '-courses_taught'
    | 'active_students'
    | '-active_students'
  page?: number
  page_size?: number
  search?: string
}