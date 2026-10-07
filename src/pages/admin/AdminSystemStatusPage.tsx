import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, CheckCircle2, Clock3, Loader2, RotateCw, XCircle } from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminOperationsAPI, type SystemStatusComponent, type SystemStatusResponse } from '../../services/adminOperationsApi'
import { ROUTES } from '../../constants/routes'

const MIN_REFRESH_INTERVAL_SECONDS = 30

const PAGE_CSS = `
  .ss-page { padding:1.5rem 2rem 2rem; background:#F5F5F5; }
  .ss-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.25rem; }
  .ss-heading { display:flex; align-items:center; gap:.7rem; }
  .ss-title { margin:0; color:#111827; font-size:1.5rem; font-weight:800; }
  .ss-subtitle { margin:.3rem 0 0; color:#6B7280; font-size:.875rem; }
  .ss-refresh { display:inline-flex; align-items:center; gap:.45rem; border:1px solid #E5E7EB; border-radius:.6rem; background:#fff; color:#374151; padding:.6rem .85rem; font-weight:700; cursor:pointer; }
  .ss-refresh:disabled { opacity:.5; cursor:not-allowed; }
  .ss-overall { display:flex; align-items:flex-start; gap:1rem; margin-bottom:1.25rem; padding:1.1rem 1.25rem; border:1px solid; border-radius:.8rem; background:#fff; }
  .ss-overall.ok { border-color:#A7F3D0; background:#ECFDF5; color:#047857; }
  .ss-overall.degraded { border-color:#FDE68A; background:#FFFBEB; color:#92400E; }
  .ss-overall.down { border-color:#FECACA; background:#FEF2F2; color:#B91C1C; }
  .ss-overall.unknown { border-color:#E5E7EB; color:#4B5563; }
  .ss-overall-title { margin:0; font-size:1.05rem; font-weight:800; text-transform:capitalize; }
  .ss-overall-copy { margin:.2rem 0 0; font-size:.84rem; }
  .ss-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:.85rem; }
  .ss-component { padding:1rem; background:#fff; border:1px solid #E5E7EB; border-radius:.75rem; }
  .ss-component-head { display:flex; align-items:center; justify-content:space-between; gap:.75rem; margin-bottom:.55rem; }
  .ss-component-title { margin:0; color:#111827; font-size:.92rem; font-weight:800; }
  .ss-component-link { padding:0; border:0; background:none; color:#2492EB; font:inherit; font-weight:800; text-align:left; text-decoration:underline; cursor:pointer; }
  .ss-badge { display:inline-flex; align-items:center; gap:.3rem; padding:.25rem .5rem; border-radius:999px; font-size:.68rem; font-weight:800; text-transform:capitalize; }
  .ss-badge.ok { color:#047857; background:#ECFDF5; }
  .ss-badge.degraded { color:#92400E; background:#FEF3C7; }
  .ss-badge.down { color:#B91C1C; background:#FEF2F2; }
  .ss-badge.unknown { color:#4B5563; background:#F3F4F6; }
  .ss-message { margin:0; color:#4B5563; font-size:.82rem; line-height:1.5; overflow-wrap:anywhere; }
  .ss-metrics { display:flex; flex-wrap:wrap; gap:.4rem; margin-top:.75rem; }
  .ss-metric { padding:.3rem .5rem; border-radius:.4rem; background:#F3F4F6; color:#4B5563; font-size:.7rem; overflow-wrap:anywhere; }
  .ss-metric strong { color:#111827; margin-left:.2rem; }
  .ss-failures { flex:1 1 100%; padding:.65rem .75rem; border:1px solid #FDE68A; border-radius:.55rem; background:#FFFBEB; color:#78350F; font-size:.75rem; }
  .ss-failures-title { margin:0 0 .45rem; font-weight:800; }
  .ss-failure-list { display:grid; gap:.35rem; margin:0; padding:0; list-style:none; }
  .ss-failure-row { display:flex; justify-content:space-between; gap:.75rem; color:#4B5563; }
  .ss-failure-row strong { color:#111827; font-weight:700; }
  .ss-state { padding:3rem 1rem; text-align:center; color:#6B7280; }
  .ss-state.error { color:#B91C1C; }
  .ss-updated { margin-top:1rem; color:#9CA3AF; font-size:.75rem; text-align:right; }
  @media(max-width:640px) { .ss-page { padding:1rem; } .ss-header { flex-direction:column; } .ss-refresh { width:100%; justify-content:center; } }
`

function statusText(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : 'unknown'
}

