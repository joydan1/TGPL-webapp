import { useMemo, useState } from 'react'
import {
  UserPlus, Search, Download, MoreVertical, User as UserIcon,
  MessageSquare, Trash2,
} from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { type AdminUser, type UserRole, type UserStatus } from '../../types/adminUser'
import UserProfileModal, { USER_PROFILE_MODAL_ALL_CSS } from '../../components/admin/UserProfileModal'
import DeleteAccountModal from '../../components/admin/DeleteAccountModal'
import MessageComposerModal from '../../components/admin/MessageComposerModal'
import InviteUserModal, { type InviteUserPayload } from '../../components/admin/InviteUserModal'

// ─── Mock data ─────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Aisha Bello',     email: 'aisha.b@example.com', role: 'Learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#EF4444' },
  { id: '2', name: 'Amara Osei',      email: 'amara@tgpl.org',      role: 'Trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#8B5CF6' },
  { id: '3', name: 'Chioma Ike',      email: 'chioma@tgpl.org',     role: 'Trainer', courses_count: 3, joined_at: '2024-09-05', last_active: 'Today',     status: 'active',   avatar_color: '#8B5CF6' },
  { id: '4', name: 'David Mensah',    email: 'david.m@example.com', role: 'Learner', joined_at: '2025-03-22', last_active: '1 week ago', status: 'active',   avatar_color: '#10B981' },
  { id: '5', name: 'Samuel Okon',     email: 'samuel@tgpl.org',     role: 'Admin Asst',   joined_at: '2024-01-01', last_active: 'Today',     status: 'active',   avatar_color: '#EF4444' },
  { id: '6', name: 'Aisha Bello',     email: 'aisha.b@example.com', role: 'Learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#EF4444' },
  { id: '7', name: 'Amara Osei',      email: 'amara@tgpl.org',      role: 'Trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#8B5CF6' },
  { id: '8', name: 'David Mensah',    email: 'david.m@example.com', role: 'Learner', joined_at: '2025-03-22', last_active: '1 week ago', status: 'active',   avatar_color: '#10B981' },
  { id: '9', name: 'Samuel Okon',     email: 'samuel@tgpl.org',     role: 'Super Admin',   joined_at: '2024-01-01', last_active: 'Today',     status: 'active',   avatar_color: '#EF4444' },
  { id: '10', name: 'Aisha Bello',    email: 'aisha.b@example.com', role: 'Learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#EF4444' },
  { id: '11', name: 'Amara Osei',     email: 'amara@tgpl.org',      role: 'Trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#8B5CF6' },
  { id: '12', name: 'Chioma Ike',     email: 'chioma@tgpl.org',     role: 'Trainer', courses_count: 3, joined_at: '2024-09-05', last_active: 'Today',     status: 'active',   avatar_color: '#8B5CF6' },
]

// ─── Role helpers ────────────────────────────────────────────────────────
// AdminUser.role can be display text like "Learner", "Trainer", "Admin Asst",
// "Super Admin" — normalize to a badge variant so filtering/styling works
// regardless of the exact admin sub-role label.

type RoleFilterKey = 'all' | 'learner' | 'trainer' | 'admin'
type RoleBadgeVariant = 'learner' | 'trainer' | 'admin'

function roleVariant(role: UserRole): RoleBadgeVariant {
  switch (role) {
    case 'Learner': return 'learner'
    case 'Trainer': return 'trainer'
    case 'Admin Asst':
    case 'Super Admin':
      return 'admin'
  }
}

