// pages/app/trainer/AddCoursePage.tsx (or wherever this lives — path unchanged)
import { useState, useEffect } from 'react'
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
  deadlineToISOString,
} from '../../../../components/AssignmentCreationModal'

type Step = 1 | 2 | 3 | 4 | 5

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: 'Basics' },
  { id: 2, label: 'Description' },
  { id: 3, label: 'Curriculum' },
  { id: 4, label: 'Settings' },
  { id: 5, label: 'Review' },
]

type Lesson = {
  id: string
  remoteId: string | null
  title: string
  description: string
  videoFile: File | null
  existingVideoUrl: string | null
  materialFiles: File[]
  existingMaterialsCount: number
  videoUploaded: boolean
  materialsUploaded: boolean
  assignment: AssignmentDraft | null
  assignmentRemoteId: string | null
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
  targetAudience: string
  audienceDescription: string
  prerequisites: string[]
  lessons: Lesson[]
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
    materialsUploaded: false,
    assignment: null,
    assignmentRemoteId: null,
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
    deadline: detail.deadline ? new Date(detail.deadline).toISOString().slice(0, 16) : '',
    isFinal: Boolean(detail.is_final),
    maxAttempts: String(detail.max_attempts ?? 1),
    acceptLate: Boolean(detail.accept_late),
    coverImages: [],
    whatYoullDo: [''],
    scenarios: [''],
    deliverables: [''],
    gradingCriteria: gradingCriteria.length ? gradingCriteria : [{ id: makeId(), criterion: '', description: '', points: '' }],
    resources: [],
    wordCountMin: '',
    wordCountMax: '',
    acceptedFileTypes: fileTypes,
    // Note: requirement drafts get fresh local ids here (makeId()), not the
    // backend requirement id — see the comment in saveCurriculumAndContinue()
    // for why that means edits to an already-saved assignment don't re-sync
    // existing requirement rows.
    requirements: requirementDrafts,
  }
}
 
function findSavedAssignment(moduleAssignments: TrainerAssignmentDetail[], moduleTitle?: string, lessonTitle?: string) {
  if (!moduleAssignments.length) return null

  const normalizedLessonTitle = lessonTitle?.trim().toLowerCase() ?? ''
  const normalizedModuleTitle = moduleTitle?.trim().toLowerCase() ?? ''

  return moduleAssignments.find((assignment) => {
    const aModule = assignment.module?.title?.trim().toLowerCase() ?? (assignment as any).module_title?.trim().toLowerCase() ?? ''
    const aTitle = assignment.title?.trim().toLowerCase() ?? ''
    return (!normalizedLessonTitle || aTitle.includes(normalizedLessonTitle) || aTitle === normalizedLessonTitle)
      && (!normalizedModuleTitle || aModule === normalizedModuleTitle || aModule.includes(normalizedModuleTitle))
  }) ?? moduleAssignments[0]
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
  lessons: [emptyLesson(), emptyLesson()],
  isFree: false,
  priceNaira: '',
  hasCertificate: true,
  visibility: 'public',
}

