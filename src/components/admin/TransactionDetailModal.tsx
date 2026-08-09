import { useState } from 'react'
import {
  X, Check, Clock3, X as XCircleIcon, Download, RotateCcw, ArrowRight, BookOpen,
} from 'lucide-react'
import type { AdminTransactionRow, TransactionStatus } from '../../types/adminTransaction'

export const TRANSACTION_MODAL_CSS = `
  .tx-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .tx-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 560px; }
  .tx-scroll { padding: 1.5rem; }

  .tx-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.3rem; }
  .tx-head-left { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
  .tx-title { margin: 0; font-size: 1.35rem; font-weight: 800; color: #111827; }
  .tx-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700; padding: 0.3rem 0.7rem; border-radius: 999px; }
  .tx-status-badge.successful { background: #ECFDF5; color: #059669; }
  .tx-status-badge.pending { background: #FEF3C7; color: #D97706; }
  .tx-status-badge.failed { background: #FEF2F2; color: #DC2626; }
  .tx-status-badge.refunded { background: #F5F3FF; color: #7C3AED; }
  .tx-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .tx-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.2rem; }
  .tx-ref { margin: 0.2rem 0 1.25rem; font-size: 0.82rem; color: #9CA3AF; font-family: monospace; }

  .tx-amount-card { display: flex; align-items: center; justify-content: space-between; background: #F9FAFB; border-radius: 0.9rem; padding: 1.1rem 1.2rem; margin-bottom: 1.25rem; border: 1px solid #F3F4F6; }
  .tx-amount-label { margin: 0; font-size: 0.8rem; color: #9CA3AF; }
  .tx-amount-value { margin: 0.2rem 0 0; font-size: 1.8rem; font-weight: 800; color: #111827; }
  .tx-amount-meta { margin: 0.2rem 0 0; font-size: 0.82rem; color: #9CA3AF; }
  .tx-amount-icon { width: 46px; height: 46px; border-radius: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tx-amount-icon.successful { background: #D1FAE5; color: #059669; }
  .tx-amount-icon.pending { background: #FEF3C7; color: #D97706; }
  .tx-amount-icon.failed { background: #FEE2E2; color: #DC2626; }
  .tx-amount-icon.refunded { background: #EDE9FE; color: #7C3AED; }

  .tx-section { background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04); margin-bottom: 1.1rem; }
  .tx-section-eyebrow { margin: 0; padding: 1rem 1.1rem 0.6rem; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; color: #9CA3AF; text-transform: uppercase; }

  .tx-learner-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.4rem 1.1rem 1rem; border-bottom: 1px solid #F3F4F6; }
  .tx-learner-left { display: flex; align-items: center; gap: 0.7rem; }
  .tx-avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.85rem; flex-shrink: 0; }
  .tx-learner-name { margin: 0; font-weight: 700; font-size: 0.92rem; color: #111827; }
  .tx-learner-email { margin: 0; font-size: 0.8rem; color: #9CA3AF; }
  .tx-enroll-badge { font-size: 0.76rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .tx-enroll-badge.enrolled { background: #ECFDF5; color: #059669; }
  .tx-enroll-badge.not_enrolled { background: #F3F4F6; color: #6B7280; }

  .tx-course-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.9rem 1.1rem; color: #374151; font-size: 0.88rem; font-weight: 600; }

  .tx-timeline { padding: 0.3rem 1.1rem 1.1rem; }
  .tx-timeline-step { display: flex; gap: 0.85rem; }
  .tx-timeline-marker { display: flex; flex-direction: column; align-items: center; }
  .tx-timeline-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 0.2rem; }
  .tx-timeline-dot.done { background: #059669; }
  .tx-timeline-dot.pending { border: 2px solid #D1D5DB; background: #fff; }
  .tx-timeline-dot.error { background: #DC2626; }
  .tx-timeline-line { width: 2px; flex: 1; min-height: 24px; background: #E5E7EB; }
  .tx-timeline-step:last-child .tx-timeline-line { display: none; }
  .tx-timeline-body { padding-bottom: 1.1rem; }
  .tx-timeline-label { margin: 0; font-size: 0.9rem; font-weight: 700; color: #111827; }
  .tx-timeline-label.error { color: #DC2626; }
  .tx-timeline-label.pending { color: #9CA3AF; }
  .tx-timeline-time { margin: 0.15rem 0 0; font-size: 0.78rem; color: #9CA3AF; font-family: monospace; }

  .tx-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .tx-detail-label { font-size: 0.85rem; color: #9CA3AF; }
  .tx-detail-value { font-size: 0.88rem; font-weight: 700; color: #111827; display: flex; align-items: center; gap: 0.4rem; }

  .tx-actions-row { display: flex; flex-direction: column; gap: 0.6rem; padding: 0.3rem 1.1rem 1.1rem; }
  .tx-action-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; width: 100%; }
  .tx-action-btn.primary { border: none; background: #2563EB; color: #fff; }
  .tx-action-btn.neutral { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .tx-action-btn.danger { border: 1.5px solid #FECACA; background: #FEF2F2; color: #DC2626; }
  .tx-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
`

