import { useEffect, useMemo, useState } from 'react'
import {
  UserPlus, Search, Download, MoreVertical, User as UserIcon,
  Mail, Trash2, Loader2, AlertCircle, Clock, XCircle, CheckCircle2, Ban,
  RotateCw, Slash, ChevronLeft, ChevronRight,
} from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { apiClient } from '../../services/api'
import { adminUsersAPI, type ApiRole, type AdminUserListItem } from '../../services/adminUsersApi'
import UserProfileModal, { USER_PROFILE_MODAL_ALL_CSS } from '../../components/admin/UserProfileModal'
import DeleteAccountModal from '../../components/admin/DeleteAccountModal'
import InviteUserModal, { type InviteUserPayload } from '../../components/admin/InviteUserModal'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: ApiRole
  joined_at: string
  status: 'active' | 'inactive'
  avatar_color: string
}

// ─── Invites (unchanged — separate endpoint, not in scope of this fix) ─────
interface AdminInviteListItem {
  id: string
  email: string
  role: ApiRole
  invited_by_email: string
  status: string
  created_at: string
  expires_at: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type AdminView = 'members' | 'invites'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 400

const AVATAR_PALETTE = ['#EF4444', '#8B5CF6', '#10B981', '#2492EB', '#F59E0B', '#EC4899']

function colorForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function toAdminUser(row: AdminUserListItem): AdminUser {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    joined_at: row.created_at,
    status: row.is_active ? 'active' : 'inactive',
    avatar_color: colorForId(row.id),
  }
}

