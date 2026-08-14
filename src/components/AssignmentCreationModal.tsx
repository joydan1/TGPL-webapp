// components/AssignmentCreatorModal.tsx
import { useState } from 'react'
import {
  X, Plus, Trash2, Upload, AlignLeft, ListChecks, Layers, Package,
  Award, Paperclip, ClipboardList, Image as ImageIcon,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// Maps to the trainer assignments API (see trainerAssignmentsAPI in
// services/api.ts): title, module_id, description, instructions, deadline,
// is_final, rubric. `onSave` still just hands the draft back to the parent
// wizard (AddCoursePage.tsx), which converts it to that payload — via
// draftToRubric/deadlineToISOString below — and calls the API once the
// lesson's module id is known. Nothing in this modal needs to change if
// that call site changes.
//
// Everything below "Resources & Templates" in the UI (cover images,
// "what you'll do" checklist, scenarios, deliverables, resource files,
// word count, accepted file types) has no equivalent field in the current
// backend contract. They're kept in local state so the trainer's input
// isn't silently lost, but they are NOT sent anywhere yet — only
// title / description / instructions / deadline / is_final / rubric are.
// Revisit this if/when the backend adds fields for them.
// ─────────────────────────────────────────────────────────────────────────

export type GradingCriterionDraft = {
  id: string
  criterion: string
  description: string
  points: string
}

export type AssignmentResourceDraft = {
  id: string
  title: string
  file: File
  sizeLabel: string
  ext: string
}

export type AssignmentDraft = {
  title: string
  description: string
  instructions: string
  deadline: string // value of a <input type="datetime-local"> — see deadlineToISOString()
  isFinal: boolean
  coverImages: File[]
  whatYoullDo: string[]
  scenarios: string[]
  deliverables: string[]
  gradingCriteria: GradingCriterionDraft[]
  resources: AssignmentResourceDraft[]
  wordCountMin: string
  wordCountMax: string
  acceptedFileTypes: string[]
}

const FILE_TYPE_OPTIONS = ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg', 'mp4']

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

export function emptyAssignmentDraft(): AssignmentDraft {
  return {
    title: '',
    description: '',
    instructions: '',
    deadline: '',
    isFinal: false,
    coverImages: [],
    whatYoullDo: [''],
    scenarios: [''],
    deliverables: [''],
    gradingCriteria: [{ id: makeId(), criterion: '', description: '', points: '' }],
    resources: [],
    wordCountMin: '',
    wordCountMax: '',
    acceptedFileTypes: ['pdf', 'docx'],
  }
}

function extOf(filename: string): string {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : ''
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${Math.round(bytes / 1024)} KB`
}

function extColor(ext: string): { bg: string; fg: string } {
  if (ext === 'xlsx' || ext === 'xls') return { bg: '#F0FDF4', fg: '#10B981' }
  if (ext === 'docx' || ext === 'doc') return { bg: '#EFF6FF', fg: '#2492EB' }
  if (ext === 'pdf') return { bg: '#FEF2F2', fg: '#EF4444' }
  if (ext === 'pptx' || ext === 'ppt') return { bg: '#FFF7ED', fg: '#EA580C' }
  return { bg: '#F7F7F7', fg: '#616873' }
}

// ─── Draft → API payload helpers ───────────────────────────────────────────

function slugifyCriterion(text: string, used: Set<string>): string {
  const base =
    text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'criterion'
  let key = base
  let i = 2
  while (used.has(key)) {
    key = `${base}_${i}`
    i += 1
  }
  used.add(key)
  return key
}

/** Sum of all grading-criteria weights — the backend requires this to equal 100. */
export function rubricWeightTotal(draft: AssignmentDraft): number {
  return draft.gradingCriteria.reduce((sum, c) => sum + (Number(c.points) || 0), 0)
}

/** Converts the editable grading-criteria rows into the rubric shape the API expects. */
export function draftToRubric(draft: AssignmentDraft): Record<string, { weight: number; description: string }> {
  const rubric: Record<string, { weight: number; description: string }> = {}
  const used = new Set<string>()
  draft.gradingCriteria
    .filter((c) => c.criterion.trim())
    .forEach((c) => {
      const key = slugifyCriterion(c.criterion, used)
      rubric[key] = { weight: Number(c.points) || 0, description: c.description.trim() }
    })
  return rubric
}

/**
 * `draft.deadline` comes from a <input type="datetime-local"> value
 * ("YYYY-MM-DDTHH:mm"), interpreted in the browser's local time zone.
 * The API wants a full ISO-8601 timestamp with an explicit offset.
 */
export function deadlineToISOString(localValue: string): string {
  if (!localValue) return ''
  const date = new Date(localValue)
  return date.toISOString()
}

const MODAL_CSS = `
  .acm-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.55); display: flex; align-items: flex-start; justify-content: center; padding: 2rem 1.5rem; z-index: 600; overflow-y: auto; }
  .acm-modal { width: 100%; max-width: 760px; background: #FFFFFF; border-radius: 24px; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }

  .acm-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 24px 24px 0; }
  .acm-head-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 18px; color: #2B2B2C; }
  .acm-head-close { width: 32px; height: 32px; border-radius: 50%; border: none; background: #F7F7F7; color: #616873; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
  .acm-head-close:hover { background: #EBEBEB; }

  .acm-body { padding: 24px; display: flex; flex-direction: column; gap: 32px; box-sizing: border-box; }

  /* top identity fields */
  .acm-top-fields { display: flex; flex-wrap: wrap; gap: 16px; box-sizing: border-box; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 16px; padding: 21px 25px; }
  .acm-field-half { flex: 1 1 260px; display: flex; flex-direction: column; gap: 6px; }
  .acm-field-full { flex: 1 1 100%; display: flex; flex-direction: column; gap: 6px; }
  .acm-field-label { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 11px; line-height: 16px; letter-spacing: 0.55px; text-transform: uppercase; color: #99A1AF; }
  .acm-input, .acm-textarea { box-sizing: border-box; width: 100%; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0 12px; height: 40px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 14px; color: #2B2B2C; }
  .acm-input.readonly { color: #616873; font-weight: 400; }
  .acm-textarea { height: auto; padding: 12px 16px; min-height: 90px; font-weight: 400; font-size: 13px; line-height: 21px; resize: vertical; }

  .acm-toggle-field { flex: 1 1 260px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .acm-toggle-labels { display: flex; flex-direction: column; gap: 2px; }
  .acm-toggle-title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; color: #2B2B2C; }
  .acm-toggle-sub { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; color: #99A1AF; }
  .acm-toggle { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
  .acm-toggle input { opacity: 0; width: 0; height: 0; }
  .acm-toggle .track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; cursor: pointer; transition: background 0.15s; }
  .acm-toggle .track::before { content: ''; position: absolute; height: 16px; width: 16px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.15s; }
  .acm-toggle input:checked + .track { background: #2492EB; }
  .acm-toggle input:checked + .track::before { transform: translateX(18px); }

  .acm-field-error { font-family: 'Sora', sans-serif; font-weight: 500; font-size: 11px; color: #DC2626; }

  /* section header (icon + title + sub) */
  .acm-section { display: flex; flex-direction: column; gap: 12px; }
  .acm-section-head { display: flex; align-items: center; gap: 10px; }
  .acm-section-icon { width: 28px; height: 28px; border-radius: 10px; background: #E9F5FF; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .acm-section-title { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; color: #2B2B2C; }
  .acm-section-sub { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 11px; line-height: 16px; color: #99A1AF; margin-top: 2px; }
  .acm-section-card { box-sizing: border-box; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 16px; padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; }

  /* instructions card */
  .acm-cover-label { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; color: #2B2B2C; }
  .acm-cover-dropzone { box-sizing: border-box; border: 2px dashed #D1D5DB; border-radius: 14px; padding: 20px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-align: center; }
  .acm-cover-dropzone:hover { background: #FAFAFA; }
  .acm-cover-dz-icon { width: 40px; height: 40px; border-radius: 14px; background: #F7F7F7; border: 1px solid #EBEBEB; display: flex; align-items: center; justify-content: center; color: #99A1AF; }
  .acm-cover-dz-label { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; color: #99A1AF; }
  .acm-cover-dz-sub { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 11px; color: #C4C9D4; }
  .acm-cover-thumbs { display: flex; gap: 10px; flex-wrap: wrap; }
  .acm-cover-thumb { position: relative; width: 96px; height: 72px; border-radius: 10px; overflow: hidden; border: 1px solid #EBEBEB; }
  .acm-cover-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .acm-cover-thumb-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 50%; background: rgba(17,24,39,0.65); border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }

  /* editable list rows */
  .acm-list-row { display: flex; align-items: center; gap: 8px; }
  .acm-list-bullet-wrap { padding-top: 2px; flex-shrink: 0; }
  .acm-list-checkbox { width: 16px; height: 16px; border: 1px solid #D1D5DB; border-radius: 4px; background: #fff; }
  .acm-list-circle { width: 16px; height: 16px; border: 1px solid #D1D5DB; border-radius: 50%; background: #fff; }
  .acm-list-numbered { width: 20px; height: 20px; border-radius: 8px; background: #E9F5FF; color: #2492EB; font-family: 'Sora', sans-serif; font-weight: 700; font-size: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .acm-list-input { flex: 1; box-sizing: border-box; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0 12px; height: 36px; font-family: 'Sora', sans-serif; font-weight: 400; font-size: 13px; color: #2B2B2C; }
  .acm-list-remove { width: 24px; height: 24px; border: none; background: none; color: #99A1AF; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .acm-list-remove:hover { color: #DC2626; }

  .acm-add-item-btn { box-sizing: border-box; display: inline-flex; align-items: center; gap: 8px; padding: 0 12px; height: 32px; border: 1px dashed #2492EB; border-radius: 14px; background: none; font-family: 'Sora', sans-serif; font-weight: 500; font-size: 12px; color: #2492EB; cursor: pointer; align-self: flex-start; }
  .acm-add-item-btn:hover { background: #EFF6FF; }
  .acm-add-item-btn.muted { border-color: #D1D5DB; color: #99A1AF; }
  .acm-add-item-btn.muted:hover { background: #FAFAFA; }

  /* grading table */
  .acm-grading-table { box-sizing: border-box; border: 1px solid #EBEBEB; border-radius: 14px; overflow: hidden; }
  .acm-grading-head { display: grid; grid-template-columns: 1.6fr 2fr 0.7fr 32px; gap: 8px; background: #FAFAFA; border-bottom: 1px solid #F3F4F6; padding: 10px 16px; }
  .acm-grading-head span { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 0.55px; text-transform: uppercase; color: #99A1AF; }
  .acm-grading-row { display: grid; grid-template-columns: 1.6fr 2fr 0.7fr 32px; gap: 8px; align-items: center; padding: 10px 16px; border-bottom: 1px solid #F9FAFB; }
  .acm-grading-input { box-sizing: border-box; width: 100%; border: 1px solid transparent; border-radius: 10px; padding: 6px 8px; font-family: 'Sora', sans-serif; font-weight: 400; font-size: 12px; color: #2B2B2C; background: transparent; }
  .acm-grading-input:focus { border-color: #EBEBEB; background: #FAFAFA; outline: none; }
  .acm-grading-input.points { color: #2492EB; font-weight: 600; }
  .acm-grading-remove { width: 24px; height: 24px; border: none; background: none; color: #C4C9D4; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .acm-grading-remove:hover { color: #DC2626; }
  .acm-grading-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #FAFAFA; border-top: 1px solid #F3F4F6; }
  .acm-grading-add-btn { border: none; background: none; display: flex; align-items: center; gap: 6px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; color: #2492EB; cursor: pointer; }
  .acm-grading-total { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 13px; color: #2B2B2C; }
  .acm-grading-total.warn { color: #EA580C; }
  .acm-grading-total.ok { color: #059669; }

  /* resources */
  .acm-resource-row { box-sizing: border-box; display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #FAFAFA; border: 1px solid #EBEBEB; border-radius: 14px; }
  .acm-resource-icon { width: 32px; height: 32px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .acm-resource-info { flex: 1; min-width: 0; }
  .acm-resource-title { font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; color: #2B2B2C; word-break: break-word; }
  .acm-resource-meta { font-family: 'Sora', sans-serif; font-weight: 400; font-size: 10px; letter-spacing: 0.25px; text-transform: uppercase; color: #99A1AF; margin-top: 2px; }
  .acm-resource-remove { border: none; background: none; color: #99A1AF; cursor: pointer; flex-shrink: 0; display: flex; }
  .acm-resource-remove:hover { color: #DC2626; }
  .acm-resource-dropzone { box-sizing: border-box; border: 2px dashed #D1D5DB; border-radius: 14px; padding: 20px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; text-align: center; }
  .acm-resource-dropzone:hover { background: #FAFAFA; }

  /* submission requirements */
  .acm-wc-row { display: flex; align-items: center; gap: 12px; }
  .acm-wc-input-wrap { position: relative; width: 140px; }
  .acm-wc-input { box-sizing: border-box; width: 100%; background: #F7F7F7; border: 1px solid #EBEBEB; border-radius: 14px; padding: 0 40px 0 12px; height: 36px; font-family: 'Sora', sans-serif; font-weight: 400; font-size: 13px; color: #2B2B2C; }
  .acm-wc-suffix { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-family: 'Sora', sans-serif; font-size: 10px; color: #99A1AF; pointer-events: none; }
  .acm-wc-to { font-family: 'Sora', sans-serif; font-size: 12px; color: #99A1AF; }
  .acm-wc-words { font-family: 'Sora', sans-serif; font-size: 12px; color: #99A1AF; }

  .acm-filetype-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .acm-filetype-chip { box-sizing: border-box; padding: 0 12px; height: 32px; border-radius: 14px; border: 1px solid #EBEBEB; background: #fff; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 12px; color: #99A1AF; cursor: pointer; }
  .acm-filetype-chip.active { background: #E9F5FF; border-color: #2492EB; color: #2492EB; }

  /* footer */
  .acm-footer { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 20px 24px; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .acm-footer-warning { font-family: 'Sora', sans-serif; font-weight: 500; font-size: 12px; color: #DC2626; flex: 1 1 100%; text-align: right; }
  .acm-btn-cancel { box-sizing: border-box; padding: 0 20px; height: 40px; background: #FFFFFF; border: 1px solid #EBEBEB; border-radius: 14px; font-family: 'Sora', sans-serif; font-weight: 600; font-size: 13px; color: #616873; cursor: pointer; }
  .acm-btn-cancel:hover { background: #F7F7F7; }
  .acm-btn-save { display: flex; align-items: center; gap: 8px; padding: 0 24px; height: 40px; background: #2492EB; border: none; border-radius: 14px; box-shadow: 0 1px 3px rgba(36,146,235,0.2), 0 1px 2px -1px rgba(36,146,235,0.2); font-family: 'Sora', sans-serif; font-weight: 700; font-size: 13px; color: #FFFFFF; cursor: pointer; }
  .acm-btn-save:hover { opacity: 0.92; }
  .acm-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  @media (max-width: 640px) {
    .acm-overlay { padding: 0; align-items: flex-end; }
    .acm-modal { max-width: 100%; border-radius: 20px 20px 0 0; max-height: 92vh; overflow-y: auto; }
    .acm-top-fields { padding: 16px; }
    .acm-body { padding: 16px; gap: 24px; }
    .acm-grading-head, .acm-grading-row { grid-template-columns: 1fr 1fr 0.6fr 24px; }
  }
`

type ListField = 'whatYoullDo' | 'scenarios' | 'deliverables'

function EditableList({
  items,
  variant,
  placeholder,
  addLabel,
  addMuted,
  onUpdate,
  onAdd,
  onRemove,
}: {
  items: string[]
  variant: 'checkbox' | 'bullet' | 'numbered'
  placeholder: string
  addLabel: string
  addMuted?: boolean
  onUpdate: (index: number, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}) {
  return (
    <>
      {items.map((item, i) => (
        <div className="acm-list-row" key={i}>
          <div className="acm-list-bullet-wrap">
            {variant === 'checkbox' && <div className="acm-list-checkbox" />}
            {variant === 'bullet' && <div className="acm-list-circle" />}
            {variant === 'numbered' && <div className="acm-list-numbered">{i + 1}</div>}
          </div>
          <input
            className="acm-list-input"
            placeholder={placeholder}
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
          />
          <button type="button" className="acm-list-remove" onClick={() => onRemove(i)} aria-label="Remove item">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className={`acm-add-item-btn${addMuted ? ' muted' : ''}`} onClick={onAdd}>
        <Plus size={12} /> {addLabel}
      </button>
    </>
  )
}

export default function AssignmentCreatorModal({
  courseTitle,
  moduleTitle,
  initialData,
  onClose,
  onSave,
}: {
  courseTitle: string
  moduleTitle: string
  initialData: AssignmentDraft | null
  onClose: () => void
  onSave: (draft: AssignmentDraft) => void
}) {
  const [draft, setDraft] = useState<AssignmentDraft>(initialData ?? emptyAssignmentDraft())

  function update<K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function updateListItem(field: ListField, index: number, value: string) {
    setDraft((d) => {
      const list = [...d[field]]
      list[index] = value
      return { ...d, [field]: list }
    })
  }
  function addListItem(field: ListField) {
    setDraft((d) => ({ ...d, [field]: [...d[field], ''] }))
  }
  function removeListItem(field: ListField, index: number) {
    setDraft((d) => ({ ...d, [field]: d[field].filter((_, i) => i !== index) }))
  }

  function addCriterion() {
    setDraft((d) => ({
      ...d,
      gradingCriteria: [...d.gradingCriteria, { id: makeId(), criterion: '', description: '', points: '' }],
    }))
  }
  function updateCriterion(id: string, patch: Partial<GradingCriterionDraft>) {
    setDraft((d) => ({
      ...d,
      gradingCriteria: d.gradingCriteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
  }
  function removeCriterion(id: string) {
    setDraft((d) => ({ ...d, gradingCriteria: d.gradingCriteria.filter((c) => c.id !== id) }))
  }
  const totalPoints = rubricWeightTotal(draft)
  const hasCriteria = draft.gradingCriteria.some((c) => c.criterion.trim())
  const rubricValid = !hasCriteria || totalPoints === 100

  function addCoverImages(files: FileList | null) {
    if (!files) return
    setDraft((d) => ({ ...d, coverImages: [...d.coverImages, ...Array.from(files)].slice(0, 2) }))
  }
  function removeCoverImage(index: number) {
    setDraft((d) => ({ ...d, coverImages: d.coverImages.filter((_, i) => i !== index) }))
  }

  function addResourceFiles(files: FileList | null) {
    if (!files) return
    const newResources: AssignmentResourceDraft[] = Array.from(files).map((file) => ({
      id: makeId(),
      title: file.name,
      file,
      sizeLabel: formatSize(file.size),
      ext: extOf(file.name),
    }))
    setDraft((d) => ({ ...d, resources: [...d.resources, ...newResources] }))
  }
  function removeResource(id: string) {
    setDraft((d) => ({ ...d, resources: d.resources.filter((r) => r.id !== id) }))
  }

  function toggleFileType(type: string) {
    setDraft((d) => ({
      ...d,
      acceptedFileTypes: d.acceptedFileTypes.includes(type)
        ? d.acceptedFileTypes.filter((t) => t !== type)
        : [...d.acceptedFileTypes, type],
    }))
  }

  const deadlineDate = draft.deadline ? new Date(draft.deadline) : null
  const deadlineMissing = !draft.deadline
  const deadlineInPast = !!deadlineDate && deadlineDate.getTime() < Date.now()

  const canSave = draft.title.trim().length > 0 && !deadlineMissing && !deadlineInPast && rubricValid

  function handleSave() {
    if (!canSave) return
    onSave(draft)
  }

  return (
    <div className="acm-overlay" onClick={onClose}>
      <style>{MODAL_CSS}</style>
      <div className="acm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="acm-head">
          <span className="acm-head-title">{initialData ? 'Edit assignment' : 'Add assignment'}</span>
          <button className="acm-head-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="acm-body">
          {/* Assignment title / Module / Course / Deadline / Final */}
          <div className="acm-top-fields">
            <div className="acm-field-half">
              <span className="acm-field-label">Assignment title</span>
              <input
                className="acm-input"
                placeholder="e.g. Stakeholder Map Project"
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
              />
            </div>
            <div className="acm-field-half">
              <span className="acm-field-label">Module</span>
              <input className="acm-input readonly" value={moduleTitle} readOnly />
            </div>
            <div className="acm-field-full">
              <span className="acm-field-label">Course</span>
              <input className="acm-input readonly" value={courseTitle} readOnly />
            </div>

            <div className="acm-field-full">
              <span className="acm-field-label">Short description</span>
              <textarea
                className="acm-textarea"
                style={{ minHeight: 60 }}
                placeholder="One or two sentences summarizing the assignment"
                value={draft.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>

            <div className="acm-field-half">
              <span className="acm-field-label">Deadline</span>
              <input
                type="datetime-local"
                className="acm-input"
                value={draft.deadline}
                onChange={(e) => update('deadline', e.target.value)}
              />
              {deadlineInPast && <span className="acm-field-error">Deadline must be in the future.</span>}
            </div>

            <div className="acm-toggle-field">
              <div className="acm-toggle-labels">
                <span className="acm-toggle-title">Final assignment</span>
                <span className="acm-toggle-sub">Only one allowed per course</span>
              </div>
              <label className="acm-toggle">
                <input
                  type="checkbox"
                  checked={draft.isFinal}
                  onChange={(e) => update('isFinal', e.target.checked)}
                />
                <span className="track" />
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><AlignLeft size={15} /></div>
              <div>
                <div className="acm-section-title">Instructions</div>
                <div className="acm-section-sub">Main task description shown to learners at the top</div>
              </div>
            </div>
            <div className="acm-section-card">
              <textarea
                className="acm-textarea"
                placeholder="Describe the assignment task in full…"
                value={draft.instructions}
                onChange={(e) => update('instructions', e.target.value)}
              />
              <div>
                <div className="acm-cover-label" style={{ marginBottom: 8 }}>
                  Cover images (optional — up to 2 images shown side by side)
                </div>
                {draft.coverImages.length > 0 && (
                  <div className="acm-cover-thumbs" style={{ marginBottom: 10 }}>
                    {draft.coverImages.map((file, i) => (
                      <div className="acm-cover-thumb" key={i}>
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <button className="acm-cover-thumb-remove" onClick={() => removeCoverImage(i)} aria-label="Remove image">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {draft.coverImages.length < 2 && (
                  <label className="acm-cover-dropzone">
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => addCoverImages(e.target.files)}
                    />
                    <div className="acm-cover-dz-icon"><ImageIcon size={18} /></div>
                    <span className="acm-cover-dz-label">Upload image</span>
                    <span className="acm-cover-dz-sub">JPG, PNG — max 10 MB</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* What you'll do */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><ListChecks size={15} /></div>
              <div>
                <div className="acm-section-title">What you'll do</div>
                <div className="acm-section-sub">Checklist of learning actions learners will complete</div>
              </div>
            </div>
            <div className="acm-section-card">
              <EditableList
                items={draft.whatYoullDo}
                variant="checkbox"
                placeholder="e.g. Identify all key stakeholders for your chosen project"
                addLabel="Add item"
                onUpdate={(i, v) => updateListItem('whatYoullDo', i, v)}
                onAdd={() => addListItem('whatYoullDo')}
                onRemove={(i) => removeListItem('whatYoullDo', i)}
              />
            </div>
          </div>

          {/* Project scenarios */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><Layers size={15} /></div>
              <div>
                <div className="acm-section-title">Project scenarios</div>
                <div className="acm-section-sub">Learners pick one of these as the context for their submission</div>
              </div>
            </div>
            <div className="acm-section-card">
              <EditableList
                items={draft.scenarios}
                variant="bullet"
                placeholder="e.g. A new community health clinic opening in a mid-sized city"
                addLabel="Add item"
                addMuted
                onUpdate={(i, v) => updateListItem('scenarios', i, v)}
                onAdd={() => addListItem('scenarios')}
                onRemove={(i) => removeListItem('scenarios', i)}
              />
            </div>
          </div>

          {/* Deliverables */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><Package size={15} /></div>
              <div>
                <div className="acm-section-title">Deliverables</div>
                <div className="acm-section-sub">Specific outputs learners must submit to complete this assignment</div>
              </div>
            </div>
            <div className="acm-section-card">
              <EditableList
                items={draft.deliverables}
                variant="numbered"
                placeholder="e.g. Completed stakeholder map using the provided template"
                addLabel="Add item"
                addMuted
                onUpdate={(i, v) => updateListItem('deliverables', i, v)}
                onAdd={() => addListItem('deliverables')}
                onRemove={(i) => removeListItem('deliverables', i)}
              />
            </div>
          </div>

          {/* Grading criteria */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><Award size={15} /></div>
              <div>
                <div className="acm-section-title">Grading criteria</div>
                <div className="acm-section-sub">Breakdown of how submissions are scored —must add up to 100</div>
              </div>
            </div>
            <div className="acm-grading-table">
              <div className="acm-grading-head">
                <span>Criterion</span>
                <span>Description</span>
                <span>Weight %</span>
                <span />
              </div>
              {draft.gradingCriteria.map((c) => (
                <div className="acm-grading-row" key={c.id}>
                  <input
                    className="acm-grading-input"
                    placeholder="Stakeholder identification"
                    value={c.criterion}
                    onChange={(e) => updateCriterion(c.id, { criterion: e.target.value })}
                  />
                  <input
                    className="acm-grading-input"
                    placeholder="All key stakeholders identified and correctly placed"
                    value={c.description}
                    onChange={(e) => updateCriterion(c.id, { description: e.target.value })}
                  />
                  <input
                    className="acm-grading-input points"
                    placeholder="40"
                    inputMode="numeric"
                    value={c.points}
                    onChange={(e) => updateCriterion(c.id, { points: e.target.value.replace(/[^0-9]/g, '') })}
                  />
                  <button className="acm-grading-remove" onClick={() => removeCriterion(c.id)} aria-label="Remove criterion">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="acm-grading-footer">
                <button className="acm-grading-add-btn" onClick={addCriterion}>
                  <Plus size={12} /> Add criterion
                </button>
                <span className={`acm-grading-total${hasCriteria ? (totalPoints === 100 ? ' ok' : ' warn') : ''}`}>
                  {totalPoints} / 100
                </span>
              </div>
            </div>
          </div>

          {/* Resources & Templates */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><Paperclip size={15} /></div>
              <div>
                <div className="acm-section-title">Resources &amp; Templates</div>
                <div className="acm-section-sub">Files and links learners can download before starting </div>
              </div>
            </div>
            <div className="acm-section-card">
              {draft.resources.map((r) => {
                const colors = extColor(r.ext)
                return (
                  <div className="acm-resource-row" key={r.id}>
                    <div className="acm-resource-icon" style={{ background: colors.bg, color: colors.fg }}>
                      <Paperclip size={14} />
                    </div>
                    <div className="acm-resource-info">
                      <div className="acm-resource-title">{r.title}</div>
                      <div className="acm-resource-meta">.{r.ext} · {r.sizeLabel}</div>
                    </div>
                    <button className="acm-resource-remove" onClick={() => removeResource(r.id)} aria-label={`Remove ${r.title}`}>
                      <X size={16} />
                    </button>
                  </div>
                )
              })}
              <label className="acm-resource-dropzone">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => addResourceFiles(e.target.files)}
                />
                <div className="acm-cover-dz-icon"><Upload size={18} /></div>
                <span className="acm-cover-dz-label">Upload file or add link</span>
                <span className="acm-cover-dz-sub">PDF, DOCX, XLSX, PNG — max 20 MB each</span>
              </label>
            </div>
          </div>

          {/* Submission requirements */}
          <div className="acm-section">
            <div className="acm-section-head">
              <div className="acm-section-icon"><ClipboardList size={15} /></div>
              <div>
                <div className="acm-section-title">Submission requirements</div>
                <div className="acm-section-sub">Rules and constraints for learner submissions </div>
              </div>
            </div>
            <div className="acm-section-card">
              <div>
                <div className="acm-cover-label" style={{ marginBottom: 8 }}>Word count range</div>
                <div className="acm-wc-row">
                  <div className="acm-wc-input-wrap">
                    <input
                      className="acm-wc-input"
                      placeholder="250"
                      inputMode="numeric"
                      value={draft.wordCountMin}
                      onChange={(e) => update('wordCountMin', e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <span className="acm-wc-suffix">min</span>
                  </div>
                  <span className="acm-wc-to">to</span>
                  <div className="acm-wc-input-wrap">
                    <input
                      className="acm-wc-input"
                      placeholder="500"
                      inputMode="numeric"
                      value={draft.wordCountMax}
                      onChange={(e) => update('wordCountMax', e.target.value.replace(/[^0-9]/g, ''))}
                    />
                    <span className="acm-wc-suffix">max</span>
                  </div>
                  <span className="acm-wc-words">words</span>
                </div>
              </div>

              <div>
                <div className="acm-cover-label" style={{ marginBottom: 8 }}>Accepted file types</div>
                <div className="acm-filetype-row">
                  {FILE_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`acm-filetype-chip${draft.acceptedFileTypes.includes(type) ? ' active' : ''}`}
                      onClick={() => toggleFileType(type)}
                    >
                      .{type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="acm-footer">
          {!rubricValid && (
            <span className="acm-footer-warning">Grading weights must add up to 100 before saving.</span>
          )}
          {deadlineMissing && (
            <span className="acm-footer-warning">Set a deadline before saving.</span>
          )}
          <button className="acm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="acm-btn-save" onClick={handleSave} disabled={!canSave}>
            {initialData ? 'Save changes' : 'Add assignment'}
          </button>
        </div>
      </div>
    </div>
  )
}