const PAGE_CSS = `
  .ac-page { padding: 1rem; background: #F5F5F5; }
  .ac-card { max-width: 980px; margin: 0 auto; background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; overflow: hidden; }

  .ac-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; border-bottom: 1px solid #F3F4F6; }
  .ac-back-btn { background: none; border: none; cursor: pointer; color: #111; display: flex; align-items: center; padding: 0.25rem; }
  .ac-title { margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827; }

  .ac-stepper { display: flex; align-items: center; padding: 1.25rem 1.25rem 0; overflow-x: auto; gap: 0; }
  .ac-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; flex-shrink: 0; min-width: 64px; }
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

  .ac-grid { display: grid; grid-template-columns: 1fr; gap: 1.1rem; }
  .ac-field { display: grid; gap: 0.5rem; }
  .ac-label { font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-required { color: #EF4444; }
  .ac-input, .ac-select, .ac-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9rem; color: #111; background: #fff; }
  .ac-textarea { resize: vertical; min-height: 120px; font-family: inherit; }
  .ac-hint { margin: 0; color: #9CA3AF; font-size: 0.78rem; }

  .ac-upload-box { border: 2px dashed #D1D5DB; border-radius: 1rem; min-height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; color: #6B7280; cursor: pointer; text-align: center; padding: 1.5rem; }
  .ac-upload-box:hover { background: #FAFAFA; }
  .ac-upload-label { font-weight: 700; color: #374151; }

  .ac-list-item { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.65rem; }
  .ac-list-dot { width: 8px; height: 8px; border-radius: 999px; background: #2492EB; flex-shrink: 0; }
  .ac-list-input { flex: 1; }
  .ac-list-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-add-item-btn { background: none; border: none; color: #2492EB; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; padding: 0.25rem 0; }

  .ac-lesson-card { border: 1px solid #E5E7EB; border-radius: 1rem; margin-bottom: 1rem; overflow: hidden; }
  .ac-lesson-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem; }
  .ac-lesson-num { width: 26px; height: 26px; border-radius: 999px; background: #EFF6FF; color: #2492EB; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-lesson-title-input { flex: 1; border: none; background: none; font-size: 0.95rem; color: #111; outline: none; }
  .ac-lesson-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-lesson-desc-wrap { padding: 0 1rem 0.85rem; }
  .ac-lesson-desc { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.6rem 0.75rem; font-size: 0.85rem; font-family: inherit; resize: vertical; min-height: 70px; color: #111; }
  .ac-lesson-uploads { padding: 0 1rem 1rem; display: grid; gap: 0.75rem; }
  .ac-upload-chip { display: flex; align-items: center; gap: 0.75rem; border: 1px dashed #93C5FD; background: #EFF6FF; border-radius: 0.85rem; padding: 0.85rem 1rem; cursor: pointer; }
  .ac-upload-chip-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #DBEAFE; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-upload-chip-label { font-weight: 700; color: #2492EB; font-size: 0.875rem; }
  .ac-upload-chip-sub { margin: 0.1rem 0 0; color: #6B7280; font-size: 0.75rem; }

  .ac-insert-assignment-btn { border: none; background: #2492EB; color: #FFFFFF; font-family: 'Sora', inherit; font-weight: 600; font-size: 12px; line-height: 18px; padding: 6px 16px; border-radius: 8px; cursor: pointer; justify-self: start; align-self: flex-start; white-space: nowrap; width: fit-content; }
  .ac-insert-assignment-btn:hover { opacity: 0.92; }
  .ac-assignment-status { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ac-assignment-added { display: flex; align-items: center; gap: 4px; color: #616873; font-family: 'Sora', inherit; font-weight: 500; font-size: 12px; line-height: 18px; }
  .ac-assignment-added svg { color: #616873; }
  .ac-assignment-preview-link { border: none; background: none; color: #2492EB; font-family: 'Sora', inherit; font-weight: 500; font-size: 12px; line-height: 18px; text-decoration: underline; cursor: pointer; padding: 0; }

  .ac-add-lesson-btn { width: 100%; border: 2px dashed #D1D5DB; border-radius: 1rem; padding: 1rem; background: none; color: #6B7280; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }

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

  .ac-visibility-option { display: flex; align-items: center; gap: 0.85rem; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1rem 1.1rem; margin-bottom: 0.75rem; cursor: pointer; }
  .ac-visibility-option.selected { border-color: #2492EB; background: #EFF6FF; }
  .ac-visibility-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #6B7280; flex-shrink: 0; }
  .ac-visibility-option.selected .ac-visibility-icon { background: #DBEAFE; color: #2492EB; }
  .ac-visibility-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-visibility-sub { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .ac-visibility-check { margin-left: auto; color: #2492EB; flex-shrink: 0; }

  .ac-preview-player { border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; margin-bottom: 1.25rem; }
  .ac-preview-video-real { width: 100%; aspect-ratio: 16 / 9; display: block; background: #111; }
  .ac-preview-video { position: relative; background: #111; aspect-ratio: 16 / 9; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; color: #fff; background-image: linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)); background-size: cover; background-position: center; }
  .ac-preview-video-empty { justify-content: flex-start; color: #D1D5DB; }
  .ac-preview-video-empty .ac-preview-video-title { color: #fff; }
  .ac-preview-video-empty .ac-preview-video-sub { color: #9CA3AF; }
  .ac-preview-video-topbar { display: flex; align-items: center; gap: 0.75rem; }
  .ac-preview-video-back { background: rgba(255,255,255,0.15); border: none; border-radius: 999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; flex-shrink: 0; }
  .ac-preview-video-title { font-weight: 700; font-size: 0.9rem; }
  .ac-preview-video-sub { font-size: 0.75rem; opacity: 0.85; margin-top: 0.15rem; }
  .ac-preview-video-controls { display: flex; align-items: center; justify-content: center; gap: 1.25rem; }
  .ac-preview-ctrl-btn { background: rgba(255,255,255,0.15); border: none; border-radius: 999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; }
  .ac-preview-ctrl-btn.primary { width: 52px; height: 52px; background: rgba(0,0,0,0.4); }
  .ac-preview-video-bottom { display: flex; flex-direction: column; gap: 0.5rem; }
  .ac-preview-progress { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.3); position: relative; }
  .ac-preview-progress-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 30%; background: #2492EB; border-radius: 999px; }
  .ac-preview-video-meta { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; }
  .ac-preview-video-icons { display: flex; align-items: center; gap: 0.6rem; }
  .ac-preview-auto { font-size: 0.7rem; border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 0.05rem 0.35rem; }

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
  }

  @media (min-width: 1024px) {
    .ac-page { padding: 1.5rem 2rem 2rem; }
  }
`