// ─── Styles ────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .au-page { padding: 1.5rem 2rem 2rem; background: #F7F7F7; font-family: 'Sora', sans-serif; }

  .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .au-title { margin: 0; font-size: 1.75rem; font-weight: 700; color: #2B2B2C; }
  .au-subtitle { margin: 0.25rem 0 0; color: #99A1AF; font-size: 0.85rem; }
  .au-create-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #2492EB; color: #fff; border: none; border-radius: 14px; padding: 0.7rem 1.2rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; box-shadow: 0px 1px 3px rgba(36,146,235,0.2), 0px 1px 2px -1px rgba(36,146,235,0.2); white-space: nowrap; }

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

  /* ── Table (desktop/tablet default) ──────────────────────────────── */
  .au-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .au-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .au-table th { text-align: left; font-size: 0.68rem; font-weight: 600; color: #99A1AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .au-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F9FAFB; font-size: 0.8rem; color: #616873; vertical-align: middle; }
  .au-table tr:last-child td { border-bottom: none; }

  .au-user-cell { display: flex; align-items: center; gap: 0.7rem; }
  .au-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.75rem; flex-shrink: 0; }
  .au-user-meta { min-width: 0; }
  .au-user-name { font-weight: 600; color: #2B2B2C; white-space: nowrap; font-size: 0.8rem; }
  .au-user-courses { font-size: 0.7rem; color: #99A1AF; }

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

  .au-row-menu-wrap { position: relative; text-align: right; }
  .au-row-menu-btn { border: none; background: none; cursor: pointer; color: #99A1AF; padding: 0.4rem; border-radius: 10px; display: inline-flex; }
  .au-row-menu-btn:hover { background: #F3F4F6; color: #616873; }
  .au-row-menu { position: absolute; top: calc(100% + 0.3rem); right: 0; background: #fff; border: 1px solid #EBEBEB; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 190px; padding: 0.4rem; z-index: 50; text-align: left; }
  .au-row-menu-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem 0.7rem; border-radius: 10px; border: none; background: none; font-size: 0.8rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; }
  .au-row-menu-item:hover { background: #F9FAFB; }
  .au-row-menu-item.danger { color: #DC2626; }
  .au-row-menu-item.danger:hover { background: #FEF2F2; }

  .au-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; background: #FAFAFA; border-top: 1px solid #F3F4F6; }
  .au-footer-text { font-size: 0.75rem; color: #99A1AF; }
  .au-page-pill { width: 28px; height: 28px; border-radius: 10px; background: #2492EB; color: #fff; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .au-empty { padding: 3rem 1.25rem; text-align: center; color: #99A1AF; font-size: 0.85rem; }

  /* ── Card layout (mobile only, hidden by default) ────────────────── */
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

  /* ── Tablet ───────────────────────────────────────────────────────── */
  @media (max-width: 900px) {
    .au-page { padding: 1.25rem 1.25rem 1.75rem; }
    .au-header { margin-bottom: 1.1rem; }
    .au-title { font-size: 1.4rem; }
  }

  /* ── Mobile: switch table to card list ───────────────────────────── */
  @media (max-width: 640px) {
    .au-page { padding: 1rem; }
    .au-header { flex-direction: column; align-items: stretch; gap: 0.75rem; }
    .au-create-btn { width: 100%; }

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

// ─── Helpers ───────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatJoinedDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const ROLE_TABS: { key: RoleFilterKey; label: string }[] = [
  { key: 'all',     label: 'All roles' },
  { key: 'learner', label: 'Learner' },
  { key: 'trainer', label: 'Trainer' },
  { key: 'admin',   label: 'Admin' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [roleFilter, setRoleFilter] = useState<RoleFilterKey>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [messagingUser, setMessagingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [inviting, setInviting] = useState(false)

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || roleVariant(u.role) === roleFilter
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, searchQuery])

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.has(u.id))

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(filteredUsers.map((u) => u.id)))
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

  function handleViewProfile(user: AdminUser) {
    setOpenMenuId(null)
    if (roleVariant(user.role) === 'admin') {
      // TODO: build an admin-specific profile view — skipped for now per product call
      console.log('Admin profile view not built yet:', user.id)
      return
    }
    setViewingUser(user)
  }

  function handleSendMessage(user: AdminUser) {
    setOpenMenuId(null)
    setMessagingUser(user)
  }

  function requestDelete(user: AdminUser) {
    setOpenMenuId(null)
    setDeletingUser(user)
  }

  function handleUserStatusChange(userId: string, status: UserStatus) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)))
  }

  function handleUserDeleted(userId: string) {
    setUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  function handleExportCsv() {
    console.log('Export CSV', filteredUsers.length, 'rows')
  }

  function handleInviteUser(payload: InviteUserPayload) {
    // TODO: wire to real invite endpoint once Mark confirms the shape
    console.log('Invite user', payload)
    setInviting(false)
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS + USER_PROFILE_MODAL_ALL_CSS}</style>
      <div className="au-page">

        <div className="au-header">
          <div>
            <h1 className="au-title">Users &amp; Roles</h1>
            <p className="au-subtitle">{users.length} total members</p>
          </div>
          <button className="au-create-btn" type="button" onClick={() => setInviting(true)}>
            <UserPlus size={17} /> Invite user
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
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="au-export-btn" type="button" onClick={handleExportCsv}>
              <Download size={15} /> Export CSV
            </button>
          </div>

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
        <th>Last Active</th>
        <th>Status</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {filteredUsers.map((user) => {
        const variant = roleVariant(user.role)
        return (
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
                  {variant === 'trainer' && user.courses_count != null && (
                    <div className="au-user-courses">{user.courses_count} courses</div>
                  )}
                </div>
              </div>
            </td>
            <td>{user.email}</td>
            <td>
              <span className={`au-role-badge ${variant}`}>{user.role}</span>
            </td>
            <td>{formatJoinedDate(user.joined_at)}</td>
            <td>{user.last_active}</td>
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
                    <button className="au-row-menu-item" onClick={() => handleSendMessage(user)} type="button">
                      <MessageSquare size={15} /> Send message
                    </button>
                    <button className="au-row-menu-item danger" onClick={() => requestDelete(user)} type="button">
                      <Trash2 size={15} /> Delete user
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        )
      })}
    </tbody>
  </table>

  {filteredUsers.length === 0 && (
    <div className="au-empty">No users match your filters.</div>
  )}
</div>

{/* Mobile card list — same data/handlers, shown instead of the table under 640px */}
<div className="au-card-list">
  {filteredUsers.map((user) => {
    const variant = roleVariant(user.role)
    return (
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
                  <button className="au-row-menu-item" onClick={() => handleSendMessage(user)} type="button">
                    <MessageSquare size={15} /> Send message
                  </button>
                  <button className="au-row-menu-item danger" onClick={() => requestDelete(user)} type="button">
                    <Trash2 size={15} /> Delete user
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="au-user-card-badges">
            <span className={`au-role-badge ${variant}`}>{user.role}</span>
            <span className={`au-status-badge ${user.status}`}>
              <span className="au-status-dot" />
              {user.status === 'active' ? 'Active' : 'Inactive'}
            </span>
            {variant === 'trainer' && user.courses_count != null && (
              <span className="au-user-card-meta"><span><strong>{user.courses_count}</strong> courses</span></span>
            )}
          </div>

          <div className="au-user-card-meta">
            <span>Joined <strong>{formatJoinedDate(user.joined_at)}</strong></span>
            <span>Active <strong>{user.last_active}</strong></span>
          </div>
        </div>
      </div>
    )
  })}

  {filteredUsers.length === 0 && (
    <div className="au-empty">No users match your filters.</div>
  )}
</div>
          <div className="au-footer">
            <span className="au-footer-text">
              Showing {filteredUsers.length} of {users.length} users
            </span>
            <span className="au-page-pill">1</span>
          </div>
        </div>
      </div>

      {viewingUser && (
        <UserProfileModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onStatusChange={handleUserStatusChange}
          onDeleted={(id) => {
            handleUserDeleted(id)
            setViewingUser(null)
          }}
        />
      )}

      {messagingUser && (
        <MessageComposerModal user={messagingUser} onClose={() => setMessagingUser(null)} />
      )}

      {deletingUser && (
        <DeleteAccountModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => {
            handleUserDeleted(deletingUser.id)
            setDeletingUser(null)
          }}
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