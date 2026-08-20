// pages/learner/CommunityPage.tsx
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../components/community/CommunityChatPanel'
import { communityAPI } from '../../services/communityApi'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants/routes'
import type { CommunityThread } from '../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

export default function CommunityPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState('community')
  const [thread, setThread] = useState<CommunityThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

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

  async function handleDeleteMine(messageId: string) {
    const res = await communityAPI.deleteMessage(messageId, 'mine')
    if (res.success) load()
  }

  // Learners have no moderation permissions — pin / moderator-delete / warn
  // are unreachable from this page's context menu, but the panel still
  // needs the props wired so the shared component's TypeScript contract holds.
  function noop() {}

  if (!user) return null

  return (
    <>
      <style>{SHELL_CSS + COMMUNITY_CHAT_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="community-page-content">
          <CommunityChatPanel
            role="learner"
            currentUserInitials={(user.name || user.email || '').slice(0, 2).toUpperCase()}
            thread={thread}
            loading={loading}
            error={error}
            sending={sending}
            onSend={handleSend}
            onReact={handleReact}
            onPin={noop}
            onDeleteMine={handleDeleteMine}
            onDeleteModerator={noop}
            onRemoveAndWarn={noop}
          />
        </div>
      </AppShell>
    </>
  )
}