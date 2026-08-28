export type CommunityRole = 'learner' | 'trainer' | 'admin'

export interface CommunityAuthor {
  id: string | null // null when the author's account has been deleted
  full_name: string // "Deleted user" when author is null
  role: CommunityRole | null // null when the author's account has been deleted
  avatar_url: string | null
}

export interface CommunityMessage {
  id: string
  author: CommunityAuthor
  body: string
  created_at: string
}

export interface CommunityFeedResponse {
  results: CommunityMessage[]
  active_members: number // posted in the last 15 min
  total_members: number // platform's total enrolled learners
}

export interface CommunityRule {
  id: number
  text: string
}

export interface CommunityRules {
  rules: CommunityRule[]
}