function statusIcon(status: string) {
  if (status === 'ok') return CheckCircle2
  if (status === 'degraded') return AlertCircle
  if (status === 'down') return XCircle
  return Activity
}

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function readError(error: unknown) {
  const body = (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {}
  return typeof body.detail === 'string' ? body.detail : typeof body.message === 'string' ? body.message : 'Could not load system status.'
}

function overallStatus(data: SystemStatusResponse | null) {
  if (!data) return 'unknown'
  const overall = data.overall ?? data.overall_status ?? data.status
  return statusText(overall)
}

function metricValue(value: unknown): string {
  if (value == null) return '—'
  if (typeof value === 'object') return Array.isArray(value) ? `${value.length} item${value.length === 1 ? '' : 's'}` : 'Details available'
  return String(value)
}

const METRIC_LABELS: Record<string, string> = {
  dead_lettered_last_24h: 'Dead-lettered (24h)',
  dead_letter_unresolved: 'Unresolved dead letters',
  dead_letter_oldest_unresolved_at: 'Oldest unresolved',
  dead_letter_oldest_unresolved_age_seconds: 'Age of oldest unresolved',
  stale_pending_count: 'Stale pending payments',
  stale_after_minutes: 'Stale after',
  oldest_pending_at: 'Oldest pending',
  oldest_pending_age_seconds: 'Age of oldest pending',
  failures_last_24h: 'Failures (24h)',
  window_hours: 'Time window',
  registered_tasks: 'Registered tasks',
  minutely_task_last_run_at: 'Minutely task last run',
  last_heartbeat_at: 'Last worker heartbeat',
  last_sweep_at: 'Last certificate sweep',
  sweep_stale_after_hours: 'Sweep alert threshold',
  sweep_candidates_evaluated: 'Learners checked',
  sweep_candidates_total: 'Learners in rotation',
  sweep_rotation_nights: 'Rotation night',
  sweep_rotation_max_nights: 'Rotation length',
  still_owed: 'Learners still owed',
  issued_without_pdf: 'Issued without PDF',
  sweep_issued: 'Certificates issued',
}

function formatMetricValue(metric: string, value: unknown): string {
  if (value == null) return '—'
  if (metric === 'minutely_task') return 'Updates scheduled session statuses'
  if (metric.endsWith('_age_seconds') && typeof value === 'number') {
    const days = Math.floor(value / 86400)
    const hours = Math.floor((value % 86400) / 3600)
    const minutes = Math.floor((value % 3600) / 60)
    const seconds = Math.floor(value % 60)
    if (days) return `${days}d ${hours}h ago`
    if (hours) return `${hours}h ${minutes}m ago`
    if (minutes) return `${minutes}m ${seconds}s ago`
    return `${seconds}s ago`
  }
  if (metric.endsWith('_at') && typeof value === 'string') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    }
  }
  return metricValue(value)
}

function metricLabel(metric: string): string {
  if (metric === 'minutely_task') return 'Scheduled task'
  if (metric === 'recent_failures') return 'Recent failures'
  return METRIC_LABELS[metric] ?? formatLabel(metric)
}

function formatComponentMessage(name: string, message: string): string {
  if (name !== 'task_failures') return message
  return message.replace(/(\d+) task failure\(s\)/g, (_, count: string) =>
    `${count} task failure${count === '1' ? '' : 's'}`,
  )
}

