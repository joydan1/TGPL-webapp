export type CommunityRole = 'learner' | 'trainer' | 'admin'

export interface CommunityAuthor {
  id: string | null
  full_name: string
  role: CommunityRole | null
  avatar_url: string | null
}

export interface CommunityReaction {
  emoji: string
  count: number
  reacted_by_me: boolean
}

export interface CommunityMessage {
  id: string
  author: CommunityAuthor
  body: string
  created_at: string
  parent_message_id: string | null
  reply_count?: number
  can_delete?: boolean
  reactions: CommunityReaction[]
}

export interface CommunityFeedResponse {
  results: CommunityMessage[]
  active_members: number
  total_members: number
}

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