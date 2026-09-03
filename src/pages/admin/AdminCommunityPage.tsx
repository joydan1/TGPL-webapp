// pages/admin/AdminCommunityPage.tsx
import { useEffect, useRef, useState } from 'react'
import AdminShell from '../../layouts/AdminShell'
import CommunityChatPanel, { COMMUNITY_CHAT_CSS } from '../../components/community/CommunityChatPanel'
import { communityAPI } from '../../services/communityApi'
import { useAuth } from '../../hooks/useAuth'
import type { CommunityMessage } from '../../types/community'

const PAGE_CSS = `
  .community-page-content { padding: 20px; height: calc(100vh - 90px); box-sizing: border-box; }
`

const POLL_INTERVAL_MS = 7000

export default function AdminCommunityPage() {
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

  // Initial main-feed load
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
    return () => { cancelled = true }
  }, [])

  // Rules — fetched once
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
        setMessages(prev => {
     
          return [...prev, ...res.data.results]
        })
        cursorRef.current = res.data.results[res.data.results.length - 1].created_at
      }
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [])

  // Poll the open thread's replies
  useEffect(() => {
    if (!openThreadParent) return

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
  }, [openThreadParent?.id])

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

  async function handleDeleteModerator(messageId: string) {
    const res = await communityAPI.moderateDeleteMessage(messageId)
    if (res.success) {
      setMessages(prev => prev.filter(m => m.id !== messageId))
      setThreadReplies(prev => prev.filter(m => m.id !== messageId))
    }
  }

  function handleOpenThread(msg: CommunityMessage) {
    // Threads are one level deep — always open on the top-level message id,
    // even if the user clicked "reply" on something that's itself a reply.
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
      // Reflect the new reply immediately in the main feed's reply_count too.
      setMessages(prev => prev.map(m =>
        m.id === openThreadParent.id ? { ...m, reply_count: (m.reply_count ?? 0) + 1 } : m
      ))
    }
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
    </AdminShell>
  )
}