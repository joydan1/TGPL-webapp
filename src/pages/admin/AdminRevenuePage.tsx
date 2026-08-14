import { useEffect, useMemo, useState, useCallback } from 'react'
import { Download, Search, TrendingUp, CheckCircle2, Clock3, ArrowUpRight, ChevronRight } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminRevenueAPI } from '../../services/adminRevenueApi'
import type { AdminPaymentRow, PaymentStatus, RevenueSummaryData } from '../../types/adminPayment'
import TransactionDetailModal, { TRANSACTION_MODAL_CSS } from '../../components/admin/TransactionDetailModal'

const PAGE_CSS = `
  .rv-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .rv-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .rv-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .rv-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .rv-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.65rem 1.1rem; font-size: 0.875rem; font-weight: 700; color: #374151; cursor: pointer; }
  .rv-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .rv-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .rv-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); display: flex; align-items: flex-start; gap: 0.85rem; }
  .rv-stat-icon { width: 40px; height: 40px; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rv-stat-value { margin: 0; font-size: 1.4rem; font-weight: 800; color: #111827; }
  .rv-stat-title { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6B7280; }
  .rv-stat-sub { color: #9CA3AF; }

  .rv-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .rv-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .rv-status-tabs { display: flex; gap: 0.4rem; background: #F9FAFB; border-radius: 0.75rem; padding: 0.3rem; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
  .rv-status-tabs::-webkit-scrollbar { display: none; }
  .rv-status-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .rv-status-tab.active { background: #2563EB; color: #fff; }
  .rv-search-wrap { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; }
  .rv-search-wrap input { flex: 1; background: none; border: none; outline: none; font-size: 0.875rem; color: #111; }
  .rv-search-wrap input::placeholder { color: #9CA3AF; }

  .rv-table-wrap { overflow-x: auto; }
  .rv-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .rv-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .rv-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #111827; vertical-align: middle; }
  .rv-table tr:last-child td { border-bottom: none; }
  .rv-table tr.clickable { cursor: pointer; }
  .rv-table tr.clickable:hover { background: #FAFAFA; }

  .rv-learner-cell { display: flex; align-items: center; gap: 0.7rem; }
  .rv-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.68rem; flex-shrink: 0; }
  .rv-learner-name { font-weight: 600; color: #111827; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  .rv-learner-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; max-width: 200px; overflow: hidden; text-overflow: ellipsis; }
  .rv-course-cell { color: #374151; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; display: block; }

  .rv-method-cell { display:inline-flex; align-items: center; gap: 0.4rem; color: #374151;  white-space: nowrap; }
.rv-method-cell .icon { width: 18px; height: 18px; flex-shrink: 0; /* prevents shifting */
}
  .rv-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .rv-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .rv-status-badge.successful { background: #BBF7D0; color: #10B981; }
  .rv-status-badge.pending { background: #FEF3C7; color: #FE9A00; }
  .rv-status-badge.failed { background: #FEF2F2; color: #EF4444; }
  .rv-status-badge.refunded { background: #F5F3FF; color: #8B5CF6; }

  .rv-chevron-cell { text-align: right; color: #D1D5DB; }

  .rv-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; }
  .rv-footer-text { font-size: 0.82rem; color: #6B7280; }
  .rv-footer-total { font-size: 0.85rem; font-weight: 800; color: #111827; }

  .rv-empty, .rv-loading, .rv-error { padding: 3rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }
  .rv-error { color: #EF4444; }

  @media (max-width: 900px) {
    .rv-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .rv-page { padding: 1.25rem; }
    .rv-stats { grid-template-columns: 1fr; }
    .rv-toolbar { flex-direction: column; align-items: stretch; }
    .rv-status-tabs { width: 100%; }
    .rv-status-tab { padding: 0.55rem 0.85rem; font-size: 0.8rem; }
     .rv-method-cell { min-width: 90px; }
  }
`

const AVATAR_COLORS = ['#2492EB', '#8B5CF6', '#10B981', '#FE9A00', '#EF4444']

function avatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function methodDisplay(paymentMethod: string) {
  const m = paymentMethod.toLowerCase()
  if (m.includes('card')) return { icon: '💳', label: 'Card' }
  if (m.includes('ussd')) return { icon: '📱', label: 'USSD' }
  if (m.includes('bank') || m.includes('transfer')) return { icon: '🏦', label: 'Bank Transfer' }
  return { icon: '🟢', label: paymentMethod.split(' ')[0] || paymentMethod }
}

function formatNairaFromKobo(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
}

function formatShortNairaFromKobo(kobo: number) {
  const naira = kobo / 100
  if (naira >= 1000) return `₦${Math.round(naira / 1000)}K`
  return formatNairaFromKobo(kobo)
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_META: Record<PaymentStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Pending', badgeClass: 'pending' },
  processing: { label: 'Processing', badgeClass: 'pending' },
  succeeded: { label: 'Successful', badgeClass: 'successful' },
  failed: { label: 'Failed', badgeClass: 'failed' },
  refunded: { label: 'Refunded', badgeClass: 'refunded' },
  abandoned: { label: 'Abandoned', badgeClass: 'failed' },
}

const STATUS_TABS: { key: 'all' | PaymentStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'succeeded', label: 'Successful' },
  { key: 'failed', label: 'Failed' },
  { key: 'pending', label: 'Pending' },
  { key: 'refunded', label: 'Refunded' },
]

