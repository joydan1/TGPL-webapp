// pages/app/trainer/courses/AddCoursePage.tsx
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Upload, Trash2, Plus, Globe, Eye,
  Send, Layers, BookOpen, Award, CheckCircle2, Loader2,
} from 'lucide-react'
import AdminShell from '../../../../layouts/AdminShell'
import TrainerShell from '../../../../layouts/TrainerShell'
import { ROUTES } from '../../../../constants/routes'
import {
  coursesManageAPI,
  trainerAssignmentsAPI,
  type CourseLevel,
  type CreateTrainerAssignmentPayload,
  type TrainerAssignmentDetail,
} from '../../../../services/api'
import AssignmentCreatorModal, {
  type AssignmentDraft,
  buildAssignmentRequirements,
  draftToGradingCriteria,
  draftToMaxAttempts,
} from '../../../../components/AssignmentCreationModal'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import { useConfirm } from '../../../../hooks/useConfirm'
import {
  useVideoUploads,
  useUploadGuard,
  type UploadJob,
} from '../../../../store/videoUploads'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Description' },
  { id: 3, label: 'Curriculum' },
  { id: 4, label: 'Settings' },
  { id: 5, label: 'Review' },
]

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB
const MAX_MATERIAL_BYTES = 500 * 1024 * 1024 // 500 MB
const MAX_COVER_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_AUDIENCE_ITEM_LENGTH = 80

type SubmitOutcome = 'published' | 'updated' | 'unpublished' | 'saved'

// Fields the API returns but the shared types don't declare yet. Move these into
// services/api.ts and these local types can be deleted.
type LessonExtras = { video_url?: string | null; videoUrl?: string | null; is_preview?: boolean }
type AssignmentExtras = { module_id?: string }

type Lesson = {
  id: string
  remoteId: string | null
  title: string
  description: string
  videoFile: File | null
  existingVideoUrl: string | null
  materialFiles: File[] // files picked but not yet uploaded; each is removed as soon as it uploads
  existingMaterialsCount: number
  videoUploaded: boolean // true once the video has been handed to the background upload queue (or already exists on the server)
  assignment: AssignmentDraft | null
  assignmentRemoteId: string | null
  isPreview: boolean
}

type CourseModule = {
  id: string
  remoteId: string | null
  title: string
  savedTitle: string | null
  lessons: Lesson[]
}

type CourseForm = {
  title: string
  subtitle: string
  category: string
  language: string
  level: CourseLevel | ''
  coverImage: File | null
  existingCoverImageUrl: string | null
  description: string
  expectedOutcomes: string[]
  targetAudience: string // raw comma-separated text; parsed into an array on save
  audienceDescription: string
  prerequisites: string[]
  modules: CourseModule[]
  isFree: boolean
  priceNaira: string
  hasCertificate: boolean
  visibility: 'public' | 'hidden'
}

const CATEGORY_OPTIONS = ['Management', 'Leadership', 'Data & Analytics', 'Product', 'Design', 'Engineering']
const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese']
const LEVEL_OPTIONS: { label: string; value: CourseLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
]

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

// Keeps only digits and one decimal point (max 2 decimals). "40,000" -> "40000".
function sanitizePrice(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, '')
  const [whole, ...rest] = cleaned.split('.')
  if (!rest.length) return whole
  return `${whole}.${rest.join('').slice(0, 2)}`
}

// "40000" -> "40,000" (display only; the stored value stays clean)
function formatPrice(raw: string): string {
  if (!raw) return ''
  const [whole, decimals] = raw.split('.')
  const formatted = whole ? Number(whole).toLocaleString('en-NG') : '0'
  return decimals !== undefined ? `${formatted}.${decimals}` : formatted
}

// "Managers, Analysts" -> ['Managers', 'Analysts'] (same format the manage page saves)
function parseAudience(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim().slice(0, MAX_AUDIENCE_ITEM_LENGTH))
    .filter(Boolean)
}

function emptyLesson(): Lesson {
  return {
    id: makeId(),
    remoteId: null,
    title: '',
    description: '',
    videoFile: null,
    existingVideoUrl: null,
    materialFiles: [],
    existingMaterialsCount: 0,
    videoUploaded: false,
    assignment: null,
    assignmentRemoteId: null,
    isPreview: false,
  }
}

function emptyModule(lessonCount = 2): CourseModule {
  return {
    id: makeId(),
    remoteId: null,
    title: '',
    savedTitle: null,
    lessons: Array.from({ length: lessonCount }, () => emptyLesson()),
  }
}

function normalizeAssignmentDraft(detail: TrainerAssignmentDetail | null): AssignmentDraft | null {
  if (!detail) return null

  const gradingCriteria = (detail.grading_criteria ?? []).map((c) => ({
    id: makeId(),
    criterion: c.label,
    description: '',
    points: String(c.max_points ?? 0),
  }))

  const fileTypes = detail.requirements?.length
    ? Array.from(new Set(detail.requirements.flatMap((req) =>
        (req.allowed_file_types || []).map((type) => type.trim().toLowerCase()).filter(Boolean)
      )))
    : ['pdf', 'docx']

  const requirementDrafts = (detail.requirements ?? []).length
    ? detail.requirements!.map((req, index) => {
        const normalizedTypes = Array.from(
          new Set((req.allowed_file_types || []).map((type) => type.trim().toLowerCase()).filter(Boolean))
        )
        return {
          id: makeId(),
          label: req.label || `Submission file ${index + 1}`,
          allowedFileTypes: normalizedTypes.length ? normalizedTypes : fileTypes,
          maxBytesMb: String(Math.max(1, Math.round((req.max_bytes || 20 * 1024 * 1024) / (1024 * 1024)))),
          required: req.required,
          namingHint: req.naming_hint || 'Use your name and assignment title in the filename.',
        }
      })
    : [{
        id: makeId(),
        label: detail.title || 'Submission file',
        allowedFileTypes: fileTypes,
        maxBytesMb: '20',
        required: true,
        namingHint: 'Use your name and assignment title in the filename.',
      }]

  return {
    title: detail.title ?? '',
    description: '',
    instructions: detail.instructions ?? '',
    maxAttempts: String(detail.max_attempts ?? 1),
    coverImages: [],
    whatYoullDo: [''],
    scenarios: [''],
    deliverables: [''],
    gradingCriteria: gradingCriteria.length ? gradingCriteria : [{ id: makeId(), criterion: '', description: '', points: '' }],
    resources: [],
    wordCountMin: '',
    wordCountMax: '',
    acceptedFileTypes: fileTypes,
    requirements: requirementDrafts,
  }
}

// Finds the saved assignment that belongs to a lesson. There is NO fallback to "the first
// assignment in the module": a lesson with no match gets no assignment, and an assignment
// that has already been given to one lesson (`claimed`) can't be given to another.
function findSavedAssignment(
  moduleAssignments: TrainerAssignmentDetail[],
  lessonTitle: string | undefined,
  claimed: Set<string>,
): TrainerAssignmentDetail | null {
  const title = lessonTitle?.trim().toLowerCase() ?? ''
  if (!title) return null

  const available = moduleAssignments.filter((a) => !claimed.has(a.id))
  const norm = (a: TrainerAssignmentDetail) => a.title?.trim().toLowerCase() ?? ''

  return (
    available.find((a) => norm(a) === title) ??
    available.find((a) => norm(a).includes(title)) ??
    null
  )
}

const initialForm: CourseForm = {
  title: '',
  subtitle: '',
  category: '',
  language: '',
  level: '',
  coverImage: null,
  existingCoverImageUrl: null,
  description: '',
  expectedOutcomes: ['', ''],
  targetAudience: '',
  audienceDescription: '',
  prerequisites: [''],
  modules: [emptyModule()],
  isFree: false,
  priceNaira: '',
  hasCertificate: true,
  visibility: 'public',
}

