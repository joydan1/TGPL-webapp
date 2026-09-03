export type CommunityRole = 'learner' | 'trainer' | 'admin'

export interface CommunityAuthor {
  id: string | null
  full_name: string
  role: CommunityRole | null
  avatar_url: string | null
}

export interface CommunityMessage {
  id: string
  author: CommunityAuthor
  body: string
  created_at: string
  parent_message_id: string | null
  reply_count?: number
}

export interface CommunityFeedResponse {
  results: CommunityMessage[]
  active_members: number
  total_members: number
}

// GET /v1/community/messages/{id}/replies/ — no active_members/total_members on this one.
export interface CommunityRepliesResponse {
  results: CommunityMessage[]
}

export interface CommunityRule {
  id: number
  text: string
}

export interface CommunityRules {
  rules: CommunityRule[]
}