export default function AdminRevenuePage() {
  const [transactions, setTransactions] = useState<AdminPaymentRow[]>([])
  const [summary, setSummary] = useState<RevenueSummaryData | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = {
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery.trim() || undefined,
      page: 1,
      page_size: 100,
    }
    const [listResult, summaryResult] = await Promise.all([
      adminRevenueAPI.listTransactions(params),
      adminRevenueAPI.getRevenueSummary(params),
    ])
    if (listResult.success) {
      setTransactions(listResult.data)
    } else {
      setError(listResult.error)
    }
    if (summaryResult.success) {
      setSummary(summaryResult.data.summary)
    }
    setLoading(false)
  }, [statusFilter, searchQuery])

  useEffect(() => {
    const t = setTimeout(loadData, searchQuery ? 350 : 0) // debounce search only
    return () => clearTimeout(t)
  }, [loadData, searchQuery])

  const filteredTotal = useMemo(
    () => transactions.reduce((sum, t) => sum + t.amount_kobo, 0),
    [transactions],
  )

  async function handleExportCsv() {
    setExporting(true)
    await adminRevenueAPI.exportTransactions({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery.trim() || undefined,
      format: 'csv',
    })
    setExporting(false)
  }

  function handleTxnChanged(paymentId: string, newStatus: PaymentStatus) {
    setTransactions((prev) => prev.map((t) => (t.id === paymentId ? { ...t, status: newStatus } : t)))
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS + TRANSACTION_MODAL_CSS}</style>
      <div className="rv-page">

        <div className="rv-header">
          <div>
            <h1 className="rv-title">Revenue &amp; Payments</h1>
            <p className="rv-subtitle">{transactions.length} transactions</p>
          </div>
          <button className="rv-export-btn" type="button" onClick={handleExportCsv} disabled={exporting}>
            <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="rv-stats">
          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#D1FAE5' }}>
              <TrendingUp size={18} color="#059669" />
            </div>
            <div>
              <p className="rv-stat-value">{summary ? formatNairaFromKobo(summary.total_revenue_kobo) : '—'}</p>
              <p className="rv-stat-title">Total revenue <span className="rv-stat-sub">{summary?.total_count ?? 0} transactions</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#E9F5FF' }}>
              <CheckCircle2 size={18} color="#2492EB" />
            </div>
            <div>
              <p className="rv-stat-value">{summary?.successful_count ?? 0}</p>
              <p className="rv-stat-title">Successful <span className="rv-stat-sub">completed payments</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#FEF3C7' }}>
              <Clock3 size={18} color="#D97706" />
            </div>
            <div>
              <p className="rv-stat-value">{summary?.pending_count ?? 0}</p>
              <p className="rv-stat-title">Pending <span className="rv-stat-sub">awaiting confirmation</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#EDE9FE' }}>
              <ArrowUpRight size={18} color="#7C3AED" />
            </div>
            <div>
              <p className="rv-stat-value">{summary ? formatShortNairaFromKobo(summary.refunded_amount_kobo) : '—'}</p>
              <p className="rv-stat-title">Refunds issued <span className="rv-stat-sub">{summary?.refunded_count ?? 0} refunds</span></p>
            </div>
          </div>
        </div>

        <div className="rv-panel">
          <div className="rv-toolbar">
            <div className="rv-status-tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`rv-status-tab${statusFilter === tab.key ? ' active' : ''}`}
                  onClick={() => setStatusFilter(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rv-search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search learner, course or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rv-table-wrap">
            {loading && <div className="rv-loading">Loading transactions…</div>}
            {!loading && error && <div className="rv-error">{error}</div>}

            {!loading && !error && (
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Learner</th>
                    <th>Course</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => {
                    const meta = STATUS_META[txn.status] ?? { label: txn.status, badgeClass: 'pending' }
                    const method = methodDisplay(txn.payment_method)
                    return (
                      <tr key={txn.id} className="clickable" onClick={() => setSelectedPaymentId(txn.id)}>
                        <td style={{ fontFamily: 'monospace', color: '#6B7280' }}>{txn.reference}</td>
                        <td>
                          <div className="rv-learner-cell">
                            <div className="rv-avatar" style={{ background: avatarColor(txn.learner.id) }}>
                              {initials(txn.learner.full_name)}
                            </div>
                            <div>
                              <div className="rv-learner-name">{txn.learner.full_name}</div>
                              <div className="rv-learner-email">{txn.learner.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="rv-course-cell">{txn.course.title}</span></td>
                        <td style={{ fontWeight: 700 }}>{formatNairaFromKobo(txn.amount_kobo)}</td>
                        <td>
                          <span className="rv-method-cell">{method.icon} {method.label}</span>
                        </td>
                        <td>
                          <span className={`rv-status-badge ${meta.badgeClass}`}>
                            <span className="rv-status-dot" />
                            {meta.label}
                          </span>
                        </td>
                        <td>{formatDate(txn.paid_at ?? txn.created_at)}</td>
                        <td className="rv-chevron-cell">
                          <ChevronRight size={17} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="rv-empty">No transactions match your filters.</div>
            )}
          </div>

          <div className="rv-footer">
            <span className="rv-footer-text">Showing {transactions.length} transactions</span>
            <span className="rv-footer-total">Page total: {formatNairaFromKobo(filteredTotal)}</span>
          </div>
        </div>
      </div>

      {selectedPaymentId && (
        <TransactionDetailModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onChanged={handleTxnChanged}
        />
      )}
    </AdminShell>
  )
}