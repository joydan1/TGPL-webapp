import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Mail, Users, ShieldAlert, BookOpen, BarChart3, Megaphone,
  DollarSign, Wallet, Settings as SettingsIcon,
} from 'lucide-react'
import { type UserRole } from '../../types/adminUser'


type InviteRoleChoice = 'Learner' | 'Trainer' | 'Admin Asst'

export interface AdminPermissionKey {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ size?: string | number }>
  sensitive?: boolean
  defaultEnabled: boolean
}

const ADMIN_PERMISSIONS: AdminPermissionKey[] = [
  { id: 'manage_users',       label: 'Manage users',        description: 'Invite, suspend & delete accounts',    icon: Users,        defaultEnabled: true },
  { id: 'moderate_content',   label: 'Moderate content',    description: 'Remove messages & flag violations',    icon: ShieldAlert,  defaultEnabled: true },
  { id: 'manage_courses',     label: 'Manage courses',      description: 'Publish, archive & edit courses',      icon: BookOpen,     defaultEnabled: true },
  { id: 'view_analytics',     label: 'View analytics',      description: 'Access dashboards & reports',          icon: BarChart3,    defaultEnabled: true },
  { id: 'send_announcements', label: 'Send announcements',  description: 'Broadcast platform-wide messages',     icon: Megaphone,    defaultEnabled: true },
  { id: 'view_revenue',       label: 'View revenue',        description: 'See transactions & payment data',      icon: DollarSign,   sensitive: true, defaultEnabled: false },
  { id: 'manage_payouts',     label: 'Manage payouts',      description: 'Approve & process trainer payouts',    icon: Wallet,       sensitive: true, defaultEnabled: false },
  { id: 'system_settings',    label: 'System settings',     description: 'Edit platform config & integrations',  icon: SettingsIcon, sensitive: true, defaultEnabled: false },
]

export interface InviteUserPayload {
  email: string
  role: UserRole
  permissions?: Record<string, boolean>
}

interface InviteUserModalProps {
  onClose: () => void
  onInvite: (payload: InviteUserPayload) => void
}

