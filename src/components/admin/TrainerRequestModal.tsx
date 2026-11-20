import { useState } from 'react'
import { X, AlertCircle, Mail } from 'lucide-react'
import RowActionMenu from './RowActionMenu'

export interface TrainerRequestModalData {
  id: string
  full_name: string
  email: string
  subject: string
  message: string
  status: string
  created_at: string
}


interface TrainerRequestModalProps<T extends TrainerRequestModalData> {
  request: T
  onClose: () => void
  onApprove: (request: T) => Promise<void>
  onReject: (request: T) => Promise<void>
}

export const TRAINER_REQUEST_MODAL_CSS = `
  .trm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 100; }
  .trm-card { position: relative; display: flex; flex-direction: column; background: #fff; border-radius: 16px; width: 100%; max-width: 516px; height: min(517px, 88vh); max-height: 88vh; overflow: hidden; font-family: 'Sora', sans-serif; }
  .trm-header { display: flex; flex-shrink: 0; justify-content: flex-end; padding: 1rem 1.5rem 0; }
  .trm-close-btn { border: none; background: none; color: #99A1AF; cursor: pointer; padding: 0.3rem; border-radius: 8px; flex-shrink: 0; }
  .trm-close-btn:hover { background: #F3F4F6; color: #616873; }

  .trm-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 0.25rem 1.5rem 1.25rem; display: flex; flex-direction: column; gap: 0.7rem; }
  .trm-field-label { font-size: 0.9rem; font-weight: 600; color: #687181; margin-bottom: 0.4rem; }
  .trm-field-value, .trm-message-box { display: flex; align-items: center; min-height: 54px; background: #F2F3F5; border: 1px solid #E1E4E8; border-radius: 16px; padding: 0.7rem 1.1rem; font-size: 1.2rem; color: #7A7A7A; word-break: break-word; }
  .trm-message-box { min-height: 104px; align-items: flex-start; line-height: 1.35; white-space: pre-wrap; }

  .trm-inline-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; font-size: 0.75rem; color: #B91C1C; }

  .trm-footer { display: flex; flex-shrink: 0; align-items: stretch; gap: 0.75rem; padding: 0 1.5rem 1.25rem; }
  .trm-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; }
  .trm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .trm-email-btn { min-height: 60px; background: #2492EB; color: #fff; text-decoration: none; border-radius: 16px; font-size: 1rem; white-space: nowrap; }
  .trm-menu-wrap { display: flex; flex: 0 0 72px; align-items: stretch; border-radius: 16px; background: #E9F5FF; }
  .trm-menu-wrap .au-row-menu-wrap { display: flex; width: 100%; }
  .trm-menu-wrap .au-row-menu-btn { display: flex; flex: 1; align-items: center; justify-content: center; color: #374151; border-radius: 16px; }
  .trm-action-menu { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; box-sizing: border-box; width: 224px !important; height: 96px; padding: 0 !important; border-radius: 16px !important; overflow: hidden; }
  .trm-action-menu .au-row-menu-item { flex: 0 0 48px; box-sizing: border-box; justify-content: center; padding: 0 12px; border-radius: 0; font-size: 1rem; font-weight: 600; color: #626B78; }
  .trm-action-menu .au-row-menu-item.primary { color: #2492EB; }
  .trm-action-menu .au-row-menu-item + .au-row-menu-item { border-top: 1px solid #E5E7EB; }
  .trm-action-menu .au-row-menu-item.danger { color: #FF3447; }

  @media (max-width: 480px) {
    .trm-overlay { align-items: flex-end; padding: 0; }
    .trm-card { width: 100%; max-width: none; height: auto; max-height: 90vh; max-height: 90dvh; border-radius: 18px 18px 0 0; }
    .trm-header { padding: 0.65rem 1rem 0; }
    .trm-body { padding: 0.2rem 1rem 0.85rem; gap: 0.55rem; }
    .trm-field-label { font-size: 0.8rem; margin-bottom: 0.3rem; }
    .trm-field-value, .trm-message-box { min-height: 48px; border-radius: 13px; padding: 0.6rem 0.8rem; font-size: 1rem; }
    .trm-message-box { min-height: 88px; }
    .trm-footer { gap: 0.5rem; padding: 0 1rem calc(0.75rem + env(safe-area-inset-bottom)); }
    .trm-btn { min-width: 0; min-height: 52px; padding: 0.65rem 0.5rem; font-size: 0.82rem; }
    .trm-menu-wrap { flex-basis: 56px; }
    .trm-action-menu .au-row-menu-item { padding: 0 12px; font-size: 0.9rem; }
  }

  @media (max-width: 360px) {
    .trm-menu-wrap { flex-basis: 50px; }
    .trm-btn { gap: 0.35rem; padding-right: 0.35rem; padding-left: 0.35rem; font-size: 0.78rem; }
  }

  @media (max-width: 400px) {
    .trm-overlay { align-items: center; padding: 8px; }
    .trm-card { width: 100%; max-width: 380px; max-height: calc(100vh - 16px); max-height: calc(100dvh - 16px); border-radius: 16px; }
    .trm-header { padding: 0.4rem 0.7rem 0; }
    .trm-body { padding: 0.15rem 0.75rem 0.65rem; gap: 0.45rem; }
    .trm-field-label { font-size: 0.72rem; margin-bottom: 0.2rem; }
    .trm-field-value, .trm-message-box { min-height: 42px; border-radius: 11px; padding: 0.45rem 0.7rem; font-size: 0.9rem; }
    .trm-message-box { min-height: 68px; }
    .trm-footer { gap: 0.35rem; padding: 0 0.75rem calc(0.55rem + env(safe-area-inset-bottom)); }
    .trm-btn { min-height: 46px; padding: 0.5rem 0.35rem; font-size: 0.78rem; }
    .trm-menu-wrap { flex-basis: 48px; }
    .trm-action-menu .au-row-menu-item { padding: 0 10px; font-size: 0.85rem; }
  }
`

