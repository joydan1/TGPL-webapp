// pages/admin/courses/AdminCourseManagePage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, Trash2, Check, X, Loader2, GripVertical,
} from 'lucide-react'
import AdminShell from '../../layouts/AdminShell'
import { adminCoursesAPI } from '../../services/adminCoursesApi'
import {
  coursesManageAPI, type CourseDraft, type CourseCurriculumModule,
  type CourseLevel,
} from '../../services/api'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useConfirm } from '../../hooks/useConfirm'

const CATEGORY_OPTIONS = ['Management', 'Leadership', 'Data & Analytics', 'Product', 'Design', 'Engineering']
const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese']
const LEVEL_OPTIONS: { label: string; value: CourseLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
]

const PAGE_CSS = `
  .acm-page { padding: 1rem; background: #F5F5F5; }
  .acm-container { max-width: 860px; margin: 0 auto; display: grid; gap: 1.25rem; }

  .acm-header { display: flex; align-items: center; gap: 0.75rem; }
  .acm-back-btn { background: #fff; border: 1px solid #E5E7EB; border-radius: 999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #111; flex-shrink: 0; }
  .acm-title-block { min-width: 0; flex: 1; }
  .acm-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .acm-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: capitalize; margin-left: 0.6rem; vertical-align: middle; }
  .acm-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .acm-status-badge.published { background: #DCFCE7; color: #16A34A; }
  .acm-status-badge.archived { background: #F3F4F6; color: #6B7280; }
  .acm-trainer-line { margin: 0.15rem 0 0; font-size: 0.8rem; color: #6B7280; }

  .acm-publish-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .acm-btn { border-radius: 999px; padding: 0.7rem 1.2rem; font-weight: 700; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; border: none; }
  .acm-btn.primary { background: #2492EB; color: #fff; }
  .acm-btn.unpublish { background: #FEF3C7; color: #D97706; }
  .acm-btn.publish { background: #DCFCE7; color: #16A34A; }
  .acm-btn:disabled { opacity: 0.6; cursor: default; }

  .acm-card { background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; overflow: hidden; }
  .acm-card-header { padding: 1.1rem 1.25rem; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .acm-card-title { margin: 0; font-size: 1rem; font-weight: 700; color: #111827; }
  .acm-card-body { padding: 1.25rem; }

  .acm-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .acm-field { display: grid; gap: 0.45rem; }
  .acm-label { font-weight: 700; color: #111827; font-size: 0.85rem; }
  .acm-input, .acm-select, .acm-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.75rem 0.9rem; font-size: 0.875rem; color: #111; background: #fff; font-family: inherit; }
  .acm-textarea { resize: vertical; min-height: 100px; }

  .acm-save-row { display: flex; justify-content: flex-end; margin-top: 1.1rem; }
  .acm-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  .acm-success-note { color: #16A34A; font-size: 0.8rem; font-weight: 600; }

  .acm-module { border: 1px solid #E5E7EB; border-radius: 0.9rem; margin-bottom: 0.85rem; overflow: hidden; }
  .acm-module-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 0.9rem; background: #F9FAFB; }
  .acm-module-head svg.grip { color: #C4C9D1; flex-shrink: 0; }
  .acm-module-title-input { flex: 1; border: none; background: none; font-weight: 700; font-size: 0.9rem; color: #111; outline: none; }
  .acm-icon-btn { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.35rem; flex-shrink: 0; display: flex; }
  .acm-icon-btn:hover { color: #374151; }
  .acm-icon-btn.danger:hover { color: #EF4444; }

  .acm-lesson-list { padding: 0.5rem 0.9rem 0.75rem; display: grid; gap: 0.5rem; }
  .acm-lesson-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.7rem; border: 1px solid #F1F3F5; border-radius: 0.6rem; }
  .acm-lesson-title-input { flex: 1; border: none; background: none; font-size: 0.85rem; color: #111; outline: none; }

  .acm-add-lesson-btn, .acm-add-module-btn { display: flex; align-items: center; gap: 0.4rem; border: 1px dashed #D1D5DB; background: none; color: #6B7280; font-weight: 700; font-size: 0.8rem; border-radius: 0.6rem; padding: 0.55rem 0.8rem; cursor: pointer; width: 100%; justify-content: center; }
  .acm-add-lesson-btn:hover, .acm-add-module-btn:hover { background: #F9FAFB; }

  @media (min-width: 640px) {
    .acm-page { padding: 1.5rem; }
    .acm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .acm-grid .acm-field.full { grid-column: 1 / -1; }
  }

  @media (min-width: 1024px) {
    .acm-page { padding: 1.5rem 2rem 2rem; }
  }
`

