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
  learner_profile?: LearnerProfile | null
}

export interface LearnerProfile {
  id?: string
  goals?: string[]
  experience_level?: string
  current_status?: string
  preferred_learning_hours?: string
  completion_status?: 'incomplete' | 'partial' | 'complete'
}

// ── Payment Types ──────────────────────────────────────────────────────────

// Checkout now has 4 screens only; Paystack modal handles the payment sub-screens
export type CheckoutScreen = 'checkout' | 'processing' | 'success' | 'failed'

// Matches GET /api/v1/payments/{reference}/ response
export interface PaymentResult {
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

// Matches POST /api/v1/payments/checkout/ response
export interface CheckoutResponse {
  is_free: false
  reference: string
  payment_id: string
  access_code: string
  authorization_url: string
  amount_kobo: number
}

// /payments/checkout/ response for free courses
export interface FreeCourseCheckoutResponse {
  is_free: true
  reference: string
  payment_id: string
}

//payments/config/ response
export interface PaymentConfig {
  public_key: string
  callback_url_pattern: string
}