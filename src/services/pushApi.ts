import { apiClient, parseApiError } from './api'
// ─── Push Notification Types ───────────────────────────────────────────────

export interface PushSubscriptionPayload {
  endpoint: string
  keys: { p256dh: string; auth: string }
  user_agent: string
}

export interface PushVapidKeyResponse {
  public_key: string
}

// ─── Push Notifications API ────────────────────────────────────────────────

export const pushAPI = {
  /** GET /v1/notifications/push/vapid-public-key/ — no auth required */
  getVapidPublicKey: async () => {
    try {
      const response = await apiClient.get<PushVapidKeyResponse>(
        '/v1/notifications/push/vapid-public-key/',
      )
      return { success: true as const, data: response.data }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to load push configuration')
      return { success: false as const, error: message, statusCode }
    }
  },

   /** POST /v1/notifications/push/subscribe/ — idempotent, safe on every page load */
  subscribe: async (payload: PushSubscriptionPayload) => {
    try {
      await apiClient.post('/v1/notifications/push/subscribe/', payload)
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to enable push notifications')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** DELETE /v1/notifications/push/subscribe/ — 204 whether or not it existed */
  unsubscribe: async (endpoint: string) => {
    try {
      await apiClient.delete('/v1/notifications/push/subscribe/', { data: { endpoint } })
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to disable push notifications')
      return { success: false as const, error: message, statusCode }
    }
  },

  /** POST /v1/notifications/push/test/ */
  sendTestPush: async () => {
    try {
      await apiClient.post('/v1/notifications/push/test/')
      return { success: true as const }
    } catch (error) {
      const { message, statusCode } = parseApiError(error, 'Failed to send test push')
      return { success: false as const, error: message, statusCode }
    }
  },
}