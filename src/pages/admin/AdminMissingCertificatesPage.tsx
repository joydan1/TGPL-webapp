import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Award, CheckCircle2, ChevronLeft, ChevronRight, Loader2, RotateCw } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import {
  adminOperationsAPI,
  type EligibilityChecklistItem,
  type MissingCertificateRow,
} from '../../services/adminOperationsApi'

const PAGE_SIZE = 20

const PAGE_CSS = `
  .mc-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }
  .mc-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
  .mc-title { margin:0; color:#111827; font-size:1.5rem; font-weight:800; }
  .mc-subtitle { margin:.3rem 0 0; color:#6B7280; font-size:.875rem; }
  .mc-refresh { display:inline-flex; align-items:center; gap:.45rem; border:1px solid #E5E7EB; border-radius:.65rem; background:#fff; color:#374151; padding:.6rem .85rem; font-weight:700; cursor:pointer; }
  .mc-refresh:disabled { opacity:.55; cursor:wait; }
  .mc-panel { overflow:hidden; background:#fff; border:1px solid #E5E7EB; border-radius:.85rem; }
  .mc-feedback { margin:1rem 1.1rem 0; padding:.75rem .9rem; border-radius:.6rem; font-size:.84rem; }
  .mc-feedback.success { color:#047857; background:#ECFDF5; border:1px solid #A7F3D0; }
  .mc-feedback.error { color:#B91C1C; background:#FEF2F2; border:1px solid #FECACA; }
  .mc-conflict { margin:.6rem 1.1rem 1rem; padding:.85rem; background:#FFFBEB; border:1px solid #FDE68A; border-radius:.6rem; color:#92400E; font-size:.82rem; }
  .mc-conflict ul { margin:.5rem 0 0 1.2rem; }
  .mc-table-wrap { overflow-x:auto; }
  .mc-table { width:100%; border-collapse:collapse; min-width:850px; }
  .mc-table th { padding:.75rem 1rem; text-align:left; color:#6B7280; background:#F9FAFB; border-bottom:1px solid #E5E7EB; font-size:.7rem; text-transform:uppercase; }
  .mc-table td { padding:.85rem 1rem; border-bottom:1px solid #F3F4F6; color:#374151; font-size:.82rem; vertical-align:middle; }
  .mc-table tr:last-child td { border-bottom:0; }
  .mc-learner { color:#111827; font-weight:700; }
  .mc-course { color:#111827; }
  .mc-state { display:inline-flex; padding:.25rem .55rem; border-radius:999px; background:#FEF3C7; color:#92400E; font-size:.72rem; font-weight:700; }
  .mc-issue { display:inline-flex; align-items:center; justify-content:center; gap:.35rem; border:0; border-radius:.55rem; padding:.5rem .7rem; background:#2492EB; color:#fff; font-size:.78rem; font-weight:700; cursor:pointer; white-space:nowrap; }
  .mc-issue:disabled { opacity:.55; cursor:wait; }
  .mc-state-screen { padding:3rem 1rem; text-align:center; color:#6B7280; }
  .mc-state-screen.error { color:#B91C1C; }
  .mc-footer { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:.9rem 1rem; background:#F9FAFB; border-top:1px solid #E5E7EB; }
  .mc-footer-text { color:#6B7280; font-size:.8rem; }
  .mc-pages { display:flex; align-items:center; gap:.5rem; }
  .mc-page-button { display:flex; align-items:center; justify-content:center; width:2rem; height:2rem; border:1px solid #E5E7EB; border-radius:.45rem; background:#fff; color:#374151; cursor:pointer; }
  .mc-page-button:disabled { opacity:.4; cursor:not-allowed; }
  @media(max-width:640px) { .mc-page { padding:1rem; } .mc-header { flex-direction:column; } .mc-refresh { width:100%; justify-content:center; } }
`

function dateLabel(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-GB', { dateStyle: 'medium' })
}

function readApiError(error: unknown) {
  const response = (error as { response?: { status?: number; data?: Record<string, unknown> } })?.response
  const body = response?.data ?? {}
  return {
    status: response?.status,
    code: typeof body.code === 'string' ? body.code : '',
    message: typeof body.detail === 'string' ? body.detail : typeof body.message === 'string' ? body.message : 'Request failed. Please retry.',
    checklist: Array.isArray(body.checklist) ? body.checklist as EligibilityChecklistItem[] : [],
    nextIncomplete: typeof body.next_incomplete === 'string' ? body.next_incomplete : null,
  }
}

