import { useEffect, useState } from 'react'
import {
  X, Check, Clock3, X as XCircleIcon, RotateCcw, RefreshCw, FileText,
} from 'lucide-react'
import { adminRevenueAPI } from '../../services/adminRevenueApi'
import type { AdminPaymentDetail, PaymentStatus, RefundReason } from '../../types/adminPayment'

export const TRANSACTION_MODAL_CSS = `
  .tx-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: flex-start; justify-content: center; z-index: 900; padding: 2rem 1rem; overflow-y: auto; }
  .tx-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 560px; }
  .tx-scroll { padding: 1.5rem; }

  .tx-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.3rem; }
  .tx-head-left { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
  .tx-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: #2B2B2C; }

  /* Status badges — colors copied 1:1 from Figma (bg + border + text/dot) */
  .tx-status-badge { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.6875rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: 999px; border: 1px solid transparent; }
  .tx-status-badge.successful { background: #F0FDF4; border-color: #BBF7D0; color: #10B981; }
  .tx-status-badge.pending    { background: #FFF7E6; border-color: #FDE68A; color: #FE9A00; }
  .tx-status-badge.failed     { background: #FEF2F2; border-color: #FECACA; color: #EF4444; }
  .tx-status-badge.refunded   { background: #F5F3FF; border-color: #DDD6FE; color: #7C3AED; }
  .tx-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
  .tx-close { border: none; background: none; cursor: pointer; color: #99A1AF; padding: 0.2rem; }
  .tx-ref { margin: 0.25rem 0 1.25rem; font-size: 0.75rem; color: #99A1AF; font-family: 'Consolas', monospace; }

  .tx-amount-card { display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 1rem; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
  .tx-amount-label { margin: 0; font-size: 0.75rem; color: #99A1AF; }
  .tx-amount-value { margin: 0.25rem 0 0; font-size: 2rem; font-weight: 700; color: #2B2B2C; line-height: 1; }
  .tx-amount-meta { margin: 0.25rem 0 0; font-size: 0.6875rem; color: #99A1AF; }
  .tx-amount-icon { width: 56px; height: 56px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid transparent; color: #2B2B2C; }
  .tx-amount-icon.successful { background: #F0FDF4; border-color: #BBF7D0; }
  .tx-amount-icon.pending    { background: #FFF7E6; border-color: #FDE68A; }
  .tx-amount-icon.failed     { background: #FEF2F2; border-color: #FECACA; }
  .tx-amount-icon.refunded   { background: #F5F3FF; border-color: #DDD6FE; }

  .tx-section { background: #fff; border: 1px solid #EBEBEB; border-radius: 1rem; overflow: hidden; margin-bottom: 1.25rem; }
  .tx-section-eyebrow { margin: 0; padding: 0.75rem 1.25rem; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.0375em; color: #99A1AF; text-transform: uppercase; border-bottom: 1px solid #F3F4F6; }

  .tx-warning-row { display: flex; align-items: flex-start; gap: 0.5rem; margin: 1rem 1.25rem; padding: 0.7rem 0.85rem; background: #FFF7E6; color: #B45309; border-radius: 0.6rem; font-size: 0.8rem; }

  .tx-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; gap: 1rem; }
  .tx-detail-row:first-of-type { border-top: none; }
  .tx-detail-label { font-size: 0.6875rem; color: #99A1AF; flex-shrink: 0; }
  .tx-detail-value { font-size: 0.75rem; font-weight: 600; color: #2B2B2C; display: flex; align-items: center; gap: 0.4rem; text-align: right; }

  /* Learner / trainer row with avatar */
  .tx-person-row { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.25rem; }
  .tx-avatar { width: 40px; height: 40px; border-radius: 0.875rem; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8125rem; flex-shrink: 0; }
  .tx-person-name { margin: 0; font-size: 0.875rem; font-weight: 600; color: #2B2B2C; }
  .tx-person-email { margin: 0; font-size: 0.75rem; color: #99A1AF; }
  .tx-enroll-pill { margin-left: auto; display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.6875rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: 999px; white-space: nowrap; }
  .tx-enroll-pill.enrolled     { background: #F0FDF4; border: 1px solid #BBF7D0; color: #10B981; }
  .tx-enroll-pill.not-enrolled { background: #F3F4F6; border: 1px solid #E5E7EB; color: #99A1AF; }
  .tx-course-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.25rem; background: #FAFAFA; border-top: 1px solid #F3F4F6; font-size: 0.8125rem; color: #616873; }

  /* Vertical timeline — matches Figma stepper (filled green = done, hollow gray = not yet, filled red = failed) */
  .tx-timeline { padding: 1rem 1.25rem; }
  .tx-timeline-step { display: flex; gap: 1rem; }
  .tx-timeline-rail { display: flex; flex-direction: column; align-items: center; width: 12px; flex-shrink: 0; }
  .tx-timeline-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid; flex-shrink: 0; margin-top: 2px; }
  .tx-timeline-dot.done    { background: #10B981; border-color: #10B981; }
  .tx-timeline-dot.failed  { background: #EF4444; border-color: #EF4444; }
  .tx-timeline-dot.pending { background: #FFFFFF; border-color: #E5E7EB; }
  .tx-timeline-line { width: 1px; flex: 1; min-height: 22px; margin: 4px 0; }
  .tx-timeline-line.done    { background: #BBF7D0; }
  .tx-timeline-line.failed  { background: #FECACA; }
  .tx-timeline-line.pending { background: #E5E7EB; }
  .tx-timeline-body { padding-bottom: 1rem; }
  .tx-timeline-title { margin: 0; font-size: 0.8125rem; font-weight: 600; color: #2B2B2C; }
  .tx-timeline-title.pending { color: #99A1AF; }
  .tx-timeline-title.failed { color: #E7000B; }
  .tx-timeline-time { margin: 0.125rem 0 0; font-size: 0.6875rem; color: #99A1AF; font-family: 'Consolas', monospace; }

  .tx-actions-row { display: flex; flex-wrap: wrap; gap: 0.6rem; padding: 1rem 1.25rem; }
  .tx-action-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 0.875rem; padding: 0.7rem; font-size: 0.8125rem; font-weight: 700; cursor: pointer; }
  .tx-action-btn.full { flex-basis: 100%; }
  .tx-action-btn.half { flex: 1 1 calc(50% - 0.3rem); }
  .tx-action-btn.primary { border: none; background: #2492EB; color: #fff; }
  .tx-action-btn.neutral { border: 1px solid #EBEBEB; background: #fff; color: #616873; }
  .tx-action-btn.danger { border: 1px solid #FFE2E2; background: #FEF2F2; color: #FB2C36; }
  .tx-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .tx-refund-form { padding: 0 1.25rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
  .tx-refund-form select, .tx-refund-form textarea { border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.6rem 0.75rem; font-size: 0.85rem; font-family: inherit; }
  .tx-refund-form textarea { resize: vertical; min-height: 60px; }

  .tx-loading, .tx-error { padding: 3rem 1.5rem; text-align: center; color: #99A1AF; font-size: 0.9rem; }
  .tx-error { color: #DC2626; }

  .tx-feedback { margin: 0 1.25rem 1rem; padding: 0.6rem 0.85rem; border-radius: 0.6rem; font-size: 0.8rem; }
  .tx-feedback.success { background: #F0FDF4; color: #10B981; }
  .tx-feedback.error { background: #FEF2F2; color: #DC2626; }
`

