// pages/app/trainer/courses/TrainerCourseManagePage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Plus, Trash2, Check, X, Loader2, GripVertical,
} from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import { ROUTES } from '../../../../constants/routes'
import {
  coursesManageAPI,
  type CourseDraft,
  type CourseCurriculumModule,
  type CourseLevel,
} from '../../../../services/api'


const CATEGORY_OPTIONS = ['Management', 'Leadership', 'Data & Analytics', 'Product', 'Design', 'Engineering']
const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese']
const LEVEL_OPTIONS: { label: string; value: CourseLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' },
]

const PAGE_CSS = `
  .cm-page { padding: 1rem; background: #F5F5F5; }
  .cm-container { max-width: 860px; margin: 0 auto; display: grid; gap: 1.25rem; }

  .cm-header { display: flex; align-items: center; gap: 0.75rem; }
  .cm-back-btn { background: #fff; border: 1px solid #E5E7EB; border-radius: 999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #111; flex-shrink: 0; }
  .cm-title-block { min-width: 0; flex: 1; }
  .cm-title { margin: 0; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .cm-status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; text-transform: capitalize; margin-left: 0.6rem; vertical-align: middle; }
  .cm-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .cm-status-badge.published { background: #DCFCE7; color: #16A34A; }
  .cm-status-badge.archived { background: #F3F4F6; color: #6B7280; }

  .cm-publish-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .cm-btn { border-radius: 999px; padding: 0.7rem 1.2rem; font-weight: 700; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.4rem; border: none; }
  .cm-btn.primary { background: #2563EB; color: #fff; }
  .cm-btn.unpublish { background: #FEF3C7; color: #D97706; }
  .cm-btn.publish { background: #DCFCE7; color: #16A34A; }
  .cm-btn:disabled { opacity: 0.6; cursor: default; }

  .cm-card { background: #fff; border-radius: 1rem; border: 1px solid #E5E7EB; overflow: hidden; }
  .cm-card-header { padding: 1.1rem 1.25rem; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .cm-card-title { margin: 0; font-size: 1rem; font-weight: 700; color: #111827; }
  .cm-card-body { padding: 1.25rem; }

  .cm-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .cm-field { display: grid; gap: 0.45rem; }
  .cm-label { font-weight: 700; color: #111827; font-size: 0.85rem; }
  .cm-input, .cm-select, .cm-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.7rem; padding: 0.75rem 0.9rem; font-size: 0.875rem; color: #111; background: #fff; font-family: inherit; }
  .cm-textarea { resize: vertical; min-height: 100px; }

  .cm-save-row { display: flex; justify-content: flex-end; margin-top: 1.1rem; }
  .cm-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 1rem; font-size: 0.85rem; margin-bottom: 1rem; }
  .cm-success-note { color: #16A34A; font-size: 0.8rem; font-weight: 600; }

  .cm-module { border: 1px solid #E5E7EB; border-radius: 0.9rem; margin-bottom: 0.85rem; overflow: hidden; }
  .cm-module-head { display: flex; align-items: center; gap: 0.6rem; padding: 0.8rem 0.9rem; background: #F9FAFB; }
  .cm-module-head svg.grip { color: #C4C9D1; flex-shrink: 0; }
  .cm-module-title-input { flex: 1; border: none; background: none; font-weight: 700; font-size: 0.9rem; color: #111; outline: none; }
  .cm-icon-btn { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.35rem; flex-shrink: 0; display: flex; }
  .cm-icon-btn:hover { color: #374151; }
  .cm-icon-btn.danger:hover { color: #EF4444; }

  .cm-lesson-list { padding: 0.5rem 0.9rem 0.75rem; display: grid; gap: 0.5rem; }
  .cm-lesson-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.7rem; border: 1px solid #F1F3F5; border-radius: 0.6rem; }
  .cm-lesson-title-input { flex: 1; border: none; background: none; font-size: 0.85rem; color: #111; outline: none; }

  .cm-add-lesson-btn, .cm-add-module-btn { display: flex; align-items: center; gap: 0.4rem; border: 1px dashed #D1D5DB; background: none; color: #6B7280; font-weight: 700; font-size: 0.8rem; border-radius: 0.6rem; padding: 0.55rem 0.8rem; cursor: pointer; width: 100%; justify-content: center; }
  .cm-add-lesson-btn:hover, .cm-add-module-btn:hover { background: #F9FAFB; }

  @media (min-width: 640px) {
    .cm-page { padding: 1.5rem; }
    .cm-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .cm-grid .cm-field.full { grid-column: 1 / -1; }
  }

  @media (min-width: 1024px) {
    .cm-page { padding: 1.5rem 2rem 2rem; }
  }
`