interface TransactionDetailModalProps {
  transaction: AdminTransactionRow
  onClose: () => void
  onStatusChange?: (ref: string, status: TransactionStatus) => void
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const METHOD_LABEL: Record<string, string> = {
  card: 'Card',
  ussd: 'USSD',
  bank_transfer: 'Bank Transfer',
  paystack: 'Paystack',
}

const STATUS_ICON = {
  successful: Check,
  pending: Clock3,
  failed: XCircleIcon,
  refunded: RotateCcw,
} as const

export default function TransactionDetailModal({ transaction, onClose, onStatusChange }: TransactionDetailModalProps) {
  const [status, setStatus] = useState<TransactionStatus>(transaction.status)
  const [busy, setBusy] = useState(false)
  const detail = transaction.detail
  const StatusIcon = STATUS_ICON[status]

  async function handleMarkSuccessful() {
    setBusy(true)
    // TODO: call adminRevenueAPI.markSuccessful(transaction.ref) once the endpoint exists
    await new Promise((r) => setTimeout(r, 300))
    setBusy(false)
    setStatus('successful')
    onStatusChange?.(transaction.ref, 'successful')
  }

  async function handleRetryPayment() {
    setBusy(true)
    // TODO: call adminRevenueAPI.retryPayment(transaction.ref) once the endpoint exists
    await new Promise((r) => setTimeout(r, 300))
    setBusy(false)
    console.log('Retry payment requested for', transaction.ref)
  }

  async function handleIssueRefund() {
    setBusy(true)
    // TODO: call adminRevenueAPI.issueRefund(transaction.ref) once the endpoint exists
    await new Promise((r) => setTimeout(r, 300))
    setBusy(false)
    setStatus('refunded')
    onStatusChange?.(transaction.ref, 'refunded')
  }

  function handleReceipt() {
    // TODO: call adminRevenueAPI.downloadReceipt(transaction.ref) once the endpoint exists
    console.log('Download receipt for', transaction.ref)
  }

  return (
    <div className="tx-overlay" onClick={onClose}>
      <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tx-scroll">
          <div className="tx-head">
            <div className="tx-head-left">
              <h2 className="tx-title">Transaction</h2>
              <span className={`tx-status-badge ${status}`}>
                <span className="tx-status-dot" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <button className="tx-close" onClick={onClose} aria-label="Close" type="button">
              <X size={20} />
            </button>
          </div>
          <p className="tx-ref">{detail.tgpl_ref}</p>

          <div className="tx-amount-card">
            <div>
              <p className="tx-amount-label">Amount charged</p>
              <p className="tx-amount-value">{formatNaira(transaction.amount_naira)}</p>
              <p className="tx-amount-meta">
                {formatDate(transaction.date)} · {METHOD_LABEL[transaction.method]}
              </p>
            </div>
            <div className={`tx-amount-icon ${status}`}>
              <StatusIcon size={20} />
            </div>
          </div>

          <div className="tx-section">
            <p className="tx-section-eyebrow">Learner</p>
            <div className="tx-learner-row">
              <div className="tx-learner-left">
                <div className="tx-avatar" style={{ background: transaction.learner_avatar_color }}>
                  {initials(transaction.learner_name)}
                </div>
                <div>
                  <p className="tx-learner-name">{transaction.learner_name}</p>
                  <p className="tx-learner-email">{transaction.learner_email}</p>
                </div>
              </div>
              <span className={`tx-enroll-badge ${detail.enrollment_state}`}>
                {detail.enrollment_state === 'enrolled' ? 'Enrolled' : 'Not enrolled'}
              </span>
            </div>
            <div className="tx-course-row">
              <BookOpen size={16} color="#9CA3AF" /> {transaction.course_title}
            </div>
          </div>

          <div className="tx-section">
            <p className="tx-section-eyebrow">Payment Timeline</p>
            <div className="tx-timeline">
              {detail.timeline.map((step, i) => (
                <div key={step.label} className="tx-timeline-step">
                  <div className="tx-timeline-marker">
                    <span className={`tx-timeline-dot ${step.state}`} />
                    {i < detail.timeline.length - 1 && <span className="tx-timeline-line" />}
                  </div>
                  <div className="tx-timeline-body">
                    <p className={`tx-timeline-label ${step.state === 'error' ? 'error' : step.state === 'pending' ? 'pending' : ''}`}>
                      {step.label}
                    </p>
                    <p className="tx-timeline-time">{step.time ?? '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="tx-section">
            <p className="tx-section-eyebrow">Gateway Response</p>
            <div className="tx-detail-row" style={{ borderTop: 'none' }}>
              <span className="tx-detail-label">Gateway</span>
              <span className="tx-detail-value">{detail.gateway}</span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Gateway ref</span>
              <span className="tx-detail-value">{detail.gateway_ref}</span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Response message</span>
              <span className="tx-detail-value">{detail.response_message}</span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">Payment method</span>
              <span className="tx-detail-value">{METHOD_LABEL[transaction.method]}</span>
            </div>
            <div className="tx-detail-row">
              <span className="tx-detail-label">TGPL ref</span>
              <span className="tx-detail-value">{detail.tgpl_ref}</span>
            </div>
          </div>

          <div className="tx-section">
            <p className="tx-section-eyebrow">Manual Actions</p>
            <div className="tx-actions-row">
              {status === 'pending' && (
                <button className="tx-action-btn primary" onClick={handleMarkSuccessful} disabled={busy} type="button">
                  <Check size={16} /> {busy ? 'Working…' : 'Mark as successful'}
                </button>
              )}
              {status === 'failed' && (
                <button className="tx-action-btn primary" onClick={handleRetryPayment} disabled={busy} type="button">
                  <ArrowRight size={16} /> {busy ? 'Working…' : 'Retry payment'}
                </button>
              )}

              <button className="tx-action-btn neutral" onClick={handleReceipt} type="button">
                <Download size={16} /> Receipt
              </button>

              {(status === 'successful' || status === 'pending') && (
                <button className="tx-action-btn danger" onClick={handleIssueRefund} disabled={busy} type="button">
                  <XCircleIcon size={16} /> {busy ? 'Working…' : 'Issue refund'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}