import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
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
  type AssignmentStatus,
  type AssignmentRequirement,
  type SubmittedFile,
} from '../../../services/api'


interface RawSubmissionFile {
  id: string
  requirement_id: string
  file_name: string
  file_size: number
  content_type: string
  download_url: string
  created_at: string
}

interface RawSubmissionAttempt {
  id: string
  assignment_id: string
  attempt_number: number
  state: string 
  submitted_at: string | null
  is_late: boolean
  files: RawSubmissionFile[]
  grade: Record<string, unknown> | null 
  created_at: string
}

interface RawAssignmentResource {
  id: string
  title: string
  resource_type: string
  file_format: string | null
  file_size: number
  created_at: string
}

interface RawAssignmentDetail {
  id: string
  module_id: string
  title: string
  instructions: string
  deadline: string | null
  max_attempts: number
  accept_late: boolean
  grading_criteria: unknown
  order: number
  requirements: AssignmentRequirement[]
  resources: RawAssignmentResource[]
  my_submissions: RawSubmissionAttempt[]
}

interface AssignmentNavContext {
  courseSlug?: string
  courseTitle?: string
  moduleTitle?: string
}

function latestAttempt(raw: RawAssignmentDetail): RawSubmissionAttempt | null {
  if (!raw.my_submissions || raw.my_submissions.length === 0) return null

  for (let i = raw.my_submissions.length - 1; i >= 0; i--) {
    const attempt = raw.my_submissions[i]
    if (attempt.files.length > 0 || attempt.submitted_at) return attempt
  }

  return raw.my_submissions[raw.my_submissions.length - 1]
}

// Attempts are only "used" once actually submitted — an abandoned/unsubmitted
// draft attempt (submitted_at === null) doesn't count against max_attempts.
function countAttemptsUsed(raw: RawAssignmentDetail): number {
  if (!raw.my_submissions) return 0
  return raw.my_submissions.filter((a) => !!a.submitted_at).length
}

function deriveStatus(attempt: RawSubmissionAttempt | null): AssignmentStatus {
  if (!attempt || attempt.state === 'not_started') return 'not_started'
  if (attempt.state === 'graded') return 'graded'
  if (!attempt.submitted_at) return 'not_started'
  return 'in_progress'
}

function deriveFeedback(attempt: RawSubmissionAttempt | null): AssignmentDetail['feedback'] {
  if (!attempt) return null
  if (attempt.state !== 'graded' && attempt.state !== 'revision_requested') return null

  const grade = (attempt.grade ?? {}) as Record<string, unknown>
  return {
    type: attempt.state === 'graded' ? 'graded' : 'revision_requested',
    grader_name: typeof grade.grader_name === 'string' ? grade.grader_name : 'Your trainer',
    comment: typeof grade.comment === 'string' ? grade.comment : '',
    date: (typeof grade.date === 'string' && grade.date) || attempt.submitted_at || attempt.created_at,
    score: typeof grade.score === 'number' ? grade.score : undefined,
  }
}

// grade.status ('pass' | 'fail') lives on AssignmentDetail directly, as a
// sibling of `feedback` — not nested inside AssignmentFeedback.
function deriveGradeStatus(attempt: RawSubmissionAttempt | null): 'pass' | 'fail' | undefined {
  if (!attempt || attempt.state !== 'graded') return undefined
  const grade = (attempt.grade ?? {}) as Record<string, unknown>
  return grade.status === 'pass' || grade.status === 'fail' ? grade.status : undefined
}

function normalizeGradingCriteria(
  raw: unknown,
): { id: string; label: string; points: number }[] {
  if (Array.isArray(raw)) {
    return raw.map((c, i) => {
      if (c && typeof c === 'object' && 'label' in c) {
        const item = c as { label: string; max_points?: number; points?: number }
        return {
          id: String(i),
          label: item.label,
          points: item.max_points ?? item.points ?? 0,
        }
      }
      console.warn('Unexpected grading_criteria array item shape:', c)
      return { id: String(i), label: String(c), points: 0 }
    })
  }

  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, number>).map(([label, points], i) => ({
      id: String(i),
      label,
      points: typeof points === 'number' ? points : 0,
    }))
  }

  if (raw != null) {
    console.warn('Unrecognized grading_criteria shape, ignoring:', raw)
  }
  return []
}


function toMB(bytes: number): number {
  return Math.round(bytes / (1024 * 1024))
}

function formatMaxFileSize(reqs: AssignmentRequirement[]): string {
  if (!reqs.length) return ''
  const sizes = reqs.map((r) => toMB(r.max_bytes))
  const min = Math.min(...sizes)
  const max = Math.max(...sizes)
  return min === max ? `${max} MB` : `${min}–${max} MB (varies by file)`
}