function renderMetric(name: string, value: unknown) {
  if (name === 'queues' && value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).map(([queue, count]) => (
      <span className="ss-metric" key={`${name}-${queue}`}>
        {formatLabel(queue)} queue<strong>{metricValue(count)} pending</strong>
      </span>
    ))
  }

  if (name === 'recent_failures' && Array.isArray(value)) {
    return (
      <div className="ss-failures" key={name}>
        <p className="ss-failures-title">Recent failures</p>
        {value.length === 0 ? (
          <span>No recent task failures.</span>
        ) : (
          <ul className="ss-failure-list">
            {value.map((failure, index) => {
              const item = failure && typeof failure === 'object' ? failure as Record<string, unknown> : {}
              const task = item.task ?? item.task_name ?? item.name
              return (
                <li className="ss-failure-row" key={`${String(item.failed_at ?? 'failure')}-${index}`}>
                  <strong>{typeof task === 'string' && task.trim() ? formatLabel(task) : 'Task name unavailable'}</strong>
                  <span>{formatMetricValue('failed_at', item.failed_at)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <span className="ss-metric" key={name}>
      {metricLabel(name)}<strong>{formatMetricValue(name, value)}</strong>
    </span>
  )
}

export default function AdminSystemStatusPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<SystemStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const lastRequestAt = useRef(0)
  const refreshIntervalMs = Math.max(
    MIN_REFRESH_INTERVAL_SECONDS,
    status?.cache_ttl_seconds ?? MIN_REFRESH_INTERVAL_SECONDS,
  ) * 1000

  const refresh = useCallback(async (automatic = false) => {
    const currentTime = Date.now()
    if (lastRequestAt.current && currentTime - lastRequestAt.current < refreshIntervalMs) return
    lastRequestAt.current = currentTime
    setLoading(true)
    setError(null)
    try {
      setStatus(await adminOperationsAPI.getSystemStatus())
      setLastUpdated(Date.now())
    } catch (requestError) {
      setError(readError(requestError))
    } finally {
      setLoading(false)
    }
    return automatic
  }, [refreshIntervalMs])

  useEffect(() => { void refresh() }, [refresh])
  useEffect(() => {
    const poll = setInterval(() => { void refresh(true) }, refreshIntervalMs)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    return () => { clearInterval(poll); clearInterval(clock) }
  }, [refresh, refreshIntervalMs])

  const secondsUntilRefresh = lastRequestAt.current
    ? Math.max(0, Math.ceil((refreshIntervalMs - (now - lastRequestAt.current)) / 1000))
    : 0
  const overall = overallStatus(status)
  const OverallIcon = statusIcon(overall)
  const components = Object.entries(status?.components ?? {})

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <main className="ss-page">
        <header className="ss-header">
          <div>
            <div className="ss-heading"><Activity size={19} color="#2492EB" /><h1 className="ss-title">System status</h1></div>
                <p className="ss-subtitle">Service health and operational indicators. Times are shown in your local timezone.</p>
          </div>
          <button className="ss-refresh" type="button" disabled={loading || secondsUntilRefresh > 0} onClick={() => void refresh()}>
            {loading ? <Loader2 size={15} className="ac-spin" /> : <RotateCw size={15} />}
            {loading ? 'Refreshing…' : secondsUntilRefresh > 0 ? `Refresh in ${secondsUntilRefresh}s` : 'Refresh status'}
          </button>
        </header>

        {loading && !status ? (
          <div className="ss-state"><Loader2 size={20} className="ac-spin" /> Loading system status…</div>
        ) : error && !status ? (
          <div className="ss-state error"><AlertCircle size={18} /> {error}</div>
        ) : status ? (
          <>
            <section className={`ss-overall ${overall}`} aria-live="polite">
              <OverallIcon size={23} />
              <div>
                <h2 className="ss-overall-title">Overall status: {overall}</h2>
                  {typeof status.message === 'string' && <p className="ss-overall-copy">{status.message}</p>}
              </div>
            </section>
            {error && <div className="ss-state error" role="alert">Refresh failed: {error}. Showing the last successful status.</div>}
            <section className="ss-grid" aria-label="System components">
              {components.map(([name, component]: [string, SystemStatusComponent]) => {
                const componentStatus = statusText(component.status)
                const Icon = statusIcon(componentStatus)
                const metrics = Object.entries(component).filter(([key]) => key !== 'status' && key !== 'message')
                return (
                  <article className="ss-component" key={name}>
                    <div className="ss-component-head">
                      <h3 className="ss-component-title">
                        {name === 'payments_webhooks' ? (
                          <button className="ss-component-link" type="button" onClick={() => navigate(ROUTES.ADMIN_DEAD_LETTER)}>{formatLabel(name)}</button>
                        ) : name === 'certificates' ? (
                          <button className="ss-component-link" type="button" onClick={() => navigate(ROUTES.ADMIN_MISSING_CERTIFICATES)}>{formatLabel(name)}</button>
                        ) : formatLabel(name)}
                      </h3>
                      <span className={`ss-badge ${componentStatus}`}><Icon size={12} />{componentStatus}</span>
                    </div>
                    <p className="ss-message">{formatComponentMessage(name, component.message)}</p>
                    {metrics.length > 0 && (
                      <div className="ss-metrics">
                        {metrics.flatMap(([metric, value]) => renderMetric(metric, value))}
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
            <p className="ss-updated"><Clock3 size={12} style={{ verticalAlign:'-2px', marginRight:'.25rem' }} />
              {lastUpdated ? `Last updated ${new Date(lastUpdated).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}. Updates no more often than every 30 seconds.` : 'Status has not refreshed successfully yet.'}
            </p>
          </>
        ) : null}
      </main>
    </AdminShell>
  )
}