export default function AdminCourseManagePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { confirmState, confirm, handleConfirm, handleCancel } = useConfirm()

  // courseId is resolved from the slug on load (see note above) — every
  // coursesManageAPI call below uses this, never the slug directly.
  const [courseId, setCourseId] = useState<string | null>(null)
  const [courseStatus, setCourseStatus] = useState<'draft' | 'published' | 'archived' | null>(null)
  const [trainerName, setTrainerName] = useState<string | null>(null)

  const [modules, setModules] = useState<CourseCurriculumModule[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState<Partial<CourseDraft>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState(false)

  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  const [curriculumBusy, setCurriculumBusy] = useState(false)
  const [curriculumError, setCurriculumError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) load(slug)
  }, [slug])

  async function load(courseSlug: string) {
    setLoading(true)
    setLoadError(null)

    const courseRes = await adminCoursesAPI.getCourse(courseSlug)
    if (!courseRes.success) {
      setLoadError(courseRes.error)
      setLoading(false)
      return
    }
    setCourseStatus(courseRes.data.status)
    setTrainerName(courseRes.data.trainer.full_name)
    const resolvedId = courseRes.data.id
    setCourseId(resolvedId)

    const [draftRes, curriculumRes] = await Promise.all([
      coursesManageAPI.getDraft(resolvedId),
      coursesManageAPI.getCurriculum(resolvedId),
    ])
    if (draftRes.success) {
      setForm(draftRes.data)
    } else {
      setLoadError(draftRes.error)
    }
    if (curriculumRes.success) {
      setModules(curriculumRes.data.map((m) => ({ ...m, lessons: m.lessons ?? [] })))
    }
    setLoading(false)
  }

  function updateForm<K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setSavedNote(false)
  }

  async function handleSaveDetails() {
    if (!courseId) return
    setSaving(true)
    setSaveError(null)
    setSavedNote(false)

    const result = await coursesManageAPI.updateDraft(courseId, {
      title: form.title,
      subtitle: form.subtitle,
      category: form.category,
      language: form.language,
      level: form.level,
      description: form.description,
      expected_outcomes: form.expected_outcomes,
      target_audience: form.target_audience,
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
    setForm(result.data)
    setSavedNote(true)
  }

  async function handlePublish() {
    if (!courseId) return
    setPublishing(true)
    setPublishError(null)
    const result = await coursesManageAPI.publishDraft(courseId)
    setPublishing(false)
    if (!result.success) {
      setPublishError(result.error)
      return
    }
    setCourseStatus('published')
  }

  async function handleUnpublish() {
    if (!courseId) return
    setPublishing(true)
    setPublishError(null)
    const result = await coursesManageAPI.unpublishDraft(courseId)
    setPublishing(false)
    if (!result.success) {
      setPublishError(result.error)
      return
    }
    setCourseStatus('draft')
  }

  async function handleAddModule() {
    if (!courseId) return
    setCurriculumBusy(true)
    setCurriculumError(null)
    const result = await coursesManageAPI.createModule(courseId, `Module ${modules.length + 1}`)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    setModules((prev) => [...prev, { ...result.data, lessons: [] }])
  }

  function handleRenameModule(moduleId: string, title: string) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)))
  }

  async function handleModuleBlur(moduleId: string, title: string) {
    if (!title.trim()) return
    const result = await coursesManageAPI.updateModule(moduleId, { title })
    if (!result.success) setCurriculumError(result.error)
  }

  async function handleDeleteModule(moduleId: string) {
    const mod = modules.find((m) => m.id === moduleId)
    const lessonCount = mod?.lessons.length ?? 0
    const lessonWarning =
      lessonCount > 0
        ? ` This will also delete ${lessonCount} lesson${lessonCount === 1 ? '' : 's'} inside it — there's no separate warning from the backend for that.`
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
    const result = await coursesManageAPI.createLesson(moduleId, `Lesson ${(mod?.lessons.length ?? 0) + 1}`)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
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

  async function handleLessonBlur(lessonId: string, title: string) {
    if (!title.trim()) return
    const result = await coursesManageAPI.updateLesson(lessonId, { title })
    if (!result.success) setCurriculumError(result.error)
  }

  async function handleDeleteLesson(moduleId: string, lessonId: string) {
    const confirmed = window.confirm('Delete this lesson? This cannot be undone.')
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

  if (loading) {
    return (
      <AdminShell>
        <style>{PAGE_CSS}</style>
        <div className="acm-page"><div className="acm-container"><p style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem 0' }}>Loading course…</p></div></div>
      </AdminShell>
    )
  }

  if (loadError || !courseId) {
    return (
      <AdminShell>
        <style>{PAGE_CSS}</style>
        <div className="acm-page"><div className="acm-container"><div className="acm-error">{loadError || 'Course not found.'}</div></div></div>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <style>{PAGE_CSS}</style>
      <div className="acm-page">
        <div className="acm-container">
          <div className="acm-header">
            <button className="acm-back-btn" onClick={() => navigate('/admin/courses')} aria-label="Back">
              <ChevronLeft size={18} />
            </button>
            <div className="acm-title-block">
              <h2 className="acm-title">
                {form.title || 'Untitled course'}
                {courseStatus && <span className={`acm-status-badge ${courseStatus}`}>{courseStatus}</span>}
              </h2>
              {trainerName && <p className="acm-trainer-line">Trainer: {trainerName}</p>}
            </div>
          </div>

          <div className="acm-publish-row">
            {publishError && <div className="acm-error" style={{ width: '100%' }}>{publishError}</div>}
            {courseStatus === 'published' ? (
              <button className="acm-btn unpublish" onClick={handleUnpublish} disabled={publishing}>
                {publishing ? <Loader2 size={15} className="acm-spin" /> : null}
                {publishing ? 'Unpublishing…' : 'Unpublish course'}
              </button>
            ) : (
              <button className="acm-btn publish" onClick={handlePublish} disabled={publishing}>
                {publishing ? <Loader2 size={15} className="acm-spin" /> : null}
                {publishing ? 'Publishing…' : 'Publish course'}
              </button>
            )}
          </div>

          {/* ── Course details ── */}
          <div className="acm-card">
            <div className="acm-card-header">
              <h3 className="acm-card-title">Course details</h3>
              {savedNote && <span className="acm-success-note"><Check size={13} style={{ verticalAlign: 'middle' }} /> Saved</span>}
            </div>
            <div className="acm-card-body">
              {saveError && <div className="acm-error">{saveError}</div>}
              <div className="acm-grid">
                <div className="acm-field">
                  <label className="acm-label">Title</label>
                  <input className="acm-input" value={form.title ?? ''} onChange={(e) => updateForm('title', e.target.value)} />
                </div>
                <div className="acm-field">
                  <label className="acm-label">Subtitle</label>
                  <input className="acm-input" value={form.subtitle ?? ''} onChange={(e) => updateForm('subtitle', e.target.value)} />
                </div>
                <div className="acm-field">
                  <label className="acm-label">Category</label>
                  <select className="acm-select" value={form.category ?? ''} onChange={(e) => updateForm('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="acm-field">
                  <label className="acm-label">Language</label>
                  <select className="acm-select" value={form.language ?? ''} onChange={(e) => updateForm('language', e.target.value)}>
                    <option value="">Select language</option>
                    {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="acm-field full">
                  <label className="acm-label">Level</label>
                  <select className="acm-select" value={form.level ?? ''} onChange={(e) => updateForm('level', e.target.value as CourseLevel)}>
                    <option value="">Select level</option>
                    {LEVEL_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="acm-field full">
                  <label className="acm-label">Description</label>
                  <textarea className="acm-textarea" value={form.description ?? ''} onChange={(e) => updateForm('description', e.target.value)} />
                </div>
                <div className="acm-field full">
                  <label className="acm-label">Who this is for</label>
                  <textarea className="acm-textarea" style={{ minHeight: 80 }} value={form.audience_description ?? ''} onChange={(e) => updateForm('audience_description', e.target.value)} />
                </div>
                <div className="acm-field">
                  <label className="acm-label">Target audience</label>
                  <input
                    className="acm-input"
                    maxLength={80}
                    value={(form.target_audience ?? []).join(', ')}
                    onChange={(e) =>
                      updateForm(
                        'target_audience',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      )
                    }
                  />
                </div>
                <div className="acm-field">
                  <label className="acm-label">Has certificate</label>
                  <select
                    className="acm-select"
                    value={form.has_certificate ? 'yes' : 'no'}
                    onChange={(e) => updateForm('has_certificate', e.target.value === 'yes')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
              <div className="acm-save-row">
                <button className="acm-btn primary" onClick={handleSaveDetails} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Curriculum ── */}
          <div className="acm-card">
            <div className="acm-card-header">
              <h3 className="acm-card-title">Curriculum</h3>
            </div>
            <div className="acm-card-body">
              {curriculumError && <div className="acm-error">{curriculumError}</div>}
              {modules.map((mod) => (
                <div className="acm-module" key={mod.id}>
                  <div className="acm-module-head">
                    <GripVertical size={15} className="grip" />
                    <input
                      className="acm-module-title-input"
                      value={mod.title}
                      onChange={(e) => handleRenameModule(mod.id, e.target.value)}
                      onBlur={(e) => handleModuleBlur(mod.id, e.target.value)}
                    />
                    <button className="acm-icon-btn danger" onClick={() => handleDeleteModule(mod.id)} aria-label="Delete module">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="acm-lesson-list">
                    {mod.lessons.map((lesson) => (
                      <div className="acm-lesson-row" key={lesson.id}>
                        <input
                          className="acm-lesson-title-input"
                          value={lesson.title}
                          onChange={(e) => handleRenameLesson(mod.id, lesson.id, e.target.value)}
                          onBlur={(e) => handleLessonBlur(lesson.id, e.target.value)}
                        />
                        <button className="acm-icon-btn danger" onClick={() => handleDeleteLesson(mod.id, lesson.id)} aria-label="Delete lesson">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button className="acm-add-lesson-btn" onClick={() => handleAddLesson(mod.id)} disabled={curriculumBusy}>
                      <Plus size={14} /> Add lesson
                    </button>
                  </div>
                </div>
              ))}
              <button className="acm-add-module-btn" onClick={handleAddModule} disabled={curriculumBusy}>
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
    </AdminShell>
  )
}