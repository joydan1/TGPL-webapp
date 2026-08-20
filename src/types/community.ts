export type CommunityRole = 'learner' | 'trainer' | 'admin'

export interface CommunityAuthor {
  id: string
  name: string
  role: CommunityRole
  avatar_url?: string | null
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
  reactions: CommunityReaction[]
  is_pinned: boolean
  is_mine: boolean
}

export interface CommunityThread {
  message_count: number
  active_member_count: number
  rules: string[]
  messages: CommunityMessage[]
}