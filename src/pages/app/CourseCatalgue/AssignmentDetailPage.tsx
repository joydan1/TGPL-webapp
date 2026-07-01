import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BookOpen, Calendar,
  CheckCircle2, AlertTriangle, Upload, X, Plus,
  FileText, FileSpreadsheet, Presentation, Download,
  Info, BookMarked, FileCheck2,
} from 'lucide-react'
import { RouteBuilder } from '../../../constants/routes'
import { useAuth } from '../../../hooks/useAuth'
import AppShell, { SHELL_CSS } from '../../../components/layout/AppShell'
import {
  assignmentsAPI,
  type AssignmentDetail,
  type AssignmentRequirement,
  type SubmittedFile,
} from '../../../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDueDate(iso: string): string {
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} · ${timePart} WAT`
}

function fmtShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function resourceIcon(fileType: string) {
  const t = fileType.toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return <FileSpreadsheet size={20} color="#16A34A" />
  if (t.includes('ppt') || t.includes('slide')) return <Presentation size={20} color="#EA580C" />
  return <FileText size={20} color="#7C3AED" />
}

function resourceIconBg(fileType: string) {
  const t = fileType.toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return '#ECFDF3'
  if (t.includes('ppt') || t.includes('slide')) return '#FFF4ED'
  return '#F5F0FF'
}

function sortedRequirements(reqs: AssignmentRequirement[]): AssignmentRequirement[] {
  return [...reqs].sort((a, b) => a.order - b.order)
}

// ─── Page CSS (page-specific only — shell handled by AppShell) ────────────────
const PAGE_CSS = `
  .content { padding: 2rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 1.5rem; }

  .state-screen { display: flex; align-items: center; justify-content: center; min-height: 320px; color: #9CA3AF; font-size: 0.9375rem; }
  .state-screen.error { color: #EF4444; }

  /* Header card */
  .header-card { background: #fff; border-radius: 1.25rem; padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 0.625rem; }
  .crumb-row { display: flex; align-items: center; gap: 0.625rem; }
  .crumb-back { width: 1.75rem; height: 1.75rem; border-radius: 50%; border: none; background: none; color: #6B7280; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .crumb-back:hover { background: #F3F4F6; }
  .crumb { font-size: 0.875rem; color: #9CA3AF; display: flex; align-items: center; gap: 0.4rem; }
  .crumb .crumb-link { color: #9CA3AF; cursor: pointer; }
  .crumb .crumb-link:hover { color: #2563EB; }
  .crumb .crumb-current { color: #2563EB; font-weight: 600; }
  .header-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .header-title { font-size: 1.5rem; font-weight: 700; color: #111; }
  .header-sub { font-size: 0.9375rem; color: #6B7280; margin-top: 0.125rem; }
  .status-pill { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.9rem; border-radius: 2rem; font-size: 0.8125rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .status-pill.not_started { background: #F3F4F6; color: #6B7280; border: 1px solid #E5E7EB; }
  .status-pill.in_progress { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
  .status-pill.graded { background: #ECFDF3; color: #16A34A; border: 1px solid #BBF7D0; }
  .meta-row { display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap; font-size: 0.875rem; color: #6B7280; }
  .meta-item { display: flex; align-items: center; gap: 0.4rem; }
  .meta-pts { font-weight: 700; color: #111; }

  /* Feedback / banner cards */
  .feedback-card { border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.625rem; }
  .feedback-card.graded { background: #ECFDF3; }
  .feedback-card.revision { background: #FFFBEB; }
  .feedback-top-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .feedback-head { display: flex; align-items: center; gap: 0.75rem; }
  .feedback-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .feedback-icon.graded { background: #D1FAE5; }
  .feedback-icon.revision { background: #FDE68A; }
  .feedback-label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .feedback-label.graded { color: #16A34A; }
  .feedback-label.revision { color: #B45309; }
  .feedback-title { font-size: 1.0625rem; font-weight: 700; color: #111; margin-top: 0.125rem; }
  .feedback-title.revision { color: #B45309; }
  .feedback-score { text-align: right; flex-shrink: 0; }
  .feedback-score-num { font-size: 1.625rem; font-weight: 800; color: #16A34A; line-height: 1; }
  .feedback-score-denom { font-size: 0.8125rem; color: #6B7280; }
  .feedback-divider { height: 1px; background: rgba(0,0,0,0.06); }
  .feedback-comment { font-size: 0.9375rem; line-height: 1.6; font-style: italic; }
  .feedback-comment.graded { color: #166534; }
  .feedback-comment.revision { color: #92400E; }
  .feedback-byline { font-size: 0.8125rem; font-weight: 600; }
  .feedback-byline.graded { color: #16A34A; }
  .feedback-byline.revision { color: #B45309; }

  .info-banner { background: #FEF3C7; border-radius: 1rem; padding: 1.25rem 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem; }
  .info-banner-main { font-size: 0.9375rem; font-weight: 600; color: #92400E; }
  .info-banner-sub { font-size: 0.8125rem; color: #B45309; opacity: 0.85; }

  /* Instructions card */
  .instructions-card { background: #fff; border-radius: 1.25rem; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .section-label { font-size: 0.78rem; font-weight: 800; letter-spacing: 0.08em; color: #6B7280; text-transform: uppercase; }
  .intro-text { font-size: 0.9375rem; line-height: 1.7; color: #374151; }
  .intro-text b { color: #111; }
  .example-fig { display: flex; flex-direction: column; gap: 0.5rem; }
  .example-img { width: 100%; border-radius: 0.875rem; aspect-ratio: 1025.333251953125/329; object-fit: cover; display: block; background: linear-gradient(135deg,#c8c8c8,#a0a0a0); }
  .example-caption { text-align: center; font-size: 0.8125rem; color: #9CA3AF; }

  .subsection { display: flex; flex-direction: column; gap: 0.75rem; }
  .subsection h3 { font-size: 1.0625rem; font-weight: 700; color: #111; }
  .bullet-list, .numbered-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .bullet-row { display: flex; align-items: flex-start; gap: 0.625rem; font-size: 0.9375rem; color: #374151; line-height: 1.55; }
  .bullet-dot { width: 6px; height: 6px; border-radius: 50%; background: #2563EB; flex-shrink: 0; margin-top: 0.55rem; }
  .numbered-row { display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.9375rem; color: #374151; line-height: 1.55; }
  .num-badge { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #F3F4F6; color: #6B7280; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.05rem; }
  .num-badge.blue { background: #DBEAFE; color: #2563EB; }

  .scenario-box { background: #EFF6FF; border-radius: 0.875rem; padding: 1.125rem 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
  .scenario-box h3 { font-size: 0.9375rem; font-weight: 700; color: #111; }

  .grading-table { display: flex; flex-direction: column; gap: 0.625rem; border-top: 1px solid #F3F4F6; padding-top: 1rem; }
  .grading-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.9375rem; }
  .grading-row span:first-child { color: #374151; }
  .grading-row span:last-child { font-weight: 700; color: #111; }

  /* Resources */
  .resources-section { display: flex; flex-direction: column; gap: 0.875rem; }
  .resources-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .resource-row { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1.125rem; border-radius: 0.875rem; background: #fff; }
  .resource-icon-wrap { width: 2.5rem; height: 2.5rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .resource-info { flex: 1; min-width: 0; }
  .resource-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .resource-meta { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.125rem; }
  .resource-meta .size-tag { color: #16A34A; font-weight: 700; }
  .resource-download { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #EFF6FF; border: none; color: #2563EB; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .resource-download:hover { background: #DBEAFE; }

  /* Submission requirements */
  .req-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .req-row { display: flex; align-items: flex-start; gap: 0.875rem; padding: 0.875rem 1.125rem; border-radius: 0.875rem; background: #fff; }
  .req-icon-wrap { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #F5F0FF; }
  .req-info { flex: 1; min-width: 0; }
  .req-label { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .req-sub { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.125rem; }
  .req-value { font-size: 0.9375rem; font-weight: 700; color: #111; text-align: right; flex-shrink: 0; white-space: nowrap; }

  /* Submitted files */
  .submitted-files-section { display: flex; flex-direction: column; gap: 0.875rem; }
  .submitted-files-card { background: #fff; border-radius: 1.25rem; padding: 1.5rem; }
  .submitted-files-grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .submitted-file-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 96px; text-align: center; }
  .submitted-file-icon { width: 3rem; height: 3rem; border-radius: 0.625rem; border: 1.5px solid #2563EB; color: #2563EB; display: flex; align-items: center; justify-content: center; }
  .submitted-file-name { font-size: 0.78rem; color: #374151; line-height: 1.35; word-break: break-word; }

  /* Bottom action bar */
  .action-bar { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .action-btn { display: flex; align-items: center; gap: 0.5rem; width: 100%; justify-content: center; padding: 0.95rem; border-radius: 0.875rem; border: none; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .action-btn.start { background: #2563EB; color: #fff; }
  .action-btn:hover { opacity: 0.92; }
  .action-hint { font-size: 0.8125rem; color: #9CA3AF; }

  /* Modal — prefixed to avoid collisions */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(17,24,39,0.55); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1.5rem; }
  .submit-modal { width: 100%; max-width: 540px; background: #fff; border-radius: 1.25rem; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-height: 88vh; overflow-y: auto; }
  .submit-modal-head { display: flex; align-items: center; justify-content: space-between; }
  .submit-modal-title { font-size: 1.125rem; font-weight: 700; color: #111; }
  .submit-modal-close { width: 1.75rem; height: 1.75rem; border-radius: 50%; border: none; background: #F3F4F6; color: #6B7280; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .submit-modal-close:hover { background: #E5E7EB; }
  .asgn-modal-progress-row { display: flex; align-items: center; justify-content: space-between; }
  .asgn-modal-progress-label { font-size: 0.9375rem; color: #6B7280; }
  .asgn-modal-progress-count { font-size: 0.9375rem; font-weight: 700; color: #2563EB; }
  .modal-body-row { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
  .dropzone { flex: 1; min-width: 200px; border: 2px dashed #93C5FD; border-radius: 0.875rem; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: background 0.15s, border-color 0.15s; background: #fff; text-align: center; }
  .dropzone:hover, .dropzone.dragover { background: #EFF6FF; border-color: #2563EB; }
  .dropzone.disabled { opacity: 0.5; cursor: not-allowed; }
  .dropzone-icon { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; }
  .dropzone-text { font-size: 0.9375rem; font-weight: 600; color: #374151; }
  .dropzone-sub { font-size: 0.78rem; color: #9CA3AF; }
  .criteria-list { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.25rem; }
  .criteria-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.9375rem; color: #374151; }
  .criteria-row .criteria-label-wrap { display: flex; flex-direction: column; }
  .criteria-row .criteria-hint { font-size: 0.72rem; color: #9CA3AF; }
  .criteria-status { flex-shrink: 0; display: flex; align-items: center; }
  .file-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .file-list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; border-radius: 0.625rem; background: #F9FAFB; }
  .file-list-name { flex: 1; min-width: 0; font-size: 0.875rem; color: #111; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .file-list-req { font-size: 0.72rem; color: #6B7280; flex-shrink: 0; }
  .file-list-size { font-size: 0.78rem; color: #9CA3AF; flex-shrink: 0; }
  .file-list-remove { width: 1.5rem; height: 1.5rem; border-radius: 50%; border: none; background: none; color: #9CA3AF; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .file-list-remove:hover { background: #FEE2E2; color: #DC2626; }
  .submit-error { font-size: 0.8438rem; color: #DC2626; background: #FEF2F2; border-radius: 0.625rem; padding: 0.625rem 0.875rem; }

  /* Upload progress indicator */
  .upload-progress { font-size: 0.8438rem; color: #2563EB; background: #EFF6FF; border-radius: 0.625rem; padding: 0.625rem 0.875rem; text-align: center; }

  @media (max-width: 900px) {
    .content { padding: 1.5rem 1.25rem 2rem; }
    .modal-body-row { flex-direction: column; }
  }
  @media (max-width: 640px) {
    .content { padding: 1.25rem 1rem 5rem; }
    .header-card, .instructions-card { padding: 1.25rem; }
    .header-title { font-size: 1.25rem; }
  }
`

// ─── Submission modal ───────────────────────────────────────────────────────
function SubmissionModal({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: AssignmentDetail
  onClose: () => void
  onSubmitted: (files: SubmittedFile[]) => void
}) {
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Requirements define both how many files we can accept and which
  // requirement_id each uploaded file must be tagged with. Files are
  // auto-mapped to requirements in the order they're added.
  const requirements = sortedRequirements(assignment.requirements)
  const maxFiles = requirements.length

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)].slice(0, maxFiles))
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (files.length === 0) return
    setSubmitting(true)
    setError(null)
    setUploadStep(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}…`)

    const res = await assignmentsAPI.submitAssignment(assignment.id, files, requirements)

    setSubmitting(false)
    setUploadStep(null)

    if (res.success) {
      onSubmitted(res.data.submitted_files)
    } else {
      setError(res.error)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="submit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="submit-modal-head">
          <span className="submit-modal-title">{assignment.title}</span>
          <button className="submit-modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="asgn-modal-progress-row">
          <span className="asgn-modal-progress-label">Submission progress</span>
          <span className="asgn-modal-progress-count">{files.length} of {maxFiles} files uploaded</span>
        </div>

        <div className="modal-body-row">
          <div
            className={`dropzone${dragOver ? ' dragover' : ''}${files.length >= maxFiles ? ' disabled' : ''}`}
            onClick={() => files.length < maxFiles && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (files.length < maxFiles) setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (files.length < maxFiles) addFiles(e.dataTransfer.files)
            }}
          >
            <div className="dropzone-icon"><Plus size={20} /></div>
            <span className="dropzone-text">
              {files.length >= maxFiles ? 'All slots filled' : 'Click to add file(s)'}
            </span>
            <span className="dropzone-sub">{assignment.submission_requirements.accepted_file_types}</span>
            <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>

          <div className="criteria-list">
            {requirements.map((req, i) => (
              <div className="criteria-row" key={req.id}>
                <div className="criteria-label-wrap">
                  <span>{req.label}{req.required ? '' : ' (optional)'}</span>
                  <span className="criteria-hint">{req.allowed_file_types}</span>
                </div>
                <span className="criteria-status">
                  {files.length > i
                    ? <CheckCircle2 size={18} color="#16A34A" />
                    : <X size={16} color="#DC2626" strokeWidth={3} />}
                </span>
              </div>
            ))}
          </div>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => (
              <div className="file-list-item" key={`${f.name}-${i}`}>
                <FileText size={16} color="#6B7280" />
                <span className="file-list-name">{f.name}</span>
                <span className="file-list-req">→ {requirements[i]?.label}</span>
                <span className="file-list-size">{(f.size / 1024).toFixed(0)} KB</span>
                <button className="file-list-remove" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {uploadStep && <div className="upload-progress">{uploadStep}</div>}
        {error && <div className="submit-error">{error}</div>}

        <button
          className="action-btn start"
          disabled={files.length === 0 || submitting}
          style={{ opacity: files.length === 0 || submitting ? 0.6 : 1, cursor: files.length === 0 || submitting ? 'default' : 'pointer' }}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit Assignment'}
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AssignmentDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [activeNav, setActiveNav]   = useState('courses')
  const [modalOpen, setModalOpen]   = useState(false)

  const load = useCallback(async (assignmentId: string) => {
    setLoading(true)
    setError(null)
    const res = await assignmentsAPI.getAssignment(assignmentId)
    if (res.success) setAssignment(res.data)
    else setError(res.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (id) load(id)
  }, [id, load])

  if (!user) return null

  // ── Resource download: use presigned URL endpoint ─────────────────────────
  async function handleResourceDownload(resourceId: string, resourceTitle: string) {
    if (!assignment) return
    const res = await assignmentsAPI.getResourceDownloadUrl(assignment.id, resourceId)
    if (res.success) {
      window.open(res.data.download_url, '_blank')
    } else {
      console.error(`Failed to download "${resourceTitle}":`, res.error)
    }
  }

  function handleSubmitted(submittedFiles: SubmittedFile[]) {
    setModalOpen(false)
    setAssignment((prev) =>
      prev ? { ...prev, status: 'in_progress', submitted_files: submittedFiles, feedback: null } : prev,
    )
  }

  const showRevisionResubmit = assignment?.status === 'in_progress' && assignment.feedback?.type === 'revision_requested'
  const showStartSubmission  = assignment?.status === 'not_started' || showRevisionResubmit
  const showAwaitingBanner   = assignment?.status === 'in_progress' && !assignment.feedback

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="content">
          {loading && <div className="state-screen">Loading assignment…</div>}
          {error && !loading && <div className="state-screen error">{error}</div>}

          {!loading && !error && assignment && (
            <>
              {/* Header */}
              <div className="header-card">
                <div className="crumb-row">
                  <button className="crumb-back" onClick={() => navigate(RouteBuilder.course(assignment.course_slug))} aria-label="Back">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
                  </button>
                  <div className="crumb">
                    <BookOpen size={14} />
                    <span className="crumb-link" onClick={() => navigate(RouteBuilder.course(assignment.course_slug))}>{assignment.course_title}</span>
                    <span>›</span>
                    <span className="crumb-link">{assignment.module_title.split('—')[0].trim()}</span>
                    <span>›</span>
                    <span className="crumb-current">Assignment</span>
                  </div>
                </div>

                <div className="header-title-row">
                  <div>
                    <div className="header-title">{assignment.title}</div>
                    <div className="header-sub">{assignment.module_title}</div>
                  </div>
                  <div className={`status-pill ${assignment.status}`}>
                    {assignment.status === 'not_started' && <><span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid #9CA3AF', display: 'inline-block' }} />Not started</>}
                    {assignment.status === 'in_progress' && <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-3-6.7" /><polyline points="21,3 21,9 15,9" /></svg>In progress</>}
                    {assignment.status === 'graded' && <><CheckCircle2 size={14} />Graded</>}
                  </div>
                </div>

                <div className="meta-row">
                  <span className="meta-item"><Calendar size={14} />{fmtDueDate(assignment.due_at)}</span>
                  <span className="meta-item meta-pts">{assignment.points} pts</span>
                  <span className="meta-item">· {assignment.grade_weight_percent}% of final grade</span>
                </div>
              </div>

              {/* Graded feedback */}
              {assignment.status === 'graded' && assignment.feedback && (
                <div className="feedback-card graded">
                  <div className="feedback-top-row">
                    <div className="feedback-head">
                      <div className="feedback-icon graded"><CheckCircle2 size={18} color="#16A34A" /></div>
                      <div>
                        <div className="feedback-label graded">Graded</div>
                        <div className="feedback-title">Well done, {(user.name || '').split(' ')[0] || 'there'}!</div>
                      </div>
                    </div>
                    <div className="feedback-score">
                      <div className="feedback-score-num">{assignment.feedback.score}</div>
                      <div className="feedback-score-denom">/ {assignment.points} pts</div>
                    </div>
                  </div>
                  <div className="feedback-divider" />
                  <div className="feedback-comment graded">&ldquo;{assignment.feedback.comment}&rdquo;</div>
                  <div className="feedback-byline graded">Graded by {assignment.feedback.grader_name} · {fmtShortDate(assignment.feedback.date)}</div>
                </div>
              )}

              {/* Revision requested */}
              {showRevisionResubmit && assignment.feedback && (
                <div className="feedback-card revision">
                  <div className="feedback-head">
                    <div className="feedback-icon revision"><AlertTriangle size={18} color="#B45309" /></div>
                    <div className="feedback-title revision">Revision requested by {assignment.feedback.grader_name}</div>
                  </div>
                  <div className="feedback-comment revision">&ldquo;{assignment.feedback.comment}&rdquo;</div>
                  <div className="feedback-byline revision">Feedback received · {fmtShortDate(assignment.feedback.date)}</div>
                </div>
              )}

              {/* Awaiting grading */}
              {showAwaitingBanner && (
                <div className="info-banner">
                  <span className="info-banner-main">Assignment is being graded, kindly check back in 48 hours</span>
                  <span className="info-banner-sub">You can proceed with your learning while you await your grades for this assignment</span>
                </div>
              )}

              {/* Instructions */}
              <div className="instructions-card">
                <div>
                  <div className="section-label" style={{ marginBottom: '0.875rem' }}>Instructions</div>
                  <div className="intro-text">{assignment.instructions.intro}</div>
                </div>

                {assignment.instructions.example_image_url && (
                  <div className="example-fig">
                    <img className="example-img" src={assignment.instructions.example_image_url} alt={assignment.instructions.example_image_caption || ''} />
                    {assignment.instructions.example_image_caption && (
                      <div className="example-caption">{assignment.instructions.example_image_caption}</div>
                    )}
                  </div>
                )}

                <div className="subsection">
                  <h3>What you&apos;ll do</h3>
                  <div className="bullet-list">
                    {assignment.instructions.what_youll_do.map((item, i) => (
                      <div className="bullet-row" key={i}><span className="bullet-dot" />{item}</div>
                    ))}
                  </div>
                </div>

                {assignment.instructions.scenarios.length > 0 && (
                  <div className="scenario-box">
                    <h3>Choose one project scenario</h3>
                    {assignment.instructions.scenarios.map((s) => (
                      <div className="numbered-row" key={s.id}>
                        <span className="num-badge blue">{s.order}</span>{s.text}
                      </div>
                    ))}
                  </div>
                )}

                <div className="subsection">
                  <h3>Deliverables</h3>
                  <div className="numbered-list">
                    {assignment.instructions.deliverables.map((d) => (
                      <div className="numbered-row" key={d.id}>
                        <span className="num-badge">{d.order}</span>{d.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#111', marginBottom: '0.75rem' }}>Grading criteria</h3>
                  <div className="grading-table">
                    {assignment.instructions.grading_criteria.map((g) => (
                      <div className="grading-row" key={g.id}>
                        <span>{g.label}</span>
                        <span>{g.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Resources */}
              {assignment.resources.length > 0 && (
                <div className="resources-section">
                  <div className="section-label">Resources &amp; Templates</div>
                  <div className="resources-list">
                    {assignment.resources.map((r) => (
                      <div className="resource-row" key={r.id}>
                        <div className="resource-icon-wrap" style={{ background: resourceIconBg(r.file_type) }}>
                          {resourceIcon(r.file_type)}
                        </div>
                        <div className="resource-info">
                          <div className="resource-title">{r.title}</div>
                          <div className="resource-meta">
                            {r.file_type} · {r.size_display}
                            {r.size_tag && <span className="size-tag"> · {r.size_tag}</span>}
                          </div>
                        </div>
                        <button
                          className="resource-download"
                          onClick={() => handleResourceDownload(r.id, r.title)}
                          aria-label={`Download ${r.title}`}
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission requirements */}
              {assignment.status === 'not_started' && (
                <div className="resources-section">
                  <div className="section-label">Submission Requirements</div>
                  <div className="req-list">
                    <div className="req-row">
                      <div className="req-icon-wrap"><FileCheck2 size={16} color="#7C3AED" /></div>
                      <div className="req-info">
                        <div className="req-label">Accepted file types</div>
                        <div className="req-sub">All three deliverables in one upload or separate files</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.accepted_file_types}</div>
                    </div>
                    <div className="req-row">
                      <div className="req-icon-wrap"><Info size={16} color="#7C3AED" /></div>
                      <div className="req-info">
                        <div className="req-label">Max file size</div>
                        <div className="req-sub">Compress images before uploading if needed</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.max_file_size}</div>
                    </div>
                    {assignment.submission_requirements.word_count && (
                      <div className="req-row">
                        <div className="req-icon-wrap"><BookMarked size={16} color="#7C3AED" /></div>
                        <div className="req-info">
                          <div className="req-label">Word count</div>
                          <div className="req-sub">Communication plan section only; map and register are template-based</div>
                        </div>
                        <div className="req-value">{assignment.submission_requirements.word_count}</div>
                      </div>
                    )}
                    <div className="req-row">
                      <div className="req-icon-wrap"><FileText size={16} color="#7C3AED" /></div>
                      <div className="req-info">
                        <div className="req-label">Max files</div>
                        <div className="req-sub">One per deliverable, or combine into a single PDF</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.max_files} files</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submitted files */}
              {assignment.submitted_files.length > 0 && (
                <div className="submitted-files-section">
                  <div className="section-label">Submitted Files</div>
                  <div className="submitted-files-card">
                    <div className="submitted-files-grid">
                      {assignment.submitted_files.map((f) => (
                        <a className="submitted-file-item" key={f.id} href={f.file_url} target="_blank" rel="noreferrer">
                          <div className="submitted-file-icon"><FileText size={22} /></div>
                          <span className="submitted-file-name">{f.filename}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action bar */}
              {showStartSubmission && (
                <div className="action-bar">
                  <button className="action-btn start" onClick={() => setModalOpen(true)}>
                    <Upload size={18} />{showRevisionResubmit ? 'Revise and resubmit' : 'Start submission'}
                  </button>
                  <span className="action-hint">Your progress is saved automatically — come back any time.</span>
                </div>
              )}
            </>
          )}
        </div>
      </AppShell>

      {modalOpen && assignment && (
        <SubmissionModal
          assignment={assignment}
          onClose={() => setModalOpen(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  )
}