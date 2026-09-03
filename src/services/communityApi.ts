import { apiClient } from './api'
import type {
  CommunityFeedResponse, CommunityMessage, CommunityRepliesResponse, CommunityRules,
} from '../types/community'

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getMessages(since?: string): Promise<ApiResult<CommunityFeedResponse>> {
  try {
    const res = await apiClient.get<CommunityFeedResponse>('/v1/community/messages/', {
      params: since ? { since } : undefined,
    })
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to fetch community messages:', err)
    return { success: false, error: 'Failed to load the community chat.' }
  }
}


async function sendMessage(body: string, parentMessageId?: string): Promise<ApiResult<CommunityMessage>> {
  try {
    const res = await apiClient.post<CommunityMessage>('/v1/community/messages/', {
      body,
      ...(parentMessageId ? { parent_message_id: parentMessageId } : {}),
    })
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to send message:', err)
    return { success: false, error: 'Message failed to send.' }
  }
}

async function deleteMessage(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.delete(`/v1/community/messages/${messageId}/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to delete message:', err)
    return { success: false, error: 'Could not delete that message.' }
  }
}

async function moderateDeleteMessage(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.delete(`/v1/community/messages/${messageId}/moderate/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to moderate-delete message:', err)
    return { success: false, error: 'Could not remove that message.' }
  }
}


async function getReplies(parentId: string, since?: string): Promise<ApiResult<CommunityRepliesResponse>> {
  try {
    const res = await apiClient.get<CommunityRepliesResponse>(
      `/v1/community/messages/${parentId}/replies/`,
      { params: since ? { since } : undefined },
    )
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to fetch replies:', err)
    return { success: false, error: 'Failed to load replies.' }
  }
}

async function getRules(): Promise<ApiResult<CommunityRules>> {
  try {
    const res = await apiClient.get<CommunityRules>('/v1/community/rules/')
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to fetch community rules:', err)
    return { success: false, error: 'Failed to load community rules.' }
  }
}

export const communityAPI = {
  getMessages,
  sendMessage,
  deleteMessage,
  moderateDeleteMessage,
  getReplies,
  getRules,
}