function normalizeAssignment(raw: RawAssignmentDetail, ctx: AssignmentNavContext): AssignmentDetail {
  const attempt = latestAttempt(raw)
  const requirements = (raw.requirements && raw.requirements.length > 0)
    ? raw.requirements
    : [{
        id: 'default-submission-slot',
        label: 'Submission file',
        allowed_file_types: ['pdf', 'docx'],
        max_bytes: 20 * 1024 * 1024,
        required: true,
        order: 1,
        naming_hint: 'Use your name and assignment title in the filename.',
      } as AssignmentRequirement]

  return {
    id: raw.id,
    title: raw.title,
    course_slug: ctx.courseSlug ?? '',
    course_title: ctx.courseTitle ?? '',
    module_title: ctx.moduleTitle ?? '',
    due_at: raw.deadline ?? '',
    points: 0,
    grade_status: deriveGradeStatus(attempt),
    grade_weight_percent: 0,
    status: deriveStatus(attempt),
    max_attempts: raw.max_attempts ?? 1,
    attempts_used: countAttemptsUsed(raw),
    instructions: {
      intro: raw.instructions,
      example_image_url: null,
      example_image_caption: null,
      what_youll_do: [],
      scenarios: [],
      deliverables: [],
      grading_criteria: normalizeGradingCriteria(raw.grading_criteria),
    },
    resources: (raw.resources ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      file_type: r.file_format ?? r.resource_type,
      file_url: '',
      size_display: r.file_size ? `${(r.file_size / 1024).toFixed(0)} KB` : '',
      size_tag: undefined,
    })),
    requirements,
    submitted_files: (attempt?.files ?? []).map((f) => ({
      id: f.id,
      filename: f.file_name,
      file_url: f.download_url,
      uploaded_at: f.created_at,
    })),
    feedback: deriveFeedback(attempt),
    submission_requirements: {
      accepted_file_types: requirements.map((r) => r.allowed_file_types).join(', '),
      max_file_size: formatMaxFileSize(requirements),
      word_count: null,
      max_files: requirements.length,
    },
  }
}

function fmtDueDate(iso: string): string {
  if (!iso) return 'No due date'
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} · ${timePart} WAT`
}

function fmtShortDate(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function resourceIcon(fileType: string) {
  const t = (fileType || '').toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return <FileSpreadsheet size={16} color="#00A63E" />
  if (t.includes('ppt') || t.includes('slide')) return <Presentation size={16} color="#EA580C" />
  if (t.includes('doc')) return <FileText size={16} color="#2B7FFF" />
  if (t.includes('pdf')) return <FileText size={16} color="#FB2C36" />
  return <FileText size={16} color="#FB2C36" />
}

function resourceIconBg(fileType: string) {
  const t = (fileType || '').toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return 'rgba(0, 201, 80, 0.1)'
  if (t.includes('ppt') || t.includes('slide')) return '#FFF4ED'
  if (t.includes('doc')) return 'rgba(43, 127, 255, 0.1)'
  return 'rgba(251, 44, 54, 0.1)'
}

function sortedRequirements(reqs: AssignmentRequirement[]): AssignmentRequirement[] {
  return [...reqs].sort((a, b) => a.order - b.order)
}

function getExtensionFromResource(fileType: string, url: string): string {
  try {
    const path = new URL(url).pathname
    const match = path.match(/\.([a-zA-Z0-9]+)(?:$|\?)/)
    if (match) return match[1].toLowerCase()
  } catch {
  }
  const t = (fileType || '').toLowerCase()
  const map: Record<string, string> = {
    pdf: 'pdf', doc: 'doc', docx: 'docx', xls: 'xls', xlsx: 'xlsx',
    sheet: 'xlsx', ppt: 'ppt', pptx: 'pptx', slide: 'pptx', zip: 'zip',
  }
  for (const key in map) {
    if (t.includes(key)) return map[key]
  }
  return ''
}

async function triggerDownload(url: string, filename?: string, fileType?: string) {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) throw new Error('Download request failed')
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const ext = getExtensionFromResource(fileType || '', url)
    const safeName = (filename || 'download').replace(/[/\\?%*:|"<>]/g, '-')
    const alreadyHasExt = /\.[a-zA-Z0-9]+$/.test(safeName)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = alreadyHasExt || !ext ? safeName : `${safeName}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename || ''
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

