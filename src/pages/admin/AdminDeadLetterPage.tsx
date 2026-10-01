import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, ChevronLeft, ChevronRight, Eye, Loader2, RotateCw, Search, X } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminOperationsAPI, type DeadLetterActionResult, type DeadLetterRow, type DeadLetterSummary } from '../../services/adminOperationsApi'

const PAGE_SIZE = 20

const PAGE_CSS = `
  .dlq-page { padding:1.5rem 2rem 2rem; background:#F5F5F5; }
  .dlq-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
  .dlq-title { margin:0; color:#111827; font-size:1.5rem; font-weight:800; }
  .dlq-subtitle { margin:.3rem 0 0; color:#6B7280; font-size:.875rem; }
  .dlq-actions { display:flex; gap:.5rem; flex-wrap:wrap; }
  .dlq-btn { display:inline-flex; align-items:center; justify-content:center; gap:.4rem; border:1px solid #E5E7EB; border-radius:.6rem; background:#fff; color:#374151; padding:.55rem .75rem; font-size:.8rem; font-weight:700; cursor:pointer; }
  .dlq-btn.primary { background:#2492EB; border-color:#2492EB; color:#fff; }
  .dlq-btn.danger { color:#B91C1C; border-color:#FECACA; }
  .dlq-btn:disabled { opacity:.5; cursor:not-allowed; }
  .dlq-summary { display:flex; gap:.75rem; overflow-x:auto; margin-bottom:1rem; }
  .dlq-stat { min-width:130px; padding:.8rem .9rem; background:#fff; border:1px solid #E5E7EB; border-radius:.7rem; }
  .dlq-stat-label { display:block; color:#6B7280; font-size:.72rem; text-transform:capitalize; }
  .dlq-stat-value { display:block; margin-top:.2rem; color:#111827; font-size:1.2rem; font-weight:800; }
  .dlq-stat-age { min-width:190px; }
  .dlq-panel { overflow:hidden; background:#fff; border:1px solid #E5E7EB; border-radius:.85rem; }
  .dlq-toolbar { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; padding:.9rem 1rem; border-bottom:1px solid #E5E7EB; }
  .dlq-filter { min-width:170px; max-width:240px; border:1px solid #E5E7EB; border-radius:.55rem; padding:.55rem .7rem; color:#374151; background:#fff; font:inherit; font-size:.8rem; }
  .dlq-table-wrap { overflow-x:auto; }
  .dlq-table { width:100%; border-collapse:collapse; min-width:1180px; }
  .dlq-table th { text-align:left; padding:.7rem .85rem; color:#6B7280; background:#F9FAFB; border-bottom:1px solid #E5E7EB; font-size:.68rem; text-transform:uppercase; }
  .dlq-table td { padding:.75rem .85rem; color:#374151; border-bottom:1px solid #F3F4F6; font-size:.8rem; vertical-align:middle; }
  .dlq-table tr:last-child td { border-bottom:0; }
  .dlq-id { max-width:190px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#111827; font-family:monospace; }
  .dlq-badge { display:inline-flex; border-radius:999px; padding:.25rem .55rem; background:#FEF3C7; color:#92400E; font-size:.7rem; font-weight:700; text-transform:capitalize; }
  .dlq-row-actions { display:flex; gap:.35rem; }
  .dlq-icon-btn { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; border:1px solid #E5E7EB; border-radius:.45rem; background:#fff; color:#374151; cursor:pointer; }
  .dlq-icon-btn:disabled { opacity:.45; cursor:wait; }
  .dlq-inline { display:flex; gap:.5rem; align-items:flex-start; flex-wrap:wrap; padding:.7rem .85rem; background:#F9FAFB; border-bottom:1px solid #E5E7EB; }
  .dlq-inline textarea { flex:1; min-width:220px; min-height:62px; padding:.6rem; border:1px solid #D1D5DB; border-radius:.5rem; font:inherit; font-size:.8rem; resize:vertical; }
  .dlq-feedback { margin:.8rem 1rem; padding:.7rem .85rem; border-radius:.55rem; font-size:.82rem; }
  .dlq-feedback.success { color:#047857; background:#ECFDF5; border:1px solid #A7F3D0; }
  .dlq-feedback.error { color:#B91C1C; background:#FEF2F2; border:1px solid #FECACA; }
  .dlq-detail { margin:.85rem 1rem; padding:.9rem; border:1px solid #E5E7EB; border-radius:.65rem; background:#FAFAFA; }
  .dlq-detail-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.6rem; color:#111827; font-size:.85rem; font-weight:700; }
  .dlq-detail pre { max-height:360px; overflow:auto; margin:0; padding:.75rem; border-radius:.5rem; background:#111827; color:#E5E7EB; font-size:.72rem; white-space:pre-wrap; overflow-wrap:anywhere; }
  .dlq-detail-note { margin:0 0 .55rem; color:#6B7280; font-size:.78rem; }
  .dlq-detail summary { margin:.75rem 0 .45rem; color:#374151; font-size:.8rem; font-weight:700; cursor:pointer; }
  .dlq-state { padding:2.5rem 1rem; text-align:center; color:#6B7280; font-size:.85rem; }
  .dlq-state.error { color:#B91C1C; }
  .dlq-footer { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:.8rem 1rem; background:#F9FAFB; border-top:1px solid #E5E7EB; }
  .dlq-footer-text { color:#6B7280; font-size:.78rem; }
  .dlq-pagination { display:flex; align-items:center; gap:.45rem; }
  @media(max-width:640px) { .dlq-page { padding:1rem; } .dlq-header { flex-direction:column; } .dlq-actions,.dlq-actions .dlq-btn { width:100%; } .dlq-toolbar { align-items:stretch; } .dlq-filter { min-width:0; max-width:none; width:100%; } }
`

