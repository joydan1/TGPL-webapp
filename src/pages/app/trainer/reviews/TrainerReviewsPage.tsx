// pages/trainer/reviews/TrainerReviewsPage.tsx
import { useEffect, useState } from 'react'
import { Users, ClipboardList, Star, Award, X, Download, FileText, CheckCircle2, RotateCcw } from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import {
  trainerReviewsAPI,
  type TrainerPendingReview,
  type TrainerCompletedReview,
  type TrainerReviewSummary,
} from '../../../../services/api'

const PAGE_CSS = `
  .rv-page { padding: 1rem; background: #F5F5F5; }

  .rv-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .rv-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .rv-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .rv-stat-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .rv-stat-title { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .rv-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .rv-section-title { margin: 1.5rem 0 0.85rem; font-size: 1.1rem; font-weight: 700; color: #111827; }
  .rv-section-header { display: flex; align-items: center; justify-content: space-between; margin: 1.5rem 0 0.85rem; }
  .rv-view-all { border: none; background: none; color: #2563EB; font-weight: 700; cursor: pointer; font-size: 0.85rem; }

  .rv-empty-state { background: #fff; border-radius: 1rem; padding: 2rem 1rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; border: 1px solid rgba(148, 163, 184, 0.12); }
  .rv-error-state { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 1rem; padding: 1rem; font-size: 0.875rem; }

  .rv-pending-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .rv-pending-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; cursor: pointer; }
  .rv-pending-body { display: flex; align-items: flex-start; gap: 0.85rem; padding: 1.1rem; }
  .rv-pending-avatar { width: 42px; height: 42px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 700; }
  .rv-pending-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .rv-pending-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .rv-overdue-badge { background: #FEF3C7; color: #D97706; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; }
  .rv-pending-assignment { margin: 0.35rem 0 0; color: #2563EB; font-weight: 600; font-size: 0.875rem; }
  .rv-pending-meta { margin: 0.35rem 0 0; color: #9CA3AF; font-size: 0.8rem; }
  .rv-grade-btn { width: 100%; border: none; border-top: 1px solid #F3F4F6; background: none; color: #2563EB; font-weight: 700; cursor: pointer; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.875rem; }

  .rv-past-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; margin-top: 0.85rem; }
  .rv-past-row { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.1rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .rv-past-row:first-child { border-top: none; }
  .rv-past-avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 700; font-size: 0.8rem; }
  .rv-past-info { flex: 1; min-width: 140px; }
  .rv-past-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .rv-past-assignment { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .rv-past-score-wrap { display: flex; align-items: center; gap: 0.5rem; }
  .rv-past-score { font-weight: 800; font-size: 0.95rem; }
  .rv-past-score.pass { color: #16A34A; }
  .rv-past-score.fail { color: #D97706; }
  .rv-past-status { font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; text-transform: capitalize; }
  .rv-past-status.pass { background: #DCFCE7; color: #16A34A; }
  .rv-past-status.fail { background: #FEF3C7; color: #D97706; }
  .rv-past-date { color: #9CA3AF; font-size: 0.78rem; margin-left: auto; }

  .rv-past-table-head { display: none; }

  @media (min-width: 640px) {
    .rv-page { padding: 1.5rem; }
    .rv-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .rv-pending-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .rv-past-table-head { display: flex; padding: 0.85rem 1.1rem; color: #9CA3AF; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .rv-past-table-head span:nth-child(1) { flex: 1; min-width: 140px; }
    .rv-past-table-head span:nth-child(2) { width: 160px; }
    .rv-past-table-head span:nth-child(3) { width: 90px; }
    .rv-past-row { flex-wrap: nowrap; }
    .rv-past-assignment-col { width: 160px; color: #374151; font-size: 0.875rem; }
  }

  @media (min-width: 1024px) {
    .rv-page { padding: 1.5rem 2rem 2rem; }
  }

  /* ── Grade modal ── */
  .rv-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 500; }
  .rv-grade-modal { background: #fff; border-radius: 1.25rem; width: 100%; max-width: 920px; max-height: 92vh; overflow-y: auto; position: relative; display: grid; grid-template-columns: 1fr; }
  .rv-grade-close { position: absolute; top: 1rem; right: 1rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; z-index: 2; }

  .rv-grade-left { padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
  .rv-grade-header { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
  .rv-grade-avatar { width: 48px; height: 48px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 700; }
  .rv-grade-name { margin: 0; font-weight: 800; font-size: 1.1rem; color: #111827; }
  .rv-grade-assignment-title { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .rv-grade-meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.85rem; flex-wrap: wrap; font-size: 0.85rem; color: #6B7280; }
  .rv-grade-tag { background: #DBEAFE; color: #2563EB; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.7rem; border-radius: 999px; }

  .rv-file-list { margin-top: 1.25rem; display: grid; gap: 0.75rem; }
  .rv-file-row { display: flex; align-items: center; gap: 0.85rem; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.85rem; }
  .rv-file-icon { width: 38px; height: 38px; border-radius: 0.6rem; background: #FEF2F2; color: #DC2626; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rv-file-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.875rem; }
  .rv-file-size { margin: 0.15rem 0 0; color: #9CA3AF; font-size: 0.78rem; }
  .rv-file-download { margin-left: auto; background: none; border: none; color: #374151; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }

  .rv-note-box { margin-top: 1.25rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 0.85rem; padding: 1rem 1.1rem; }
  .rv-note-title { margin: 0 0 0.35rem; color: #2563EB; font-weight: 800; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .rv-note-body { margin: 0; color: #1E3A8A; font-size: 0.85rem; line-height: 1.5; }

  .rv-grade-right { padding: 1.5rem; }
  .rv-grade-form-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .rv-grade-form-sub { margin: 0.4rem 0 1.25rem; color: #6B7280; font-size: 0.85rem; }
  .rv-score-label { font-weight: 700; color: #111827; font-size: 0.9rem; }
  .rv-score-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.6rem; margin-bottom: 0.5rem; }
  .rv-score-input { flex: 1; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.85rem 1rem; font-size: 1rem; }
  .rv-score-of { color: #9CA3AF; font-weight: 600; }

  .rv-status-label { font-weight: 700; color: #111827; font-size: 0.9rem; display: block; margin: 1.25rem 0 0.6rem; }
  .rv-status-toggle { display: flex; gap: 0.6rem; }
  .rv-status-btn { flex: 1; border: 1px solid #E5E7EB; background: #fff; border-radius: 0.85rem; padding: 0.75rem; font-weight: 700; font-size: 0.9rem; cursor: pointer; color: #6B7280; }
  .rv-status-btn.active-pass { border-color: #16A34A; background: #DCFCE7; color: #16A34A; }
  .rv-status-btn.active-fail { border-color: #D97706; background: #FEF3C7; color: #D97706; }

  .rv-feedback-label { font-weight: 700; color: #111827; font-size: 0.9rem; display: block; margin: 1.5rem 0 0.6rem; }
  .rv-feedback-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.9rem 1rem; min-height: 140px; font-family: inherit; font-size: 0.9rem; resize: vertical; }

  .rv-form-error { margin-top: 1rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; }

  .rv-grade-actions { display: flex; flex-direction: column-reverse; gap: 0.75rem; margin-top: 1.5rem; }
  .rv-cancel-btn { border: none; background: none; color: #6B7280; font-weight: 700; cursor: pointer; padding: 0.9rem; }
  .rv-submit-btn { border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.9rem 1.4rem; cursor: pointer; }
  .rv-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (min-width: 768px) {
    .rv-grade-modal { grid-template-columns: 1fr 1fr; }
    .rv-grade-left { border-bottom: none; border-right: 1px solid #F3F4F6; }
    .rv-grade-actions { flex-direction: row; justify-content: flex-end; align-items: center; }
  }

  /* ── Success modal ── */
  .rv-past-score.revision { color: #2563EB; }
.rv-past-status.revision { background: #DBEAFE; color: #2563EB; }
  .rv-status-btn.active-revision { border-color: #2563EB; background: #DBEAFE; color: #2563EB; }
  .rv-success-modal { background: #fff; border-radius: 1.25rem; padding: 2rem 1.5rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
  .rv-success-icon { width: 72px; height: 72px; border-radius: 999px; background: #D1FAE5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
  .rv-success-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .rv-success-sub { margin: 0.6rem 0 1.5rem; color: #6B7280; font-size: 0.9rem; }
  .rv-success-btn { width: 100%; border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.9rem; cursor: pointer; }
`

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHrs < 1) return 'Just now'
  if (diffHrs < 24) return `Submitted ${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  return `Submitted ${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function TrainerReviewsPage() {
  const [summary, setSummary] = useState<TrainerReviewSummary | null>(null)
  const [pendingReviews, setPendingReviews] = useState<TrainerPendingReview[]>([])
  const [pastReviews, setPastReviews] = useState<TrainerCompletedReview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [successType, setSuccessType] = useState<'graded' | 'revision' | null>(null)
  const [activeReview, setActiveReview] = useState<TrainerPendingReview | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [score, setScore] = useState('')
  const [status, setStatus] = useState<'pass' | 'fail' | 'revision' | null>(null)
  const [revisionReason, setRevisionReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    setLoadError(null)

    const [summaryRes, pendingRes, completedRes] = await Promise.all([
      trainerReviewsAPI.getSummary(),
      trainerReviewsAPI.getPendingReviews(),
      trainerReviewsAPI.getCompletedReviews(),
    ])

    if (summaryRes.success) setSummary(summaryRes.data)
    if (pendingRes.success) setPendingReviews(pendingRes.data)
    if (completedRes.success) setPastReviews(completedRes.data)

    if (!summaryRes.success && !pendingRes.success && !completedRes.success) {
      setLoadError(pendingRes.error || completedRes.error || summaryRes.error || 'Failed to load reviews')
    }

    setLoading(false)
  }

  function openGradeModal(review: TrainerPendingReview) {
    setActiveReview(review)
    setScore('')
    setStatus(null)
    setFeedback('')
    setRevisionReason('')
    setSubmitError(null)
  }

  function closeGradeModal() {
    if (submitting) return
    setActiveReview(null)
  }

  async function handleSubmitGrade() {
    if (!activeReview) return

    if (!status) {
      setSubmitError('Select Pass, Fail, or Request Revision before submitting.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    const result = status === 'revision'
      ? await trainerReviewsAPI.requestRevision(activeReview.id, { reason: revisionReason })
      : await trainerReviewsAPI.gradeSubmission(activeReview.id, {
          score: score.trim() === '' ? null : Number(score),
          feedback,
          status,
        })

    setSubmitting(false)

    if (!result.success) {
      setSubmitError(result.error)
      return
    }

    setPendingReviews((prev) => prev.filter((r) => r.id !== activeReview.id))
    setActiveReview(null)
    setSuccessType(status === 'revision' ? 'revision' : 'graded')
    setShowSuccess(true)

    const [summaryRes, completedRes] = await Promise.all([
      trainerReviewsAPI.getSummary(),
      trainerReviewsAPI.getCompletedReviews(),
    ])
    if (summaryRes.success) setSummary(summaryRes.data)
    if (completedRes.success) setPastReviews(completedRes.data)
  }

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="rv-page">
        {loadError && <div className="rv-error-state">{loadError}</div>}

        <div className="rv-stats">
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">{loading ? '—' : summary?.total_reviews ?? 0}</p>
                <p className="rv-stat-title">Total Reviews</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#DBEAFE' }}><Users size={16} color="#2563EB" /></div>
            </div>
          </div>
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">{loading ? '—' : summary?.pending_count ?? 0}</p>
                <p className="rv-stat-title">Pending reviews</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#FEF3C7' }}><ClipboardList size={16} color="#D97706" /></div>
            </div>
          </div>
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">
                  {loading ? '—' : summary?.average_score != null ? summary.average_score.toFixed(1) : '—'}
                </p>
                <p className="rv-stat-title">Avg. score</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#D1FAE5' }}><Star size={16} color="#059669" /></div>
            </div>
          </div>
        </div>

        <h3 className="rv-section-title">Pending Reviews</h3>
        {loading ? (
          <div className="rv-empty-state">Loading…</div>
        ) : pendingReviews.length === 0 ? (
          <div className="rv-empty-state">No pending reviews right now.</div>
        ) : (
          <div className="rv-pending-grid">
            {pendingReviews.map((review) => (
              <div key={review.id} className="rv-pending-card" onClick={() => openGradeModal(review)}>
                <div className="rv-pending-body">
                  <div className="rv-pending-avatar">{initials(review.learner_name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="rv-pending-name-row">
                      <p className="rv-pending-name">{review.learner_name}</p>
                      {review.is_late && <span className="rv-overdue-badge">Overdue</span>}
                    </div>
                    <p className="rv-pending-assignment">{review.assignment_title}</p>
                    <p className="rv-pending-meta">{review.course_title} · {formatRelativeDate(review.submitted_at)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rv-grade-btn"
                  onClick={(e) => { e.stopPropagation(); openGradeModal(review) }}
                >
                  <Award size={16} /> Grade
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rv-section-header">
          <h3 className="rv-section-title" style={{ margin: 0 }}>Past Reviews</h3>
        </div>
        {loading ? (
          <div className="rv-empty-state">Loading…</div>
        ) : pastReviews.length === 0 ? (
          <div className="rv-empty-state">No completed reviews yet.</div>
        ) : (
          <div className="rv-past-card">
            <div className="rv-past-table-head">
              <span>Learner</span>
              <span>Assignment</span>
              <span>Score</span>
            </div>
            {pastReviews.map((review) => {
              const isPass = review.grade_status === 'pass'
              const isRevision = review.grade_status == null
              const statusClass = isRevision ? 'revision' : isPass ? 'pass' : 'fail'
              const statusLabel = isRevision ? 'Revision requested' : review.grade_status

              return (
                <div key={review.id} className="rv-past-row">
                  <div className="rv-past-avatar">{initials(review.learner_name)}</div>
                  <div className="rv-past-info">
                    <p className="rv-past-name">{review.learner_name}</p>
                    <p className="rv-past-assignment">{review.assignment_title}</p>
                  </div>
                  <div className="rv-past-score-wrap">
                    <span className={`rv-past-score ${statusClass}`}>
                      {review.score != null ? review.score : '—'}
                    </span>
                    {statusLabel && (
                      <span className={`rv-past-status ${statusClass}`}>{statusLabel}</span>
                    )}
                  </div>
                  <span className="rv-past-date">{formatShortDate(review.graded_at)}</span>
                </div>
              )
            })}
          </div>
        )}

        {activeReview && (
          <div className="rv-modal-overlay" onClick={closeGradeModal}>
            <div className="rv-grade-modal" onClick={(e) => e.stopPropagation()}>
              <button className="rv-grade-close" onClick={closeGradeModal} aria-label="Close">
                <X size={18} />
              </button>

              <div className="rv-grade-left">
                <div className="rv-grade-header">
                  <div className="rv-grade-avatar">{initials(activeReview.learner_name)}</div>
                  <div>
                    <p className="rv-grade-name">{activeReview.learner_name}</p>
                    <p className="rv-grade-assignment-title">{activeReview.assignment_title}</p>
                  </div>
                  {activeReview.is_late && <span className="rv-overdue-badge">Overdue</span>}
                </div>
                <div className="rv-grade-meta">
                  <span>{formatRelativeDate(activeReview.submitted_at)}</span>
                  <span className="rv-grade-tag">{activeReview.course_title.toUpperCase()}</span>
                </div>

                <div className="rv-file-list">
                  {activeReview.files.map((file) => (
                    <div className="rv-file-row" key={file.id}>
                      <div className="rv-file-icon"><FileText size={18} /></div>
                      <div>
                        <p className="rv-file-name">{file.file_name}</p>
                        <p className="rv-file-size">{formatFileSize(file.file_size)}</p>
                      </div>
                      <a
                        className="rv-file-download"
                        href={file.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Download ${file.file_name}`}
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  ))}
                </div>

                <div className="rv-note-box">
                  <p className="rv-note-title">Note to trainer</p>
                  <p className="rv-note-body">Kindly download the file(s), read through and input the grade on the right-side panel.</p>
                </div>
              </div>

              <div className="rv-grade-right">
                <h3 className="rv-grade-form-title">Grade Assignment</h3>
                <p className="rv-grade-form-sub">Any score below 70%, the students will be required to review</p>

                <label className="rv-status-label">Result <span style={{ color: '#EF4444' }}>*</span></label>
                <div className="rv-status-toggle">
                  <button
                    type="button"
                    className={`rv-status-btn ${status === 'pass' ? 'active-pass' : ''}`}
                    onClick={() => setStatus('pass')}
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    className={`rv-status-btn ${status === 'fail' ? 'active-fail' : ''}`}
                    onClick={() => setStatus('fail')}
                  >
                    Fail
                  </button>
                  <button
                    type="button"
                    className={`rv-status-btn ${status === 'revision' ? 'active-revision' : ''}`}
                    onClick={() => setStatus('revision')}
                  >
                    <RotateCcw size={14} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />
                    Request Revision
                  </button>
                </div>

                {status !== 'revision' && (
                  <>
                    <label className="rv-score-label">Score</label>
                    <div className="rv-score-row">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="rv-score-input"
                        placeholder="—"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                      />
                      <span className="rv-score-of">/ 100</span>
                    </div>
                  </>
                )}

                {status === 'revision' ? (
                  <>
                    <label className="rv-feedback-label">Reason for revision (optional)</label>
                    <textarea
                      className="rv-feedback-textarea"
                      placeholder="Let the learner know what needs to change…"
                      value={revisionReason}
                      onChange={(e) => setRevisionReason(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <label className="rv-feedback-label">Feedback</label>
                    <textarea
                      className="rv-feedback-textarea"
                      placeholder="Add your feedback here…"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                  </>
                )}

                {submitError && <div className="rv-form-error">{submitError}</div>}

                <div className="rv-grade-actions">
                  <button className="rv-cancel-btn" onClick={closeGradeModal} disabled={submitting}>Cancel</button>
                  <button className="rv-submit-btn" onClick={handleSubmitGrade} disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Grade'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="rv-modal-overlay">
            <div className="rv-success-modal">
              <div className="rv-success-icon"><CheckCircle2 size={40} /></div>
              <h3 className="rv-success-title">
                {successType === 'revision' ? 'Revision requested' : 'Successful'}
              </h3>
              <p className="rv-success-sub">
                {successType === 'revision'
                  ? 'The learner has been notified to revise and resubmit.'
                  : 'The assessment has been graded successfully.'}
              </p>
              <button className="rv-success-btn" onClick={() => setShowSuccess(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </TrainerShell>
  )
}