export default function AdminMissingCertificatesPage() {
  const [rows, setRows] = useState<MissingCertificateRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [issuingKey, setIssuingKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [conflict, setConflict] = useState<{ checklist: EligibilityChecklistItem[]; nextIncomplete: string | null } | null>(null)

  const loadRows = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await adminOperationsAPI.listMissingCertificates(page, PAGE_SIZE)
      setRows(response.results)
      setCount(response.count)
    } catch (error) {
      setLoadError(readApiError(error).message)
    } finally {
      setLoading(false)
    }
  }, [page, reloadKey])

  useEffect(() => { void loadRows() }, [loadRows])

  async function issue(row: MissingCertificateRow) {
    const key = `${row.user_id}:${row.course_id}`
    setIssuingKey(key)
    setFeedback(null)
    setConflict(null)
    try {
      const result = await adminOperationsAPI.issueMissingCertificate(row.user_id, row.course_id)
      setFeedback({
        kind: 'success',
        text: result.status === 'already_issued'
          ? `${row.learner}'s certificate had already been issued. The list has been refreshed.`
          : `Certificate ${result.serial} issued for ${row.learner}.`,
      })
      setReloadKey((value) => value + 1)
    } catch (error) {
      const parsed = readApiError(error)
      if (parsed.status === 409 && parsed.code === 'not_eligible') {
        setConflict({ checklist: parsed.checklist, nextIncomplete: parsed.nextIncomplete })
        setFeedback({ kind: 'error', text: parsed.message || 'This learner is not eligible yet.' })
      } else {
        setFeedback({ kind: 'error', text: parsed.message })
      }
    } finally {
      setIssuingKey(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const firstRow = count ? (page - 1) * PAGE_SIZE + 1 : 0
  const lastRow = Math.min(page * PAGE_SIZE, count)

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <main className="mc-page">
        <header className="mc-header">
          <div>
            <h1 className="mc-title">Missing certificates</h1>
            <p className="mc-subtitle">Completed learners without an issued certificate. The daily issuer usually keeps this list empty.</p>
          </div>
          <button className="mc-refresh" type="button" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
            {loading ? <Loader2 size={15} className="ac-spin" /> : <RotateCw size={15} />} Refresh
          </button>
        </header>

        <section className="mc-panel" aria-label="Missing certificate records">
          {feedback && <div className={`mc-feedback ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</div>}
          {conflict && (
            <div className="mc-conflict">
              {conflict.nextIncomplete && <div>Next outstanding requirement: <strong>{conflict.nextIncomplete}</strong></div>}
              {conflict.checklist.length > 0 && (
                <ul>
                  {conflict.checklist.map((item, index) => (
                    <li key={`${item.requirement}-${index}`}>{item.satisfied ? '✓ Complete' : '✕ Outstanding'}: {item.requirement}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {loading ? (
            <div className="mc-state-screen"><Loader2 size={20} className="ac-spin" /> Loading missing certificates…</div>
          ) : loadError ? (
            <div className="mc-state-screen error"><AlertCircle size={18} /> {loadError}</div>
          ) : rows.length === 0 ? (
            <div className="mc-state-screen"><CheckCircle2 size={20} color="#059669" /> No missing certificates. The daily issuance job is up to date.</div>
          ) : (
            <div className="mc-table-wrap">
              <table className="mc-table">
                <thead><tr><th>Learner</th><th>Course</th><th>Eligibility</th><th>Completed</th><th>Missing since</th><th>Action</th></tr></thead>
                <tbody>
                  {rows.map((row) => {
                    const key = `${row.user_id}:${row.course_id}`
                    return (
                      <tr key={key}>
                        <td className="mc-learner">{row.learner}</td>
                        <td className="mc-course">{row.course}</td>
                        <td><span className="mc-state">{row.eligibility_status.replace(/_/g, ' ')}</span></td>
                        <td>{dateLabel(row.completed_at)}</td>
                        <td>{dateLabel(row.missing_since)}</td>
                        <td>
                          <button className="mc-issue" type="button" onClick={() => void issue(row)} disabled={issuingKey !== null}>
                            {issuingKey === key ? <Loader2 size={14} className="ac-spin" /> : <Award size={14} />}
                            {row.action === 're-issue' ? 'Re-issue certificate' : 'Issue certificate'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !loadError && count > 0 && (
            <footer className="mc-footer">
              <span className="mc-footer-text">Showing {firstRow}–{lastRow} of {count}</span>
              <div className="mc-pages">
                <button className="mc-page-button" aria-label="Previous page" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}><ChevronLeft size={16} /></button>
                <span className="mc-footer-text">{page} / {totalPages}</span>
                <button className="mc-page-button" aria-label="Next page" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}><ChevronRight size={16} /></button>
              </div>
            </footer>
          )}
        </section>
      </main>
    </AdminShell>
  )
}