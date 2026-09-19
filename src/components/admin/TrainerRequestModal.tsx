import { useState } from 'react'
import { X, CheckCircle2, Ban, Loader2, AlertCircle } from 'lucide-react'

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
  .trm-card { background: #fff; border-radius: 18px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; font-family: 'Sora', sans-serif; }
  .trm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.5rem 1.5rem 1rem; }
  .trm-title { margin: 0; font-size: 1.15rem; font-weight: 700; color: #2B2B2C; word-break: break-word; }
  .trm-subtitle { margin: 0.2rem 0 0; font-size: 0.8rem; color: #99A1AF; word-break: break-all; }
  .trm-close-btn { border: none; background: none; color: #99A1AF; cursor: pointer; padding: 0.3rem; border-radius: 8px; flex-shrink: 0; }
  .trm-close-btn:hover { background: #F3F4F6; color: #616873; }

  .trm-body { padding: 0 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .trm-field-label { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; color: #99A1AF; margin-bottom: 0.3rem; }
  .trm-field-value { font-size: 0.85rem; color: #2B2B2C; word-break: break-word; }
  .trm-message-box { background: #FAFAFA; border: 1px solid #EBEBEB; border-radius: 12px; padding: 0.85rem 1rem; font-size: 0.85rem; color: #374151; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }

  .trm-inline-error { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; font-size: 0.75rem; color: #B91C1C; }

  .trm-footer { display: flex; gap: 0.6rem; padding: 0 1.5rem 1.5rem; }
  .trm-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.7rem 1rem; border-radius: 12px; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; }
  .trm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .trm-btn.approve { background: #10B981; color: #fff; }
  .trm-btn.reject { background: #fff; color: #DC2626; border: 1px solid #FECACA; }

  @media (max-width: 480px) {
    .trm-overlay { padding: 0.5rem; align-items: flex-end; }
    .trm-card { border-radius: 16px; max-height: 92vh; }
    .trm-header { padding: 1.25rem 1.1rem 0.85rem; }
    .trm-body { padding: 0 1.1rem 1.25rem; }
    .trm-footer { flex-direction: column-reverse; padding: 0 1.1rem 1.25rem; }
    .trm-btn { width: 100%; padding: 0.8rem 1rem; }
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
          <div>
            <h2 className="trm-title">{request.full_name}</h2>
            <p className="trm-subtitle">{request.email}</p>
          </div>
          <button className="trm-close-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="trm-body">
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
            <button className="trm-btn reject" type="button" onClick={handleReject} disabled={acting !== null}>
              {acting === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
              Reject
            </button>
            <button className="trm-btn approve" type="button" onClick={handleApprove} disabled={acting !== null}>
              {acting === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  )
}