// pages/admin/AdminCommunityPage.tsx
import { useEffect, useRef, useState } from 'react'
import AdminShell from '../../layouts/AdminShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../components/community/CommunityChatPanel'
import { communityAPI } from '../../services/communityApi'
import { useAuth } from '../../hooks/useAuth' // adjust to your actual auth hook path
import type { CommunityMessage } from '../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

const POLL_INTERVAL_MS = 7000

export default function AdminCommunityPage() {
  const { user } = useAuth() // needs user.id for currentUserId — adjust to your actual auth shape
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [activeMembers, setActiveMembers] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [rules, setRules] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const cursorRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function initialLoad() {
      setLoading(true)
      setError(null)
      const res = await communityAPI.getMessages()
      if (cancelled) return
      if (res.success) {
        setMessages(res.data.results)
        setActiveMembers(res.data.active_members)
        setTotalMembers(res.data.total_members)
        if (res.data.results.length > 0) {
          cursorRef.current = res.data.results[res.data.results.length - 1].created_at
        }
      } else {
        setError(res.error)
      }
      setLoading(false)
    }
    initialLoad()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
  communityAPI.getRules().then((res) => {
    if (res.success) setRules(res.data.rules.map((r) => r.text))
  })
}, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      if (cursorRef.current === null) return
      const res = await communityAPI.getMessages(cursorRef.current)
      if (!res.success) return

      setActiveMembers(res.data.active_members)
      setTotalMembers(res.data.total_members)

      if (res.data.results.length > 0) {
        setMessages(prev => [...prev, ...res.data.results])
        cursorRef.current = res.data.results[res.data.results.length - 1].created_at
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  async function handleSend(body: string) {
    setSending(true)
    const res = await communityAPI.sendMessage(body)
    setSending(false)
    if (res.success) {
      setMessages(prev => [...prev, res.data])
      cursorRef.current = res.data.created_at
    }
  }

  async function handleDeleteMine(messageId: string) {
    const res = await communityAPI.deleteMessage(messageId)
    if (res.success) setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  async function handleDeleteModerator(messageId: string) {
    const res = await communityAPI.moderateDeleteMessage(messageId)
    if (res.success) setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  return (
    <AdminShell>
      <style>{COMMUNITY_CHAT_CSS + PAGE_CSS}</style>
      <div className="community-page-content">
        <CommunityChatPanel
          role="admin"
           currentUserId={String(user?.id ?? '')}
          currentUserInitials="AN"
          messages={messages}
          activeMembers={activeMembers}
          totalMembers={totalMembers}
          rules={rules}
          loading={loading}
          error={error}
          sending={sending}
          onSend={handleSend}
          onDeleteMine={handleDeleteMine}
          onDeleteModerator={handleDeleteModerator}
        />
      </div>
    </AdminShell>
  )
}