const PAGE_CSS = `
  .adp-header { background: #fff; border-bottom: 1px solid #F3F4F6; padding: 1rem clamp(1rem, 4vw, 2.5rem) 0.75rem; display: flex; flex-direction: column; gap: 0.75rem; box-sizing: border-box; }
  .content { padding: 1.5rem clamp(1rem, 4vw, 2.5rem) 3rem; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; box-sizing: border-box; }

  .state-screen { display: flex; align-items: center; justify-content: center; min-height: 320px; color: #9CA3AF; font-size: 0.9375rem; }
  .state-screen.error { color: #EF4444; }

  .crumb-row { display: flex; align-items: center; gap: 0.5rem; }
  .crumb-back { width: 2rem; height: 2rem; border-radius: 50%; border: none; background: none; color: #2B3942; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .crumb-back:hover { background: #F3F4F6; }
  .crumb { font-size: 0.6875rem; color: #99A1AF; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap; row-gap: 0.25rem; min-width: 0; }
  .crumb .crumb-link { color: #99A1AF; cursor: pointer; }
  .crumb .crumb-link:hover { color: #2492EB; }
  .crumb .crumb-current { color: #2492EB; font-weight: 600; }
  .header-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding-left: 0.25rem; }
  .header-title { font-size: 1.0625rem; font-weight: 700; color: #2B3942; word-break: break-word; }
  .header-sub { font-size: 0.6875rem; color: #99A1AF; margin-top: 0.125rem; }
  .status-pill { display: flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.625rem; border-radius: 2rem; font-size: 0.6875rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; }
  .status-pill.not_started { background: #F3F4F6; color: #6A7282; border: 1px solid #E5E7EB; }
  .status-pill.in_progress { background: #EFF6FF; color: #2492EB; border: 1px solid #BFDBFE; }
  .status-pill.graded { background: #ECFDF3; color: #16A34A; border: 1px solid #BBF7D0; }
  .meta-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; font-size: 0.6875rem; color: #6A7282; padding-left: 0.25rem; }
  .meta-item { display: flex; align-items: center; gap: 0.35rem; }
  .meta-pts { font-weight: 600; color: #2B3942; }

  .feedback-card { border-radius: 1rem; padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.625rem; }
  .feedback-card.graded { background: #ECFDF3; }
  .feedback-card.revision { background: #FFFBEB; }
  .feedback-top-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .feedback-head { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
  .feedback-icon { width: 2.25rem; height: 2.25rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .feedback-icon.graded { background: #D1FAE5; }
  .feedback-icon.revision { background: #FDE68A; }
  .feedback-label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .feedback-label.graded { color: #16A34A; }
  .feedback-label.revision { color: #B45309; }
  .feedback-title { font-size: 1.0625rem; font-weight: 700; color: #111; margin-top: 0.125rem; word-break: break-word; }
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

  .attempts-banner { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 1rem; padding: 1rem 1.25rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem; }
  .attempts-banner-main { font-size: 0.9375rem; font-weight: 600; color: #B91C1C; }
  .attempts-banner-sub { font-size: 0.8125rem; color: #DC2626; opacity: 0.85; }

  .instructions-card { box-sizing: border-box; background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; padding: 1rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .section-label { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; color: #2B3942; text-transform: uppercase; }
  .intro-text { font-size: 0.875rem; line-height: 1.65; color: #364153; white-space: pre-wrap; }
  .intro-text b { color: #111; }
  .example-fig { display: flex; flex-direction: column; gap: 0.5rem; background: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 0.75rem; overflow: hidden; }
  .example-img { width: 100%; border-radius: 0; aspect-ratio: 1025.333251953125/329; object-fit: cover; display: block; background: linear-gradient(135deg,#c8c8c8,#a0a0a0); }
  .example-caption { text-align: center; font-size: 0.625rem; color: #99A1AF; padding: 0.5rem 0.75rem; }

  .subsection { display: flex; flex-direction: column; gap: 0.75rem; }
  .subsection h3 { font-size: 0.875rem; font-weight: 600; color: #2B3942; }
  .bullet-list, .numbered-list { display: flex; flex-direction: column; gap: 0.625rem; }
  .bullet-row { display: flex; align-items: flex-start; gap: 0.625rem; font-size: 0.875rem; color: #364153; line-height: 1.55; }
  .bullet-dot { width: 6px; height: 6px; border-radius: 50%; background: #2492EB; flex-shrink: 0; margin-top: 0.55rem; }
  .numbered-row { display: flex; align-items: flex-start; gap: 0.625rem; font-size: 0.8125rem; color: #364153; line-height: 1.55; }
  .num-badge { width: 1.25rem; height: 1.25rem; border-radius: 50%; background: #F3F4F6; color: #6A7282; font-size: 0.625rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.05rem; }
  .num-badge.blue { background: rgba(36,146,235,0.15); color: #2492EB; }

  .scenario-box { background: rgba(239,246,255,0.6); border: 1px solid #DBEAFE; border-radius: 0.75rem; padding: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .scenario-box h3 { font-size: 0.8125rem; font-weight: 600; color: #2B3942; }

  .grading-table { display: flex; flex-direction: column; gap: 0.375rem; border-top: 1px solid #F3F4F6; padding-top: 0.75rem; }
  .grading-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.75rem; }
  .grading-row span:first-child { color: #4A5565; }
  .grading-row span:last-child { font-weight: 600; color: #2B3942; white-space: nowrap; }

  .resources-section { display: flex; flex-direction: column; gap: 0.75rem; }
  .resources-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .resource-row { box-sizing: border-box; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: 0.75rem; background: #fff; }
  .resource-icon-wrap { width: 2.25rem; height: 2.25rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .resource-info { flex: 1; min-width: 0; }
  .resource-title { font-size: 0.8125rem; font-weight: 600; color: #2B3942; word-break: break-word; }
  .resource-meta { font-size: 0.625rem; letter-spacing: 0.02em; text-transform: uppercase; color: #99A1AF; margin-top: 0.125rem; }
  .resource-meta .size-tag { color: #16A34A; font-weight: 700; }
  .resource-download { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: rgba(36,146,235,0.1); border: none; color: #2492EB; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .resource-download:hover { background: rgba(36,146,235,0.2); }

  .req-card { box-sizing: border-box; background: #fff; border: 1px solid #F3F4F6; border-radius: 1rem; overflow: hidden; }
  .req-row { box-sizing: border-box; display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.875rem 1rem; flex-wrap: wrap; }
  .req-row + .req-row { border-top: 1px solid #F3F4F6; }
  .req-icon-wrap { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #F3F4F6; margin-top: 0.1rem; }
  .req-info { flex: 1; min-width: 140px; }
  .req-label { font-size: 0.75rem; font-weight: 400; color: #6A7282; }
  .req-sub { font-size: 0.6875rem; color: #99A1AF; margin-top: 0.125rem; }
  .req-value { font-size: 0.75rem; font-weight: 700; color: #2B3942; text-align: right; flex-shrink: 0; white-space: nowrap; margin-left: auto; }
.req-slots-list { display: flex; flex-direction: column; gap: 1rem; }
.req-slot { display: flex; flex-direction: column; gap: 0.5rem; }
.req-slot-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.req-slot-label { font-size: 0.9375rem; font-weight: 600; color: #111; }
.req-slot-hint { font-size: 0.75rem; color: #9CA3AF; }
.req-dropzone { padding: 1.25rem 1rem; }
  .submitted-files-section { display: flex; flex-direction: column; gap: 0.875rem; }
  .submitted-files-card { background: #fff; border-radius: 1.25rem; padding: 1.5rem; }
  .submitted-files-grid { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .submitted-file-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 96px; text-align: center; }
  .submitted-file-icon { width: 3rem; height: 3rem; border-radius: 0.625rem; border: 1.5px solid #2492EB; color: #2492EB; display: flex; align-items: center; justify-content: center; }
  .submitted-file-name { font-size: 0.78rem; color: #374151; line-height: 1.35; word-break: break-word; }

  .action-bar { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #F3F4F6; }
  .action-btn { display: flex; align-items: center; gap: 0.5rem; width: 100%; justify-content: center; padding: 0.85rem; border-radius: 0.75rem; border: none; font-size: 0.875rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .action-btn.start { background: #2492EB; color: #fff; }
  .action-btn:hover { opacity: 0.92; }
  .action-hint { font-size: 0.625rem; color: #99A1AF; text-align: center; }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(17,24,39,0.55); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1.5rem; }
  .submit-modal { width: 100%; max-width: 540px; background: #fff; border-radius: 1.25rem; padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; box-shadow: 0 20px 60px rgba(0,0,0,0.25); max-height: 88vh; overflow-y: auto; box-sizing: border-box; }
  .submit-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .submit-modal-title { font-size: 1.125rem; font-weight: 700; color: #111; word-break: break-word; }
  .submit-modal-close { width: 1.75rem; height: 1.75rem; border-radius: 50%; border: none; background: #F3F4F6; color: #6B7280; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .submit-modal-close:hover { background: #E5E7EB; }
  .asgn-modal-progress-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
  .asgn-modal-progress-label { font-size: 0.9375rem; color: #6B7280; }
  .asgn-modal-progress-count { font-size: 0.9375rem; font-weight: 700; color: #2492EB; }
  .modal-body-row { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap; }
  .dropzone { flex: 1; min-width: 200px; border: 2px dashed #93C5FD; border-radius: 0.875rem; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: background 0.15s, border-color 0.15s; background: #fff; text-align: center; }
  .dropzone:hover, .dropzone.dragover { background: #EFF6FF; border-color: #2492EB; }
  .dropzone.disabled { opacity: 0.5; cursor: not-allowed; }
  .dropzone-icon { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #EFF6FF; color: #2492EB; display: flex; align-items: center; justify-content: center; }
  .dropzone-text { font-size: 0.9375rem; font-weight: 600; color: #374151; }
  .dropzone-sub { font-size: 0.78rem; color: #9CA3AF; }
  .criteria-list { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.25rem; }
  .criteria-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.9375rem; color: #374151; flex-wrap: wrap; }
  .criteria-row .criteria-label-wrap { display: flex; flex-direction: column; min-width: 0; }
  .criteria-row .criteria-hint { font-size: 0.72rem; color: #9CA3AF; word-break: break-word; }
  .criteria-status { flex-shrink: 0; display: flex; align-items: center; }
  .file-list { display: flex; flex-direction: column; gap: 0.5rem; }
  .file-list-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.875rem; border-radius: 0.625rem; background: #F9FAFB; flex-wrap: wrap; }
  .file-list-name { flex: 1; min-width: 80px; font-size: 0.875rem; color: #111; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .file-list-req { font-size: 0.72rem; color: #6B7280; flex-shrink: 0; }
  .file-list-size { font-size: 0.78rem; color: #9CA3AF; flex-shrink: 0; }
  .file-list-remove:hover { background: #FEE2E2; color: #DC2626; }
  .submit-error { font-size: 0.8438rem; color: #DC2626; background: #FEF2F2; border-radius: 0.625rem; padding: 0.625rem 0.875rem; }

  .upload-progress { font-size: 0.8438rem; color: #2492EB; background: #EFF6FF; border-radius: 0.625rem; padding: 0.625rem 0.875rem; text-align: center; }

  @media (max-width: 900px) {
    .modal-body-row { flex-direction: column; }
    .dropzone, .criteria-list { min-width: 0; width: 100%; }
  }
  @media (max-width: 640px) {
    .content { padding: 1.25rem 1rem 5rem; gap: 1.125rem; }
    .instructions-card { padding: 1rem; }
    .header-title { font-size: 1rem; }
    .header-title-row { flex-direction: column; align-items: flex-start; gap: 0.625rem; }
    .status-pill { align-self: flex-start; }
    .meta-row { gap: 0.5rem 0.875rem; }

    .feedback-card { padding: 1rem 1.25rem; }
    .feedback-top-row { flex-direction: column; align-items: flex-start; gap: 0.625rem; }
    .feedback-score { text-align: left; }

    .grading-row { flex-wrap: wrap; }
    .req-row { padding: 0.75rem; }
    .req-value { margin-left: 0; text-align: left; }
    .resource-row { padding: 0.625rem 0.75rem; }

    .submit-modal { padding: 1.25rem; border-radius: 1rem; max-height: 92vh; }
    .submitted-files-grid { gap: 0.875rem; }
    .submitted-file-item { width: 78px; }
    .submitted-file-icon { width: 2.5rem; height: 2.5rem; }
    .submitted-file-name { font-size: 0.72rem; }

    .criteria-row { padding: 0.375rem 0; }
    .file-list-item { gap: 0.5rem; padding: 0.5rem 0.625rem; }
  }
`

