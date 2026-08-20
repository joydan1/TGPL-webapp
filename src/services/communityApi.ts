
import { apiClient } from './api'
import type { CommunityThread } from '../types/community'

type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

async function getThread(): Promise<ApiResult<CommunityThread>> {
  try {
    const res = await apiClient.get<CommunityThread>('/v1/community/thread/')
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to fetch community thread:', err)
    return { success: false, error: 'Failed to load the community chat.' }
  }
}

async function sendMessage(body: string): Promise<ApiResult<CommunityThread['messages'][number]>> {
  try {
    const res = await apiClient.post<CommunityThread['messages'][number]>('/v1/community/messages/', { body })
    return { success: true, data: res.data }
  } catch (err) {
    console.error('Failed to send message:', err)
    return { success: false, error: 'Message failed to send.' }
  }
}

async function toggleReaction(messageId: string, emoji: string): Promise<ApiResult<null>> {
  try {
    await apiClient.post(`/v1/community/messages/${messageId}/reactions/`, { emoji })
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to toggle reaction:', err)
    return { success: false, error: 'Reaction failed.' }
  }
}

// Trainer + Admin only.
async function pinMessage(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.post(`/v1/community/messages/${messageId}/pin/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to pin message:', err)
    return { success: false, error: 'Could not pin that message.' }
  }
}

// `scope: 'mine'` = the sender deleting their own message ("Delete for everyone").
// `scope: 'moderator'` = Trainer/Admin removing someone else's message.
async function deleteMessage(messageId: string, scope: 'mine' | 'moderator'): Promise<ApiResult<null>> {
  try {
    await apiClient.delete(`/v1/community/messages/${messageId}/`, { params: { scope } })
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to delete message:', err)
    return { success: false, error: 'Could not delete that message.' }
  }
}

// Admin only.
async function removeAndWarnUser(messageId: string): Promise<ApiResult<null>> {
  try {
    await apiClient.post(`/v1/community/messages/${messageId}/warn-user/`)
    return { success: true, data: null }
  } catch (err) {
    console.error('Failed to warn user:', err)
    return { success: false, error: 'Could not send the warning.' }
  }
}

export const communityAPI = {
  getThread,
  sendMessage,
  toggleReaction,
  pinMessage,
  deleteMessage,
  removeAndWarnUser,
}