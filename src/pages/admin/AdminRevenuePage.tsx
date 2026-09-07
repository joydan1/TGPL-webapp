import { useEffect, useMemo, useState, useCallback } from 'react'
import { Download, Search, TrendingUp, CheckCircle2, Clock3, ArrowUpRight, ChevronRight, Plus, Tag } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminRevenueAPI } from '../../services/adminRevenueApi'
import { adminPromoCodesAPI } from '../../services/adminPromoCodesApi'
import type { AdminPaymentRow, PaymentStatus, RevenueSummaryData } from '../../types/adminPayment'
import type { AdminPromoCode } from '../../services/adminPromoCodesApi'
import TransactionDetailModal, { TRANSACTION_MODAL_CSS } from '../../components/admin/TransactionDetailModal'
import CreatePromoCodeModal, { PROMO_MODAL_CSS } from '../../components/admin/CreatePromoCodeModal'

const PAGE_CSS = `
  .rv-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .rv-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .rv-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .rv-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .rv-export-btn { display: flex; align-items: center; gap: 0.5rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.65rem 1.1rem; font-size: 0.875rem; font-weight: 700; color: #374151; cursor: pointer; }
  .rv-export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .rv-page-tabs { display: flex; gap: 0.4rem; background: #EEF0F2; border-radius: 0.8rem; padding: 0.3rem; width: fit-content; margin-bottom: 1.25rem; }
  .rv-page-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1.1rem; border-radius: 0.6rem; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
  .rv-page-tab.active { background: #fff; color: #111827; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08); }

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
  .rv-status-tab.active { background: #2492EB; color: #fff; }
  .rv-search-wrap { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; }
  .rv-search-wrap input { flex: 1; background: none; border: none; outline: none; font-size: 0.875rem; color: #111; }
  .rv-search-wrap input::placeholder { color: #9CA3AF; }

  .rv-add-code-btn { display: flex; align-items: center; gap: 0.4rem; background: #2492EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.65rem 1.1rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; margin-left: auto; }

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
  .rv-learner-name.unknown { color: #9CA3AF; font-style: italic; font-weight: 500; }
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
  .rv-status-badge.active { background: #BBF7D0; color: #10B981; }
  .rv-status-badge.inactive { background: #F3F4F6; color: #6B7280; }

  .rv-code-pill { font-family: monospace; font-weight: 700; background: #EFF6FF; color: #2492EB; padding: 0.25rem 0.6rem; border-radius: 0.5rem; letter-spacing: 0.02em; }
  .rv-deactivate-btn { border: 1px solid #FEE2E2; background: #fff; color: #EF4444; border-radius: 0.5rem; padding: 0.4rem 0.75rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
  .rv-deactivate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
     .rv-add-code-btn { margin-left: 0; width: 100%; justify-content: center; }
  }
`

const AVATAR_COLORS = ['#2492EB', '#8B5CF6', '#10B981', '#FE9A00', '#EF4444']
const UNKNOWN_AVATAR_COLOR = '#9CA3AF'

