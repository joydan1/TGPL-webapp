// types/index.ts

export type LearnerProfileStatus = 'incomplete' | 'partial' | 'complete'
export type Goal = 'land_pm_role' | 'switch_careers' | 'upskill_current_role' | 'academic_learning' | 'explore_field'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type CurrentStatus = 'student' | 'working' | 'between_roles' | 'freelancer' | 'career_break'
export type PreferredLearningHours = '1-3' | '4-6' | '7-10' | '10+'

export interface User {
  id: number
  email: string
  name: string
  role: 'learner' | 'trainer' | 'admin'
  createdAt: string
  learner_profile?: LearnerProfile | null   // ← Must match
}

export interface LearnerProfile {
  id?: string
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
  completion_status?: 'incomplete' | 'partial' | 'complete'
  // add other fields as needed
}

// ── Payment Types ─────────────────────────────
export type PaymentMethod = 'card' | 'bank' | 'ussd'
export type CheckoutScreen =
  | 'checkout'
  | 'card-details' | 'card-pin' | 'card-otp'
  | 'bank-details' | 'ussd-details'
  | 'processing' | 'success' | 'failed'

export interface CardDetails {
  number: string
  name: string
  expiry: string
  cvv: string
}

export interface PaymentOrder {
  courseId: string
  courseTitle: string
  amount: number
  method: PaymentMethod
  email: string
  promoCode?: string
}

export interface PaymentResult {
  success: boolean
  orderId?: string
  referenceId?: string
  error?: string
}