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

// ─── Mock data ─────────────────────────────────────────────────────────────

// TODO: swap for adminUsersAPI.listUsers() once GET /api/v1/admin/users/ exists.
// Shape below is kept API-ready so the swap is a drop-in replacement.
const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Aisha Bello',     email: 'aisha.b@example.com', role: 'learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#DC2626' },
  { id: '2', name: 'Amara Osei',      email: 'amara@tgpl.org',      role: 'trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#7C3AED' },
  { id: '3', name: 'Chioma Ike',      email: 'chioma@tgpl.org',     role: 'trainer', courses_count: 3, joined_at: '2024-09-05', last_active: 'Today',     status: 'active',   avatar_color: '#7C3AED' },
  { id: '4', name: 'David Mensah',    email: 'david.m@example.com', role: 'learner', joined_at: '2025-03-22', last_active: '1 week ago', status: 'active',   avatar_color: '#059669' },
  { id: '5', name: 'Samuel Okon',     email: 'samuel@tgpl.org',     role: 'admin',   joined_at: '2024-01-01', last_active: 'Today',     status: 'active',   avatar_color: '#DC2626' },
  { id: '6', name: 'Aisha Bello',     email: 'aisha.b@example.com', role: 'learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#DC2626' },
  { id: '7', name: 'Amara Osei',      email: 'amara@tgpl.org',      role: 'trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#7C3AED' },
  { id: '8', name: 'David Mensah',    email: 'david.m@example.com', role: 'learner', joined_at: '2025-03-22', last_active: '1 week ago', status: 'active',   avatar_color: '#059669' },
  { id: '9', name: 'Samuel Okon',     email: 'samuel@tgpl.org',     role: 'admin',   joined_at: '2024-01-01', last_active: 'Today',     status: 'active',   avatar_color: '#DC2626' },
  { id: '10', name: 'Aisha Bello',    email: 'aisha.b@example.com', role: 'learner', joined_at: '2025-06-30', last_active: '4 days ago', status: 'inactive', avatar_color: '#DC2626' },
  { id: '11', name: 'Amara Osei',     email: 'amara@tgpl.org',      role: 'trainer', courses_count: 5, joined_at: '2024-11-20', last_active: 'Yesterday', status: 'active',   avatar_color: '#7C3AED' },
  { id: '12', name: 'Chioma Ike',     email: 'chioma@tgpl.org',     role: 'trainer', courses_count: 3, joined_at: '2024-09-05', last_active: 'Today',     status: 'active',   avatar_color: '#7C3AED' },
]

// ─── Styles ────────────────────────────────────────────────────────────────
// Note: the old .au-modal-* rules (inline delete-confirm modal) have been
// dropped — that modal is fully superseded by DeleteAccountModal now.

const PAGE_CSS = `
  .au-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .au-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .au-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .au-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .au-create-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.7rem 1.2rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }

  .au-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .au-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .au-role-tabs { display: flex; gap: 0.4rem; background: #F9FAFB; border-radius: 0.75rem; padding: 0.3rem; }
  .au-role-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1.1rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; }
  .au-role-tab.active { background: #2563EB; color: #fff; }
  .au-search-wrap { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; }
  .au-search-wrap input { flex: 1; background: none; border: none; outline: none; font-size: 0.875rem; color: #111; }
  .au-search-wrap input::placeholder { color: #9CA3AF; }
  .au-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 700; color: #374151; cursor: pointer; white-space: nowrap; }

  .au-table-wrap { overflow-x: auto; }
  .au-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .au-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .au-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #111827; vertical-align: middle; }
  .au-table tr:last-child td { border-bottom: none; }

  .au-user-cell { display: flex; align-items: center; gap: 0.7rem; }
  .au-avatar { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
  .au-user-meta { min-width: 0; }
  .au-user-name { font-weight: 600; color: #111827; white-space: nowrap; }
  .au-user-courses { font-size: 0.75rem; color: #9CA3AF; }

  .au-role-badge { display: inline-flex; align-items: center; gap: 0.3rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .au-role-badge.learner { background: #EFF6FF; color: #2563EB; }
  .au-role-badge.trainer { background: #ECFDF5; color: #059669; }
  .au-role-badge.admin { background: #F5F3FF; color: #7C3AED; }

  .au-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .au-status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .au-status-badge.active { background: #ECFDF5; color: #059669; }
  .au-status-badge.active .au-status-dot { background: #059669; }
  .au-status-badge.inactive { background: #FEF3C7; color: #D97706; }
  .au-status-badge.inactive .au-status-dot { background: #D97706; }

  .au-row-menu-wrap { position: relative; text-align: right; }
  .au-row-menu-btn { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.4rem; border-radius: 0.5rem; display: inline-flex; }
  .au-row-menu-btn:hover { background: #F3F4F6; color: #374151; }
  .au-row-menu { position: absolute; top: calc(100% + 0.3rem); right: 1.25rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 190px; padding: 0.4rem; z-index: 50; text-align: left; }
  .au-row-menu-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.55rem; border: none; background: none; font-size: 0.85rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; }
  .au-row-menu-item:hover { background: #F9FAFB; }
  .au-row-menu-item.danger { color: #DC2626; }
  .au-row-menu-item.danger:hover { background: #FEF2F2; }

  .au-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; }
  .au-footer-text { font-size: 0.82rem; color: #6B7280; }
  .au-page-pill { width: 30px; height: 30px; border-radius: 0.5rem; background: #2563EB; color: #fff; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; }

  .au-empty { padding: 3rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }

  @media (max-width: 640px) {
    .au-page { padding: 1.25rem; }
    .au-toolbar { flex-direction: column; align-items: stretch; }
    .au-role-tabs { overflow-x: auto; }
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

const ROLE_TABS: { key: 'all' | UserRole; label: string }[] = [
  { key: 'all',     label: 'All roles' },
  { key: 'learner', label: 'Learner' },
  { key: 'trainer', label: 'Trainer' },
  { key: 'admin',   label: 'Admin' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS)
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [viewingUser, setViewingUser] = useState<AdminUser | null>(null)
  const [messagingUser, setMessagingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return users.filter((u) => {
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
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
    if (user.role === 'admin') {
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
    // TODO: call adminUsersAPI.exportCsv() or generate client-side from filteredUsers
    console.log('Export CSV', filteredUsers.length, 'rows')
  }

  function handleCreateUser() {
    // TODO: open create-user modal — out of scope for now per product decision
    console.log('Create user clicked')
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
          <button className="au-create-btn" type="button" onClick={handleCreateUser}>
            <UserPlus size={17} /> Create user
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
              <Search size={16} color="#9CA3AF" />
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
                {filteredUsers.map((user) => (
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
                          {user.role === 'trainer' && user.courses_count != null && (
                            <div className="au-user-courses">{user.courses_count} courses</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`au-role-badge ${user.role}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
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
                            <button
                              className="au-row-menu-item"
                              onClick={() => handleViewProfile(user)}
                              type="button"
                            >
                              <UserIcon size={15} /> View profile
                            </button>
                            <button
                              className="au-row-menu-item"
                              onClick={() => handleSendMessage(user)}
                              type="button"
                            >
                              <MessageSquare size={15} /> Send message
                            </button>
                            <button
                              className="au-row-menu-item danger"
                              onClick={() => requestDelete(user)}
                              type="button"
                            >
                              <Trash2 size={15} /> Delete user
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
    </AdminShell>
  )
}