// `seed` is `learner.id`, which the API sends as `null` for anonymous/guest
// checkouts or learners whose account no longer exists — the payment record
// survives even when the account it points to doesn't. Guard against
// null/empty rather than assuming every transaction has a live learner.
function avatarColor(seed: string | null | undefined) {
  if (!seed) return UNKNOWN_AVATAR_COLOR
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
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

function formatDiscount(code: AdminPromoCode) {
  if (code.discount_type === 'percentage') return `${code.discount_value}% off`
  return `₦${Number(code.discount_value).toLocaleString('en-NG')} off`
}


function formatRedemptions(code: AdminPromoCode) {
  const max = code.max_redemptions
  return max ? `${code.redemptions_used} / ${max}` : `${code.redemptions_used} / \u221e`
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

type PageTab = 'transactions' | 'promo_codes'

export default function AdminRevenuePage() {
  const [pageTab, setPageTab] = useState<PageTab>('transactions')

  // ─── Transactions tab state ───
  const [transactions, setTransactions] = useState<AdminPaymentRow[]>([])
  const [summary, setSummary] = useState<RevenueSummaryData | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // ─── Promo codes tab state ───
  const [promoCodes, setPromoCodes] = useState<AdminPromoCode[]>([])
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoLoaded, setPromoLoaded] = useState(false)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

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

    const loadPromoCodes = useCallback(async () => {
    setPromoLoading(true)
    setPromoError(null)
    const res = await adminPromoCodesAPI.listCodes()
    if (res.success) {
      setPromoCodes(res.data)
    } else {
      setPromoError(res.error)
    }
    setPromoLoading(false)
    setPromoLoaded(true)
  }, [])

  useEffect(() => {
    if (pageTab !== 'transactions') return
    const t = setTimeout(loadData, searchQuery ? 350 : 0) // debounce search only
    return () => clearTimeout(t)
  }, [loadData, searchQuery, pageTab])

  useEffect(() => {
    if (pageTab === 'promo_codes' && !promoLoaded && !promoLoading) {
      loadPromoCodes()
    }
  }, [pageTab, promoLoaded, promoLoading, loadPromoCodes])

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

  async function handleDeactivate(id: string) {
    setDeactivatingId(id)
    const res = await adminPromoCodesAPI.deactivateCode(id)
    setDeactivatingId(null)
    if (res.success) {
      setPromoCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: false } : c)))
    } else {
      setPromoError(res.error)
    }
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS + TRANSACTION_MODAL_CSS + PROMO_MODAL_CSS}</style>
      <div className="rv-page">

        <div className="rv-header">
          <div>
            <h1 className="rv-title">Revenue &amp; Payments</h1>
            <p className="rv-subtitle">
              {pageTab === 'transactions' ? `${transactions.length} transactions` : `${promoCodes.length} promo codes`}
            </p>
          </div>
          {pageTab === 'transactions' && (
            <button className="rv-export-btn" type="button" onClick={handleExportCsv} disabled={exporting}>
              <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          )}
        </div>

        <div className="rv-page-tabs">
          <button
            type="button"
            className={`rv-page-tab${pageTab === 'transactions' ? ' active' : ''}`}
            onClick={() => setPageTab('transactions')}
          >
            <TrendingUp size={15} /> Transactions
          </button>
          <button
            type="button"
            className={`rv-page-tab${pageTab === 'promo_codes' ? ' active' : ''}`}
            onClick={() => setPageTab('promo_codes')}
          >
            <Tag size={15} /> Promo Codes
          </button>
        </div>

        {pageTab === 'transactions' ? (
          <>
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
                        const learnerId = txn.learner?.id ?? null
                        const learnerName = txn.learner?.full_name?.trim() || null
                        const learnerEmail = txn.learner?.email ?? null
                        const displayName = learnerName ?? 'Unknown learner'
                        return (
                          <tr key={txn.id} className="clickable" onClick={() => setSelectedPaymentId(txn.id)}>
                            <td style={{ fontFamily: 'monospace', color: '#6B7280' }}>{txn.reference}</td>
                            <td>
                              <div className="rv-learner-cell">
                                <div className="rv-avatar" style={{ background: avatarColor(learnerId) }}>
                                  {initials(learnerName)}
                                </div>
                                <div>
                                  <div className={`rv-learner-name${learnerName ? '' : ' unknown'}`}>{displayName}</div>
                                  <div className="rv-learner-email">{learnerEmail ?? '—'}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className="rv-course-cell">{txn.course?.title ?? '—'}</span></td>
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
          </>
        ) : (
          <div className="rv-panel">
            <div className="rv-toolbar">
              <button
                type="button"
                className="rv-add-code-btn"
                onClick={() => setShowCreatePromoModal(true)}
              >
                <Plus size={16} /> Create code
              </button>
            </div>

            <div className="rv-table-wrap">
              {promoLoading && <div className="rv-loading">Loading promo codes…</div>}
              {!promoLoading && promoError && <div className="rv-error">{promoError}</div>}

              {!promoLoading && !promoError && (
                <table className="rv-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Discount</th>
                      <th>Redemptions</th>
                      <th>Per learner</th>
                      <th>Scope</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((code) => (
                      <tr key={code.id}>
                        <td><span className="rv-code-pill">{code.code}</span></td>
                        <td style={{ fontWeight: 700 }}>{formatDiscount(code)}</td>
                        <td>{formatRedemptions(code)}</td>
                        <td>{code.max_redemptions_per_user ?? '\u2014'}</td>
                        
<td>{(code.applicable_course_ids ?? []).length === 0 ? 'Platform-wide' : `${(code.applicable_course_ids ?? []).length} course(s)`}</td>
<td>
                       
<span className={`rv-status-badge ${code.is_active ? 'active' : 'inactive'}`}>
  <span className="rv-status-dot" />
  {code.is_active ? 'Active' : 'Inactive'}
</span>
                        </td>
                        <td>{formatDate(code.created_at)}</td>
                        <td>
                          {code.is_active !== false && (
                            <button
                              type="button"
                              className="rv-deactivate-btn"
                              disabled={deactivatingId === code.id}
                              onClick={() => handleDeactivate(code.id)}
                            >
                              {deactivatingId === code.id ? 'Deactivating\u2026' : 'Deactivate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!promoLoading && !promoError && promoCodes.length === 0 && (
                <div className="rv-empty">No promo codes yet. Create one to get started.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedPaymentId && (
        <TransactionDetailModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
          onChanged={handleTxnChanged}
        />
      )}

      {showCreatePromoModal && (
        <CreatePromoCodeModal
          onClose={() => setShowCreatePromoModal(false)}
          onCreated={loadPromoCodes}
        />
      )}
    </AdminShell>
  )
}