const MODAL_CSS = `
  .ium-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 1000;
  }
  .ium-card {
    background: #fff;
    border: 1px solid #EBEBEB;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    width: 440px;
    max-width: 100%;
    /* dvh accounts for mobile browser chrome so the card (and the
       scrollable body inside it) never gets silently clipped */
    max-height: 90vh;
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    font-family: 'Sora', sans-serif;
  }

  .ium-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #F3F4F6; flex-shrink: 0; }
  .ium-title { margin: 0; font-size: 16px; font-weight: 700; color: #2B2B2C; }
  .ium-subtitle { margin: 2px 0 0; font-size: 12px; color: #99A1AF; }
  .ium-close { border: none; background: none; cursor: pointer; color: #99A1AF; width: 32px; height: 32px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ium-close:hover { background: #F7F7F7; }

  .ium-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1 1 auto;
    min-height: 0; /* required so flex children can actually shrink & scroll instead of overflowing the card */
  }

  .ium-field-label { display: block; font-size: 12px; font-weight: 600; color: #2B2B2C; margin-bottom: 6px; }
  .ium-input-wrap { position: relative; }
  .ium-input-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #99A1AF; }
  .ium-input { box-sizing: border-box; width: 100%; height: 40px; padding: 0 12px 0 36px; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; font-size: 13px; font-family: 'Sora', sans-serif; color: #2B2B2C; outline: none; }
  .ium-input::placeholder { color: #99A1AF; }
  .ium-input:focus { border-color: #2492EB; background: #fff; }

  .ium-role-row { display: flex; gap: 8px; }
  .ium-role-btn { flex: 1; height: 40px; border-radius: 14px; border: 2px solid #EBEBEB; background: #fff; font-size: 12px; font-weight: 600; color: #99A1AF; cursor: pointer; min-width: 0; }
  .ium-role-btn.active { background: #E9F5FF; border-color: #2492EB; color: #2492EB; }

  .ium-perm-panel { border: 1px solid #EBEBEB; border-radius: 16px; overflow: hidden; flex-shrink: 0; }
  .ium-perm-head { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #FAFAFA; border-bottom: 1px solid #EBEBEB; }
  .ium-perm-head-icon { width: 24px; height: 24px; border-radius: 10px; background: #F5F3FF; color: #8B5CF6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ium-perm-head-title { font-size: 12px; font-weight: 700; color: #2B2B2C; }
  .ium-perm-head-sub { font-size: 10px; color: #99A1AF; margin-top: 2px; }

  .ium-perm-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #F3F4F6; }
  .ium-perm-row:last-child { border-bottom: none; }
  .ium-perm-icon { width: 28px; height: 28px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ium-perm-icon.on { background: #E9F5FF; color: #2492EB; }
  .ium-perm-icon.off { background: #F3F4F6; color: #D1D5DB; }
  .ium-perm-text { flex: 1; min-width: 0; }
  .ium-perm-title-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .ium-perm-title { font-size: 12px; font-weight: 600; }
  .ium-perm-title.on { color: #2B2B2C; }
  .ium-perm-title.off { color: #99A1AF; }
  .ium-perm-desc { font-size: 10px; margin-top: 2px; }
  .ium-perm-desc.on { color: #99A1AF; }
  .ium-perm-desc.off { color: #C4C9D4; }
  .ium-sensitive-tag { font-size: 8px; font-weight: 700; letter-spacing: 0.2px; text-transform: uppercase; color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 999px; padding: 2px 6px; white-space: nowrap; }

  .ium-toggle { position: relative; width: 36px; height: 20px; border-radius: 999px; border: none; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .ium-toggle.on { background: #2492EB; }
  .ium-toggle.off { background: #D1D5DB; }
  .ium-toggle-knob { position: absolute; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: left 0.15s; }
  .ium-toggle.off .ium-toggle-knob { left: 2px; }
  .ium-toggle.on .ium-toggle-knob { left: 18px; }

  .ium-perm-footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 16px; background: #FAFAFA; border-top: 1px solid #EBEBEB; flex-wrap: wrap; }
  .ium-perm-count { font-size: 10px; color: #99A1AF; }
  .ium-clear-all { border: none; background: none; font-size: 10px; font-weight: 600; color: #99A1AF; cursor: pointer; flex-shrink: 0; }
  .ium-clear-all:hover { color: #616873; }

  .ium-footer { padding: 4px 24px 20px; flex-shrink: 0; }
  .ium-submit { width: 100%; height: 44px; border: none; border-radius: 14px; background: #2492EB; color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
  .ium-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Tablet / mobile ──────────────────────────────────────────────── */
  @media (max-width: 640px) {
    .ium-overlay { padding: 0; align-items: flex-end; }
    .ium-card {
      width: 100%;
      max-width: 100%;
      max-height: 92vh;
      max-height: 92dvh;
      border-radius: 20px 20px 0 0;
      border-left: none;
      border-right: none;
      border-bottom: none;
    }
    .ium-header { padding: 16px 18px; }
    .ium-title { font-size: 15px; }
    .ium-body { padding: 16px 18px; gap: 14px; }
    .ium-footer { padding: 4px 18px 18px; }

    .ium-perm-row { padding: 10px 12px; gap: 10px; }
    .ium-perm-head { padding: 10px 12px; }
  }

  /* ── Very small phones ────────────────────────────────────────────── */
  @media (max-width: 380px) {
    .ium-perm-desc { display: none; }
    .ium-perm-row { padding: 10px 8px; }
  }
`

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function InviteUserModal({ onClose, onInvite }: InviteUserModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InviteRoleChoice>('Learner')
  const [permissions, setPermissions] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ADMIN_PERMISSIONS.map((p) => [p.id, p.defaultEnabled]))
  )

  const enabledCount = useMemo(
    () => Object.values(permissions).filter(Boolean).length,
    [permissions]
  )

  const canSubmit = isValidEmail(email) && (role !== 'Admin Asst' || enabledCount > 0)

  function togglePermission(id: string) {
    setPermissions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function clearAll() {
    setPermissions(Object.fromEntries(ADMIN_PERMISSIONS.map((p) => [p.id, false])))
  }

  function handleSubmit() {
    if (!canSubmit) return
    onInvite({
      email: email.trim(),
      role,
      permissions: role === 'Admin Asst' ? permissions : undefined,
    })
  }

  const modal = (
    <div className="ium-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <style>{MODAL_CSS}</style>
      <div className="ium-card">
        <div className="ium-header">
          <div>
            <p className="ium-title">Invite a user</p>
            <p className="ium-subtitle">They'll receive an email invite link</p>
          </div>
          <button className="ium-close" onClick={onClose} type="button" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="ium-body">
          <div>
            <label className="ium-field-label" htmlFor="ium-email">Email address</label>
            <div className="ium-input-wrap">
              <Mail size={14} />
              <input
                id="ium-email"
                className="ium-input"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="ium-field-label">Assign role</label>
            <div className="ium-role-row">
              {(['Learner', 'Trainer', 'Admin Asst'] as InviteRoleChoice[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`ium-role-btn${role === r ? ' active' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r === 'Admin Asst' ? 'Admin' : r}
                </button>
              ))}
            </div>
          </div>

          {role === 'Admin Asst' && (
            <div className="ium-perm-panel">
              <div className="ium-perm-head">
                <div className="ium-perm-head-icon"><ShieldAlert size={13} /></div>
                <div>
                  <div className="ium-perm-head-title">Admin assistant permissions</div>
                  <div className="ium-perm-head-sub">Toggle which functions this admin can access</div>
                </div>
              </div>

              {ADMIN_PERMISSIONS.map((perm) => {
                const on = permissions[perm.id]
                const Icon = perm.icon
                return (
                  <div className="ium-perm-row" key={perm.id}>
                    <div className={`ium-perm-icon ${on ? 'on' : 'off'}`}>
                      <Icon size={13} />
                    </div>
                    <div className="ium-perm-text">
                      <div className="ium-perm-title-row">
                        <span className={`ium-perm-title ${on ? 'on' : 'off'}`}>{perm.label}</span>
                        {perm.sensitive && <span className="ium-sensitive-tag">Sensitive</span>}
                      </div>
                      <div className={`ium-perm-desc ${on ? 'on' : 'off'}`}>{perm.description}</div>
                    </div>
                    <button
                      type="button"
                      className={`ium-toggle ${on ? 'on' : 'off'}`}
                      onClick={() => togglePermission(perm.id)}
                      aria-pressed={on}
                      aria-label={`Toggle ${perm.label}`}
                    >
                      <span className="ium-toggle-knob" />
                    </button>
                  </div>
                )
              })}

              <div className="ium-perm-footer">
                <span className="ium-perm-count">{enabledCount} of {ADMIN_PERMISSIONS.length} permissions enabled</span>
                <button type="button" className="ium-clear-all" onClick={clearAll}>Clear all</button>
              </div>
            </div>
          )}
        </div>

        <div className="ium-footer">
          <button className="ium-submit" type="button" disabled={!canSubmit} onClick={handleSubmit}>
            <Mail size={15} /> Send invite
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}