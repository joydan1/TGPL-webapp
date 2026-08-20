// pages/trainer/community/TrainerCommunityPage.tsx
import { useCallback, useEffect, useState } from 'react'
import TrainerShell from '../../../layouts/TrainerShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../../components/community/CommunityChatPanel'
import { communityAPI } from '../../../services/communityApi'
import { useAuth } from '../../../hooks/useAuth'
import type { CommunityThread } from '../../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

export default function TrainerCommunityPage() {
  const { user } = useAuth()
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
    if (user) load()
  }, [user, load])

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

  // Trainers can moderate others' messages but don't get the Admin-only
  // "Remove & warn user" escalation — that prop is a no-op here.
  async function handleDeleteModerator(messageId: string) {
    const res = await communityAPI.deleteMessage(messageId, 'moderator')
    if (res.success) load()
  }
  function noop() {}

  if (!user) return null

  return (
    <TrainerShell>
      <style>{COMMUNITY_CHAT_CSS + PAGE_CSS}</style>
      <div className="community-page-content">
        <CommunityChatPanel
          role="trainer"
          currentUserInitials={(user.name || '').slice(0, 2).toUpperCase() || 'TR'}
          thread={thread}
          loading={loading}
          error={error}
          sending={sending}
          onSend={handleSend}
          onReact={handleReact}
          onPin={handlePin}
          onDeleteMine={handleDeleteMine}
          onDeleteModerator={handleDeleteModerator}
          onRemoveAndWarn={noop}
        />
      </div>
    </TrainerShell>
  )
}