// pages/trainer/community/TrainerCommunityPage.tsx
import { useEffect, useRef, useState } from 'react'
import TrainerShell from '../../../layouts/TrainerShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../../components/community/CommunityChatPanel'
import { communityAPI } from '../../../services/communityApi'
import { useAuth } from '../../../hooks/useAuth'
import type { CommunityMessage } from '../../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

const POLL_INTERVAL_MS = 7000

export default function TrainerCommunityPage() {
  const { user } = useAuth()

  // Main feed
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [activeMembers, setActiveMembers] = useState(0)
  const [totalMembers, setTotalMembers] = useState(0)
  const [rules, setRules] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const cursorRef = useRef<string | null>(null)

  // Open thread
  const [openThreadParent, setOpenThreadParent] = useState<CommunityMessage | null>(null)
  const [threadReplies, setThreadReplies] = useState<CommunityMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadError, setThreadError] = useState<string | null>(null)
  const [threadSending, setThreadSending] = useState(false)
  const threadCursorRef = useRef<string | null>(null)

  // Initial load — no `?since=`.
  useEffect(() => {
    if (!user) return
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
  }, [user])

  // Rules panel content — fetched once, not polled.
  useEffect(() => {
    if (!user) return
    communityAPI.getRules().then((res) => {
      if (res.success) setRules(res.data.rules.map((r) => r.text))
    })
  }, [user])

  // Poll on an interval using the stored cursor.
  useEffect(() => {
    if (!user) return
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
  }, [user])

  // Poll the open thread's replies
  useEffect(() => {
    if (!user || !openThreadParent) return

    let cancelled = false
    async function initialThreadLoad() {
      setThreadLoading(true)
      setThreadError(null)
      const res = await communityAPI.getReplies(openThreadParent!.id)
      if (cancelled) return
      if (res.success) {
        setThreadReplies(res.data.results)
        if (res.data.results.length > 0) {
          threadCursorRef.current = res.data.results[res.data.results.length - 1].created_at
        } else {
          threadCursorRef.current = openThreadParent!.created_at
        }
      } else {
        setThreadError(res.error)
      }
      setThreadLoading(false)
    }
    initialThreadLoad()

    const interval = setInterval(async () => {
      if (!openThreadParent || threadCursorRef.current === null) return
      const res = await communityAPI.getReplies(openThreadParent.id, threadCursorRef.current)
      if (!res.success) {
        // 404 means the thread is gone — close the panel rather than keep polling.
        setOpenThreadParent(null)
        return
      }
      if (res.data.results.length > 0) {
        setThreadReplies(prev => [...prev, ...res.data.results])
        threadCursorRef.current = res.data.results[res.data.results.length - 1].created_at
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, openThreadParent?.id])

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
    if (res.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
      setThreadReplies(prev => prev.filter(m => m.id !== messageId))
    }
  }

 
  function noopDeleteModerator() {}

  function handleOpenThread(msg: CommunityMessage) {
    const topLevelId = msg.parent_message_id ?? msg.id
    const topLevelMsg = topLevelId === msg.id ? msg : messages.find(m => m.id === topLevelId) ?? msg
    setThreadReplies([])
    threadCursorRef.current = null
    setOpenThreadParent(topLevelMsg)
  }

  function handleCloseThread() {
    setOpenThreadParent(null)
    setThreadReplies([])
    threadCursorRef.current = null
  }

  async function handleSendReply(body: string) {
    if (!openThreadParent) return
    setThreadSending(true)
    const res = await communityAPI.sendMessage(body, openThreadParent.id)
    setThreadSending(false)
    if (res.success) {
      setThreadReplies(prev => [...prev, res.data])
      threadCursorRef.current = res.data.created_at
      setMessages(prev => prev.map(m =>
        m.id === openThreadParent.id ? { ...m, reply_count: (m.reply_count ?? 0) + 1 } : m
      ))
    }
  }

  if (!user) return null

  return (
    <TrainerShell>
      <style>{COMMUNITY_CHAT_CSS + PAGE_CSS}</style>
      <div className="community-page-content">
        <CommunityChatPanel
          role="trainer"
          currentUserId={String(user.id ?? '')}
          currentUserInitials={(user.name || '').slice(0, 2).toUpperCase() || 'TR'}
          messages={messages}
          activeMembers={activeMembers}
          totalMembers={totalMembers}
          rules={rules}
          loading={loading}
          error={error}
          sending={sending}
          onSend={handleSend}
          onDeleteMine={handleDeleteMine}
          onDeleteModerator={noopDeleteModerator}
          openThreadParent={openThreadParent}
          threadReplies={threadReplies}
          threadLoading={threadLoading}
          threadError={threadError}
          threadSending={threadSending}
          onOpenThread={handleOpenThread}
          onCloseThread={handleCloseThread}
          onSendReply={handleSendReply}
        />
      </div>
    </TrainerShell>
  )
}