// pages/admin/AdminCommunityPage.tsx
import { useCallback, useEffect, useState } from 'react'
import AdminShell from '../../layouts/AdminShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../components/community/CommunityChatPanel'
import { communityAPI } from '../../services/communityApi'
import type { CommunityThread } from '../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

export default function AdminCommunityPage() {
  const [thread, setThread] = useState<CommunityThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await communityAPI.getThread()
    if (res.success) setThread(res.data)
    else setError(res.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSend(body: string) {
    setSending(true)
    const res = await communityAPI.sendMessage(body)
    setSending(false)
    if (res.success) load()
  }

  async function handleReact(messageId: string, emoji: string) {
    const res = await communityAPI.toggleReaction(messageId, emoji)
    if (res.success) load()
  }

  async function handlePin(messageId: string) {
    const res = await communityAPI.pinMessage(messageId)
    if (res.success) load()
  }

  async function handleDeleteMine(messageId: string) {
    const res = await communityAPI.deleteMessage(messageId, 'mine')
    if (res.success) load()
  }

  async function handleDeleteModerator(messageId: string) {
    const res = await communityAPI.deleteMessage(messageId, 'moderator')
    if (res.success) load()
  }

  async function handleRemoveAndWarn(messageId: string) {
    const res = await communityAPI.removeAndWarnUser(messageId)
    if (res.success) load()
  }

  return (
    <AdminShell>
      <style>{COMMUNITY_CHAT_CSS + PAGE_CSS}</style>
      <div className="community-page-content">
        <CommunityChatPanel
          role="admin"
          currentUserInitials="AN"
          thread={thread}
          loading={loading}
          error={error}
          sending={sending}
          onSend={handleSend}
          onReact={handleReact}
          onPin={handlePin}
          onDeleteMine={handleDeleteMine}
          onDeleteModerator={handleDeleteModerator}
          onRemoveAndWarn={handleRemoveAndWarn}
        />
      </div>
    </AdminShell>
  )
}