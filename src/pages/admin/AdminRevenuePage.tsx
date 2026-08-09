import { useMemo, useState } from 'react'
import { Download, Search, TrendingUp, CheckCircle2, Clock3, ArrowUpRight, ChevronRight } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import {
  MOCK_REVENUE_SUMMARY, MOCK_TRANSACTIONS,
  type AdminTransactionRow, type TransactionStatus,
} from '../../types/adminTransaction'
import TransactionDetailModal, { TRANSACTION_MODAL_CSS } from '../../components/admin/TransactionDetailModal'

const PAGE_CSS = `
  .rv-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .rv-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .rv-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .rv-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .rv-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.65rem 1.1rem; font-size: 0.875rem; font-weight: 700; color: #374151; cursor: pointer; }

  .rv-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
  .rv-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); display: flex; align-items: flex-start; gap: 0.85rem; }
  .rv-stat-icon { width: 40px; height: 40px; border-radius: 0.7rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rv-stat-value { margin: 0; font-size: 1.4rem; font-weight: 800; color: #111827; }
  .rv-stat-title { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6B7280; }
  .rv-stat-sub { color: #9CA3AF; }

  .rv-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .rv-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .rv-status-tabs { display: flex; gap: 0.4rem; background: #F9FAFB; border-radius: 0.75rem; padding: 0.3rem; flex-wrap: wrap; }
  .rv-status-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; }
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
  .rv-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.78rem; flex-shrink: 0; }
  .rv-learner-name { font-weight: 600; color: #111827; white-space: nowrap; }
  .rv-learner-email { font-size: 0.76rem; color: #9CA3AF; }

  .rv-method-cell { display: flex; align-items: center; gap: 0.4rem; color: #374151; }

  .rv-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .rv-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
  .rv-status-badge.successful { background: #ECFDF5; color: #059669; }
  .rv-status-badge.pending { background: #FEF3C7; color: #D97706; }
  .rv-status-badge.failed { background: #FEF2F2; color: #DC2626; }
  .rv-status-badge.refunded { background: #F5F3FF; color: #7C3AED; }

  .rv-chevron-cell { text-align: right; color: #D1D5DB; }

  .rv-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; }
  .rv-footer-text { font-size: 0.82rem; color: #6B7280; }
  .rv-footer-total { font-size: 0.85rem; font-weight: 800; color: #111827; }

  .rv-empty { padding: 3rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }

  @media (max-width: 900px) {
    .rv-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .rv-page { padding: 1.25rem; }
    .rv-stats { grid-template-columns: 1fr; }
    .rv-toolbar { flex-direction: column; align-items: stretch; }
    .rv-status-tabs { overflow-x: auto; }
  }
`

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function formatShortNaira(amount: number) {
  if (amount >= 1000) return `₦${Math.round(amount / 1000)}K`
  return formatNaira(amount)
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

const STATUS_TABS: { key: 'all' | TransactionStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'successful', label: 'Successful' },
  { key: 'failed', label: 'Failed' },
  { key: 'pending', label: 'Pending' },
  { key: 'refunded', label: 'Refunded' },
]

export default function AdminRevenuePage() {
  const [transactions, setTransactions] = useState<AdminTransactionRow[]>(MOCK_TRANSACTIONS)
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTxn, setSelectedTxn] = useState<AdminTransactionRow | null>(null)

  const summary = MOCK_REVENUE_SUMMARY // TODO: swap for adminRevenueAPI.getSummary()

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return transactions.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesSearch =
        !q ||
        t.course_title.toLowerCase().includes(q) ||
        t.learner_name.toLowerCase().includes(q) ||
        t.learner_email.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [transactions, statusFilter, searchQuery])

  const filteredTotal = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.amount_naira, 0),
    [filteredTransactions],
  )

  function handleExportCsv() {
    // TODO: call adminRevenueAPI.exportCsv() or generate client-side from filteredTransactions
    console.log('Export CSV', filteredTransactions.length, 'rows')
  }

  function handleTxnStatusChange(ref: string, status: TransactionStatus) {
    setTransactions((prev) =>
      prev.map((t) => (t.ref === ref ? { ...t, status, detail: { ...t.detail, status } } : t)),
    )
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS + TRANSACTION_MODAL_CSS}</style>
      <div className="rv-page">

        <div className="rv-header">
          <div>
            <h1 className="rv-title">Revenue &amp; Payments</h1>
            <p className="rv-subtitle">{transactions.length} transactions · last 30 days</p>
          </div>
          <button className="rv-export-btn" type="button" onClick={handleExportCsv}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="rv-stats">
          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#D1FAE5' }}>
              <TrendingUp size={18} color="#059669" />
            </div>
            <div>
              <p className="rv-stat-value">{formatNaira(summary.total_revenue)}</p>
              <p className="rv-stat-title">Total revenue <span className="rv-stat-sub">{summary.total_revenue_txn_count} transactions</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#DBEAFE' }}>
              <CheckCircle2 size={18} color="#2563EB" />
            </div>
            <div>
              <p className="rv-stat-value">{summary.successful_count}</p>
              <p className="rv-stat-title">Successful <span className="rv-stat-sub">completed paym...</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#FEF3C7' }}>
              <Clock3 size={18} color="#D97706" />
            </div>
            <div>
              <p className="rv-stat-value">{summary.pending_count}</p>
              <p className="rv-stat-title">Pending <span className="rv-stat-sub">awaiting confirmation</span></p>
            </div>
          </div>

          <div className="rv-stat-card">
            <div className="rv-stat-icon" style={{ background: '#EDE9FE' }}>
              <ArrowUpRight size={18} color="#7C3AED" />
            </div>
            <div>
              <p className="rv-stat-value">{formatShortNaira(summary.refunds_naira)}</p>
              <p className="rv-stat-title">Refunds issued <span className="rv-stat-sub">{summary.refunds_count} refunds</span></p>
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
                placeholder="Search courses or trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rv-table-wrap">
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
                {filteredTransactions.map((txn) => (
                  <tr key={txn.ref} className="clickable" onClick={() => setSelectedTxn(txn)}>
                    <td style={{ fontFamily: 'monospace', color: '#6B7280' }}>{txn.ref}</td>
                    <td>
                      <div className="rv-learner-cell">
                        <div className="rv-avatar" style={{ background: txn.learner_avatar_color }}>
                          {initials(txn.learner_name)}
                        </div>
                        <div>
                          <div className="rv-learner-name">{txn.learner_name}</div>
                          <div className="rv-learner-email">{txn.learner_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{txn.course_title}</td>
                    <td style={{ fontWeight: 700 }}>{formatNaira(txn.amount_naira)}</td>
                    <td>
                      <span className="rv-method-cell">{METHOD_LABEL[txn.method]}</span>
                    </td>
                    <td>
                      <span className={`rv-status-badge ${txn.status}`}>
                        <span className="rv-status-dot" />
                        {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                      </span>
                    </td>
                    <td>{formatDate(txn.date)}</td>
                    <td className="rv-chevron-cell">
                      <ChevronRight size={17} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div className="rv-empty">No transactions match your filters.</div>
            )}
          </div>

          <div className="rv-footer">
            <span className="rv-footer-text">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </span>
            <span className="rv-footer-total">Filtered total: {formatNaira(filteredTotal)}</span>
          </div>
        </div>
      </div>

      {selectedTxn && (
        <TransactionDetailModal
          transaction={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onStatusChange={handleTxnStatusChange}
        />
      )}
    </AdminShell>
  )
}