export default function TrainerRequestModal<T extends TrainerRequestModalData>({
  request,
  onClose,
  onApprove,
  onReject,
}: TrainerRequestModalProps<T>) {
  const [acting, setActing] = useState<'approve' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isPending = request.status.toLowerCase() === 'pending'

  async function handleApprove() {
    setError(null)
    setActing('approve')
    try {
      await onApprove(request)
      onClose()
    } catch {
      setError("Couldn't approve this request. Please try again.")
    } finally {
      setActing(null)
    }
  }

  async function handleReject() {
    setError(null)
    setActing('reject')
    try {
      await onReject(request)
      onClose()
    } catch {
      setError("Couldn't reject this request. Please try again.")
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="trm-overlay" onClick={onClose}>
      <div className="trm-card" onClick={(e) => e.stopPropagation()}>
        <div className="trm-header">
          <button className="trm-close-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="trm-body">
          <div>
            <div className="trm-field-label">Name</div>
            <div className="trm-field-value">{request.full_name}</div>
          </div>
          <div>
            <div className="trm-field-label">Email</div>
            <div className="trm-field-value">{request.email}</div>
          </div>
          <div>
            <div className="trm-field-label">Subject</div>
            <div className="trm-field-value">{request.subject}</div>
          </div>
          <div>
            <div className="trm-field-label">Message</div>
            <div className="trm-message-box">{request.message}</div>
          </div>

          {error && (
            <div className="trm-inline-error" role="alert">
              <AlertCircle size={15} />
              {error}
            </div>
          )}
        </div>

        {isPending && (
          <div className="trm-footer">
            <a className="trm-btn trm-email-btn" href={`mailto:${request.email}`}>
              <Mail size={18} />
              Respond by email
            </a>
            <div className="trm-menu-wrap">
              <RowActionMenu
                label="Trainer request actions"
                loading={acting !== null}
                menuWidth={224}
                menuClassName="trm-action-menu"
                menuPlacement="right"
                items={[
                  { label: 'Approve', primary: true, onClick: handleApprove },
                  { label: 'Decline', danger: true, onClick: handleReject },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}