interface TransactionDetailModalProps {
  paymentId: string
  onClose: () => void
  onChanged?: (paymentId: string, newStatus: PaymentStatus) => void
}

const STATUS_META: Record<PaymentStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Pending', badgeClass: 'pending' },
  processing: { label: 'Pending', badgeClass: 'pending' },
  succeeded: { label: 'Successful', badgeClass: 'successful' },
  failed: { label: 'Failed', badgeClass: 'failed' },
  refunded: { label: 'Refunded', badgeClass: 'refunded' },
  abandoned: { label: 'Failed', badgeClass: 'failed' },
}

const STATUS_ICON = {
  succeeded: Check,
  processing: Clock3,
  pending: Clock3,
  failed: XCircleIcon,
  refunded: RotateCcw,
  abandoned: XCircleIcon,
} as const

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: 'learner_request', label: 'Learner request' },
  { value: 'duplicate_charge', label: 'Duplicate charge' },
  { value: 'course_cancelled', label: 'Course cancelled' },
  { value: 'other', label: 'Other' },
]

function formatNairaFromKobo(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function humanizeAction(action: string) {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

// Deterministic-ish avatar color from name, matching the Figma palette (blue / purple / amber)
const AVATAR_COLORS = ['#2492EB', '#8B5CF6', '#FE9A00']
function avatarColor(name: string) {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export default function TransactionDetailModal({ paymentId, onClose, onChanged }: TransactionDetailModalProps) {
  const [detail, setDetail] = useState<AdminPaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [refundFormOpen, setRefundFormOpen] = useState(false)
  const [refundReason, setRefundReason] = useState<RefundReason>('learner_request')
  const [refundNote, setRefundNote] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const result = await adminRevenueAPI.getTransaction(paymentId)
      if (cancelled) return
      if (result.success) {
        setDetail(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [paymentId])

  function applyStatus(newStatus: PaymentStatus) {
    setDetail((prev) => (prev ? { ...prev, status: newStatus } : prev))
    onChanged?.(paymentId, newStatus)
  }

  async function handleUpdateStatus(status: 'succeeded' | 'failed') {
    setBusy(true)
    setFeedback(null)
    const result = await adminRevenueAPI.updateStatus(paymentId, status)
    setBusy(false)
    if (result.success) {
      applyStatus(status)
      setFeedback({ type: 'success', text: result.data.detail || 'Status updated.' })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
  }

  function handleViewReceipt() {
    if (detail?.payment_details && 'receipt_url' in detail.payment_details) {
      window.open((detail.payment_details as any).receipt_url, '_blank')
    } else {
      setFeedback({ type: 'error', text: 'No receipt available for this transaction yet.' })
    }
  }

  async function handleRefundConfirm() {
    setBusy(true)
    setFeedback(null)
    const result = await adminRevenueAPI.refund(paymentId, refundReason, refundNote)
    setBusy(false)
    if (result.success) {
      applyStatus('refunded')
      setRefundFormOpen(false)
      setFeedback({ type: 'success', text: result.data.detail || 'Refund recorded.' })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
  }

  async function handleMarkRefundedExternal() {
    setBusy(true)
    setFeedback(null)
    const result = await adminRevenueAPI.markRefundedExternal(paymentId, { note: refundNote })
    setBusy(false)
    if (result.success) {
      applyStatus('refunded')
      setRefundFormOpen(false)
      setFeedback({ type: 'success', text: result.data.detail || 'Marked as refunded (external).' })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
  }

  // Reconciles Payment + Enrollment from Paystack — the fix for "paid but no enrollment record"
  async function handleResync() {
    setBusy(true)
    setFeedback(null)
    const result = await adminRevenueAPI.resyncFromPaystack(paymentId)
    if (result.success) {
      const refreshed = await adminRevenueAPI.getTransaction(paymentId)
      if (refreshed.success) {
        setDetail(refreshed.data)
        onChanged?.(paymentId, refreshed.data.status)
      }
      setFeedback({
        type: 'success',
        text: result.data.status === 'synced'
          ? 'Access repaired — enrollment created.'
          : 'Already in sync — nothing to fix.',
      })
    } else {
      setFeedback({ type: 'error', text: result.error })
    }
    setBusy(false)
  }

  return (
    <div className="tx-overlay" onClick={onClose}>
      <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tx-scroll">
          <div className="tx-head">
            <div className="tx-head-left">
              <h2 className="tx-title">Transaction</h2>
              {detail && (
                <span className={`tx-status-badge ${STATUS_META[detail.status]?.badgeClass ?? 'pending'}`}>
                  <span className="tx-status-dot" />
                  {STATUS_META[detail.status]?.label ?? detail.status}
                </span>
              )}
            </div>
            <button className="tx-close" onClick={onClose} aria-label="Close" type="button">
              <X size={20} />
            </button>
          </div>

          {loading && <div className="tx-loading">Loading…</div>}
          {!loading && error && <div className="tx-error">{error}</div>}

          {!loading && detail && (
            <>
              <p className="tx-ref">{detail.reference}</p>

              <div className="tx-amount-card">
                <div>
                  <p className="tx-amount-label">Amount charged</p>
                  <p className="tx-amount-value">{formatNairaFromKobo(detail.amount_kobo)}</p>
                  <p className="tx-amount-meta">
                    {formatDateTime(detail.paid_at ?? detail.created_at)} · {detail.payment_method}
                  </p>
                </div>
                <div className={`tx-amount-icon ${STATUS_META[detail.status]?.badgeClass ?? 'pending'}`}>
                  {(() => {
                    const Icon = STATUS_ICON[detail.status] ?? Clock3
                    return <Icon size={22} />
                  })()}
                </div>
              </div>

              {detail.status === 'succeeded' && detail.enrollment === null && (
                <div className="tx-warning-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Paid but no enrollment record — this learner may not have course access.</span>
                  <button
                    className="tx-action-btn primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                    onClick={handleResync}
                    disabled={busy}
                    type="button"
                  >
                    <RefreshCw size={14} /> {busy ? 'Syncing…' : 'Repair access'}
                  </button>
                </div>
              )}

              <div className="tx-section">
                <p className="tx-section-eyebrow">Learner</p>
                <div className="tx-person-row">
                  <div className="tx-avatar" style={{ background: avatarColor(detail.learner.full_name) }}>
                    {initials(detail.learner.full_name)}
                  </div>
                  <div>
                    <p className="tx-person-name">{detail.learner.full_name}</p>
                    <p className="tx-person-email">{detail.learner.email}</p>
                  </div>
                  <span className={`tx-enroll-pill ${detail.enrollment ? 'enrolled' : 'not-enrolled'}`}>
                    <span className="tx-status-dot" />
                    {detail.enrollment ? 'Enrolled' : 'Not enrolled'}
                  </span>
                </div>
                <div className="tx-course-row">{detail.course.title}</div>
              </div>

              <div className="tx-section">
                <p className="tx-section-eyebrow">Payment timeline</p>
                <div className="tx-timeline">
                  {detail.audit_log.length ? (
                    detail.audit_log.map((entry, i) => {
                      const isFailed = /fail|block|decline/i.test(entry.action)
                      // A step with no timestamp hasn't happened yet — render it hollow/gray like
                      // Figma's "Enrollment pending" / "3DS verification" placeholder steps.
                      const isPending = !entry.timestamp
                      const state = isFailed ? 'failed' : isPending ? 'pending' : 'done'
                      const isLast = i === detail.audit_log.length - 1
                      return (
                        <div className="tx-timeline-step" key={i}>
                          <div className="tx-timeline-rail">
                            <span className={`tx-timeline-dot ${state}`} />
                            {!isLast && <span className={`tx-timeline-line ${state}`} />}
                          </div>
                          <div className="tx-timeline-body">
                            <p className={`tx-timeline-title ${state !== 'done' ? state : ''}`}>
                              {humanizeAction(entry.action)}
                            </p>
                            <p className="tx-timeline-time">{entry.timestamp ? formatDateTime(entry.timestamp) : '—'}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="tx-timeline-time">No timeline entries.</p>
                  )}
                </div>
              </div>

              <div className="tx-section">
                <p className="tx-section-eyebrow">Gateway response</p>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Gateway</span>
                  <span className="tx-detail-value">{String(detail.payment_details?.gateway ?? 'Paystack')}</span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Gateway ref</span>
                  <span className="tx-detail-value" style={{ fontFamily: 'Consolas, monospace' }}>
                    {detail.payment_details?.reference_id ?? '—'}
                  </span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Response message</span>
                  <span className="tx-detail-value">
                    {String(detail.failure_reason ?? detail.payment_details?.response_message ?? 'Transaction successful')}
                  </span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">Payment method</span>
                  <span className="tx-detail-value">{detail.payment_method}</span>
                </div>
                <div className="tx-detail-row">
                  <span className="tx-detail-label">TGPL ref</span>
                  <span className="tx-detail-value" style={{ fontFamily: 'Consolas, monospace' }}>{detail.reference}</span>
                </div>
              </div>

              {feedback && <div className={`tx-feedback ${feedback.type}`}>{feedback.text}</div>}

              <div className="tx-section">
                <p className="tx-section-eyebrow">Manual actions</p>
                <div className="tx-actions-row">
                  {detail.status === 'pending' && (
                    <button className="tx-action-btn primary full" onClick={() => handleUpdateStatus('succeeded')} disabled={busy} type="button">
                      <Check size={16} /> {busy ? 'Working…' : 'Mark as successful'}
                    </button>
                  )}
                  {detail.status === 'failed' && (
                    <button className="tx-action-btn primary full" onClick={handleResync} disabled={busy} type="button">
                      <RefreshCw size={16} /> {busy ? 'Working…' : 'Resync from Paystack'}
                    </button>
                  )}

                  <button className={`tx-action-btn neutral ${detail.status === 'failed' ? 'full' : 'half'}`} onClick={handleViewReceipt} disabled={busy} type="button">
                    <FileText size={16} /> Receipt
                  </button>

                  {detail.status !== 'failed' && !refundFormOpen && detail.status === 'succeeded' && (
                    <button className="tx-action-btn danger half" onClick={() => setRefundFormOpen(true)} disabled={busy} type="button">
                      <RotateCcw size={16} /> Issue refund
                    </button>
                  )}
                </div>

                {refundFormOpen && (
                  <div className="tx-refund-form">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B2B2C' }}>Reason</label>
                    <select value={refundReason} onChange={(e) => setRefundReason(e.target.value as RefundReason)}>
                      {REFUND_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2B2B2C' }}>Note (optional)</label>
                    <textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="Internal note…" />
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button className="tx-action-btn primary" onClick={handleRefundConfirm} disabled={busy} type="button">
                        {busy ? 'Working…' : 'Confirm refund (via Paystack)'}
                      </button>
                      <button className="tx-action-btn neutral" onClick={() => setRefundFormOpen(false)} disabled={busy} type="button">
                        Cancel
                      </button>
                    </div>
                    <button className="tx-action-btn neutral" onClick={handleMarkRefundedExternal} disabled={busy} type="button">
                      Mark refunded externally instead (bank transfer, no email)
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}