export default function TrainerCourseManagePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [course, setCourse] = useState<CourseDraft | null>(null)
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
    if (id) load(id)
  }, [id])

  async function load(courseId: string) {
    setLoading(true)
    setLoadError(null)
    const [draftRes, curriculumRes] = await Promise.all([
      coursesManageAPI.getDraft(courseId),
      coursesManageAPI.getCurriculum(courseId),
    ])
    if (draftRes.success) {
      setCourse(draftRes.data)
      setForm(draftRes.data)
    } else {
      setLoadError(draftRes.error)
    }
  if (curriculumRes.success) {
  setModules(
    curriculumRes.data.map((m) => ({ ...m, lessons: m.lessons ?? [] })),
  )
}
    setLoading(false)
  }

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
    setCourse(result.data)
    setForm(result.data)
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
    setCourse((c) => (c ? { ...c, status: 'published' } : c))
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
    setCourse((c) => (c ? { ...c, status: 'draft' } : c))
  }

  async function handleAddModule() {
    if (!id) return
    setCurriculumBusy(true)
    setCurriculumError(null)
    const result = await coursesManageAPI.createModule(id, `Module ${modules.length + 1}`)
    setCurriculumBusy(false)
    if (!result.success) {
      setCurriculumError(result.error)
      return
    }
    setModules((prev) => [...prev, { ...result.data, lessons: [] }])
  }

  async function handleRenameModule(moduleId: string, title: string) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, title } : m)))
  }

  async function handleModuleBlur(moduleId: string, title: string) {
    if (!title.trim()) return
    const result = await coursesManageAPI.updateModule(moduleId, title)
    if (!result.success) setCurriculumError(result.error)
  }

  async function handleDeleteModule(moduleId: string) {
    const confirmed = window.confirm('Delete this module and all its lessons? This cannot be undone.')
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

          {/* ── Course details ── */}
          <div className="cm-card">
            <div className="cm-card-header">
              <h3 className="cm-card-title">Course details</h3>
              {savedNote && <span className="cm-success-note"><Check size={13} style={{ verticalAlign: 'middle' }} /> Saved</span>}
            </div>
            <div className="cm-card-body">
              {saveError && <div className="cm-error">{saveError}</div>}
              <div className="cm-grid">
                <div className="cm-field">
                  <label className="cm-label">Title</label>
                  <input className="cm-input" value={form.title ?? ''} onChange={(e) => updateForm('title', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Subtitle</label>
                  <input className="cm-input" value={form.subtitle ?? ''} onChange={(e) => updateForm('subtitle', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Category</label>
                  <select className="cm-select" value={form.category ?? ''} onChange={(e) => updateForm('category', e.target.value)}>
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="cm-field">
                  <label className="cm-label">Language</label>
                  <select className="cm-select" value={form.language ?? ''} onChange={(e) => updateForm('language', e.target.value)}>
                    <option value="">Select language</option>
                    {LANGUAGE_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="cm-field full">
                  <label className="cm-label">Level</label>
                  <select className="cm-select" value={form.level ?? ''} onChange={(e) => updateForm('level', e.target.value as CourseLevel)}>
                    <option value="">Select level</option>
                    {LEVEL_OPTIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="cm-field full">
                  <label className="cm-label">Description</label>
                  <textarea className="cm-textarea" value={form.description ?? ''} onChange={(e) => updateForm('description', e.target.value)} />
                </div>
                <div className="cm-field full">
                  <label className="cm-label">Who this is for </label>
                  <textarea className="cm-textarea" style={{ minHeight: 80 }} value={form.audience_description ?? ''} onChange={(e) => updateForm('audience_description', e.target.value)} />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Target audience</label>
                  <input
                    className="cm-input"
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
                <div className="cm-field">
                  <label className="cm-label">Has certificate</label>
                  <select
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
              {curriculumError && <div className="cm-error">{curriculumError}</div>}
              {modules.map((mod) => (
                <div className="cm-module" key={mod.id}>
                  <div className="cm-module-head">
                    <GripVertical size={15} className="grip" />
                    <input
                      className="cm-module-title-input"
                      value={mod.title}
                      onChange={(e) => handleRenameModule(mod.id, e.target.value)}
                      onBlur={(e) => handleModuleBlur(mod.id, e.target.value)}
                    />
                    <button className="cm-icon-btn danger" onClick={() => handleDeleteModule(mod.id)} aria-label="Delete module">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="cm-lesson-list">
                    {mod.lessons.map((lesson) => (
                      <div className="cm-lesson-row" key={lesson.id}>
                        <input
                          className="cm-lesson-title-input"
                          value={lesson.title}
                          onChange={(e) => handleRenameLesson(mod.id, lesson.id, e.target.value)}
                          onBlur={(e) => handleLessonBlur(lesson.id, e.target.value)}
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
    </TrainerShell>
  )
}