function roleLabel(role: ApiRole) {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

type RoleFilterKey = 'all' | ApiRole

const ROLE_TABS: { key: RoleFilterKey; label: string }[] = [
  { key: 'all', label: 'All roles' },
  { key: 'learner', label: 'Learner' },
  { key: 'trainer', label: 'Trainer' },
  { key: 'admin', label: 'Admin' },
]

// ─── Styles ────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .au-page { padding: 1.5rem 2rem 2rem; background: #F7F7F7; font-family: 'Sora', sans-serif; }

  .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .au-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #2B2B2C; }
  .au-subtitle { margin: 0.25rem 0 0; color: #99A1AF; font-size: 0.85rem; }
  .au-create-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none; border-radius: 14px; padding: 0.7rem 1.2rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; box-shadow: 0px 1px 3px rgba(36,146,235,0.2), 0px 1px 2px -1px rgba(36,146,235,0.2); white-space: nowrap; }

  .au-view-tabs { display: flex; gap: 0.25rem; background: #fff; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0.25rem; width: fit-content; margin-bottom: 1rem; }
  .au-view-tab { display: flex; align-items: center; gap: 0.4rem; border: none; background: none; color: #99A1AF; font-weight: 600; font-size: 0.82rem; padding: 0.55rem 1rem; border-radius: 10px; cursor: pointer; white-space: nowrap; }
  .au-view-tab.active { background: #E9F5FF; color: #2492EB; }
  .au-view-tab-count { font-size: 0.68rem; font-weight: 700; background: rgba(0,0,0,0.06); color: inherit; border-radius: 999px; padding: 0.05rem 0.4rem; }
  .au-view-tab.active .au-view-tab-count { background: rgba(36,146,235,0.15); }

  .au-panel { background: #fff; border-radius: 16px; border: 1px solid #EBEBEB; overflow: hidden; }

  .au-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .au-role-tabs { display: flex; gap: 0.25rem; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0.25rem; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .au-role-tabs::-webkit-scrollbar { display: none; }
  .au-role-tab { border: none; background: none; color: #99A1AF; font-weight: 600; font-size: 0.8rem; padding: 0.5rem 0.9rem; border-radius: 10px; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .au-role-tab.active { background: #2492EB; color: #fff; }
  .au-search-wrap { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 0.5rem; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0.6rem 1rem; }
  .au-search-wrap input { flex: 1; min-width: 0; background: none; border: none; outline: none; font-size: 0.8rem; color: #2B2B2C; font-family: 'Sora', sans-serif; }
  .au-search-wrap input::placeholder { color: #99A1AF; }
  .au-export-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #fff; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0.6rem 1rem; font-size: 0.8rem; font-weight: 600; color: #616873; cursor: pointer; white-space: nowrap; }
  .au-export-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .au-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .au-table { width: 100%; border-collapse: collapse; min-width: 780px; }
  .au-table th { text-align: left; font-size: 0.68rem; font-weight: 600; color: #99A1AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .au-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F9FAFB; font-size: 0.8rem; color: #616873; vertical-align: middle; }
  .au-table tr:last-child td { border-bottom: none; }

  .au-user-cell { display: flex; align-items: center; gap: 0.7rem; }
  .au-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; object-fit: cover; }
  .au-user-meta { min-width: 0; }
  .au-user-name { font-weight: 600; color: #2B2B2C; white-space: nowrap; font-size: 0.8rem; }

  .au-role-badge { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .au-role-badge.learner { background: #E9F5FF; color: #2492EB; }
  .au-role-badge.trainer { background: #F0FDF4; color: #10B981; }
  .au-role-badge.admin { background: #F5F3FF; color: #8B5CF6; }

  .au-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .au-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .au-status-badge.active { background: #F0FDF4; color: #10B981; }
  .au-status-badge.active .au-status-dot { background: #10B981; }
  .au-status-badge.inactive { background: #FFF7EB; color: #FE9A00; }
  .au-status-badge.inactive .au-status-dot { background: #FE9A00; }

  .au-invite-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; font-weight: 600; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; text-transform: capitalize; }
  .au-invite-badge.pending { background: #FFF7EB; color: #FE9A00; }
  .au-invite-badge.accepted { background: #F0FDF4; color: #10B981; }
  .au-invite-badge.revoked { background: #FEF2F2; color: #DC2626; }
  .au-invite-badge.expired { background: #F3F4F6; color: #99A1AF; }

  .au-row-menu-wrap { position: relative; text-align: right; }
  .au-row-menu-btn { border: none; background: none; cursor: pointer; color: #99A1AF; padding: 0.4rem; border-radius: 10px; display: inline-flex; }
  .au-row-menu-btn:hover { background: #F3F4F6; color: #616873; }
  .au-row-menu-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .au-row-menu { position: absolute; top: calc(100% + 0.3rem); right: 0; background: #fff; border: 1px solid #EBEBEB; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 190px; padding: 0.4rem; z-index: 50; text-align: left; }
  .au-row-menu-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem 0.7rem; border-radius: 10px; border: none; background: none; font-size: 0.8rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; }
  .au-row-menu-item:hover { background: #F9FAFB; }
  .au-row-menu-item:disabled { opacity: 0.5; cursor: not-allowed; }
  .au-row-menu-item.danger { color: #DC2626; }
  .au-row-menu-item.danger:hover { background: #FEF2F2; }

  .au-inline-error { display: flex; align-items: center; gap: 0.5rem; margin: 0 1.25rem 0.9rem; padding: 0.6rem 0.85rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; font-size: 0.75rem; color: #B91C1C; }

  .au-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; background: #FAFAFA; border-top: 1px solid #F3F4F6; }
  .au-footer-text { font-size: 0.75rem; color: #99A1AF; }
  .au-pagination { display: flex; align-items: center; gap: 0.5rem; }
  .au-page-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid #EBEBEB; background: #fff; color: #616873; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .au-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .au-page-pill { min-width: 28px; height: 28px; padding: 0 0.5rem; border-radius: 10px; background: #2492EB; color: #fff; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .au-empty, .au-loading, .au-load-error { padding: 3rem 1.25rem; text-align: center; color: #99A1AF; font-size: 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; }
  .au-load-error { color: #DC2626; }
  .au-retry-btn { border: 1px solid #EBEBEB; background: #fff; color: #374151; font-size: 0.8rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 10px; cursor: pointer; }

  .au-card-list { display: none; }
  .au-user-card { padding: 1rem 1.1rem; border-bottom: 1px solid #F3F4F6; display: flex; gap: 0.75rem; }
  .au-user-card:last-child { border-bottom: none; }
  .au-user-card-checkbox { padding-top: 0.2rem; flex-shrink: 0; }
  .au-user-card-main { flex: 1; min-width: 0; }
  .au-user-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
  .au-user-card-identity { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
  .au-user-card-name { font-weight: 600; color: #2B2B2C; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .au-user-card-email { font-size: 0.72rem; color: #99A1AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .au-user-card-badges { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.6rem; }
  .au-user-card-meta { display: flex; flex-wrap: wrap; gap: 0.3rem 0.8rem; margin-top: 0.5rem; font-size: 0.7rem; color: #99A1AF; }
  .au-user-card-meta span strong { color: #616873; font-weight: 500; }

  .au-invite-card-main { flex: 1; min-width: 0; }
  .au-invite-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
  .au-invite-card-email { font-weight: 600; color: #2B2B2C; font-size: 0.85rem; word-break: break-all; }

  @media (max-width: 900px) {
    .au-page { padding: 1.25rem 1.25rem 1.75rem; }
    .au-header { margin-bottom: 1.1rem; }
    .au-title { font-size: 1.4rem; }
  }

  @media (max-width: 640px) {
    .au-page { padding: 1rem; }
    .au-header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
    .au-create-btn { width: 100%; }

    .au-view-tabs { width: 100%; }
    .au-view-tab { flex: 1; justify-content: center; }

    .au-toolbar { flex-direction: column; align-items: stretch; padding: 1rem; }
    .au-role-tabs { width: 100%; }
    .au-search-wrap { width: 100%; }
    .au-export-btn { width: 100%; }

    .au-table-wrap { display: none; }
    .au-card-list { display: block; }

    .au-footer { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  }

  @media (max-width: 380px) {
    .au-title { font-size: 1.25rem; }
    .au-user-card { padding: 0.85rem; }
  }
`

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatJoinedDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function invitesBadgeClass(status: string) {
  const key = status.toLowerCase()
  return ['pending', 'accepted', 'revoked', 'expired'].includes(key) ? key : 'pending'
}

function invitesBadgeIcon(status: string) {
  switch (status.toLowerCase()) {
    case 'accepted': return CheckCircle2
    case 'revoked': return Ban
    case 'expired': return XCircle
    default: return Clock
  }
}

function downloadCsv(rows: AdminUser[]) {
  const header = ['Name', 'Email', 'Role', 'Joined', 'Status']
  const lines = rows.map((u) => [u.name, u.email, roleLabel(u.role), formatJoinedDate(u.joined_at), u.status])
  const csv = [header, ...lines].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminUsersPage() {
  const [view, setView] = useState<AdminView>('members')

  // ── Members (server-paginated) ──
  const [users, setUsers] = useState<AdminUser[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('all')
  const [searchInput, setSearchInput] = useState('')      // raw input, updates every keystroke
  const [searchQuery, setSearchQuery] = useState('')       // debounced, drives the actual fetch
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  // ── Invites (unchanged) ──
  const [invites, setInvites] = useState<AdminInviteListItem[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [invitesLoadError, setInvitesLoadError] = useState<string | null>(null)
  const [invitesLoaded, setInvitesLoaded] = useState(false)
  const [invitesReloadKey, setInvitesReloadKey] = useState(0)
  const [openInviteMenuId, setOpenInviteMenuId] = useState<string | null>(null)
  const [invitesActingId, setInvitesActingId] = useState<string | null>(null)
  const [inviteActionError, setInviteActionError] = useState<string | null>(null)

  // Debounce the search box — resets to page 1 once the debounced value changes.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [roleFilter, searchQuery])

  // Main members fetch — re-runs whenever page, filters, or reloadKey change.
  useEffect(() => {
    if (view !== 'members') return
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    adminUsersAPI
      .listUsers({
        page,
        page_size: PAGE_SIZE,
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      })
      .then((res) => {
        if (cancelled) return
        if (res.success) {
          setUsers(res.data.results.map(toAdminUser))
          setTotalUsers(res.data.count)
        } else {
          setLoadError(res.error || "Couldn't load users. Please try again.")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [view, page, roleFilter, searchQuery, reloadKey])

  // Invites — unchanged, still lazily loaded on first tab visit.
  useEffect(() => {
    if (view !== 'invites') return
    if (invitesLoaded && invitesReloadKey === 0) return

    let cancelled = false
    setInvitesLoading(true)
    setInvitesLoadError(null)
    apiClient
      .get<PaginatedResponse<AdminInviteListItem>>('/v1/admin/invites/')
      .then((res) => {
        if (cancelled) return
        setInvites(res.data.results)
        setInvitesLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setInvitesLoadError("Couldn't load invites. Please try again.")
      })
      .finally(() => {
        if (!cancelled) setInvitesLoading(false)
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, invitesReloadKey])

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))

  const filteredInvites = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return invites.filter((inv) => {
      const matchesRole = roleFilter === 'all' || inv.role === roleFilter
      const matchesSearch = !q || inv.email.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [invites, roleFilter, searchQuery])

  const allSelected = users.length > 0 && users.every((u) => selectedIds.has(u.id))

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(users.map((u) => u.id)))
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleRowMenu(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id))
  }

  function toggleInviteMenu(id: string) {
    setInviteActionError(null)
    setOpenInviteMenuId((prev) => (prev === id ? null : id))
  }

  async function handleInviteAction(invite: AdminInviteListItem, action: 'resend' | 'revoke') {
    setOpenInviteMenuId(null)
    setInviteActionError(null)
    setInvitesActingId(invite.id)
    try {
      const res = await apiClient.post<AdminInviteListItem>(`/v1/admin/invites/${invite.id}/${action}/`)
      setInvites((prev) => prev.map((inv) => (inv.id === invite.id ? res.data : inv)))
    } catch (err: any) {
      const code = err?.response?.data?.code
      const apiMessage = err?.response?.data?.detail || err?.response?.data?.message
      if (apiMessage) {
        setInviteActionError(apiMessage)
      } else if (code === 'invite_not_pending' || err?.response?.status === 400) {
        setInviteActionError(
          action === 'resend'
            ? "This invite is no longer pending, so it can't be resent."
            : "This invite is no longer pending, so it can't be revoked."
        )
      } else if (err?.response?.status === 404) {
        setInviteActionError('This invite no longer exists.')
      } else {
        setInviteActionError(`Couldn't ${action} the invite. Please try again.`)
      }
    } finally {
      setInvitesActingId(null)
    }
  }

  function handleViewProfile(user: AdminUser) {
    setOpenMenuId(null)
    if (user.role === 'admin') return
    setViewingUser(user)
  }

  function requestDelete(user: AdminUser) {
    setOpenMenuId(null)
    setDeleteError(null)
    setDeletingUser(user)
  }

  async function handleDeleteConfirm() {
    if (!deletingUser) return
    setDeleteError(null)
    setDeleteSubmitting(true)
    try {
      await apiClient.delete(`/v1/admin/users/${deletingUser.id}/?confirm=true`)
      setDeletingUser(null)
      // Deleting a row can shift totals/pages — safest to refetch the
      // current page from the server rather than patch local state.
      setReloadKey((k) => k + 1)
    } catch (err: any) {
      const apiMessage = err?.response?.data?.detail || err?.response?.data?.message
      setDeleteError(apiMessage || "Couldn't delete this account. Please try again.")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  function handleUserStatusChange(userId: string, status: 'active' | 'inactive') {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)))
  }

  function handleUserRoleChange(userId: string, role: 'learner' | 'trainer') {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
  }

  function handleUserDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
    setReloadKey((k) => k + 1)
  }

  // Exports every user matching the current filters, not just the visible
  // page — pages through the server in the background via listAllMatching.
  async function handleExportCsv() {
    setExporting(true)
    setExportError(null)
    const res = await adminUsersAPI.listAllMatching({
      ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
    })
    if (res.success) {
      downloadCsv(res.data.map(toAdminUser))
    } else {
      setExportError(res.error || 'Export failed. Please try again.')
    }
    setExporting(false)
  }

  function handleSwitchView(next: AdminView) {
    setView(next)
    setSearchInput('')
    setSearchQuery('')
    setRoleFilter('all')
    setPage(1)
    setOpenMenuId(null)
    setOpenInviteMenuId(null)
    setInviteActionError(null)
  }

  // The modal now sends exactly what POST /v1/admin/invites/ expects: email,
  // role (already lowercased to match ApiRole), and — only for admin invites
  // — the 8 permission toggle fields. Nothing left to translate here.
  async function handleInviteUser(payload: InviteUserPayload) {
    await apiClient.post('/v1/admin/invites/', payload)
    setInviting(false)
    setInvitesReloadKey((k) => k + 1)
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS + USER_PROFILE_MODAL_ALL_CSS}</style>
      <div className="au-page">

        <div className="au-header">
          <div>
            <h1 className="au-title">Users &amp; Roles</h1>
            <p className="au-subtitle">
              {view === 'members' ? `${totalUsers} total members` : `${invites.length} invites sent`}
            </p>
          </div>
          <button className="au-create-btn" type="button" onClick={() => setInviting(true)}>
            <UserPlus size={17} /> Invite user
          </button>
        </div>

        <div className="au-view-tabs">
          <button
            className={`au-view-tab${view === 'members' ? ' active' : ''}`}
            type="button"
            onClick={() => handleSwitchView('members')}
          >
            Members
            <span className="au-view-tab-count">{totalUsers}</span>
          </button>
          <button
            className={`au-view-tab${view === 'invites' ? ' active' : ''}`}
            type="button"
            onClick={() => handleSwitchView('invites')}
          >
            Invites
            {invitesLoaded && <span className="au-view-tab-count">{invites.length}</span>}
          </button>
        </div>

        <div className="au-panel">
          <div className="au-toolbar">
            <div className="au-role-tabs">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`au-role-tab${roleFilter === tab.key ? ' active' : ''}`}
                  onClick={() => setRoleFilter(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="au-search-wrap">
              <Search size={16} color="#99A1AF" />
              <input
                type="text"
                placeholder={view === 'members' ? 'Search by name or email...' : 'Search by email...'}
                value={view === 'members' ? searchInput : searchQuery}
                onChange={(e) => (view === 'members' ? setSearchInput(e.target.value) : setSearchQuery(e.target.value))}
              />
            </div>

            {view === 'members' && (
              <button className="au-export-btn" type="button" onClick={handleExportCsv} disabled={exporting}>
                {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            )}
          </div>

          {view === 'members' && exportError && (
            <div className="au-inline-error" role="alert">
              <AlertCircle size={15} />
              {exportError}
            </div>
          )}

          {view === 'members' && (
            <>
              {loading && (
                <div className="au-loading">
                  <Loader2 size={20} className="animate-spin" /> Loading users…
                </div>
              )}

              {!loading && loadError && (
                <div className="au-load-error">
                  <AlertCircle size={20} />
                  {loadError}
                  <button className="au-retry-btn" type="button" onClick={() => setReloadKey((k) => k + 1)}>
                    Retry
                  </button>
                </div>
              )}

              {!loading && !loadError && (
                <>
                  <div className="au-table-wrap">
                    <table className="au-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40 }}>
                            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                          </th>
                          <th>User</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.has(user.id)}
                                onChange={() => toggleSelectOne(user.id)}
                              />
                            </td>
                            <td>
                              <div className="au-user-cell">
                                <div className="au-avatar" style={{ background: user.avatar_color }}>
                                  {initials(user.name)}
                                </div>
                                <div className="au-user-meta">
                                  <div className="au-user-name">{user.name}</div>
                                </div>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`au-role-badge ${user.role}`}>{roleLabel(user.role)}</span>
                            </td>
                            <td>{formatJoinedDate(user.joined_at)}</td>
                            <td>
                              <span className={`au-status-badge ${user.status}`}>
                                <span className="au-status-dot" />
                                {user.status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div className="au-row-menu-wrap">
                                <button
                                  className="au-row-menu-btn"
                                  onClick={() => toggleRowMenu(user.id)}
                                  aria-label="Row actions"
                                  aria-haspopup="true"
                                  aria-expanded={openMenuId === user.id}
                                  type="button"
                                >
                                  <MoreVertical size={17} />
                                </button>
                                {openMenuId === user.id && (
                                  <div className="au-row-menu" role="menu">
                                    <button className="au-row-menu-item" onClick={() => handleViewProfile(user)} type="button">
                                      <UserIcon size={15} /> View profile
                                    </button>
                                    <a
                                      className="au-row-menu-item"
                                      href={`mailto:${user.email}`}
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Mail size={15} /> Send message
                                    </a>
                                    {user.role === 'learner' && (
                                      <button className="au-row-menu-item danger" onClick={() => requestDelete(user)} type="button">
                                        <Trash2 size={15} /> Delete user
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {users.length === 0 && (
                      <div className="au-empty">No users match your filters.</div>
                    )}
                  </div>

                  <div className="au-card-list">
                    {users.map((user) => (
                      <div className="au-user-card" key={user.id}>
                        <div className="au-user-card-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.id)}
                            onChange={() => toggleSelectOne(user.id)}
                          />
                        </div>
                        <div className="au-user-card-main">
                          <div className="au-user-card-top">
                            <div className="au-user-card-identity">
                              <div className="au-avatar" style={{ background: user.avatar_color, width: 34, height: 34, fontSize: '0.7rem' }}>
                                {initials(user.name)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div className="au-user-card-name">{user.name}</div>
                                <div className="au-user-card-email">{user.email}</div>
                              </div>
                            </div>
                            <div className="au-row-menu-wrap">
                              <button
                                className="au-row-menu-btn"
                                onClick={() => toggleRowMenu(user.id)}
                                aria-label="Row actions"
                                aria-haspopup="true"
                                aria-expanded={openMenuId === user.id}
                                type="button"
                              >
                                <MoreVertical size={17} />
                              </button>
                              {openMenuId === user.id && (
                                <div className="au-row-menu" role="menu">
                                  <button className="au-row-menu-item" onClick={() => handleViewProfile(user)} type="button">
                                    <UserIcon size={15} /> View profile
                                  </button>
                                  <a
                                    className="au-row-menu-item"
                                    href={`mailto:${user.email}`}
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <Mail size={15} /> Send message
                                  </a>
                                  {user.role === 'learner' && (
                                    <button className="au-row-menu-item danger" onClick={() => requestDelete(user)} type="button">
                                      <Trash2 size={15} /> Delete user
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="au-user-card-badges">
                            <span className={`au-role-badge ${user.role}`}>{roleLabel(user.role)}</span>
                            <span className={`au-status-badge ${user.status}`}>
                              <span className="au-status-dot" />
                              {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <div className="au-user-card-meta">
                            <span>Joined <strong>{formatJoinedDate(user.joined_at)}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {users.length === 0 && (
                      <div className="au-empty">No users match your filters.</div>
                    )}
                  </div>

                  <div className="au-footer">
                    <span className="au-footer-text">
                      Page {page} of {totalPages} · {totalUsers} total users
                    </span>
                    <div className="au-pagination">
                      <button
                        className="au-page-btn"
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        aria-label="Previous page"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="au-page-pill">{page}</span>
                      <button
                        className="au-page-btn"
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        aria-label="Next page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {view === 'invites' && (
            <>
              {invitesLoading && (
                <div className="au-loading">
                  <Loader2 size={20} className="animate-spin" /> Loading invites…
                </div>
              )}

              {!invitesLoading && invitesLoadError && (
                <div className="au-load-error">
                  <AlertCircle size={20} />
                  {invitesLoadError}
                  <button className="au-retry-btn" type="button" onClick={() => setInvitesReloadKey((k) => k + 1)}>
                    Retry
                  </button>
                </div>
              )}

              {!invitesLoading && !invitesLoadError && (
                <>
                  {inviteActionError && (
                    <div className="au-inline-error" role="alert">
                      <AlertCircle size={15} />
                      {inviteActionError}
                    </div>
                  )}

                  <div className="au-table-wrap">
                    <table className="au-table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Invited by</th>
                          <th>Sent</th>
                          <th>Expires</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvites.map((inv) => {
                          const StatusIcon = invitesBadgeIcon(inv.status)
                          const isPending = inv.status.toLowerCase() === 'pending'
                          const isActing = invitesActingId === inv.id
                          return (
                            <tr key={inv.id}>
                              <td>{inv.email}</td>
                              <td>
                                <span className={`au-role-badge ${inv.role}`}>{roleLabel(inv.role)}</span>
                              </td>
                              <td>{inv.invited_by_email}</td>
                              <td>{formatJoinedDate(inv.created_at)}</td>
                              <td>{formatJoinedDate(inv.expires_at)}</td>
                              <td>
                                <span className={`au-invite-badge ${invitesBadgeClass(inv.status)}`}>
                                  <StatusIcon size={12} />
                                  {inv.status}
                                </span>
                              </td>
                              <td>
                                {isPending && (
                                  <div className="au-row-menu-wrap">
                                    <button
                                      className="au-row-menu-btn"
                                      onClick={() => toggleInviteMenu(inv.id)}
                                      aria-label="Invite actions"
                                      aria-haspopup="true"
                                      aria-expanded={openInviteMenuId === inv.id}
                                      type="button"
                                      disabled={isActing}
                                    >
                                      {isActing ? <Loader2 size={17} className="animate-spin" /> : <MoreVertical size={17} />}
                                    </button>
                                    {openInviteMenuId === inv.id && (
                                      <div className="au-row-menu" role="menu">
                                        <button
                                          className="au-row-menu-item"
                                          onClick={() => handleInviteAction(inv, 'resend')}
                                          type="button"
                                        >
                                          <RotateCw size={15} /> Resend invite
                                        </button>
                                        <button
                                          className="au-row-menu-item danger"
                                          onClick={() => handleInviteAction(inv, 'revoke')}
                                          type="button"
                                        >
                                          <Slash size={15} /> Revoke invite
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {filteredInvites.length === 0 && (
                      <div className="au-empty">No invites match your filters.</div>
                    )}
                  </div>

                  <div className="au-card-list">
                    {filteredInvites.map((inv) => {
                      const StatusIcon = invitesBadgeIcon(inv.status)
                      const isPending = inv.status.toLowerCase() === 'pending'
                      const isActing = invitesActingId === inv.id
                      return (
                        <div className="au-user-card" key={inv.id}>
                          <div className="au-invite-card-main">
                            <div className="au-invite-card-top">
                              <div className="au-invite-card-email">{inv.email}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span className={`au-invite-badge ${invitesBadgeClass(inv.status)}`}>
                                  <StatusIcon size={12} />
                                  {inv.status}
                                </span>
                                {isPending && (
                                  <div className="au-row-menu-wrap">
                                    <button
                                      className="au-row-menu-btn"
                                      onClick={() => toggleInviteMenu(inv.id)}
                                      aria-label="Invite actions"
                                      aria-haspopup="true"
                                      aria-expanded={openInviteMenuId === inv.id}
                                      type="button"
                                      disabled={isActing}
                                    >
                                      {isActing ? <Loader2 size={17} className="animate-spin" /> : <MoreVertical size={17} />}
                                    </button>
                                    {openInviteMenuId === inv.id && (
                                      <div className="au-row-menu" role="menu">
                                        <button
                                          className="au-row-menu-item"
                                          onClick={() => handleInviteAction(inv, 'resend')}
                                          type="button"
                                        >
                                          <RotateCw size={15} /> Resend invite
                                        </button>
                                        <button
                                          className="au-row-menu-item danger"
                                          onClick={() => handleInviteAction(inv, 'revoke')}
                                          type="button"
                                        >
                                          <Slash size={15} /> Revoke invite
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="au-user-card-badges">
                              <span className={`au-role-badge ${inv.role}`}>{roleLabel(inv.role)}</span>
                            </div>

                            <div className="au-user-card-meta">
                              <span>By <strong>{inv.invited_by_email}</strong></span>
                              <span>Sent <strong>{formatJoinedDate(inv.created_at)}</strong></span>
                              <span>Expires <strong>{formatJoinedDate(inv.expires_at)}</strong></span>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {filteredInvites.length === 0 && (
                      <div className="au-empty">No invites match your filters.</div>
                    )}
                  </div>

                  <div className="au-footer">
                    <span className="au-footer-text">
                      Showing {filteredInvites.length} of {invites.length} invites
                    </span>
                    <span className="au-page-pill">1</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {viewingUser && (
        <UserProfileModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onStatusChange={handleUserStatusChange}
          onRoleChange={handleUserRoleChange}
          onDeleted={(id) => {
            handleUserDeleted(id)
            setViewingUser(null)
          }}
        />
      )}

      {deletingUser && (
        <DeleteAccountModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleDeleteConfirm}
          submitting={deleteSubmitting}
          errorMessage={deleteError}
        />
      )}

      {inviting && (
        <InviteUserModal
          onClose={() => setInviting(false)}
          onInvite={handleInviteUser}
        />
      )}
    </AdminShell>
  )
}