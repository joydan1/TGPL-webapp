import { apiClient } from './api'
import type { CommunityFeedResponse, CommunityMessage, CommunityRules } from '../types/community'

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// No `?since=` → initial load. Pass `?since=` → poll for new messages.
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

async function sendMessage(body: string): Promise<ApiResult<CommunityMessage>> {
  try {
    const res = await apiClient.post<CommunityMessage>('/v1/community/messages/', { body })
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to send message:', err)
    return { success: false, error: 'Message failed to send.' }
  }
}

// Deleting your own message.
async function deleteMessage(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.delete(`/v1/community/messages/${messageId}/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to delete message:', err)
    return { success: false, error: 'Could not delete that message.' }
  }
}

// Admin-only: delete anyone's message.
async function moderateDeleteMessage(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.delete(`/v1/community/messages/${messageId}/moderate/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to moderate-delete message:', err)
    return { success: false, error: 'Could not remove that message.' }
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
  getRules,
}