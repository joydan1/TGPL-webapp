// pages/app/trainer/courses/TrainerCourseManagePage.tsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronUp, ChevronDown, Plus, Trash2, Check, X, Loader2, Pencil } from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import { ROUTES, RouteBuilder } from '../../../../constants/routes'
import {
  coursesManageAPI,
  type CourseDraft,
  type CourseCurriculumModule,
  type CourseLevel,
} from '../../../../services/api'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import { useConfirm } from '../../../../hooks/useConfirm'

const MAX_AUDIENCE_ITEM_LENGTH = 80

const CATEGORY_OPTIONS = ['Management', 'Leadership', 'Data & Analytics', 'Product', 'Design', 'Engineering']
const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese']
const LEVEL_OPTIONS: { label: string; value: CourseLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
]

// "Managers, Analysts" -> ['Managers', 'Analysts'] (same format AddCoursePage saves)
function parseAudience(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim().slice(0, MAX_AUDIENCE_ITEM_LENGTH))
    .filter(Boolean)
}

// Returns a copy of `list` with the item at `index` moved one step up (-1) or down (+1),
// or null when it's already at that end.
function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return null
  const next = [...list]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

const PAGE_CSS = `
  .cm-page { padding: 1rem; background: #F5F5F5; }
  .cm-container { max-width: 860px; margin: 0 auto; display: grid; gap: 1.25rem; }

  .cm-spin { animation: cm-spin 1s linear infinite; }
  @keyframes cm-spin { to { transform: rotate(360deg); } }

  .cm-header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .cm-back-btn { background: #fff; border: 1px solid #E5E7EB; border-radius: 999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #111; flex-shrink: 0; }
  .cm-title-block { min-width: 0; flex: 1; }
  .cm-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; overflow-wrap: anywhere; }
  .cm-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: capitalize; margin-left: 0.6rem; vertical-align: middle; }
  .cm-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .cm-status-badge.published { background: #DCFCE7; color: #16A34A; }
  .cm-status-badge.archived { background: #F3F4F6; color: #6B7280; }

  .cm-publish-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .cm-btn { border-radius: 999px; padding: 0.7rem 1.2rem; font-weight: 700; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; border: none; }
  .cm-btn.primary { background: #2492EB; color: #fff; }
  .cm-btn.secondary { background: #fff; color: #2492EB; border: 1px solid #2492EB; }
  .cm-btn.unpublish { background: #FEF3C7; color: #D97706; }
  .cm-btn.publish { background: #DCFCE7; color: #16A34A; }
  .cm-btn:disabled { opacity: 0.6; cursor: default; }

  .cm-edit-full { width: 100%; }

  .cm-card { background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; overflow: hidden; }
  .cm-card-header { padding: 1.1rem 1.25rem; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .cm-card-title { margin: 0; font-size: 1rem; font-weight: 700; color: #111827; }
  .cm-card-body { padding: 1.25rem; }

  .cm-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .cm-field { display: grid; gap: 0.45rem; }
  .cm-label { font-weight: 700; color: #111827; font-size: 0.85rem; }
  .cm-hint { margin: 0; color: #9CA3AF; font-size: 0.75rem; }
  .cm-input, .cm-select, .cm-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.75rem 0.9rem; font-size: 0.875rem; color: #111; background: #fff; font-family: inherit; }
  .cm-textarea { resize: vertical; min-height: 100px; }

  .cm-save-row { display: flex; justify-content: flex-end; margin-top: 1.1rem; }
  .cm-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  .cm-certificate-warning { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.85rem 1rem; border: 1px solid #FDE68A; border-radius: 0.75rem; background: #FFFBEB; color: #92400E; font-size: 0.85rem; }
  .cm-certificate-warning button { border: 0; background: none; color: inherit; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
  .cm-success-note { color: #16A34A; font-size: 0.8rem; font-weight: 600; }

  .cm-module { border: 1px solid #E5E7EB; border-radius: 0.9rem; margin-bottom: 0.85rem; overflow: hidden; }
  .cm-module-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 0.9rem; background: #F9FAFB; }
  .cm-move-group { display: flex; flex-shrink: 0; }
  .cm-icon-btn:disabled { opacity: 0.3; cursor: default; }
  .cm-icon-btn:disabled:hover { color: #9CA3AF; }
  .cm-module-title-input { flex: 1; min-width: 0; border: none; background: none; font-weight: 700; font-size: 0.9rem; color: #111; outline: none; }
  .cm-icon-btn { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.35rem; flex-shrink: 0; display: flex; }
  .cm-icon-btn:hover { color: #374151; }
  .cm-icon-btn.danger:hover { color: #EF4444; }

  .cm-lesson-list { padding: 0.5rem 0.9rem 0.75rem; display: grid; gap: 0.5rem; }
  .cm-lesson-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.7rem; border: 1px solid #F1F3F5; border-radius: 0.6rem; }
  .cm-lesson-title-input { flex: 1; min-width: 0; border: none; background: none; font-size: 0.85rem; color: #111; outline: none; }

  .cm-add-lesson-btn, .cm-add-module-btn { display: flex; align-items: center; gap: 0.4rem; border: 1px dashed #D1D5DB; background: none; color: #6B7280; font-weight: 700; font-size: 0.8rem; border-radius: 0.6rem; padding: 0.55rem 0.8rem; cursor: pointer; width: 100%; justify-content: center; }
  .cm-add-lesson-btn:hover, .cm-add-module-btn:hover { background: #F9FAFB; }
  .cm-add-lesson-btn:disabled, .cm-add-module-btn:disabled { opacity: 0.6; cursor: default; }

  @media (min-width: 640px) {
    .cm-page { padding: 1.5rem; }
    .cm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cm-grid .cm-field.full { grid-column: 1 / -1; }
    .cm-edit-full { width: auto; }
  }

  @media (min-width: 1024px) {
    .cm-page { padding: 1.5rem 2rem 2rem; }
  }
`