const PAGE_CSS = `
  .ac-page { padding: 1rem; background: #F5F5F5; }
  .ac-card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; overflow: hidden; }

  .ac-spin { animation: ac-spin 1s linear infinite; }
  @keyframes ac-spin { to { transform: rotate(360deg); } }

  .ac-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; border-bottom: 1px solid #F3F4F6; }
  .ac-back-btn { background: none; border: none; cursor: pointer; color: #111; display: flex; align-items: center; padding: 0.25rem; }
  .ac-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827; }

  .ac-stepper { display: flex; align-items: center; padding: 1.25rem 1.25rem 0; overflow-x: auto; gap: 0; }
  .ac-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex-shrink: 0; min-width: 64px; }
  button.ac-step { border: none; padding: 0; background: none; font: inherit; cursor: pointer; }
  button.ac-step:disabled { cursor: default; }
  .ac-step-circle { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; background: #E5E7EB; color: #6B7280; flex-shrink: 0; }
  .ac-step-circle.active { background: #2492EB; color: #fff; }
  .ac-step-circle.done { background: #2492EB; color: #fff; }
  .ac-step-label { font-size: 0.7rem; font-weight: 600; color: #9CA3AF; white-space: nowrap; }
  .ac-step-label.active, .ac-step-label.done { color: #2492EB; }
  .ac-step-line { height: 2px; background: #E5E7EB; flex: 1; margin: 0 0.4rem; min-width: 20px; align-self: flex-start; margin-top: 16px; }
  .ac-step-line.done { background: #2492EB; }

  .ac-body { padding: 1.25rem; }
  .ac-section-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: #111827; }
  .ac-section-sub { margin: 0.4rem 0 1.25rem; color: #6B7280; font-size: 0.875rem; }

  .ac-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.1rem; font-size: 0.85rem; }
  .ac-notice { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E3A8A; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.1rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
  .ac-notice.warn { background: #FEF2F2; border-color: #FECACA; color: #B91C1C; }
  .ac-notice-btn { background: none; border: none; padding: 0; color: inherit; font-weight: 700; font-size: 0.85rem; text-decoration: underline; cursor: pointer; }

  .ac-grid { display: grid; grid-template-columns: 1fr; gap: 1.1rem; }
  .ac-field { display: grid; gap: 0.5rem; }
  .ac-label { font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-required { color: #EF4444; }
  .ac-input, .ac-select, .ac-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9rem; color: #111; background: #fff; }
  .ac-textarea { resize: vertical; min-height: 120px; font-family: inherit; }
  .ac-hint { margin: 0; color: #9CA3AF; font-size: 0.78rem; }

  .ac-price-wrap { position: relative; }
  .ac-price-prefix { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #6B7280; font-weight: 700; font-size: 0.9rem; pointer-events: none; }
  .ac-price-wrap .ac-input { padding-left: 2.1rem; }

  .ac-upload-box { border: 2px dashed #D1D5DB; border-radius: 1rem; min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; color: #6B7280; cursor: pointer; text-align: center; padding: 1.5rem; }
  .ac-upload-box:hover { background: #FAFAFA; }
  .ac-upload-label { font-weight: 700; color: #374151; }

  .ac-list-item { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.65rem; }
  .ac-list-dot { width: 8px; height: 8px; border-radius: 999px; background: #2492EB; flex-shrink: 0; }
  .ac-list-input { flex: 1; }
  .ac-list-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-add-item-btn { background: none; border: none; color: #2492EB; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; padding: 0.25rem 0; }

  .ac-module-card { border: 1px solid #BFDBFE; border-radius: 1rem; margin-bottom: 1.25rem; overflow: hidden; background: #fff; }
  .ac-module-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.95rem 1rem; background: #EFF6FF; border-bottom: 1px solid #BFDBFE; }
  .ac-module-badge { flex-shrink: 0; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #fff; background: #2492EB; border-radius: 999px; padding: 0.3rem 0.7rem; white-space: nowrap; }
  .ac-module-title-input { flex: 1; min-width: 0; border: 1px solid transparent; background: #fff; border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-size: 0.95rem; font-weight: 700; color: #111827; outline: none; }
  .ac-module-title-input:focus { border-color: #2492EB; }
  .ac-module-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-module-delete:disabled { opacity: 0.4; cursor: not-allowed; }
  .ac-module-body { padding: 1rem; }
  .ac-module-count { margin: 0 0 0.85rem; color: #6B7280; font-size: 0.8rem; }
  .ac-module-add-lesson { width: 100%; border: 2px dashed #D1D5DB; border-radius: 0.85rem; padding: 0.8rem; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
  .ac-add-module-btn { width: 100%; border: 2px dashed #2492EB; border-radius: 1rem; padding: 1rem; background: #F8FBFF; color: #2492EB; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

  .ac-lesson-card { border: 1px solid #E5E7EB; border-radius: 1rem; margin-bottom: 1rem; overflow: hidden; }
  .ac-lesson-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem; }
  .ac-lesson-num { width: 26px; height: 26px; border-radius: 999px; background: #EFF6FF; color: #2492EB; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-lesson-title-input { flex: 1; border: none; background: none; font-size: 0.95rem; color: #111; outline: none; }
  .ac-lesson-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-lesson-desc-wrap { padding: 0 1rem 0.85rem; }
  .ac-lesson-desc { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.6rem 0.75rem; font-size: 0.85rem; font-family: inherit; resize: vertical; min-height: 70px; color: #111; }
  .ac-lesson-uploads { padding: 0 1rem 1rem; display: grid; gap: 0.75rem; }
  .ac-upload-chip { display: flex; align-items: center; gap: 0.75rem; border: 1px dashed #93C5FD; background: #EFF6FF; border-radius: 0.85rem; padding: 0.85rem 1rem; cursor: pointer; }
  .ac-upload-chip.busy { cursor: default; }
  .ac-upload-chip.failed { border-color: #FCA5A5; background: #FEF2F2; cursor: default; }
  .ac-upload-chip-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #DBEAFE; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-upload-chip.failed .ac-upload-chip-icon { background: #FEE2E2; color: #B91C1C; }
  .ac-upload-chip-body { flex: 1; min-width: 0; }
  .ac-upload-chip-label { font-weight: 700; color: #2492EB; font-size: 0.875rem; }
  .ac-upload-chip.failed .ac-upload-chip-label { color: #B91C1C; }
  .ac-upload-chip-sub { margin: 0.1rem 0 0; color: #6B7280; font-size: 0.75rem; }
  .ac-upload-progress { height: 5px; background: #DBEAFE; border-radius: 999px; overflow: hidden; margin-top: 0.5rem; }
  .ac-upload-progress-fill { height: 100%; background: #2492EB; transition: width 0.2s; }
  .ac-chip-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }
  .ac-chip-btn { background: none; border: none; padding: 0; font-weight: 700; font-size: 0.78rem; color: #2492EB; cursor: pointer; }
  .ac-upload-chip.failed .ac-chip-btn { color: #B91C1C; }

  .ac-insert-assignment-btn { border: none; background: #2492EB; color: #FFFFFF; font-family: 'Sora', inherit; font-weight: 600; font-size: 12px; line-height: 18px; padding: 6px 16px; border-radius: 8px; cursor: pointer; justify-self: start; align-self: flex-start; white-space: nowrap; width: fit-content; }
  .ac-insert-assignment-btn:hover { opacity: 0.92; }
  .ac-assignment-status { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ac-assignment-added { display: flex; align-items: center; gap: 4px; color: #616873; font-family: 'Sora', inherit; font-weight: 500; font-size: 12px; line-height: 18px; }
  .ac-assignment-added svg { color: #616873; }
  .ac-assignment-preview-link { border: none; background: none; color: #2492EB; font-family: 'Sora', inherit; font-weight: 500; font-size: 12px; line-height: 18px; text-decoration: underline; cursor: pointer; padding: 0; }

  .ac-preview-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.75rem 1rem; }
  .ac-preview-toggle-text { display: flex; flex-direction: column; gap: 0.1rem; }
  .ac-preview-toggle-title { font-weight: 700; color: #111827; font-size: 0.85rem; }
  .ac-preview-toggle-sub { color: #6B7280; font-size: 0.75rem; }

  .ac-settings-card { border: 1px solid #E5E7EB; border-radius: 1rem; margin-bottom: 1.1rem; overflow: hidden; }
  .ac-settings-section-title { padding: 1.1rem 1.25rem 0.5rem; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .ac-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .ac-toggle-row:first-of-type { border-top: none; }
  .ac-toggle-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-toggle-sub { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .ac-price-block { padding: 0 1.25rem 1.1rem; }

  .toggle { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle .track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; transition: background 0.15s; cursor: pointer; }
  .toggle .track::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.15s; }
  .toggle input:checked + .track { background: #2492EB; }
  .toggle input:checked + .track::before { transform: translateX(18px); }
  .toggle input:focus-visible + .track { outline: 2px solid #2492EB; outline-offset: 2px; }

  .ac-visibility-option { display: flex; align-items: center; gap: 0.85rem; width: 100%; box-sizing: border-box; text-align: left; font: inherit; color: inherit; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1rem 1.1rem; margin-bottom: 0.75rem; cursor: pointer; }
  .ac-visibility-option:focus-visible { outline: 2px solid #2492EB; outline-offset: 2px; }
  .ac-visibility-option.selected { border-color: #2492EB; background: #EFF6FF; }
  .ac-visibility-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #6B7280; flex-shrink: 0; }
  .ac-visibility-option.selected .ac-visibility-icon { background: #DBEAFE; color: #2492EB; }
  .ac-visibility-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-visibility-sub { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .ac-visibility-check { margin-left: auto; color: #2492EB; flex-shrink: 0; }

  .ac-preview-player { border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; margin-bottom: 1.25rem; }
  .ac-preview-cover-wrap { position: relative; }
  .ac-preview-cover { width: 100%; aspect-ratio: 16 / 9; display: block; object-fit: cover; background: #F3F4F6; }
  .ac-preview-cover-note { position: absolute; left: 0.75rem; bottom: 0.75rem; background: rgba(17,24,39,0.7); color: #fff; font-size: 0.75rem; padding: 0.35rem 0.7rem; border-radius: 999px; }
  .ac-preview-video-real { width: 100%; aspect-ratio: 16 / 9; display: block; background: #111; }
  .ac-preview-video { position: relative; background: #111; aspect-ratio: 16 / 9; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; color: #fff; background-image: linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)); background-size: cover; background-position: center; }
  .ac-preview-video-empty { justify-content: flex-start; color: #D1D5DB; }
  .ac-preview-video-empty .ac-preview-video-title { color: #fff; }
  .ac-preview-video-empty .ac-preview-video-sub { color: #9CA3AF; }
  .ac-preview-video-topbar { display: flex; align-items: center; gap: 0.75rem; }
  .ac-preview-video-title { font-weight: 700; font-size: 0.9rem; }
  .ac-preview-video-sub { font-size: 0.75rem; opacity: 0.85; margin-top: 0.15rem; }

  .ac-preview-info { padding: 1.1rem 1.25rem; }
  .ac-preview-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2492EB; font-weight: 700; }
  .ac-preview-title { margin: 0.3rem 0 0; font-size: 1.15rem; font-weight: 700; color: #111827; }
  .ac-preview-sub { margin: 0.35rem 0 0; color: #6B7280; font-size: 0.875rem; }
  .ac-preview-badges { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.85rem; }
  .ac-preview-badge { display: flex; align-items: center; gap: 0.35rem; color: #6B7280; font-size: 0.8rem; }

  .ac-review-table { border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; margin-bottom: 1.25rem; }
  .ac-review-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.95rem 1.1rem; border-top: 1px solid #F3F4F6; }
  .ac-review-row:first-child { border-top: none; }
  .ac-review-row-label { color: #6B7280; font-size: 0.875rem; }
  .ac-review-row-value { color: #111827; font-weight: 700; font-size: 0.9rem; text-align: right; }

  .ac-outcomes-box { border: 1px solid #BFDBFE; background: #EFF6FF; border-radius: 1rem; padding: 1.1rem 1.25rem; }
  .ac-outcomes-title { margin: 0 0 0.75rem; color: #2492EB; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .ac-outcome-item { display: flex; align-items: center; gap: 0.6rem; color: #1E3A8A; font-size: 0.875rem; margin-bottom: 0.5rem; }
  .ac-outcome-item svg { color: #2492EB; flex-shrink: 0; }

  .ac-review-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
  .ac-btn.full { width: 100%; }

  .ac-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 1.25rem; z-index: 500; }
  .ac-modal { background: #fff; border-radius: 1.25rem; padding: 2rem 1.5rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
  .ac-modal-icon { width: 72px; height: 72px; border-radius: 999px; background: #D1FAE5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
  .ac-modal-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .ac-modal-sub { margin: 0.6rem 0 1.5rem; color: #6B7280; font-size: 0.9rem; }
  .ac-modal-actions { display: grid; gap: 0.75rem; }

  .ac-footer { display: flex; flex-direction: column-reverse; gap: 0.75rem; padding: 1.1rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .ac-btn { border-radius: 999px; padding: 0.9rem 1.4rem; font-weight: 700; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; width: 100%; }
  .ac-btn.primary { background: #2492EB; color: #fff; border: none; }
  .ac-btn.secondary { background: #fff; color: #2492EB; border: 1px solid #2492EB; }
  .ac-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (min-width: 640px) {
    .ac-page { padding: 1.5rem; }
    .ac-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ac-grid .ac-field.full { grid-column: 1 / -1; }
    .ac-footer { flex-direction: row; justify-content: space-between; }
    .ac-btn { width: auto; }
    .ac-review-actions { flex-direction: row-reverse; justify-content: flex-start; }
    .ac-btn.full { width: auto; }
    .ac-modal-actions .ac-btn.full { width: 100%; }
  }

  @media (min-width: 1024px) {
    .ac-page { padding: 1.5rem 2rem 2rem; }
  }
`

