export type UserRole = 'Learner' | 'Trainer' | 'Admin Asst' | 'Super Admin'
export type UserStatus = 'active' | 'inactive'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  courses_count?: number // trainers only, shown in the table row
  joined_at: string
  last_active: string
  status: UserStatus
  avatar_color: string
}

export interface ActivityEntry {
  id: string
  icon: 'book' | 'star' | 'check'| 'upload' | 'message' | 'calendar' | 'bell'
  title: string
  time_ago: string
}

export interface LearnerProfileStats {
  courses_enrolled: number
  courses_completed: number
  certificates_earned: number
  avg_completion_rate: number
  in_progress: { id: string; title: string; percent: number }[]
  recent_activity: ActivityEntry[]
}

export interface TrainerCourseSummary {
  id: string
  title: string
  students: number
  rating: number
  status: 'published' | 'draft'
}

export interface TrainerProfileStats {
  total_students: number
  courses_total: number
  courses_published: number
  avg_rating: number
  courses: TrainerCourseSummary[]
  recent_activity: ActivityEntry[]
}



export function getMockLearnerStats(_user: AdminUser): LearnerProfileStats {
  return {
    courses_enrolled: 1,
    courses_completed: 0,
    certificates_earned: 1,
    avg_completion_rate: 95,
    in_progress: [{ id: 'c1', title: 'Project Management', percent: 25 }],
    recent_activity: [
      { id: 'a1', icon: 'book', title: 'Enrolled in a new course', time_ago: 'Recently' },
      { id: 'a2', icon: 'star', title: 'Left a course review', time_ago: 'Recently' },
      { id: 'a3', icon: 'check', title: 'Completed a course module', time_ago: 'Recently' },
    ],
  }
}

export function getMockTrainerStats(_user: AdminUser): TrainerProfileStats {
  return {
    total_students: 920,
    courses_total: 3,
    courses_published: 2,
    avg_rating: 4.7,
    courses: [
      { id: 't1', title: 'Leadership Essentials', students: 410, rating: 4.8, status: 'published' },
      { id: 't2', title: 'Communication Skills', students: 310, rating: 4.6, status: 'published' },
      { id: 't3', title: 'Emotional Intelligence at Work', students: 200, rating: 4.5, status: 'draft' },
    ],
    recent_activity: [
      { id: 'a1', icon: 'book', title: 'Uploaded a new course', time_ago: 'Recently' },
      { id: 'a2', icon: 'star', title: 'Had a live session', time_ago: 'Recently' },
      { id: 'a3', icon: 'check', title: 'Added a course material', time_ago: 'Recently' },
    ],
  }
}