function errorMessage(error: unknown) {
  const body = (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {}
  return typeof body.detail === 'string' ? body.detail : typeof body.message === 'string' ? body.message : 'Request failed. Please retry.'
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

function dateLabel(value: unknown) {
  if (typeof value !== 'string') return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatAge(seconds: number | null) {
  if (seconds == null) return 'Clear'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days) return `${days}d ${hours}h`
  if (hours) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getSummaryCounts(summary: DeadLetterSummary | null): Record<string, number> {
  return summary?.counts_by_status ?? {}
}

export default function AdminDeadLetterPage() {
  const [rows, setRows] = useState<DeadLetterRow[]>([])
  const [summary, setSummary] = useState<DeadLetterSummary | null>(null)
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actingId, setActingId] = useState<string | null>(null)
  const [bulkActing, setBulkActing] = useState(false)
  const [dismissNote, setDismissNote] = useState('')
  const [dismissId, setDismissId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DeadLetterRow | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [list, summaryResponse] = await Promise.all([
        adminOperationsAPI.listDeadLetters({
          page,
          page_size: PAGE_SIZE,
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(eventTypeFilter.trim() ? { event_type: eventTypeFilter.trim() } : {}),
          ...(dateFrom ? { date_from: toIsoDateTime(dateFrom) } : {}),
          ...(dateTo ? { date_to: toIsoDateTime(dateTo) } : {}),
        }),
        adminOperationsAPI.getDeadLetterSummary(),
      ])
      setRows(list.results)
      setCount(list.count)
      setSummary(summaryResponse)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, eventTypeFilter, dateFrom, dateTo, reloadKey])

  useEffect(() => { void loadData() }, [loadData])
  useEffect(() => () => { if (refreshTimer.current) clearTimeout(refreshTimer.current) }, [])
  useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [statusFilter, eventTypeFilter, dateFrom, dateTo])

  function scheduleRefresh() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => setReloadKey((value) => value + 1), 2500)
  }

  function showActionResult(result: DeadLetterActionResult, label: string) {
    const reason = result.reason ? ` ${result.reason}` : ''
    const message = result.outcome === 'retried'
      ? 'Replay queued.'
      : result.outcome === 'dismissed'
        ? 'Event dismissed.'
        : result.outcome === 'already_resolved'
          ? 'This event was already resolved; the row has been refreshed.'
          : result.reason || statusLabel(result.outcome)
    setFeedback({
      kind: result.outcome === 'failed' || result.outcome === 'not_eligible' ? 'error' : 'success',
      text: `${label}: ${message}${result.outcome === 'failed' || result.outcome === 'not_eligible' ? '' : reason}`,
    })
    if (result.outcome === 'retried') scheduleRefresh()
    else setReloadKey((value) => value + 1)
  }

  async function handleRetry(id: string) {
    setActingId(id)
    setFeedback(null)
    try {
      showActionResult(await adminOperationsAPI.retryDeadLetter(id), `Webhook ${id}`)
    } catch (requestError) {
      setFeedback({ kind: 'error', text: errorMessage(requestError) })
    } finally {
      setActingId(null)
    }
  }

  async function handleBulkRetry() {
    if (selectedIds.size === 0 || selectedIds.size > 50) return
    const ids = Array.from(selectedIds)
    setBulkActing(true)
    setFeedback(null)
    try {
      const response = await adminOperationsAPI.retryDeadLetters(ids)
      const returnedIds = new Set(response.results.map((result) => result.id).filter((id): id is string => Boolean(id)))
      const summaries = response.results.map((result) => `${result.id ?? 'Webhook'}: ${statusLabel(result.outcome)}${result.reason ? ` (${result.reason})` : ''}`)
      const missingCount = ids.filter((id) => !returnedIds.has(id)).length
      if (missingCount > 0) summaries.push(`${missingCount} requested id(s) are no longer in the queue`)
      const hasFailure = response.results.some((result) => result.outcome === 'failed' || result.outcome === 'not_eligible')
      setFeedback({ kind: hasFailure ? 'error' : 'success', text: `${response.requested} requested. ${summaries.join(' · ') || 'No results returned.'}` })
      setSelectedIds(new Set())
      if (response.results.some((result) => result.outcome === 'retried')) scheduleRefresh()
      else setReloadKey((value) => value + 1)
    } catch (requestError) {
      setFeedback({ kind: 'error', text: errorMessage(requestError) })
    } finally {
      setBulkActing(false)
    }
  }

  async function handleDismiss() {
    if (!dismissId || !dismissNote.trim()) return
    setActingId(dismissId)
    setFeedback(null)
    try {
      const result = await adminOperationsAPI.dismissDeadLetter(dismissId, dismissNote.trim())
      showActionResult(result, `Webhook ${dismissId}`)
      setDismissId(null)
      setDismissNote('')
    } catch (requestError) {
      setFeedback({ kind: 'error', text: errorMessage(requestError) })
    } finally {
      setActingId(null)
    }
  }

  async function showDetail(row: DeadLetterRow) {
    setDetailLoading(true)
    setDetail(null)
    try {
      setDetail(await adminOperationsAPI.getDeadLetter(row.id))
    } catch (requestError) {
      setFeedback({ kind: 'error', text: errorMessage(requestError) })
    } finally {
      setDetailLoading(false)
    }
  }

  const counts = getSummaryCounts(summary)
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const firstRow = count ? (page - 1) * PAGE_SIZE + 1 : 0
  const lastRow = Math.min(page * PAGE_SIZE, count)

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <main className="dlq-page">
        <header className="dlq-header">
          <div>
            <h1 className="dlq-title">Failed payment webhooks</h1>
            <p className="dlq-subtitle">Inspect and retry webhook events that failed processing.</p>
          </div>
          <div className="dlq-actions">
            <button type="button" className="dlq-btn" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}><RotateCw size={15} /> Refresh</button>
            <button type="button" className="dlq-btn primary" onClick={() => void handleBulkRetry()} disabled={bulkActing || selectedIds.size === 0 || selectedIds.size > 50}>
              {bulkActing ? <Loader2 size={15} className="ac-spin" /> : <RotateCw size={15} />} Retry selected ({selectedIds.size}/50)
            </button>
          </div>
        </header>

        <section className="dlq-summary" aria-label="Dead-letter status summary">
          {Object.entries(counts).map(([status, value]) => (
            <div className="dlq-stat" key={status}><span className="dlq-stat-label">{statusLabel(status)}</span><strong className="dlq-stat-value">{value}</strong></div>
          ))}
          <div className="dlq-stat"><span className="dlq-stat-label">Unresolved</span><strong className="dlq-stat-value">{summary?.unresolved ?? 0}</strong></div>
          <div className="dlq-stat dlq-stat-age"><span className="dlq-stat-label">Oldest unresolved</span><strong className="dlq-stat-value">{formatAge(summary?.oldest_unresolved_age_seconds ?? null)}</strong></div>
        </section>

        <section className="dlq-panel" aria-label="Dead-letter webhooks">
          <div className="dlq-toolbar">
            <select className="dlq-filter" aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="retrying">Retrying</option>
              <option value="resolved">Resolved</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <div style={{ display:'flex', alignItems:'center', gap:'.4rem', flex:'1 1 220px', minWidth:0, border:'1px solid #E5E7EB', borderRadius:'.55rem', padding:'.1rem .6rem' }}>
              <Search size={15} color="#9CA3AF" />
              <input className="dlq-filter" style={{ border:0, flex:1, minWidth:0 }} aria-label="Filter by event type" placeholder="Event type (any)" value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value)} />
            </div>
            <input className="dlq-filter" aria-label="Filter from date" type="datetime-local" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <input className="dlq-filter" aria-label="Filter to date" type="datetime-local" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>

          {feedback && <div className={`dlq-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}
          {detailLoading && <div className="dlq-state"><Loader2 size={18} className="ac-spin" /> Loading webhook detail…</div>}
          {detail && (
            <div className="dlq-detail">
              <div className="dlq-detail-head"><span>Webhook detail · {detail.id}</span><button className="dlq-icon-btn" type="button" aria-label="Close webhook detail" onClick={() => setDetail(null)}><X size={15} /></button></div>
              {Array.isArray(detail.payload?.redacted_keys) && detail.payload.redacted_keys.length > 0 && (
                <p className="dlq-detail-note">{detail.payload.redacted_keys.length} sensitive field(s) hidden by the backend.</p>
              )}
              <pre>{JSON.stringify({ ...detail, error_traceback: undefined }, null, 2)}</pre>
              {detail.error_traceback && <details><summary>Technical details</summary><pre>{detail.error_traceback}</pre></details>}
            </div>
          )}
          {dismissId && (
            <div className="dlq-inline">
              <textarea aria-label="Required dismissal note" placeholder="Required note explaining why this event is being dismissed" value={dismissNote} onChange={(event) => setDismissNote(event.target.value)} />
              <button type="button" className="dlq-btn danger" onClick={() => void handleDismiss()} disabled={!dismissNote.trim() || actingId !== null}>{actingId === dismissId ? <Loader2 size={14} className="ac-spin" /> : null} Confirm dismiss</button>
              <button type="button" className="dlq-btn" onClick={() => { setDismissId(null); setDismissNote('') }}>Cancel</button>
            </div>
          )}
          {loading ? (
            <div className="dlq-state"><Loader2 size={18} className="ac-spin" /> Loading webhook failures…</div>
          ) : error ? (
            <div className="dlq-state error"><AlertCircle size={18} /> {error}</div>
          ) : rows.length === 0 ? (
            <div className="dlq-state"><Check size={18} color="#059669" /> No webhooks match these filters.</div>
          ) : (
            <div className="dlq-table-wrap">
              <table className="dlq-table">
                <thead><tr><th><input type="checkbox" aria-label="Select retryable rows on page" checked={rows.filter((row) => isRetryable(row.status)).length > 0 && rows.filter((row) => isRetryable(row.status)).every((row) => selectedIds.has(row.id))} onChange={(event) => setSelectedIds((previous) => {
                  const next = new Set(previous)
                  rows.filter((row) => isRetryable(row.status)).forEach((row) => {
                    if (!event.target.checked) next.delete(row.id)
                    else if (next.size < 50) next.add(row.id)
                  })
                  return next
                })} /></th><th>Event type</th><th>Reference</th><th>Learner</th><th>Course</th><th>Failure reason</th><th>Attempts</th><th>Status</th><th>First failed</th><th>Actions</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td><input type="checkbox" aria-label={`Select webhook ${row.id}`} checked={selectedIds.has(row.id)} onChange={(event) => setSelectedIds((previous) => {
                        const next = new Set(previous)
                        if (event.target.checked && isRetryable(row.status) && next.size < 50) next.add(row.id)
                        else next.delete(row.id)
                        return next
                      })} disabled={!isRetryable(row.status) || (!selectedIds.has(row.id) && selectedIds.size >= 50)} /></td>
                      <td>{row.event_type}</td>
                      <td>{row.reference || '—'}</td>
                      <td>{row.learner_email || '—'}</td>
                      <td>{row.course || '—'}</td>
                      <td>{row.failure_reason || '—'}</td>
                      <td>{row.attempts ?? '—'}</td>
                      <td><span className="dlq-badge">{statusLabel(row.status)}</span></td>
                      <td>{dateLabel(row.first_failed_at ?? row.created_at)}</td>
                      <td><div className="dlq-row-actions">
                        <button className="dlq-icon-btn" type="button" title="View detail" aria-label={`View details for ${row.id}`} onClick={() => void showDetail(row)}><Eye size={15} /></button>
                        <button className="dlq-icon-btn" type="button" title="Retry webhook" aria-label={`Retry ${row.id}`} disabled={actingId !== null || !isRetryable(row.status)} onClick={() => void handleRetry(row.id)}>{actingId === row.id ? <Loader2 size={15} className="ac-spin" /> : <RotateCw size={15} />}</button>
                        <button className="dlq-icon-btn" type="button" title="Dismiss webhook" aria-label={`Dismiss ${row.id}`} disabled={actingId !== null || !isDismissible(row.status)} onClick={() => { setDismissId(row.id); setDismissNote('') }}><X size={15} /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && count > 0 && (
            <footer className="dlq-footer">
              <span className="dlq-footer-text">Showing {firstRow}–{lastRow} of {count}</span>
              <div className="dlq-pagination">
                <button className="dlq-icon-btn" aria-label="Previous page" type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button>
                <span className="dlq-footer-text">{page} / {totalPages}</span>
                <button className="dlq-icon-btn" aria-label="Next page" type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={16} /></button>
              </div>
            </footer>
          )}
        </section>
      </main>
    </AdminShell>
  )
}

function isRetryable(status: string) {
  return status === 'pending' || status === 'abandoned'
}

function isDismissible(status: string) {
  return status === 'pending' || status === 'retrying' || status === 'abandoned'
}

function toIsoDateTime(value: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}