export default function TrainerCourseManagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()

  const [course, setCourse] = useState<CourseDraft | null>(null)
  const [modules, setModules] = useState<CourseCurriculumModule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<CourseDraft>>({})
  // Raw text for the audience field so typing a comma never gets swallowed.
  const [audienceText, setAudienceText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState(false)

  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const [curriculumBusy, setCurriculumBusy] = useState(false)
  const [curriculumError, setCurriculumError] = useState<string | null>(null)
  const [reordering, setReordering] = useState(false)

  // Last title known to be saved on the server, for every module and lesson id.
  // Lets a blur restore the old title when the field was cleared, and skip needless saves.
  const savedTitles = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const courseId = id

    async function load() {
      setLoading(true)
      setLoadError(null)
      const [draftRes, curriculumRes] = await Promise.all([
        coursesManageAPI.getDraft(courseId),
        coursesManageAPI.getCurriculum(courseId),
      ])
      if (cancelled) return

      if (draftRes.success) {
        setCourse(draftRes.data)
        setForm(draftRes.data)
        setAudienceText((draftRes.data.target_audience ?? []).join(', '))
      } else {
        setLoadError(draftRes.error)
      }

      if (curriculumRes.success) {
        const loaded = curriculumRes.data.map((m) => ({ ...m, lessons: m.lessons ?? [] }))
        const titles: Record<string, string> = {}
        loaded.forEach((m) => {
          titles[m.id] = m.title ?? ''
          m.lessons.forEach((l) => {
            titles[l.id] = l.title ?? ''
          })
        })
        savedTitles.current = titles
        setModules(loaded)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  function updateForm<K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSavedNote(false)
  }

  async function handleSaveDetails() {
    if (!id) return
    setSaving(true)
    setSaveError(null)
    setSavedNote(false)

    const result = await coursesManageAPI.updateDraft(id, {
      title: form.title,
      subtitle: form.subtitle,
      category: form.category,
      language: form.language,
      level: form.level,
      description: form.description,
      expected_outcomes: form.expected_outcomes,
      target_audience: parseAudience(audienceText),
      audience_description: form.audience_description,
      prerequisites: form.prerequisites,
      is_free: form.is_free,
      price_kobo: form.price_kobo,
      has_certificate: form.has_certificate,
    })

    setSaving(false)
    if (!result.success) {
      setSaveError(result.error)
      return
    }
    setCourse(result.data)
    setForm(result.data)
    setAudienceText((result.data.target_audience ?? []).join(', '))
    setSavedNote(true)
  }

  async function handlePublish() {
    if (!id) return
    setPublishing(true)
    setPublishError(null)
    const result = await coursesManageAPI.publishDraft(id)
    setPublishing(false)
    if (!result.success) {
      setPublishError(result.error)
      return
    }
    setCourse(result.data)
  }

  async function handleUnpublish() {
    if (!id) return
    setPublishing(true)
    setPublishError(null)
    const result = await coursesManageAPI.unpublishDraft(id)
    setPublishing(false)
    if (!result.success) {
      setPublishError(result.error)
      return
    }
    setCourse(result.data)
  }

  async function handleAddModule() {
    if (!id) return
    setCurriculumBusy(true)
    setCurriculumError(null)
    const title = `Module ${modules.length + 1}`
    const result = await coursesManageAPI.createModule(id, title)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    savedTitles.current[result.data.id] = result.data.title ?? title
    setModules((prev) => [...prev, { ...result.data, lessons: [] }])
  }

  function handleRenameModule(moduleId: string, title: string) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)))
  }

  async function handleModuleBlur(moduleId: string, title: string) {
    const saved = savedTitles.current[moduleId] ?? ''
    const trimmed = title.trim()

    // Cleared field: put the last saved title back instead of leaving it empty.
    if (!trimmed) {
      handleRenameModule(moduleId, saved)
      return
    }
    if (trimmed === saved) return

    const result = await coursesManageAPI.updateModule(moduleId, { title: trimmed })
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    savedTitles.current[moduleId] = trimmed
  }

  async function handleDeleteModule(moduleId: string) {
    const mod = modules.find((m) => m.id === moduleId)
    const lessonCount = mod?.lessons.length ?? 0
    const lessonWarning =
      lessonCount > 0
        ? ` This will also delete ${lessonCount} lesson${lessonCount === 1 ? '' : 's'} inside it.`
        : ''

    const confirmed = await confirm({
      title: `Delete "${mod?.title || 'this module'}"?`,
      message: `This can't be undone.${lessonWarning}`,
      confirmLabel: 'Delete module',
      destructive: true,
    })
    if (!confirmed) return

    setCurriculumBusy(true)
    setCurriculumError(null)
    const result = await coursesManageAPI.deleteModule(moduleId)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    setModules((prev) => prev.filter((m) => m.id !== moduleId))
  }

  async function handleAddLesson(moduleId: string) {
    setCurriculumBusy(true)
    setCurriculumError(null)
    const mod = modules.find((m) => m.id === moduleId)
    const title = `Lesson ${(mod?.lessons.length ?? 0) + 1}`
    const result = await coursesManageAPI.createLesson(moduleId, title)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    savedTitles.current[result.data.id] = result.data.title ?? title
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, result.data] } : m)),
    )
  }

  function handleRenameLesson(moduleId: string, lessonId: string, title: string) {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, title } : l)) }
          : m,
      ),
    )
  }

  async function handleLessonBlur(moduleId: string, lessonId: string, title: string) {
    const saved = savedTitles.current[lessonId] ?? ''
    const trimmed = title.trim()

    if (!trimmed) {
      handleRenameLesson(moduleId, lessonId, saved)
      return
    }
    if (trimmed === saved) return

    const result = await coursesManageAPI.updateLesson(lessonId, { title: trimmed })
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    savedTitles.current[lessonId] = trimmed
  }

  async function handleDeleteLesson(moduleId: string, lessonId: string) {
    const lesson = modules.find((m) => m.id === moduleId)?.lessons.find((l) => l.id === lessonId)
    const confirmed = await confirm({
      title: `Delete "${lesson?.title || 'this lesson'}"?`,
      message: "This can't be undone.",
      confirmLabel: 'Delete lesson',
      destructive: true,
    })
    if (!confirmed) return

    setCurriculumBusy(true)
    setCurriculumError(null)
    const result = await coursesManageAPI.deleteLesson(lessonId)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    setModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m)),
    )
  }

  // Reordering is optimistic: the list moves immediately, the full new order is sent to the
  // server, and the previous order is restored if the request fails.
  async function handleMoveModule(moduleId: string, direction: -1 | 1) {
    if (!id || reordering) return
    const next = moveItem(modules, modules.findIndex((m) => m.id === moduleId), direction)
    if (!next) return

    const previous = modules
    setModules(next)
    setReordering(true)
    setCurriculumError(null)

    const result = await coursesManageAPI.reorderModules(id, next.map((m) => m.id))
    setReordering(false)
    if (!result.success) {
      setModules(previous)
      setCurriculumError(result.error || 'Could not save the new module order.')
    }
  }

  async function handleMoveLesson(moduleId: string, lessonId: string, direction: -1 | 1) {
    if (reordering) return
    const mod = modules.find((m) => m.id === moduleId)
    if (!mod) return
    const nextLessons = moveItem(mod.lessons, mod.lessons.findIndex((l) => l.id === lessonId), direction)
    if (!nextLessons) return

    const previous = modules
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons: nextLessons } : m)))
    setReordering(true)
    setCurriculumError(null)

    const result = await coursesManageAPI.reorderLessons(moduleId, nextLessons.map((l) => l.id))
    setReordering(false)
    if (!result.success) {
      setModules(previous)
      setCurriculumError(result.error || 'Could not save the new lesson order.')
    }
  }

  if (loading) {
    return (
      <TrainerShell>
        <style>{PAGE_CSS}</style>
        <div className="cm-page"><div className="cm-container"><p style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem 0' }}>Loading course…</p></div></div>
      </TrainerShell>
    )
  }

  if (loadError || !course) {
    return (
      <TrainerShell>
        <style>{PAGE_CSS}</style>
        <div className="cm-page"><div className="cm-container"><div className="cm-error">{loadError || 'Course not found.'}</div></div></div>
      </TrainerShell>
    )
  }

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="cm-page">
        <div className="cm-container">
          <div className="cm-header">
            <button className="cm-back-btn" onClick={() => navigate(ROUTES.TRAINER_COURSES)} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
            <div className="cm-title-block">
              <h2 className="cm-title">
                {course.title || 'Untitled course'}
                <span className={`cm-status-badge ${course.status}`}>{course.status}</span>
              </h2>
            </div>
            <button
              className="cm-btn secondary cm-edit-full"
              onClick={() => navigate(RouteBuilder.trainerCourseEdit(course.id))}
            >
              <Pencil size={14} /> Edit full course
            </button>
          </div>

          <div className="cm-publish-row">
            {publishError && <div className="cm-error" style={{ width: '100%' }}>{publishError}</div>}
            {course.status === 'published' ? (
              <button className="cm-btn unpublish" onClick={handleUnpublish} disabled={publishing}>
                {publishing ? <Loader2 size={15} className="cm-spin" /> : null}
                {publishing ? 'Unpublishing…' : 'Unpublish course'}
              </button>
            ) : (
              <button className="cm-btn publish" onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 size={15} className="cm-spin" /> : null}
                {publishing ? 'Publishing…' : 'Publish course'}
              </button>
            )}
          </div>

          {course.certificate_setup_issue != null && (
            <div className="cm-certificate-warning" role="alert">
              <span>Certificates can&apos;t be issued until you mark a final project.</span>
              <button
                type="button"
                onClick={() => navigate(RouteBuilder.trainerCourseEdit(course.id), { state: { initialStep: 3 } })}
              >
                Open course assignments
              </button>
            </div>
          )}

          {/* ── Course details ── */}
          <div className="cm-card">
            <div className="cm-card-header">
              <h3 className="cm-card-title">Course details</h3>
              {savedNote && <span className="cm-success-note"><Check size={13} style={{ verticalAlign: 'middle' }} /> Saved</span>}
            </div>
            <div className="cm-card-body">
              {saveError && <div className="cm-error" role="alert">{saveError}</div>}
              <div className="cm-grid">
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-title">Title</label>
                  <input id="cm-title" className="cm-input" value={form.title ?? ''} onChange={(e) => updateForm('title', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-subtitle">Subtitle</label>
                  <input id="cm-subtitle" className="cm-input" value={form.subtitle ?? ''} onChange={(e) => updateForm('subtitle', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-category">Category</label>
                  <select id="cm-category" className="cm-select" value={form.category ?? ''} onChange={(e) => updateForm('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-language">Language</label>
                  <select id="cm-language" className="cm-select" value={form.language ?? ''} onChange={(e) => updateForm('language', e.target.value)}>
                    <option value="">Select language</option>
                    {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="cm-field full">
                  <label className="cm-label" htmlFor="cm-level">Level</label>
                  <select id="cm-level" className="cm-select" value={form.level ?? ''} onChange={(e) => updateForm('level', e.target.value as CourseLevel)}>
                    <option value="">Select level</option>
                    {LEVEL_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="cm-field full">
                  <label className="cm-label" htmlFor="cm-description">Description</label>
                  <textarea id="cm-description" className="cm-textarea" value={form.description ?? ''} onChange={(e) => updateForm('description', e.target.value)} />
                </div>
                <div className="cm-field full">
                  <label className="cm-label" htmlFor="cm-audience-description">Who this is for</label>
                  <textarea id="cm-audience-description" className="cm-textarea" style={{ minHeight: 80 }} value={form.audience_description ?? ''} onChange={(e) => updateForm('audience_description', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-audience">Target audience</label>
                  <input
                    id="cm-audience"
                    className="cm-input"
                    value={audienceText}
                    onChange={(e) => {
                      setAudienceText(e.target.value)
                      setSavedNote(false)
                    }}
                  />
                  <p className="cm-hint">Separate several with commas — each up to {MAX_AUDIENCE_ITEM_LENGTH} characters.</p>
                </div>
                <div className="cm-field">
                  <label className="cm-label" htmlFor="cm-certificate">Has certificate</label>
                  <select
                    id="cm-certificate"
                    className="cm-select"
                    value={form.has_certificate ? 'yes' : 'no'}
                    onChange={(e) => updateForm('has_certificate', e.target.value === 'yes')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div className="cm-save-row">
                <button className="cm-btn primary" onClick={handleSaveDetails} disabled={saving}>
                  {saving ? <Loader2 size={15} className="cm-spin" /> : null}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Curriculum ── */}
          <div className="cm-card">
            <div className="cm-card-header">
              <h3 className="cm-card-title">Curriculum</h3>
            </div>
            <div className="cm-card-body">
              {curriculumError && <div className="cm-error" role="alert">{curriculumError}</div>}
              <p className="cm-hint" style={{ marginBottom: '1rem' }}>
                Rename, add, delete or reorder modules and lessons here. To upload videos, materials or assignments, use Edit full course.
              </p>
              {modules.map((mod, mi) => (
                <div className="cm-module" key={mod.id}>
                  <div className="cm-module-head">
                    <div className="cm-move-group">
                      <button
                        type="button"
                        className="cm-icon-btn"
                        onClick={() => handleMoveModule(mod.id, -1)}
                        disabled={reordering || curriculumBusy || mi === 0}
                        aria-label="Move module up"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        className="cm-icon-btn"
                        onClick={() => handleMoveModule(mod.id, 1)}
                        disabled={reordering || curriculumBusy || mi === modules.length - 1}
                        aria-label="Move module down"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <input
                      className="cm-module-title-input"
                      aria-label="Module title"
                      value={mod.title}
                      onChange={(e) => handleRenameModule(mod.id, e.target.value)}
                      onBlur={(e) => handleModuleBlur(mod.id, e.target.value)}
                    />
                    <button className="cm-icon-btn danger" onClick={() => handleDeleteModule(mod.id)} aria-label="Delete module">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="cm-lesson-list">
                    {mod.lessons.map((lesson, li) => (
                      <div className="cm-lesson-row" key={lesson.id}>
                        <div className="cm-move-group">
                          <button
                            type="button"
                            className="cm-icon-btn"
                            onClick={() => handleMoveLesson(mod.id, lesson.id, -1)}
                            disabled={reordering || curriculumBusy || li === 0}
                            aria-label="Move lesson up"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            type="button"
                            className="cm-icon-btn"
                            onClick={() => handleMoveLesson(mod.id, lesson.id, 1)}
                            disabled={reordering || curriculumBusy || li === mod.lessons.length - 1}
                            aria-label="Move lesson down"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>
                        <input
                          className="cm-lesson-title-input"
                          aria-label="Lesson title"
                          value={lesson.title}
                          onChange={(e) => handleRenameLesson(mod.id, lesson.id, e.target.value)}
                          onBlur={(e) => handleLessonBlur(mod.id, lesson.id, e.target.value)}
                        />
                        <button className="cm-icon-btn danger" onClick={() => handleDeleteLesson(mod.id, lesson.id)} aria-label="Delete lesson">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button className="cm-add-lesson-btn" onClick={() => handleAddLesson(mod.id)} disabled={curriculumBusy}>
                      <Plus size={14} /> Add lesson
                    </button>
                  </div>
                </div>
              ))}
              <button className="cm-add-module-btn" onClick={handleAddModule} disabled={curriculumBusy}>
                <Plus size={14} /> Add module
              </button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </TrainerShell>
  )
}