function SubmissionModal({
  assignment,
  onClose,
  onSubmitted,
}: {
  assignment: AssignmentDetail
  onClose: () => void
  onSubmitted: (files: SubmittedFile[]) => void
}) {
  const requirements = sortedRequirements(assignment.requirements)

  // Keyed by requirement.id — one slot per requirement, not a flat pool.
  const [filesByRequirement, setFilesByRequirement] = useState<Record<string, File | null>>({})
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadStep, setUploadStep] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function setFileForRequirement(reqId: string, file: File | null) {
    setFilesByRequirement((prev) => ({ ...prev, [reqId]: file }))
  }

  function acceptAttr(allowedTypes: string[]): string {
  return allowedTypes
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('.') ? t : `.${t}`))
    .join(',')
}

  const missingRequired = requirements.filter((r) => r.required && !filesByRequirement[r.id])
  const filledCount = requirements.filter((r) => filesByRequirement[r.id]).length

  async function handleSubmit() {
    if (missingRequired.length > 0) {
      setError(`Please add a file for: ${missingRequired.map((r) => r.label).join(', ')}`)
      return
    }

    // Build files/requirements in matching order — submitAssignment maps
    // files[i] to requirements[i].id positionally, so order must line up
    // exactly, including skipping requirements left empty (optional ones).
    const orderedReqs = requirements.filter((r) => filesByRequirement[r.id])
    const orderedFiles = orderedReqs.map((r) => filesByRequirement[r.id] as File)

    if (orderedFiles.length === 0) {
      setError('Upload at least one file.')
      return
    }

    setSubmitting(true)
    setError(null)
    setUploadStep(`Uploading ${orderedFiles.length} file${orderedFiles.length > 1 ? 's' : ''}...`)

    const res = await assignmentsAPI.submitAssignment(assignment.id, orderedFiles, orderedReqs)

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
          <span className="asgn-modal-progress-count">{filledCount} of {requirements.length} slots filled</span>
        </div>

        <div className="req-slots-list">
          {requirements.map((req) => {
            const file = filesByRequirement[req.id] ?? null
            const isDragOver = dragOverId === req.id

            return (
              <div className="req-slot" key={req.id}>
                <div className="req-slot-head">
                  <span className="req-slot-label">
                    {req.label}{req.required ? '' : ' (optional)'}
                  </span>
                  <span className="req-slot-status">
                    {file
                      ? <CheckCircle2 size={16} color="#16A34A" />
                      : req.required
                        ? <X size={14} color="#DC2626" strokeWidth={3} />
                        : null}
                  </span>
                </div>
                <span className="req-slot-hint">
                  {req.allowed_file_types} · up to {toMB(req.max_bytes)} MB
                  {req.naming_hint ? ` · Name your file: ${req.naming_hint}` : ''}
                </span>

                {file ? (
                  <div className="file-list-item">
                    <FileText size={16} color="#6B7280" />
                    <span className="file-list-name">{file.name}</span>
                    <span className="file-list-size">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      className="file-list-remove"
                      onClick={() => setFileForRequirement(req.id, null)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`dropzone req-dropzone${isDragOver ? ' dragover' : ''}`}
                    onClick={() => fileInputRefs.current[req.id]?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOverId(req.id) }}
                    onDragLeave={() => setDragOverId(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverId(null)
                      const dropped = e.dataTransfer.files?.[0]
                      if (dropped) setFileForRequirement(req.id, dropped)
                    }}
                  >
                    <div className="dropzone-icon"><Plus size={18} /></div>
                    <span className="dropzone-text">Click to add file</span>
                    <input
                      ref={(el) => { fileInputRefs.current[req.id] = el }}
                      type="file"
                      accept={acceptAttr(req.allowed_file_types)}
                      hidden
                      onChange={(e) => setFileForRequirement(req.id, e.target.files?.[0] ?? null)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {uploadStep && <div className="upload-progress">{uploadStep}</div>}
        {error && <div className="submit-error">{error}</div>}

        <button
          className="action-btn start"
          disabled={missingRequired.length > 0 || submitting}
          style={{
            opacity: missingRequired.length > 0 || submitting ? 0.6 : 1,
            cursor: missingRequired.length > 0 || submitting ? 'default' : 'pointer',
          }}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit Assignment'}
        </button>
      </div>
    </div>
  )
}

export default function AssignmentDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user } = useAuth()

  const navCtx = (location.state as AssignmentNavContext) ?? {}

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [activeNav, setActiveNav]   = useState('courses')
  const [modalOpen, setModalOpen]   = useState(false)

  const load = useCallback(async (assignmentId: string) => {
    setLoading(true)
    setError(null)
    const res = await assignmentsAPI.getAssignment(assignmentId)
    if (res.success) {
      setAssignment(normalizeAssignment(res.data as unknown as RawAssignmentDetail, navCtx))
    } else {
      setError(res.error)
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navCtx.courseSlug, navCtx.courseTitle, navCtx.moduleTitle])

  useEffect(() => {
    if (id) load(id)
  }, [id, load])

  if (!user) return null

async function handleResourceDownload(resourceId: string, resourceTitle: string) {
  if (!assignment) return
  const res = await assignmentsAPI.getResourceDownloadUrl(assignment.id, resourceId)
  if (res.success) {
    const resource = assignment.resources.find((r) => r.id === resourceId)
    await triggerDownload(res.data.download_url, resourceTitle, resource?.file_type ?? '')
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

  // Resubmission is only offered in one case: the trainer explicitly
  // requested a revision. A "fail" grade is terminal, same as a pass —
  // it's just shown with warning styling instead of green.
  //
  // Even a revision request is blocked once the learner has used up their
  // max_attempts (counting only submissions that were actually submitted,
  // not abandoned drafts) — in that case we show an explanatory banner
  // instead of a resubmit button, rather than letting them hit a
  // submitAssignment error deep in the modal.
  const isRevisionRequested = assignment?.status === 'in_progress' && assignment.feedback?.type === 'revision_requested'
  const attemptsExhausted = !!assignment && assignment.max_attempts > 0 && assignment.attempts_used >= assignment.max_attempts
  const showResubmit = isRevisionRequested && !attemptsExhausted
  const showAttemptsExhaustedNotice = isRevisionRequested && attemptsExhausted
  const showStartSubmission = assignment?.status === 'not_started' || showResubmit
  const showAwaitingBanner = assignment?.status === 'in_progress' && !assignment.feedback
  const isFailed = assignment?.status === 'graded' && assignment.grade_status === 'fail'

  const hasPoints = Boolean(assignment?.points)
  const hasWeight = Boolean(assignment?.grade_weight_percent)

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        {loading && (
          <div className="content">
            <div className="state-screen">Loading assignment…</div>
          </div>
        )}
        {error && !loading && (
          <div className="content">
            <div className="state-screen error">{error}</div>
          </div>
        )}

        {!loading && !error && assignment && (
          <>
            <div className="adp-header">
              <div className="crumb-row">
                <button className="crumb-back" onClick={() => navigate(-1)} aria-label="Back">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
                </button>
                <div className="crumb">
                  <BookOpen size={11} />
                  {assignment.course_title && (
                    <>
                      <span
                        className="crumb-link"
                        onClick={() => assignment.course_slug && navigate(RouteBuilder.course(assignment.course_slug))}
                      >
                        {assignment.course_title}
                      </span>
                      <span>›</span>
                    </>
                  )}
                  {assignment.module_title && (
                    <>
                      <span className="crumb-link">{assignment.module_title.split('—')[0].trim()}</span>
                      <span>›</span>
                    </>
                  )}
                  <span className="crumb-current">Assignment</span>
                </div>
              </div>

              <div className="header-title-row">
                <div>
                  <div className="header-title">{assignment.title}</div>
                  {assignment.module_title && <div className="header-sub">{assignment.module_title}</div>}
                </div>
                <div className={`status-pill ${assignment.status}`}>
                  {assignment.status === 'not_started' && <><span style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid #9CA3AF', display: 'inline-block' }} />Not started</>}
                  {assignment.status === 'in_progress' && <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-3-6.7" /><polyline points="21,3 21,9 15,9" /></svg>In progress</>}
                  {assignment.status === 'graded' && <><CheckCircle2 size={12} />Graded</>}
                </div>
              </div>

              <div className="meta-row">
                <span className="meta-item"><Calendar size={12} />{fmtDueDate(assignment.due_at)}</span>
                {hasPoints && <span className="meta-item meta-pts">{assignment.points} pts</span>}
                {hasWeight && <span className="meta-item">· {assignment.grade_weight_percent}% of final grade</span>}
                {assignment.max_attempts > 0 && (
                  <span className="meta-item">· Attempt {Math.min(assignment.attempts_used + (assignment.status === 'not_started' ? 1 : 0), assignment.max_attempts) || assignment.attempts_used} of {assignment.max_attempts}</span>
                )}
              </div>
            </div>

            <div className="content">
              {assignment.status === 'graded' && assignment.feedback && !isFailed && (
                <div className="feedback-card graded">
                  <div className="feedback-top-row">
                    <div className="feedback-head">
                      <div className="feedback-icon graded"><CheckCircle2 size={18} color="#16A34A" /></div>
                      <div>
                        <div className="feedback-label graded">Graded</div>
                        <div className="feedback-title">Well done, {(user.name || '').split(' ')[0] || 'there'}!</div>
                      </div>
                    </div>
                    {typeof assignment.feedback.score === 'number' && (
                      <div className="feedback-score">
                        <div className="feedback-score-num">{assignment.feedback.score}</div>
                        {hasPoints && <div className="feedback-score-denom">/ {assignment.points} pts</div>}
                      </div>
                    )}
                  </div>
                  {assignment.feedback.comment && (
                    <>
                      <div className="feedback-divider" />
                      <div className="feedback-comment graded">&ldquo;{assignment.feedback.comment}&rdquo;</div>
                    </>
                  )}
                  <div className="feedback-byline graded">Graded by {assignment.feedback.grader_name} · {fmtShortDate(assignment.feedback.date)}</div>
                </div>
              )}

              {isFailed && assignment.feedback && (
                <div className="feedback-card revision">
                  <div className="feedback-top-row">
                    <div className="feedback-head">
                      <div className="feedback-icon revision"><AlertTriangle size={18} color="#B45309" /></div>
                      <div>
                        <div className="feedback-label revision">Not passed</div>
                        <div className="feedback-title revision">Review your feedback below</div>
                      </div>
                    </div>
                    {typeof assignment.feedback.score === 'number' && (
                      <div className="feedback-score">
                        <div className="feedback-score-num" style={{ color: '#B45309' }}>{assignment.feedback.score}</div>
                        {hasPoints && <div className="feedback-score-denom">/ {assignment.points} pts</div>}
                      </div>
                    )}
                  </div>
                  {assignment.feedback.comment && (
                    <>
                      <div className="feedback-divider" />
                      <div className="feedback-comment revision">&ldquo;{assignment.feedback.comment}&rdquo;</div>
                    </>
                  )}
                  <div className="feedback-byline revision">Graded by {assignment.feedback.grader_name} · {fmtShortDate(assignment.feedback.date)}</div>
                </div>
              )}

              {isRevisionRequested && assignment.feedback && (
                <div className="feedback-card revision">
                  <div className="feedback-head">
                    <div className="feedback-icon revision"><AlertTriangle size={18} color="#B45309" /></div>
                    <div className="feedback-title revision">Revision requested by {assignment.feedback.grader_name}</div>
                  </div>
                  {assignment.feedback.comment && (
                    <div className="feedback-comment revision">&ldquo;{assignment.feedback.comment}&rdquo;</div>
                  )}
                  <div className="feedback-byline revision">Feedback received · {fmtShortDate(assignment.feedback.date)}</div>
                </div>
              )}

              {showAttemptsExhaustedNotice && (
                <div className="attempts-banner">
                  <span className="attempts-banner-main">You've used all {assignment.max_attempts} of your attempts</span>
                  <span className="attempts-banner-sub">Contact your trainer if you believe you need another attempt on this assignment.</span>
                </div>
              )}

              {showAwaitingBanner && (
                <div className="info-banner">
                  <span className="info-banner-main">Assignment is being graded, kindly check back in 48 hours</span>
                  <span className="info-banner-sub">You can proceed with your learning while you await your grades for this assignment</span>
                </div>
              )}

              <div>
                <div className="section-label" style={{ marginBottom: '0.75rem' }}>Instructions</div>
                <div className="instructions-card">
                  <div className="intro-text">{assignment.instructions.intro}</div>

                  {assignment.instructions.example_image_url && (
                    <div className="example-fig">
                      <img className="example-img" src={assignment.instructions.example_image_url} alt={assignment.instructions.example_image_caption || ''} />
                      {assignment.instructions.example_image_caption && (
                        <div className="example-caption">{assignment.instructions.example_image_caption}</div>
                      )}
                    </div>
                  )}

                  {assignment.instructions.what_youll_do.length > 0 && (
                    <div className="subsection">
                      <h3>What you&apos;ll do</h3>
                      <div className="bullet-list">
                        {assignment.instructions.what_youll_do.map((item, i) => (
                          <div className="bullet-row" key={i}><span className="bullet-dot" />{item}</div>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {assignment.instructions.deliverables.length > 0 && (
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
                  )}

                  {assignment.instructions.grading_criteria.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2B3942', marginBottom: '0.5rem' }}>Grading criteria</h3>
                      <div className="grading-table">
                        {assignment.instructions.grading_criteria.map((g) => (
                          <div className="grading-row" key={g.id}>
                            <span>{g.label}</span>
                            <span>{g.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                            {r.file_type}{r.size_display && ` · ${r.size_display}`}
                            {r.size_tag && <span className="size-tag"> · {r.size_tag}</span>}
                          </div>
                        </div>
                        <button
                          className="resource-download"
                          onClick={() => handleResourceDownload(r.id, r.title)}
                          aria-label={`Download ${r.title}`}
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignment.status === 'not_started' && (
                <div className="resources-section">
                  <div className="section-label">Submission Requirements</div>
                  <div className="req-card">
                    <div className="req-row">
                      <div className="req-icon-wrap"><FileCheck2 size={14} color="#2492EB" /></div>
                      <div className="req-info">
                        <div className="req-label">Accepted file types</div>
                        <div className="req-sub">All deliverables in one upload or separate files</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.accepted_file_types || '—'}</div>
                    </div>
                    <div className="req-row">
                      <div className="req-icon-wrap"><Info size={14} color="#AD46FF" /></div>
                      <div className="req-info">
                        <div className="req-label">Max file size</div>
                        <div className="req-sub">Compress images before uploading if needed</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.max_file_size || '—'}</div>
                    </div>
                    {assignment.submission_requirements.word_count && (
                      <div className="req-row">
                        <div className="req-icon-wrap"><BookMarked size={14} color="#FE9A00" /></div>
                        <div className="req-info">
                          <div className="req-label">Word count</div>
                          <div className="req-sub">Communication plan section only; map and register are template-based</div>
                        </div>
                        <div className="req-value">{assignment.submission_requirements.word_count}</div>
                      </div>
                    )}
                    <div className="req-row">
                      <div className="req-icon-wrap"><FileText size={14} color="#00C950" /></div>
                      <div className="req-info">
                        <div className="req-label">Max files</div>
                        <div className="req-sub">One per deliverable, or combine into a single PDF</div>
                      </div>
                      <div className="req-value">{assignment.submission_requirements.max_files} files</div>
                    </div>
                  </div>
                </div>
              )}

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

              {showStartSubmission && (
                <div className="action-bar">
                  <button className="action-btn start" onClick={() => setModalOpen(true)}>
                    <Upload size={16} />{isRevisionRequested ? 'Revise and resubmit' : 'Start submission'}
                  </button>
                  <span className="action-hint">Your progress is saved automatically — come back any time.</span>
                </div>
              )}
            </div>
          </>
        )}
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