const SUBMIT_COPY: Record<SubmitOutcome, { title: string; sub: string }> = {
  published: { title: 'Course published', sub: 'Your course is now live in the catalogue.' },
  updated: { title: 'Changes saved', sub: 'Your course is live and your changes are saved.' },
  unpublished: { title: 'Course hidden', sub: 'Your course is no longer listed. You can publish it again any time.' },
  saved: { title: 'Course saved', sub: 'Your course is saved as hidden. You can publish it any time from your courses list.' },
}

// ─── Video upload chip (idle / busy / failed states) ─────────────────────────

function VideoUploadChip({
  lesson,
  job,
  onPick,
  onCancel,
  onRetry,
}: {
  lesson: Lesson
  job: UploadJob | undefined
  onPick: (file: File | null) => void
  onCancel: () => void
  onRetry: () => void
}) {
  if (job && (job.status === 'queued' || job.status === 'uploading')) {
    return (
      <div className="ac-upload-chip busy">
        <div className="ac-upload-chip-icon"><Loader2 size={16} className="ac-spin" /></div>
        <div className="ac-upload-chip-body">
          <div className="ac-upload-chip-label">
            {job.status === 'queued' ? 'Waiting to upload…' : `Uploading video… ${job.progress}%`}
          </div>
          <p className="ac-upload-chip-sub">
            {job.note ?? 'You can keep going — this uploads in the background.'}
          </p>
          <div className="ac-upload-progress">
            <div className="ac-upload-progress-fill" style={{ width: `${job.progress}%` }} />
          </div>
        </div>
        <div className="ac-chip-actions">
          <button type="button" className="ac-chip-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  if (job && job.status === 'error') {
    return (
      <div className="ac-upload-chip failed">
        <div className="ac-upload-chip-icon"><Upload size={16} /></div>
        <div className="ac-upload-chip-body">
          <div className="ac-upload-chip-label">Video upload failed</div>
          <p className="ac-upload-chip-sub">{job.error || 'Something went wrong.'}</p>
        </div>
        <div className="ac-chip-actions">
          <button type="button" className="ac-chip-btn" onClick={onRetry}>Retry</button>
          <button type="button" className="ac-chip-btn" onClick={onCancel}>Remove</button>
        </div>
      </div>
    )
  }

  // A file the trainer just picked always wins over an older finished job or saved URL,
  // so replacing a video shows the new file name instead of "Video uploaded".
  const hasNewFile = Boolean(lesson.videoFile)
  const uploadedLabel = !hasNewFile && (job?.status === 'done' || Boolean(lesson.existingVideoUrl))

  return (
    <label className="ac-upload-chip">
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        style={{ display: 'none' }}
        onChange={(e) => {
          onPick(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />
      <div className="ac-upload-chip-icon"><Upload size={16} /></div>
      <div>
        <div className="ac-upload-chip-label">
          {hasNewFile
            ? lesson.videoFile!.name
            : uploadedLabel
              ? 'Video uploaded — tap to replace'
              : 'Upload video'}
        </div>
        <p className="ac-upload-chip-sub">
          {hasNewFile
            ? 'Uploads in the background when you continue'
            : 'MP4, MOV, or WebM · max 2 GB'}
        </p>
      </div>
    </label>
  )
}

export default function AddCoursePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const isAdmin = location.pathname.startsWith('/admin')
  const Shell = isAdmin ? AdminShell : TrainerShell
  const coursesListRoute = isAdmin ? '/admin/courses' : ROUTES.TRAINER_COURSES
  const dashboardRoute = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.TRAINER_DASHBOARD

  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<CourseForm>(initialForm)
  const [submitOutcome, setSubmitOutcome] = useState<SubmitOutcome | null>(null)

  const [courseId, setCourseId] = useState<string | null>(id ?? null)
  const [courseSlug, setCourseSlug] = useState<string | null>(null)
  // Current status on the server. null until the course exists / has loaded.
  const [courseStatus, setCourseStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [loading, setLoading] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [assignmentTarget, setAssignmentTarget] = useState<{ moduleId: string; lessonId: string } | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // ── Background video uploads (global store) ──
  useUploadGuard()
  const uploadJobs = useVideoUploads((s) => s.jobs)
  const enqueueVideo = useVideoUploads((s) => s.enqueue)
  const cancelVideo = useVideoUploads((s) => s.cancel)
  const retryVideo = useVideoUploads((s) => s.retry)

  const isLive = courseStatus === 'published'
  const pendingUploads = Object.values(uploadJobs).filter((j) => j.courseId === courseId && j.status !== 'done')
  const failedUploads = pendingUploads.filter((j) => j.status === 'error')
  const publishBlocked = form.visibility === 'public' && pendingUploads.length > 0

  const allLessons = form.modules.flatMap((m) => m.lessons)
  const previewLesson = allLessons.find((l) => l.videoFile) ?? allLessons.find((l) => l.existingVideoUrl)
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null)
  const [previewCoverSrc, setPreviewCoverSrc] = useState<string | null>(null)

  // Scroll back to the top of the card whenever the step changes.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step])

  useEffect(() => {
    if (previewLesson?.videoFile) {
      const objectUrl = URL.createObjectURL(previewLesson.videoFile)
      setPreviewVideoSrc(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    if (previewLesson?.existingVideoUrl) {
      setPreviewVideoSrc(previewLesson.existingVideoUrl)
      return
    }
    setPreviewVideoSrc(null)
    return
  }, [previewLesson?.videoFile, previewLesson?.existingVideoUrl])

  useEffect(() => {
    if (form.coverImage) {
      const objectUrl = URL.createObjectURL(form.coverImage)
      setPreviewCoverSrc(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    setPreviewCoverSrc(form.existingCoverImageUrl)
    return
  }, [form.coverImage, form.existingCoverImageUrl])

  // When a background upload finishes, swap the local file for the server URL.
  useEffect(() => {
    form.modules.forEach((mod) =>
      mod.lessons.forEach((lesson) => {
        const job = lesson.remoteId ? uploadJobs[lesson.remoteId] : undefined
        if (job?.status === 'done' && job.url && lesson.existingVideoUrl !== job.url) {
          updateLesson(mod.id, lesson.id, { existingVideoUrl: job.url, videoFile: null })
        }
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadJobs])

  // Edit mode: load the existing course + curriculum and pre-fill every step.
  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setLoadError(null)

      const [draftRes, curriculumRes] = await Promise.all([
        coursesManageAPI.getDraft(id as string),
        coursesManageAPI.getCurriculum(id as string),
      ])

      if (cancelled) return

      if (!draftRes.success) {
        setLoadError(draftRes.error || 'Failed to load this course.')
        setLoading(false)
        return
      }

      const draft = draftRes.data

      const curriculumModules = curriculumRes.success ? curriculumRes.data : []
      const curriculumLessons = curriculumModules.flatMap((mod) =>
        mod.lessons.map((lesson) => ({ ...lesson, moduleId: mod.id })),
      )

      const lessonDetailResults = await Promise.all(
        curriculumLessons.map((lesson) => coursesManageAPI.getLesson(lesson.id)),
      )

      if (cancelled) return

      const assignmentsByModule = new Map<string, TrainerAssignmentDetail[]>()
      if (draft.slug) {
        const assignmentsRes = await trainerAssignmentsAPI.list(draft.slug)
        if (assignmentsRes.success) {
          const assignmentDetails = await Promise.all(
            assignmentsRes.data.map((assignment) => trainerAssignmentsAPI.get(draft.slug, assignment.id)),
          )

          assignmentDetails.forEach((result) => {
            if (!result.success) return
            const detail = result.data as TrainerAssignmentDetail & AssignmentExtras
            const assignmentModuleId = detail.module?.id ?? detail.module_id ?? null
            if (!assignmentModuleId) return
            const existing = assignmentsByModule.get(assignmentModuleId) ?? []
            assignmentsByModule.set(assignmentModuleId, [...existing, detail])
          })
        }
      }

      const prefilledModules: CourseModule[] = curriculumModules.map((mod) => {
        const moduleAssignments = assignmentsByModule.get(mod.id) ?? []
        // Each assignment can be attached to at most one lesson.
        const claimedAssignments = new Set<string>()

        const lessons: Lesson[] = mod.lessons.map((lesson) => {
          const detailRes = lessonDetailResults.find((result) => result.success && result.data.id === lesson.id)
          const detail = detailRes?.success ? detailRes.data : null

          const savedAssignment = findSavedAssignment(moduleAssignments, lesson.title, claimedAssignments)
          if (savedAssignment) claimedAssignments.add(savedAssignment.id)
          const loadedAssignment = savedAssignment ? normalizeAssignmentDraft(savedAssignment) : null

          const lessonX = lesson as typeof lesson & LessonExtras
          const detailX = detail as (typeof detail & LessonExtras) | null
          const rawVideoUrl =
            lessonX.video_url ?? lessonX.videoUrl ?? detailX?.video_url ?? detailX?.videoUrl ?? null
          const rawIsPreview = lessonX.is_preview ?? detailX?.is_preview ?? false

          return {
            id: makeId(),
            remoteId: lesson.id,
            title: lesson.title ?? '',
            description: detail?.body ?? '',
            videoFile: null,
            existingVideoUrl: rawVideoUrl,
            materialFiles: [],
            existingMaterialsCount: detail?.resource_keys?.length ?? 0,
            videoUploaded: !!rawVideoUrl,
            assignment: loadedAssignment,
            assignmentRemoteId: savedAssignment?.id ?? null,
            isPreview: Boolean(rawIsPreview),
          }
        })

        return {
          id: makeId(),
          remoteId: mod.id,
          title: mod.title ?? '',
          savedTitle: mod.title ?? '',
          lessons: lessons.length ? lessons : [emptyLesson()],
        }
      })

      setForm((f) => ({
        ...f,
        title: draft.title ?? '',
        subtitle: draft.subtitle ?? '',
        category: draft.category ?? '',
        language: draft.language ?? '',
        level: draft.level ?? '',
        coverImage: null,
        existingCoverImageUrl: draft.cover_image_url ?? (draft as typeof draft & { thumbnail_url?: string | null }).thumbnail_url ?? null,
        description: draft.description ?? '',
        expectedOutcomes: draft.expected_outcomes?.length ? draft.expected_outcomes.slice(0, 8) : ['', ''],
        // Every audience item is kept, not just the first.
        targetAudience: (draft.target_audience ?? []).join(', '),
        audienceDescription: draft.audience_description ?? '',
        prerequisites: draft.prerequisites?.length ? draft.prerequisites.slice(0, 8) : [''],
        modules: prefilledModules.length ? prefilledModules : [emptyModule()],
        isFree: draft.is_free ?? false,
        priceNaira: draft.price_kobo ? String(draft.price_kobo / 100) : '',
        hasCertificate: draft.has_certificate ?? true,
        visibility: draft.status === 'published' ? 'public' : 'hidden',
      }))

      setCourseId(id as string)
      setCourseSlug(draft.slug ?? null)
      setCourseStatus(draft.status ?? null)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  function update<K extends keyof CourseForm>(key: K, value: CourseForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function goBack() {
    if (step === 1) {
      navigate(coursesListRoute)
      return
    }
    setStep((s) => (s - 1) as Step)
  }

  // Steps save when you press Continue, so you can only jump back — never skip ahead
  // past a step that hasn't been saved.
  function goToStep(target: Step) {
    if (target < step && !saving) setStep(target)
  }

  // ---------- Cover image ----------
  function handleCoverPick(file: File | null) {
    if (!file) return
    if (file.size > MAX_COVER_BYTES) {
      setSaveError(`"${file.name}" is larger than 5 MB. Please choose a smaller image.`)
      return
    }
    setSaveError(null)
    setForm((f) => ({ ...f, coverImage: file }))
  }

  async function saveBasicsAndContinue() {
    setSaveError(null)

    if (!form.title.trim()) return setSaveError('Enter a course title to continue.')
    if (!form.category) return setSaveError('Choose a category to continue.')
    if (!form.level) return setSaveError('Choose a level to continue.')

    setSaving(true)

    const basics = {
      title: form.title.trim(),
      subtitle: form.subtitle,
      category: form.category,
      language: form.language,
      level: form.level || undefined,
    }

    let activeCourseId = courseId
    if (!activeCourseId) {
      const result = await coursesManageAPI.createDraft(basics)
      if (!result.success) {
        setSaveError(result.error || 'Failed to save course basics.')
        setSaving(false)
        return
      }
      activeCourseId = result.data.id
      setCourseId(activeCourseId)
      setCourseSlug(result.data.slug)
      setCourseStatus(result.data.status ?? 'draft')
    } else {
      const result = await coursesManageAPI.updateDraft(activeCourseId, basics)
      if (!result.success) {
        setSaveError(result.error || 'Failed to save course basics.')
        setSaving(false)
        return
      }
      if (result.data.slug) setCourseSlug(result.data.slug)
    }

    if (form.coverImage) {
      const coverResult = await coursesManageAPI.uploadCourseImage(activeCourseId, form.coverImage, 'cover')
      if (!coverResult.success) {
        setSaveError(coverResult.error || 'Failed to upload cover image.')
        setSaving(false)
        return
      }

      const thumbResult = await coursesManageAPI.uploadCourseImage(activeCourseId, form.coverImage, 'thumbnail')
      if (!thumbResult.success) {
        setSaveError(thumbResult.error || 'Failed to upload thumbnail image.')
        setSaving(false)
        return
      }

      setForm((f) => ({
        ...f,
        coverImage: null,
        existingCoverImageUrl: coverResult.data.cover_image_url ?? f.existingCoverImageUrl,
      }))
    }

    setSaving(false)
    setStep(2)
  }

  async function saveDescriptionAndContinue() {
    if (!courseId) return
    setSaveError(null)

    if (!form.description.trim()) return setSaveError('Add a course description to continue.')
    if (!form.expectedOutcomes.some((i) => i.trim())) {
      return setSaveError('Add at least one thing learners will learn.')
    }

    setSaving(true)

    const result = await coursesManageAPI.updateDraft(courseId, {
      description: form.description,
      expected_outcomes: form.expectedOutcomes.filter((i) => i.trim()),
      target_audience: parseAudience(form.targetAudience),
      audience_description: form.audienceDescription,
      prerequisites: form.prerequisites.filter((i) => i.trim()),
    })

    setSaving(false)
    if (!result.success) {
      setSaveError(result.error || 'Failed to save the description.')
      return
    }
    setStep(3)
  }

  async function saveCurriculumAndContinue() {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)

    // ---- Validate everything up front, before any network call ----
    const totalTitledLessons = form.modules.reduce(
      (sum, mod) => sum + mod.lessons.filter((l) => l.title.trim()).length,
      0,
    )
    if (totalTitledLessons === 0) {
      setSaveError('Add a lesson title before continuing. Empty lesson cards are not saved.')
      setSaving(false)
      return
    }

    for (let m = 0; m < form.modules.length; m++) {
      const mod = form.modules[m]
      const hasTitledLessons = mod.lessons.some((l) => l.title.trim())
      if (hasTitledLessons && !mod.title.trim()) {
        setSaveError(`Give Module ${m + 1} a title before continuing.`)
        setSaving(false)
        return
      }
    }

    // ---- Save module by module, in order ----
    for (let m = 0; m < form.modules.length; m++) {
      const mod = form.modules[m]
      const titledLessons = mod.lessons.filter((l) => l.title.trim())

      if (!mod.title.trim() && titledLessons.length === 0) continue

      let activeModuleId = mod.remoteId
      const trimmedModuleTitle = mod.title.trim()

      if (!activeModuleId) {
        const moduleResult = await coursesManageAPI.createModule(courseId, trimmedModuleTitle)
        if (!moduleResult.success) {
          setSaveError(moduleResult.error || `Failed to create "${trimmedModuleTitle}".`)
          setSaving(false)
          return
        }
        activeModuleId = moduleResult.data.id
        updateModule(mod.id, { remoteId: activeModuleId, savedTitle: trimmedModuleTitle })
      } else if (trimmedModuleTitle !== (mod.savedTitle ?? '')) {
        const renameResult = await coursesManageAPI.updateModule(activeModuleId, { title: trimmedModuleTitle })
        if (!renameResult.success) {
          setSaveError(renameResult.error || `Failed to rename module to "${trimmedModuleTitle}".`)
          setSaving(false)
          return
        }
        updateModule(mod.id, { savedTitle: trimmedModuleTitle })
      }

      for (let i = 0; i < mod.lessons.length; i++) {
        const lesson = mod.lessons[i]
        if (!lesson.title.trim()) continue

        let remoteId = lesson.remoteId

        if (!remoteId) {
          const lessonResult = await coursesManageAPI.createLesson(activeModuleId, lesson.title)
          if (!lessonResult.success) {
            setSaveError(lessonResult.error || `Failed to create lesson "${lesson.title}".`)
            setSaving(false)
            return
          }
          remoteId = lessonResult.data.id
          // Remember the server id straight away so a later failure + retry can't create a duplicate lesson.
          updateLesson(mod.id, lesson.id, { remoteId })

          if (lesson.description.trim() || lesson.isPreview) {
            const bodyResult = await coursesManageAPI.updateLesson(remoteId, {
              body: lesson.description,
              is_preview: lesson.isPreview,
            })
            if (!bodyResult.success) {
              setSaveError(bodyResult.error || `Failed to save description for "${lesson.title}".`)
              setSaving(false)
              return
            }
          }
        } else {
          const updateResult = await coursesManageAPI.updateLesson(remoteId, {
            title: lesson.title,
            body: lesson.description,
            is_preview: lesson.isPreview,
          })
          if (!updateResult.success) {
            setSaveError(updateResult.error || `Failed to update lesson "${lesson.title}".`)
            setSaving(false)
            return
          }
        }

        // Videos are handed to the background queue — we don't wait for them here.
        if (lesson.videoFile && !lesson.videoUploaded) {
          enqueueVideo({
            key: remoteId,
            courseId,
            lessonTitle: lesson.title,
            file: lesson.videoFile,
          })
        }

        // Materials upload one at a time and each file is dropped from the pending list as soon
        // as it succeeds, so a retry after a failure never re-uploads files that already went through.
        if (lesson.materialFiles.length > 0) {
          let remainingFiles = [...lesson.materialFiles]
          let materialsCount = lesson.existingMaterialsCount

          for (const file of lesson.materialFiles) {
            const uploadResult = await coursesManageAPI.uploadFile(file, 'lesson_resource', {
              lesson_id: remoteId,
            })
            if (!uploadResult.success) {
              setSaveError(uploadResult.error || `Failed to upload "${file.name}".`)
              setSaving(false)
              return
            }
            remainingFiles = remainingFiles.filter((f) => f !== file)
            materialsCount += 1
            updateLesson(mod.id, lesson.id, {
              materialFiles: remainingFiles,
              existingMaterialsCount: materialsCount,
            })
          }
        }

        let assignmentRemoteId = lesson.assignmentRemoteId
        const isNewAssignment = !assignmentRemoteId

        if (lesson.assignment) {
          if (!courseSlug) {
            setSaveError('Missing course reference — please reload the page and try again.')
            setSaving(false)
            return
          }

          const payload: CreateTrainerAssignmentPayload = {
            module_id: activeModuleId,
            title: lesson.assignment.title,
            instructions: lesson.assignment.instructions,
            max_attempts: draftToMaxAttempts(lesson.assignment),
            grading_criteria: draftToGradingCriteria(lesson.assignment),
            order: i + 1,
          }

          const assignmentResult = assignmentRemoteId
            ? await trainerAssignmentsAPI.update(courseSlug, assignmentRemoteId, payload)
            : await trainerAssignmentsAPI.create(courseSlug, payload)

          if (!assignmentResult.success) {
            setSaveError(assignmentResult.error || `Failed to save the assignment for "${lesson.title}".`)
            setSaving(false)
            return
          }

          assignmentRemoteId = assignmentResult.data.id
          // Same reason as the lesson id above: don't create the assignment twice on retry.
          updateLesson(mod.id, lesson.id, { assignmentRemoteId })

          let shouldCreateRequirements = isNewAssignment
          if (!isNewAssignment) {
            const existingReqs = await trainerAssignmentsAPI.listRequirements(courseSlug, assignmentRemoteId)
            shouldCreateRequirements = existingReqs.success && existingReqs.data.length === 0
          }

          if (shouldCreateRequirements) {
            const requirementPayloads = buildAssignmentRequirements(lesson.assignment)
            for (const reqPayload of requirementPayloads) {
              const reqResult = await trainerAssignmentsAPI.createRequirement(courseSlug, assignmentRemoteId, reqPayload)
              if (!reqResult.success) {
                setSaveError(reqResult.error || `Failed to save a submission requirement for "${lesson.title}".`)
                setSaving(false)
                return
              }
            }
          }

          for (const resource of lesson.assignment.resources) {
            const resResult = await trainerAssignmentsAPI.createResource(courseSlug, assignmentRemoteId, {
              title: resource.title,
              file: resource.file,
            })
            if (!resResult.success) {
              setSaveError(resResult.error || `Failed to upload "${resource.title}" for "${lesson.title}".`)
              setSaving(false)
              return
            }
          }
        }

        updateLesson(mod.id, lesson.id, {
          remoteId,
          videoUploaded: lesson.videoFile ? true : lesson.videoUploaded,
          assignmentRemoteId,
        })
      }
    }

    setSaving(false)
    setStep(4)
  }

  async function saveSettingsAndContinue() {
    if (!courseId) return
    setSaveError(null)

    const price = Number(form.priceNaira)
    if (!form.isFree && !(price > 0)) {
      setSaveError('Enter a price greater than ₦0, or mark the course as free.')
      return
    }

    setSaving(true)
    const priceKobo = form.isFree ? 0 : Math.round(price * 100)

    const result = await coursesManageAPI.updateDraft(courseId, {
      is_free: form.isFree,
      price_kobo: priceKobo,
      has_certificate: form.hasCertificate,
    })

    setSaving(false)
    if (!result.success) {
      setSaveError(result.error || 'Failed to save course settings.')
      return
    }
    setStep(5)
  }

  function goNext() {
    if (step === 1) return saveBasicsAndContinue()
    if (step === 2) return saveDescriptionAndContinue()
    if (step === 3) return saveCurriculumAndContinue()
    if (step === 4) return saveSettingsAndContinue()
  }

  // Makes the server match the visibility the trainer picked:
  //   public + not live  -> publish        hidden + live -> unpublish
  //   public + live      -> nothing to do  hidden + not live -> nothing to do
  async function handleSubmit() {
    if (!courseId) return
    if (publishBlocked) return
    setSaving(true)
    setSaveError(null)

    let outcome: SubmitOutcome = 'saved'

    if (form.visibility === 'public' && !isLive) {
      const result = await coursesManageAPI.publishDraft(courseId)
      if (!result.success) {
        setSaveError(result.error || 'Failed to publish the course.')
        setSaving(false)
        return
      }
      setCourseStatus('published')
      outcome = 'published'
    } else if (form.visibility === 'hidden' && isLive) {
      const result = await coursesManageAPI.unpublishDraft(courseId)
      if (!result.success) {
        setSaveError(result.error || 'Failed to hide the course.')
        setSaving(false)
        return
      }
      setCourseStatus('draft')
      outcome = 'unpublished'
    } else if (form.visibility === 'public' && isLive) {
      outcome = 'updated'
    }

    setSaving(false)
    setSubmitOutcome(outcome)
  }

  function handleSaveDraft() {
    navigate(coursesListRoute)
  }

  function handleBackToDashboard() {
    setSubmitOutcome(null)
    navigate(dashboardRoute)
  }

  function handleViewCourses() {
    setSubmitOutcome(null)
    navigate(coursesListRoute, { replace: true })
  }

  function updateListItem(field: 'expectedOutcomes' | 'prerequisites', index: number, value: string) {
    setForm((f) => {
      const list = [...f[field]]
      list[index] = value
      return { ...f, [field]: list }
    })
  }
  function addListItem(field: 'expectedOutcomes' | 'prerequisites') {
    if (form[field].length >= 8) return
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }))
  }
  function removeListItem(field: 'expectedOutcomes' | 'prerequisites', index: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  // ---------- Module helpers ----------
  function updateModule(moduleLocalId: string, patch: Partial<CourseModule>) {
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m) => (m.id === moduleLocalId ? { ...m, ...patch } : m)),
    }))
  }

  function addModule() {
    setForm((f) => ({ ...f, modules: [...f.modules, emptyModule(1)] }))
  }

  async function removeModule(moduleLocalId: string) {
    if (form.modules.length <= 1) return
    const mod = form.modules.find((m) => m.id === moduleLocalId)
    if (!mod) return

    const hasContent = Boolean(
      mod.remoteId ||
      mod.title.trim() ||
      mod.lessons.some((l) => l.remoteId || l.title.trim() || l.description.trim() || l.videoFile || l.materialFiles.length),
    )

    if (hasContent) {
      const lessonCount = mod.lessons.filter((l) => l.title.trim() || l.remoteId).length
      const lessonWarning =
        lessonCount > 0
          ? ` This will also delete ${lessonCount} lesson${lessonCount === 1 ? '' : 's'} inside it.`
          : ''
      const confirmed = await confirm({
        title: `Delete "${mod.title.trim() || 'this module'}"?`,
        message: `This can't be undone.${lessonWarning}`,
        confirmLabel: 'Delete module',
        destructive: true,
      })
      if (!confirmed) return
    }

    // Delete on the server first, so the screen never shows a module as gone while it still exists.
    if (mod.remoteId) {
      const result = await coursesManageAPI.deleteModule(mod.remoteId)
      if (!result.success) {
        setSaveError(result.error || 'Failed to delete this module. Nothing was removed.')
        return
      }
    }

    mod.lessons.forEach((l) => {
      if (l.remoteId) cancelVideo(l.remoteId)
    })
    setForm((f) => ({ ...f, modules: f.modules.filter((m) => m.id !== moduleLocalId) }))
  }

  // ---------- Lesson helpers (always scoped to a module) ----------
  function updateLesson(moduleLocalId: string, lessonLocalId: string, patch: Partial<Lesson>) {
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m) =>
        m.id === moduleLocalId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonLocalId ? { ...l, ...patch } : l)) }
          : m,
      ),
    }))
  }

  function addLesson(moduleLocalId: string) {
    setForm((f) => ({
      ...f,
      modules: f.modules.map((m) =>
        m.id === moduleLocalId ? { ...m, lessons: [...m.lessons, emptyLesson()] } : m,
      ),
    }))
  }

  async function removeLesson(moduleLocalId: string, lessonLocalId: string) {
    const lesson = form.modules.find((m) => m.id === moduleLocalId)?.lessons.find((l) => l.id === lessonLocalId)
    if (!lesson) return

    const hasContent = Boolean(
      lesson.remoteId || lesson.title.trim() || lesson.description.trim() || lesson.videoFile || lesson.materialFiles.length || lesson.assignment,
    )

    if (hasContent) {
      const confirmed = await confirm({
        title: `Delete "${lesson.title.trim() || 'this lesson'}"?`,
        message: "This can't be undone.",
        confirmLabel: 'Delete lesson',
        destructive: true,
      })
      if (!confirmed) return
    }

    if (lesson.remoteId) {
      const result = await coursesManageAPI.deleteLesson(lesson.remoteId)
      if (!result.success) {
        setSaveError(result.error || 'Failed to delete this lesson. Nothing was removed.')
        return
      }
      cancelVideo(lesson.remoteId)
    }

    setForm((f) => ({
      ...f,
      modules: f.modules.map((m) =>
        m.id === moduleLocalId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonLocalId) } : m,
      ),
    }))
  }

  // ---------- Video pick / cancel / retry ----------
  function handleVideoPick(moduleLocalId: string, lesson: Lesson, file: File | null) {
    if (!file) return
    if (file.size > MAX_VIDEO_BYTES) {
      setSaveError(`"${file.name}" is larger than 2 GB. Please choose a smaller video.`)
      return
    }
    setSaveError(null)
    if (lesson.remoteId) cancelVideo(lesson.remoteId) // replacing: stop any earlier upload
    updateLesson(moduleLocalId, lesson.id, { videoFile: file, videoUploaded: false })
  }

  function handleVideoCancel(moduleLocalId: string, lesson: Lesson) {
    if (lesson.remoteId) cancelVideo(lesson.remoteId)
    updateLesson(moduleLocalId, lesson.id, { videoFile: null, videoUploaded: false })
  }

  // ---------- Materials pick / clear ----------
  function handleMaterialsPick(moduleLocalId: string, lesson: Lesson, files: File[]) {
    if (!files.length) return
    const tooBig = files.find((f) => f.size > MAX_MATERIAL_BYTES)
    if (tooBig) {
      setSaveError(`"${tooBig.name}" is larger than 500 MB. Please choose a smaller file.`)
      return
    }
    setSaveError(null)

    // Add to the current selection instead of replacing it, skipping exact duplicates.
    const merged = [...lesson.materialFiles]
    files.forEach((f) => {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f)
    })
    updateLesson(moduleLocalId, lesson.id, { materialFiles: merged })
  }

  // ---------- Assignment modal ----------
  function openAssignmentModal(moduleLocalId: string, lessonLocalId: string) {
    setAssignmentTarget({ moduleId: moduleLocalId, lessonId: lessonLocalId })
  }
  function closeAssignmentModal() {
    setAssignmentTarget(null)
  }
  function saveAssignmentDraft(moduleLocalId: string, lessonLocalId: string, draft: AssignmentDraft) {
    updateLesson(moduleLocalId, lessonLocalId, { assignment: draft })
    setAssignmentTarget(null)
  }

  const totalModules = form.modules.length
  const totalLessons = form.modules.reduce((sum, m) => sum + m.lessons.length, 0)

  const assignmentModalModule = assignmentTarget
    ? form.modules.find((m) => m.id === assignmentTarget.moduleId) ?? null
    : null
  const assignmentModalLesson = assignmentModalModule && assignmentTarget
    ? assignmentModalModule.lessons.find((l) => l.id === assignmentTarget.lessonId) ?? null
    : null

  // Label for the main button on the review step.
  function submitLabel() {
    if (saving) return 'Saving…'
    if (publishBlocked) {
      return failedUploads.length > 0
        ? 'Fix failed uploads to publish'
        : `Uploading videos (${pendingUploads.length})…`
    }
    if (form.visibility === 'public') return isLive ? 'Save changes' : 'Publish course'
    return isLive ? 'Unpublish course' : 'Save as hidden'
  }

  if (loading) {
    return (
      <Shell>
        <style>{PAGE_CSS}</style>
        <div className="ac-page">
          <div className="ac-card">
            <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem 0' }}>Loading course…</p>
          </div>
        </div>
      </Shell>
    )
  }

  if (loadError) {
    return (
      <Shell>
        <style>{PAGE_CSS}</style>
        <div className="ac-page">
          <div className="ac-card">
            <div className="ac-error" style={{ margin: '1.25rem' }}>{loadError}</div>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <style>{PAGE_CSS}</style>
      <div className="ac-page">
        <div className="ac-card" ref={cardRef}>
          <div className="ac-header">
            <button className="ac-back-btn" onClick={goBack} aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <h2 className="ac-title">{isEditMode ? 'Edit course' : 'Add New course'}</h2>
          </div>

          <div className="ac-stepper">
            {STEPS.map((s, i) => {
              const status = s.id < step ? 'done' : s.id === step ? 'active' : ''
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                  <button
                    type="button"
                    className="ac-step"
                    onClick={() => goToStep(s.id)}
                    disabled={s.id >= step || saving}
                    aria-label={`Go to ${s.label}`}
                  >
                    <div className={`ac-step-circle ${status}`}>
                      {s.id < step ? <Check size={16} /> : s.id}
                    </div>
                    <span className={`ac-step-label ${status}`}>{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && <div className={`ac-step-line ${s.id < step ? 'done' : ''}`} />}
                </div>
              )
            })}
          </div>

          <div className="ac-body">
            {saveError && <div className="ac-error" role="alert">{saveError}</div>}

            {step === 1 && (
              <>
                <h3 className="ac-section-title">Course basics</h3>
                <p className="ac-section-sub">Start with the essential details learners will see first.</p>
                <div className="ac-grid">
                  <div className="ac-field">
                    <label className="ac-label" htmlFor="ac-title">Course title <span className="ac-required">*</span></label>
                    <input
                      id="ac-title"
                      className="ac-input"
                      placeholder="e.g. Project Management Course"
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                    />
                    <p className="ac-hint">Keep it clear and specific — e.g. 'Project Management for Early-Career Professionals'</p>
                  </div>
                  <div className="ac-field">
                    <label className="ac-label" htmlFor="ac-subtitle">Subtitle / tagline</label>
                    <input
                      id="ac-subtitle"
                      className="ac-input"
                      placeholder="e.g. Master the fundamentals of managing projects end-to-end"
                      value={form.subtitle}
                      onChange={(e) => update('subtitle', e.target.value)}
                    />
                    <p className="ac-hint">One line that expands on the title — appears in search results</p>
                  </div>

                  <div className="ac-field">
                    <label className="ac-label" htmlFor="ac-category">Category <span className="ac-required">*</span></label>
                    <select id="ac-category" className="ac-select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="ac-field">
                    <label className="ac-label" htmlFor="ac-language">Language</label>
                    <select id="ac-language" className="ac-select" value={form.language} onChange={(e) => update('language', e.target.value)}>
                      <option value="">Select language</option>
                      {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="ac-field full">
                    <label className="ac-label" htmlFor="ac-level">Level <span className="ac-required">*</span></label>
                    <select
                      id="ac-level"
                      className="ac-select"
                      value={form.level}
                      onChange={(e) => update('level', e.target.value as CourseLevel)}
                    >
                      <option value="">Select Level</option>
                      {LEVEL_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>

                  <div className="ac-field full">
                    <label className="ac-label">Cover image</label>
                    <label className="ac-upload-box" style={form.existingCoverImageUrl && !form.coverImage ? { padding: 0, minHeight: 160, overflow: 'hidden', position: 'relative', border: '1px solid #E5E7EB' } : undefined}>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          handleCoverPick(e.target.files?.[0] ?? null)
                          e.target.value = ''
                        }}
                      />
                      {form.existingCoverImageUrl && !form.coverImage ? (
                        <>
                          <img
                            src={form.existingCoverImageUrl}
                            alt="Course cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                          />
                          <span
                            className="ac-upload-label"
                            style={{
                              position: 'relative', background: 'rgba(17,24,39,0.65)', color: '#fff',
                              padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.8rem',
                            }}
                          >
                            Change cover image
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={22} />
                          <span className="ac-upload-label">
                            {form.coverImage ? form.coverImage.name : 'Upload cover image'}
                          </span>
                        </>
                      )}
                    </label>
                    <p className="ac-hint">Recommended: 1280×720 px · JPG or PNG · max 5 MB.</p>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="ac-section-title">Course description</h3>
                <p className="ac-section-sub">Help learners decide if this course is right for them.</p>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label" htmlFor="ac-description">Full description <span className="ac-required">*</span></label>
                  <textarea
                    id="ac-description"
                    className="ac-textarea"
                    placeholder="This course covers the fundamentals of project management, from planning and scheduling to stakeholder communication and risk management…"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                  />
                  <p className="ac-hint">Aim for 150–300 words. Describe what the course covers and the value it delivers.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">What learners will learn <span className="ac-required">*</span></label>
                  {form.expectedOutcomes.map((item, i) => (
                    <div className="ac-list-item" key={i}>
                      <span className="ac-list-dot" />
                      <input
                        className="ac-input ac-list-input"
                        aria-label={`Learning outcome ${i + 1}`}
                        placeholder="e.g. Create a full project plan from initiation to closure"
                        value={item}
                        onChange={(e) => updateListItem('expectedOutcomes', i, e.target.value)}
                      />
                      <button className="ac-list-delete" onClick={() => removeListItem('expectedOutcomes', i)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="ac-add-item-btn" onClick={() => addListItem('expectedOutcomes')} disabled={form.expectedOutcomes.length >= 8}>
                    <Plus size={16} /> Add item
                  </button>
                  <p className="ac-hint">List 4–8 concrete outcomes. These appear as bullet points on the course page.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label" htmlFor="ac-audience">Target audience (short)</label>
                  <input
                    id="ac-audience"
                    className="ac-input"
                    placeholder="e.g. Early-career project professionals, Team leads"
                    value={form.targetAudience}
                    onChange={(e) => update('targetAudience', e.target.value)}
                  />
                  <p className="ac-hint">Shown as short tags under the "Who this is for" paragraph. Separate several with commas — each up to {MAX_AUDIENCE_ITEM_LENGTH} characters.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label" htmlFor="ac-audience-description">Who this course is for</label>
                  <textarea
                    id="ac-audience-description"
                    className="ac-textarea"
                    style={{ minHeight: 90 }}
                    placeholder="Early-career professionals (0–4 years experience) who work on or aspire to lead projects…"
                    value={form.audienceDescription}
                    onChange={(e) => update('audienceDescription', e.target.value)}
                  />
                  <p className="ac-hint">Describe the ideal learner — their role, experience level, and goals.</p>
                </div>

                <div className="ac-field">
                  <label className="ac-label">Prerequisites</label>
                  {form.prerequisites.map((item, i) => (
                    <div className="ac-list-item" key={i}>
                      <span className="ac-list-dot" />
                      <input
                        className="ac-input ac-list-input"
                        aria-label={`Prerequisite ${i + 1}`}
                        placeholder="e.g. No prior experience required"
                        value={item}
                        onChange={(e) => updateListItem('prerequisites', i, e.target.value)}
                      />
                      <button className="ac-list-delete" onClick={() => removeListItem('prerequisites', i)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="ac-add-item-btn" onClick={() => addListItem('prerequisites')} disabled={form.prerequisites.length >= 8}>
                    <Plus size={16} /> Add item
                  </button>
                  <p className="ac-hint">List any prior knowledge or tools learners need before starting.</p>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="ac-section-title">Curriculum</h3>
                <p className="ac-section-sub">
                  {totalModules} {totalModules === 1 ? 'module' : 'modules'} · {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
                  {' · '}Videos upload in the background after you continue.
                </p>

                {form.modules.map((mod, mi) => (
                  <div className="ac-module-card" key={mod.id}>
                    <div className="ac-module-head">
                      <span className="ac-module-badge">Module {mi + 1}</span>
                      <input
                        className="ac-module-title-input"
                        aria-label={`Module ${mi + 1} title`}
                        placeholder="Module title, e.g. Project Initiation"
                        value={mod.title}
                        onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                      />
                      <button
                        className="ac-module-delete"
                        onClick={() => removeModule(mod.id)}
                        disabled={form.modules.length <= 1}
                        aria-label={`Remove module ${mi + 1}`}
                        title={form.modules.length <= 1 ? 'A course needs at least one module' : 'Remove module'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="ac-module-body">
                      <p className="ac-module-count">
                        {mod.lessons.length} {mod.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </p>

                      {mod.lessons.map((lesson, i) => (
                        <div className="ac-lesson-card" key={lesson.id}>
                          <div className="ac-lesson-head">
                            <span className="ac-lesson-num">{i + 1}</span>
                            <input
                              className="ac-lesson-title-input"
                              aria-label={`Lesson ${i + 1} title`}
                              placeholder="Lesson title"
                              value={lesson.title}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { title: e.target.value })}
                            />
                            <button className="ac-lesson-delete" onClick={() => removeLesson(mod.id, lesson.id)} aria-label="Remove lesson">
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="ac-lesson-desc-wrap">
                            <textarea
                              className="ac-lesson-desc"
                              aria-label={`Lesson ${i + 1} description`}
                              placeholder="What does this lesson cover? (optional)"
                              value={lesson.description}
                              onChange={(e) => updateLesson(mod.id, lesson.id, { description: e.target.value })}
                            />
                          </div>

                          <div className="ac-lesson-uploads">
                            <div className="ac-preview-toggle-row">
                              <div className="ac-preview-toggle-text">
                                <span className="ac-preview-toggle-title">Free preview</span>
                                <span className="ac-preview-toggle-sub">
                                  Anyone can watch this lesson without enrolling
                                </span>
                              </div>
                              <label className="toggle">
                                <input
                                  type="checkbox"
                                  aria-label="Free preview"
                                  checked={lesson.isPreview}
                                  onChange={(e) => updateLesson(mod.id, lesson.id, { isPreview: e.target.checked })}
                                />
                                <span className="track" />
                              </label>
                            </div>

                            <VideoUploadChip
                              lesson={lesson}
                              job={lesson.remoteId ? uploadJobs[lesson.remoteId] : undefined}
                              onPick={(file) => handleVideoPick(mod.id, lesson, file)}
                              onCancel={() => handleVideoCancel(mod.id, lesson)}
                              onRetry={() => lesson.remoteId && retryVideo(lesson.remoteId)}
                            />

                            <label className="ac-upload-chip">
                              <input
                                type="file"
                                multiple
                                accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  handleMaterialsPick(mod.id, lesson, Array.from(e.target.files ?? []))
                                  e.target.value = ''
                                }}
                              />
                              <div className="ac-upload-chip-icon"><Upload size={16} /></div>
                              <div className="ac-upload-chip-body">
                                <div className="ac-upload-chip-label">
                                  {lesson.materialFiles.length > 0
                                    ? `${lesson.materialFiles.length} file(s) ready to upload`
                                    : lesson.existingMaterialsCount > 0
                                      ? `${lesson.existingMaterialsCount} material(s) uploaded — tap to add more`
                                      : 'Upload Material(s)'}
                                </div>
                                <p className="ac-upload-chip-sub">
                                  {lesson.materialFiles.length > 0
                                    ? 'Tap to add more · uploads when you continue'
                                    : 'Docx, Xlsx, PDF, PPTX · max 500 MB each'}
                                </p>
                              </div>
                              {lesson.materialFiles.length > 0 && (
                                <div className="ac-chip-actions">
                                  <button
                                    type="button"
                                    className="ac-chip-btn"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      updateLesson(mod.id, lesson.id, { materialFiles: [] })
                                    }}
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </label>

                            {lesson.assignment ? (
                              <div className="ac-assignment-status">
                                <span className="ac-assignment-added">
                                  Added <Check size={14} />
                                </span>
                                <button
                                  type="button"
                                  className="ac-assignment-preview-link"
                                  onClick={() => openAssignmentModal(mod.id, lesson.id)}
                                >
                                  Preview
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="ac-insert-assignment-btn"
                                onClick={() => openAssignmentModal(mod.id, lesson.id)}
                              >
                                Insert assignment(s)
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button className="ac-module-add-lesson" onClick={() => addLesson(mod.id)}>
                        <Plus size={16} /> Add lesson to Module {mi + 1}
                      </button>
                    </div>
                  </div>
                ))}

                <button className="ac-add-module-btn" onClick={addModule}>
                  <Plus size={16} /> Add module
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <h3 className="ac-section-title">Course settings</h3>
                <p className="ac-section-sub">Configure pricing, access, and enrolment options.</p>

                <div className="ac-settings-card">
                  <div className="ac-settings-section-title">Pricing</div>
                  <div className="ac-toggle-row">
                    <div>
                      <p className="ac-toggle-title">Free course</p>
                      <p className="ac-toggle-sub">Learners can enrol at no cost</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="Free course"
                        checked={form.isFree}
                        onChange={(e) => update('isFree', e.target.checked)}
                      />
                      <span className="track" />
                    </label>
                  </div>
                  <div className="ac-price-block">
                    <label className="ac-label" htmlFor="ac-price" style={{ display: 'block', marginBottom: '0.5rem' }}>Price (₦)</label>
                    <div className="ac-price-wrap">
                      <span className="ac-price-prefix">₦</span>
                      <input
                        id="ac-price"
                        className="ac-input"
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 40,000"
                        disabled={form.isFree}
                        value={formatPrice(form.priceNaira)}
                        onChange={(e) => update('priceNaira', sanitizePrice(e.target.value))}
                      />
                    </div>
                    <p className="ac-hint" style={{ marginTop: '0.5rem' }}>
                      Enter the amount in naira. Commas are added automatically.
                    </p>
                  </div>
                </div>

                <div className="ac-settings-card">
                  <div className="ac-toggle-row" style={{ borderTop: 'none' }}>
                    <div>
                      <p className="ac-toggle-title">Certificate of completion</p>
                      <p className="ac-toggle-sub">Learners receive a certificate after completing all requirements</p>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        aria-label="Certificate of completion"
                        checked={form.hasCertificate}
                        onChange={(e) => update('hasCertificate', e.target.checked)}
                      />
                      <span className="track" />
                    </label>
                  </div>
                </div>

                <p className="ac-toggle-title" id="ac-visibility-label" style={{ marginBottom: '0.75rem' }}>Visibility</p>
                <div role="radiogroup" aria-labelledby="ac-visibility-label">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.visibility === 'public'}
                    className={`ac-visibility-option ${form.visibility === 'public' ? 'selected' : ''}`}
                    onClick={() => update('visibility', 'public')}
                  >
                    <div className="ac-visibility-icon"><Globe size={18} /></div>
                    <div>
                      <p className="ac-visibility-title">Public</p>
                      <p className="ac-visibility-sub">Listed in the catalogue, open to all learners</p>
                    </div>
                    {form.visibility === 'public' && <Check size={18} className="ac-visibility-check" />}
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.visibility === 'hidden'}
                    className={`ac-visibility-option ${form.visibility === 'hidden' ? 'selected' : ''}`}
                    onClick={() => update('visibility', 'hidden')}
                  >
                    <div className="ac-visibility-icon"><Eye size={18} /></div>
                    <div>
                      <p className="ac-visibility-title">Hidden</p>
                      <p className="ac-visibility-sub">Not listed anywhere — for internal testing only</p>
                    </div>
                    {form.visibility === 'hidden' && <Check size={18} className="ac-visibility-check" />}
                  </button>
                </div>
                <p className="ac-hint" style={{ marginTop: '0.5rem' }}>
                  {isLive
                    ? 'This course is live now. Choosing Hidden will unpublish it when you finish in the next step.'
                    : 'This only takes effect when you finish in the next step — it isn\'t saved yet.'}
                </p>
              </>
            )}

            {step === 5 && (
              <>
                <h3 className="ac-section-title">Review &amp; publish</h3>
                <p className="ac-section-sub">Check everything looks right before going live.</p>

                {pendingUploads.length > 0 && (
                  <div className={`ac-notice ${failedUploads.length > 0 ? 'warn' : ''}`}>
                    <span>
                      {failedUploads.length > 0
                        ? `${failedUploads.length} video${failedUploads.length === 1 ? '' : 's'} failed to upload. Retry ${failedUploads.length === 1 ? 'it' : 'them'} in the Curriculum step.`
                        : `${pendingUploads.length} video${pendingUploads.length === 1 ? ' is' : 's are'} still uploading. You can publish once ${pendingUploads.length === 1 ? 'it finishes' : 'they finish'}.`}
                    </span>
                    {failedUploads.length > 0 && (
                      <button className="ac-notice-btn" onClick={() => goToStep(3)}>Go to Curriculum</button>
                    )}
                  </div>
                )}

                <div className="ac-preview-player">
                  {previewVideoSrc ? (
                    <video
                      key={previewVideoSrc}
                      className="ac-preview-video-real"
                      src={previewVideoSrc}
                      poster={previewCoverSrc ?? undefined}
                      controls
                      preload="metadata"
                    />
                  ) : previewCoverSrc ? (
                    <div className="ac-preview-cover-wrap">
                      <img className="ac-preview-cover" src={previewCoverSrc} alt="Course cover preview" />
                      <span className="ac-preview-cover-note">
                        No preview video yet — add one in the Curriculum step
                      </span>
                    </div>
                  ) : (
                    <div className="ac-preview-video ac-preview-video-empty">
                      <div className="ac-preview-video-topbar">
                        <div>
                          <div className="ac-preview-video-title">No video uploaded yet</div>
                          <div className="ac-preview-video-sub">
                            Add a video to a lesson in the Curriculum step to preview it here
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="ac-preview-info">
                    <p className="ac-preview-cat">{form.category || 'Category'}</p>
                    <h4 className="ac-preview-title">{form.title || 'Untitled course'}</h4>
                    <p className="ac-preview-sub">{form.subtitle || 'No subtitle provided'}</p>
                    <div className="ac-preview-badges">
                      <span className="ac-preview-badge"><Layers size={14} /> {totalModules} module{totalModules === 1 ? '' : 's'}</span>
                      <span className="ac-preview-badge"><BookOpen size={14} /> {totalLessons} lesson{totalLessons === 1 ? '' : 's'}</span>
                      {form.hasCertificate && <span className="ac-preview-badge"><Award size={14} /> Certificate</span>}
                    </div>
                  </div>
                </div>

                <div className="ac-review-table">
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Title</span>
                    <span className="ac-review-row-value">{form.title || '—'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Category</span>
                    <span className="ac-review-row-value">{form.category || '—'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Level</span>
                    <span className="ac-review-row-value">
                      {LEVEL_OPTIONS.find((l) => l.value === form.level)?.label || '—'}
                    </span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Language</span>
                    <span className="ac-review-row-value">{form.language || '—'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Modules</span>
                    <span className="ac-review-row-value">{totalModules}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Lessons</span>
                    <span className="ac-review-row-value">{totalLessons}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Price</span>
                    <span className="ac-review-row-value">{form.isFree ? 'Free' : `₦${formatPrice(form.priceNaira) || '0'}`}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Certificate</span>
                    <span className="ac-review-row-value">{form.hasCertificate ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Visibility</span>
                    <span className="ac-review-row-value">{form.visibility === 'public' ? 'Public' : 'Hidden'}</span>
                  </div>
                </div>

                <div className="ac-outcomes-box">
                  <p className="ac-outcomes-title">Learning outcomes</p>
                  {form.expectedOutcomes.filter((i) => i.trim()).map((item, i) => (
                    <div className="ac-outcome-item" key={i}>
                      <Check size={15} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="ac-footer">
            {step < 5 ? (
              <>
                <button className="ac-btn secondary" onClick={goBack} disabled={saving}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button className="ac-btn primary" onClick={goNext} disabled={saving}>
                  {saving ? <Loader2 size={18} className="ac-spin" /> : null}
                  {saving ? 'Saving…' : step === 4 ? 'Review Course' : 'Continue'}
                  {!saving && <ChevronRight size={18} />}
                </button>
              </>
            ) : (
              <div className="ac-review-actions">
                <button className="ac-btn primary full" onClick={handleSubmit} disabled={saving || publishBlocked}>
                  {saving ? <Loader2 size={18} className="ac-spin" /> : <Send size={18} />}{' '}
                  {submitLabel()}
                </button>
                <button className="ac-btn secondary full" onClick={handleSaveDraft} disabled={saving}>
                  {isLive ? 'Back to courses' : 'Save as draft'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {submitOutcome && (
        <div className="ac-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="ac-success-title">
          <div className="ac-modal">
            <div className="ac-modal-icon">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="ac-modal-title" id="ac-success-title">{SUBMIT_COPY[submitOutcome].title}</h3>
            <p className="ac-modal-sub">{SUBMIT_COPY[submitOutcome].sub}</p>
            <div className="ac-modal-actions">
              <button className="ac-btn primary full" onClick={handleViewCourses}>
                View my courses
              </button>
              <button className="ac-btn secondary full" onClick={handleBackToDashboard}>
                Back to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {assignmentModalLesson && assignmentModalModule && assignmentTarget && (
        <AssignmentCreatorModal
          courseTitle={form.title || 'Untitled course'}
          moduleTitle={assignmentModalModule.title.trim() || `Module ${form.modules.indexOf(assignmentModalModule) + 1}`}
          initialData={assignmentModalLesson.assignment}
          onClose={closeAssignmentModal}
          onSave={(draft: AssignmentDraft) =>
            saveAssignmentDraft(assignmentTarget.moduleId, assignmentTarget.lessonId, draft)
          }
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Shell>
  )
}