export default function AddCoursePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const isEditMode = Boolean(id)

  const isAdmin = location.pathname.startsWith('/admin')
  const Shell = isAdmin ? AdminShell : TrainerShell
  const coursesListRoute = isAdmin ? '/admin/courses' : ROUTES.TRAINER_COURSES
  const dashboardRoute = isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.TRAINER_DASHBOARD

  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<CourseForm>(initialForm)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [courseId, setCourseId] = useState<string | null>(id ?? null)
  
  const [courseSlug, setCourseSlug] = useState<string | null>(null)
  const [moduleId, setModuleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [loading, setLoading] = useState(isEditMode)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Which lesson's assignment modal is open (null = closed).
  const [assignmentModalLessonId, setAssignmentModalLessonId] = useState<string | null>(null)

  const previewLesson = form.lessons.find((l) => l.videoFile) ?? form.lessons.find((l) => l.existingVideoUrl)
  const [previewVideoSrc, setPreviewVideoSrc] = useState<string | null>(null)

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
    // Only re-run when the actual video source changes, not on every keystroke elsewhere in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewLesson?.videoFile, previewLesson?.existingVideoUrl])

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
      const curriculumLessons = curriculumModules.flatMap((module) =>
        module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id })),
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
            const detail = result.data as TrainerAssignmentDetail & { module_id?: string }
            const moduleId = detail.module?.id ?? detail.module_id ?? null
            if (!moduleId) return
            const existing = assignmentsByModule.get(moduleId) ?? []
            assignmentsByModule.set(moduleId, [...existing, detail])
          })
        }
      }

      const prefilledLessons: Lesson[] = curriculumLessons.map((lesson) => {
        const detailRes = lessonDetailResults.find((result) => result.success && result.data.id === lesson.id)
        const detail = detailRes?.success ? detailRes.data : null
        const moduleAssignments = assignmentsByModule.get(lesson.moduleId) ?? []
        const loadedAssignment = findSavedAssignment(moduleAssignments, undefined, lesson.title) ? normalizeAssignmentDraft(findSavedAssignment(moduleAssignments, undefined, lesson.title)) : null
        const rawVideoUrl = (lesson as any).video_url ?? (lesson as any).videoUrl ?? (detail as any)?.video_url ?? (detail as any)?.videoUrl ?? null

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
          materialsUploaded: true,
          assignment: loadedAssignment,
          assignmentRemoteId: loadedAssignment ? (moduleAssignments[0]?.id ?? null) : null,
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
        existingCoverImageUrl: draft.cover_image_url ?? null,
        description: draft.description ?? '',
        expectedOutcomes: draft.expected_outcomes?.length ? draft.expected_outcomes : ['', ''],
        targetAudience: draft.target_audience?.[0] ?? '',
        audienceDescription: draft.audience_description ?? '',
        prerequisites: draft.prerequisites?.length ? draft.prerequisites : [''],
        lessons: prefilledLessons.length ? prefilledLessons : [emptyLesson(), emptyLesson()],
        isFree: draft.is_free ?? false,
        priceNaira: draft.price_kobo ? String(draft.price_kobo / 100) : '',
        hasCertificate: draft.has_certificate ?? true,
        visibility: draft.status === 'published' ? 'public' : 'hidden',
      }))

      setCourseId(id as string)
      setCourseSlug(draft.slug ?? null)
      if (curriculumModules[0]) setModuleId(curriculumModules[0].id)
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

  async function saveBasicsAndContinue() {
    setSaving(true)
    setSaveError(null)

    const basics = {
      title: form.title,
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
    } else {
      const result = await coursesManageAPI.updateDraft(activeCourseId, basics)
      if (!result.success) {
        setSaveError(result.error || 'Failed to save course basics.')
        setSaving(false)
        return
      }
      if (result.data.slug) setCourseSlug(result.data.slug)
    }

    

    setSaving(false)
    setStep(2)
  }

  async function saveDescriptionAndContinue() {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)

    const result = await coursesManageAPI.updateDraft(courseId, {
      description: form.description,
      expected_outcomes: form.expectedOutcomes.filter((i) => i.trim()),
      target_audience: form.targetAudience.trim() ? [form.targetAudience.trim()] : [],
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

    let activeModuleId = moduleId
    if (!activeModuleId) {
      const moduleResult = await coursesManageAPI.createModule(courseId, 'Module 1')
      if (!moduleResult.success) {
        setSaveError(moduleResult.error || 'Failed to create the module.')
        setSaving(false)
        return
      }
      activeModuleId = moduleResult.data.id
      setModuleId(activeModuleId)
    }

    for (let i = 0; i < form.lessons.length; i++) {
      const lesson = form.lessons[i]
      if (!lesson.title.trim()) continue

      let remoteId = lesson.remoteId

      if (!remoteId) {
        // createLesson only accepts a title — body has to be set in a
        // follow-up patch, since there's no create-with-body endpoint.
        const lessonResult = await coursesManageAPI.createLesson(activeModuleId, lesson.title)
        if (!lessonResult.success) {
          setSaveError(lessonResult.error || `Failed to create lesson "${lesson.title}".`)
          setSaving(false)
          return
        }
        remoteId = lessonResult.data.id

        if (lesson.description.trim()) {
          const bodyResult = await coursesManageAPI.updateLesson(remoteId, {
            body: lesson.description,
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
        })
        if (!updateResult.success) {
          setSaveError(updateResult.error || `Failed to update lesson "${lesson.title}".`)
          setSaving(false)
          return
        }
      }

      if (lesson.videoFile && !lesson.videoUploaded) {
        const uploadResult = await coursesManageAPI.uploadFile(lesson.videoFile, 'lesson_video', {
          lesson_id: remoteId,
        })
        if (!uploadResult.success) {
          setSaveError(uploadResult.error || `Failed to upload video for "${lesson.title}".`)
          setSaving(false)
          return
        }
      }

      if (lesson.materialFiles.length > 0 && !lesson.materialsUploaded) {
        for (const file of lesson.materialFiles) {
          const uploadResult = await coursesManageAPI.uploadFile(file, 'lesson_resource', {
            lesson_id: remoteId,
          })
          if (!uploadResult.success) {
            setSaveError(uploadResult.error || `Failed to upload "${file.name}".`)
            setSaving(false)
            return
          }
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
    deadline: deadlineToISOString(lesson.assignment.deadline),
    max_attempts: draftToMaxAttempts(lesson.assignment),
    accept_late: lesson.assignment.acceptLate,
    grading_criteria: draftToGradingCriteria(lesson.assignment),
    is_final: lesson.assignment.isFinal,
    order: i + 1, // position within this module's assignment list
  
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

      updateLesson(lesson.id, {
        remoteId,
        videoUploaded: lesson.videoFile ? true : lesson.videoUploaded,
        materialsUploaded: lesson.materialFiles.length > 0 ? true : lesson.materialsUploaded,
        assignmentRemoteId,
      })
    }

    setSaving(false)
    setStep(4)
  }

  async function saveSettingsAndContinue() {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)

    const priceKobo = form.isFree ? 0 : Math.round((Number(form.priceNaira) || 0) * 100)

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

  async function handleSubmit() {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)

    if (form.visibility === 'public') {
      const result = await coursesManageAPI.publishDraft(courseId)
      if (!result.success) {
        setSaveError(result.error || 'Failed to publish the course.')
        setSaving(false)
        return
      }
    }

    setSaving(false)
    setShowSuccessModal(true)
  }

  function handleSaveDraft() {
    navigate(coursesListRoute)
  }

  function handleBackToDashboard() {
    setShowSuccessModal(false)
    navigate(dashboardRoute)
  }

  function updateListItem(field: 'expectedOutcomes' | 'prerequisites', index: number, value: string) {
    setForm((f) => {
      const list = [...f[field]]
      list[index] = value
      return { ...f, [field]: list }
    })
  }
  function addListItem(field: 'expectedOutcomes' | 'prerequisites') {
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }))
  }
  function removeListItem(field: 'expectedOutcomes' | 'prerequisites', index: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }))
  }

  function updateLesson(id: string, patch: Partial<Lesson>) {
    setForm((f) => ({
      ...f,
      lessons: f.lessons.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }
  function addLesson() {
    setForm((f) => ({ ...f, lessons: [...f.lessons, emptyLesson()] }))
  }

  async function removeLesson(id: string) {
    const lesson = form.lessons.find((l) => l.id === id)
    setForm((f) => ({ ...f, lessons: f.lessons.filter((l) => l.id !== id) }))

    if (lesson?.remoteId) {
      const result = await coursesManageAPI.deleteLesson(lesson.remoteId)
      if (!result.success) {
        setSaveError(result.error || 'Lesson removed locally, but failed to delete it on the server.')
      }
    }

    // Note: this only removes the lesson locally/server-side — it does NOT
    // delete the underlying assignment via trainerAssignmentsAPI.remove().
    // Assignments are module-scoped, so the assignment may still be
    // relevant to other lessons/the module as a whole; deleting it here
    // could surprise the trainer. If a "delete lesson also deletes its
    // assignment" behavior is wanted, call trainerAssignmentsAPI.remove()
    // with lesson.assignmentRemoteId here (courseSlug must be set).
  }

  function openAssignmentModal(lessonId: string) {
    setAssignmentModalLessonId(lessonId)
  }
  function closeAssignmentModal() {
    setAssignmentModalLessonId(null)
  }
  function saveAssignmentDraft(lessonId: string, draft: AssignmentDraft) {
    updateLesson(lessonId, { assignment: draft })
    setAssignmentModalLessonId(null)
  }

  const totalLessons = form.lessons.length
  const assignmentModalLesson = form.lessons.find((l) => l.id === assignmentModalLessonId) ?? null

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
        <div className="ac-card">
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
                  <div className="ac-step">
                    <div className={`ac-step-circle ${status}`}>
                      {s.id < step ? <Check size={16} /> : s.id}
                    </div>
                    <span className={`ac-step-label ${status}`}>{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`ac-step-line ${s.id < step ? 'done' : ''}`} />}
                </div>
              )
            })}
          </div>

          <div className="ac-body">
            {saveError && <div className="ac-error">{saveError}</div>}

            {step === 1 && (
              <>
                <h3 className="ac-section-title">Course basics</h3>
                <p className="ac-section-sub">Start with the essential details learners will see first.</p>
                <div className="ac-grid">
                  <div className="ac-field">
                    <label className="ac-label">Course title <span className="ac-required">*</span></label>
                    <input
                      className="ac-input"
                      placeholder="e.g. Project Management Course"
                      value={form.title}
                      onChange={(e) => update('title', e.target.value)}
                    />
                    <p className="ac-hint">Keep it clear and specific — e.g. 'Project Management for Early-Career Professionals'</p>
                  </div>
                  <div className="ac-field">
                    <label className="ac-label">Subtitle / tagline</label>
                    <input
                      className="ac-input"
                      placeholder="e.g. Master the fundamentals of managing projects end-to-end"
                      value={form.subtitle}
                      onChange={(e) => update('subtitle', e.target.value)}
                    />
                    <p className="ac-hint">One line that expands on the title — appears in search results</p>
                  </div>

                  <div className="ac-field">
                    <label className="ac-label">Category <span className="ac-required">*</span></label>
                    <select className="ac-select" value={form.category} onChange={(e) => update('category', e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="ac-field">
                    <label className="ac-label">Language</label>
                    <select className="ac-select" value={form.language} onChange={(e) => update('language', e.target.value)}>
                      <option value="">Select language</option>
                      {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="ac-field full">
                    <label className="ac-label">Level <span className="ac-required">*</span></label>
                    <select
                      className="ac-select"
                      value={form.level}
                      onChange={(e) => update('level', e.target.value as CourseLevel)}
                    >
                      <option value="">e.g Beginner</option>
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
                        onChange={(e) =>
                          setForm((f) => ({ ...f, coverImage: e.target.files?.[0] ?? null }))
                        }
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
                    <p className="ac-hint">Recommended: 1280×720 px · JPG or PNG · max 5 MB · upload isn't wired up yet — the backend endpoint for this doesn't exist/isn't confirmed</p>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="ac-section-title">Course description</h3>
                <p className="ac-section-sub">Help learners decide if this course is right for them.</p>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">Full description <span className="ac-required">*</span></label>
                  <textarea
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
                        placeholder="e.g. Create a full project plan from initiation to closure"
                        value={item}
                        onChange={(e) => updateListItem('expectedOutcomes', i, e.target.value)}
                      />
                      <button className="ac-list-delete" onClick={() => removeListItem('expectedOutcomes', i)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="ac-add-item-btn" onClick={() => addListItem('expectedOutcomes')}>
                    <Plus size={16} /> Add item
                  </button>
                  <p className="ac-hint">List 4–8 concrete outcomes. These appear as bullet points on the course page.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">Target audience (short)</label>
                  <input
                    className="ac-input"
                    maxLength={80}
                    placeholder="e.g. Early-career project professionals"
                    value={form.targetAudience}
                    onChange={(e) => update('targetAudience', e.target.value)}
                  />
                  <p className="ac-hint">Shown as a short tag under the "Who this is for" paragraph — max 80 characters.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">Who this course is for</label>
                  <textarea
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
                        placeholder="e.g. No prior experience required"
                        value={item}
                        onChange={(e) => updateListItem('prerequisites', i, e.target.value)}
                      />
                      <button className="ac-list-delete" onClick={() => removeListItem('prerequisites', i)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="ac-add-item-btn" onClick={() => addListItem('prerequisites')}>
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
                  {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'}
                </p>

                {form.lessons.map((lesson, i) => (
                  <div className="ac-lesson-card" key={lesson.id}>
                    <div className="ac-lesson-head">
                      <span className="ac-lesson-num">{i + 1}</span>
                      <input
                        className="ac-lesson-title-input"
                        placeholder="Lesson title"
                        value={lesson.title}
                        onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                      />
                      <button className="ac-lesson-delete" onClick={() => removeLesson(lesson.id)} aria-label="Remove lesson">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="ac-lesson-desc-wrap">
                      <textarea
                        className="ac-lesson-desc"
                        placeholder="What does this lesson cover? (optional)"
                        value={lesson.description}
                        onChange={(e) => updateLesson(lesson.id, { description: e.target.value })}
                      />
                    </div>

                    <div className="ac-lesson-uploads">
                      <label className="ac-upload-chip">
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            updateLesson(lesson.id, { videoFile: e.target.files?.[0] ?? null, videoUploaded: false })
                          }
                        />
                        <div className="ac-upload-chip-icon"><Upload size={16} /></div>
                        <div>
                          <div className="ac-upload-chip-label">
                            {lesson.videoFile
                              ? lesson.videoFile.name
                              : lesson.existingVideoUrl
                                ? 'Video uploaded — tap to replace'
                                : 'Upload video'}
                          </div>
                          <p className="ac-upload-chip-sub">MP4, MOV, or WebM · max 2 GB</p>
                        </div>
                      </label>

                      <label className="ac-upload-chip">
                        <input
                          type="file"
                          multiple
                          accept=".doc,.docx,.xls,.xlsx,.pdf,.ppt,.pptx"
                          style={{ display: 'none' }}
                          onChange={(e) =>
                            updateLesson(lesson.id, {
                              materialFiles: Array.from(e.target.files ?? []),
                              materialsUploaded: false,
                            })
                          }
                        />
                        <div className="ac-upload-chip-icon"><Upload size={16} /></div>
                        <div>
                          <div className="ac-upload-chip-label">
                            {lesson.materialFiles.length > 0
                              ? `${lesson.materialFiles.length} file(s) selected`
                              : lesson.existingMaterialsCount > 0
                                ? `${lesson.existingMaterialsCount} material(s) uploaded — tap to add more`
                                : 'Upload Material(s)'}
                          </div>
                          <p className="ac-upload-chip-sub">Docx, Xlsx, PDF, PPTX · max 500 MB</p>
                        </div>
                      </label>

                      {lesson.assignment ? (
                        <div className="ac-assignment-status">
                          <span className="ac-assignment-added">
                            Added <Check size={14} />
                          </span>
                          <button
                            type="button"
                            className="ac-assignment-preview-link"
                            onClick={() => openAssignmentModal(lesson.id)}
                          >
                            Preview
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="ac-insert-assignment-btn"
                          onClick={() => openAssignmentModal(lesson.id)}
                        >
                          Insert assignment(s)
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button className="ac-add-lesson-btn" onClick={addLesson}>
                  <Plus size={16} /> Add lesson
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
                        checked={form.isFree}
                        onChange={(e) => update('isFree', e.target.checked)}
                      />
                      <span className="track" />
                    </label>
                  </div>
                  <div className="ac-price-block">
                    <label className="ac-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Price (NGN)</label>
                    <input
                      className="ac-input"
                      placeholder="e.g. 40,000"
                      disabled={form.isFree}
                      value={form.priceNaira}
                      onChange={(e) => update('priceNaira', e.target.value)}
                    />
                    <p className="ac-hint">Set a price for learners to enrol.</p>
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
                        checked={form.hasCertificate}
                        onChange={(e) => update('hasCertificate', e.target.checked)}
                      />
                      <span className="track" />
                    </label>
                  </div>
                </div>

                <p className="ac-toggle-title" style={{ marginBottom: '0.75rem' }}>Visibility</p>
                <div
                  className={`ac-visibility-option ${form.visibility === 'public' ? 'selected' : ''}`}
                  onClick={() => update('visibility', 'public')}
                >
                  <div className="ac-visibility-icon"><Globe size={18} /></div>
                  <div>
                    <p className="ac-visibility-title">Public</p>
                    <p className="ac-visibility-sub">Listed in the catalogue, open to all learners</p>
                  </div>
                  {form.visibility === 'public' && <Check size={18} className="ac-visibility-check" />}
                </div>
                <div
                  className={`ac-visibility-option ${form.visibility === 'hidden' ? 'selected' : ''}`}
                  onClick={() => update('visibility', 'hidden')}
                >
                  <div className="ac-visibility-icon"><Eye size={18} /></div>
                  <div>
                    <p className="ac-visibility-title">Hidden</p>
                    <p className="ac-visibility-sub">Not listed anywhere — for internal testing only</p>
                  </div>
                  {form.visibility === 'hidden' && <Check size={18} className="ac-visibility-check" />}
                </div>
                <p className="ac-hint" style={{ marginTop: '0.5rem' }}>
                  This only takes effect when you publish in the next step — it isn't saved yet.
                </p>
              </>
            )}

            {step === 5 && (
              <>
                <h3 className="ac-section-title">Review &amp; publish</h3>
                <p className="ac-section-sub">Check everything looks right before going live.</p>

                <div className="ac-preview-player">
                  {previewVideoSrc ? (
                    <video
                      key={previewVideoSrc}
                      className="ac-preview-video-real"
                      src={previewVideoSrc}
                      controls
                      preload="metadata"
                    />
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
                      <span className="ac-preview-badge"><Layers size={14} /> 1 module</span>
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
                    <span className="ac-review-row-value">1</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Lessons</span>
                    <span className="ac-review-row-value">{totalLessons}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Price</span>
                    <span className="ac-review-row-value">{form.isFree ? 'Free' : `₦${form.priceNaira || '0'}`}</span>
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
                <button className="ac-btn primary full" onClick={handleSubmit} disabled={saving}>
                  <Send size={18} /> {saving ? 'Publishing…' : form.visibility === 'public' ? 'Publish course' : 'Save as hidden'}
                </button>
                <button className="ac-btn secondary full" onClick={handleSaveDraft} disabled={saving}>
                  Save as draft
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="ac-modal-overlay">
          <div className="ac-modal">
            <div className="ac-modal-icon">
              <CheckCircle2 size={40} />
            </div>
            <h3 className="ac-modal-title">
              {form.visibility === 'public' ? 'Course Published!' : 'Course Saved!'}
            </h3>
            <p className="ac-modal-sub">
              {form.visibility === 'public'
                ? 'Your course is now live in the catalogue.'
                : 'Your course has been saved as hidden. You can publish it any time from your courses list.'}
            </p>
            <button className="ac-btn primary full" onClick={handleBackToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {assignmentModalLesson && (
        <AssignmentCreatorModal
          courseTitle={form.title || 'Untitled course'}
          moduleTitle="Module 1"
          initialData={assignmentModalLesson.assignment}
          onClose={closeAssignmentModal}
          onSave={(draft: AssignmentDraft) => saveAssignmentDraft(assignmentModalLesson.id, draft)}
        />
      )}
    </Shell>
  )
}