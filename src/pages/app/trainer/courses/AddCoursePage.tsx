import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Check, Upload, Trash2, Plus, Globe, Eye,
  Play, SkipBack, SkipForward, Volume2, Subtitles, Maximize, Send,
  Layers, BookOpen, Award, CheckCircle2,
} from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'
import { ROUTES } from '../../../../constants/routes'

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
  title: string
  videoFile: File | null
  materialFiles: File[]
}

type CourseForm = {
  title: string
  subtitle: string
  category: string
  language: string
  level: string
  coverImage: File | null
  fullDescription: string
  learnItems: string[]
  whoFor: string
  prerequisites: string[]
  lessons: Lesson[]
  isFree: boolean
  priceNgn: string
  hasCertificate: boolean
  visibility: 'public' | 'hidden'
}

const CATEGORY_OPTIONS = ['Management', 'Leadership', 'Data & Analytics', 'Product', 'Design', 'Engineering']
const LANGUAGE_OPTIONS = ['English', 'French', 'Portuguese']
const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function emptyLesson(): Lesson {
  return { id: makeId(), title: '', videoFile: null, materialFiles: [] }
}

const initialForm: CourseForm = {
  title: '',
  subtitle: '',
  category: '',
  language: '',
  level: '',
  coverImage: null,
  fullDescription: '',
  learnItems: ['', ''],
  whoFor: '',
  prerequisites: [''],
  lessons: [emptyLesson(), emptyLesson()],
  isFree: false,
  priceNgn: '',
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
  .ac-step-circle.active { background: #2563EB; color: #fff; }
  .ac-step-circle.done { background: #2563EB; color: #fff; }
  .ac-step-label { font-size: 0.7rem; font-weight: 600; color: #9CA3AF; white-space: nowrap; }
  .ac-step-label.active, .ac-step-label.done { color: #2563EB; }
  .ac-step-line { height: 2px; background: #E5E7EB; flex: 1; margin: 0 0.4rem; min-width: 20px; align-self: flex-start; margin-top: 16px; }
  .ac-step-line.done { background: #2563EB; }

  .ac-body { padding: 1.25rem; }
  .ac-section-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: #111827; }
  .ac-section-sub { margin: 0.4rem 0 1.25rem; color: #6B7280; font-size: 0.875rem; }

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
  .ac-list-dot { width: 8px; height: 8px; border-radius: 999px; background: #2563EB; flex-shrink: 0; }
  .ac-list-input { flex: 1; }
  .ac-list-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-add-item-btn { background: none; border: none; color: #2563EB; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; padding: 0.25rem 0; }

  .ac-lesson-card { border: 1px solid #E5E7EB; border-radius: 1rem; margin-bottom: 1rem; overflow: hidden; }
  .ac-lesson-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1rem; }
  .ac-lesson-num { width: 26px; height: 26px; border-radius: 999px; background: #EFF6FF; color: #2563EB; font-weight: 700; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-lesson-title-input { flex: 1; border: none; background: none; font-size: 0.95rem; color: #111; outline: none; }
  .ac-lesson-delete { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }
  .ac-lesson-uploads { padding: 0 1rem 1rem; display: grid; gap: 0.75rem; }
  .ac-upload-chip { display: flex; align-items: center; gap: 0.75rem; border: 1px dashed #93C5FD; background: #EFF6FF; border-radius: 0.85rem; padding: 0.85rem 1rem; cursor: pointer; }
  .ac-upload-chip-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #DBEAFE; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-upload-chip-label { font-weight: 700; color: #2563EB; font-size: 0.875rem; }
  .ac-upload-chip-sub { margin: 0.1rem 0 0; color: #6B7280; font-size: 0.75rem; }

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
  .toggle input:checked + .track { background: #2563EB; }
  .toggle input:checked + .track::before { transform: translateX(18px); }

  .ac-visibility-option { display: flex; align-items: center; gap: 0.85rem; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1rem 1.1rem; margin-bottom: 0.75rem; cursor: pointer; }
  .ac-visibility-option.selected { border-color: #2563EB; background: #EFF6FF; }
  .ac-visibility-icon { width: 34px; height: 34px; border-radius: 0.6rem; background: #F3F4F6; display: flex; align-items: center; justify-content: center; color: #6B7280; flex-shrink: 0; }
  .ac-visibility-option.selected .ac-visibility-icon { background: #DBEAFE; color: #2563EB; }
  .ac-visibility-title { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .ac-visibility-sub { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .ac-visibility-check { margin-left: auto; color: #2563EB; flex-shrink: 0; }

  .ac-preview-player { border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; margin-bottom: 1.25rem; }
  .ac-preview-video { position: relative; background: #111; aspect-ratio: 16 / 9; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; color: #fff; background-image: linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.45)); background-size: cover; background-position: center; }
  .ac-preview-video-topbar { display: flex; align-items: center; gap: 0.75rem; }
  .ac-preview-video-back { background: rgba(255,255,255,0.15); border: none; border-radius: 999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; flex-shrink: 0; }
  .ac-preview-video-title { font-weight: 700; font-size: 0.9rem; }
  .ac-preview-video-sub { font-size: 0.75rem; opacity: 0.85; margin-top: 0.15rem; }
  .ac-preview-video-controls { display: flex; align-items: center; justify-content: center; gap: 1.25rem; }
  .ac-preview-ctrl-btn { background: rgba(255,255,255,0.15); border: none; border-radius: 999px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; }
  .ac-preview-ctrl-btn.primary { width: 52px; height: 52px; background: rgba(0,0,0,0.4); }
  .ac-preview-video-bottom { display: flex; flex-direction: column; gap: 0.5rem; }
  .ac-preview-progress { height: 4px; border-radius: 999px; background: rgba(255,255,255,0.3); position: relative; }
  .ac-preview-progress-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 30%; background: #2563EB; border-radius: 999px; }
  .ac-preview-video-meta { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; }
  .ac-preview-video-icons { display: flex; align-items: center; gap: 0.6rem; }
  .ac-preview-auto { font-size: 0.7rem; border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 0.05rem 0.35rem; }

  .ac-preview-info { padding: 1.1rem 1.25rem; }
  .ac-preview-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; font-weight: 700; }
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
  .ac-outcomes-title { margin: 0 0 0.75rem; color: #2563EB; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .ac-outcome-item { display: flex; align-items: center; gap: 0.6rem; color: #1E3A8A; font-size: 0.875rem; margin-bottom: 0.5rem; }
  .ac-outcome-item svg { color: #2563EB; flex-shrink: 0; }

  .ac-review-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; }
  .ac-btn.full { width: 100%; }

  .ac-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 1.25rem; z-index: 500; }
  .ac-modal { background: #fff; border-radius: 1.25rem; padding: 2rem 1.5rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
  .ac-modal-icon { width: 72px; height: 72px; border-radius: 999px; background: #D1FAE5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
  .ac-modal-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .ac-modal-sub { margin: 0.6rem 0 1.5rem; color: #6B7280; font-size: 0.9rem; }

  .ac-footer { display: flex; flex-direction: column-reverse; gap: 0.75rem; padding: 1.1rem 1.25rem; border-top: 1px solid #F3F4F6; }
  .ac-btn { border-radius: 999px; padding: 0.9rem 1.4rem; font-weight: 700; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; width: 100%; }
  .ac-btn.primary { background: #2563EB; color: #fff; border: none; }
  .ac-btn.secondary { background: #fff; color: #2563EB; border: 1px solid #2563EB; }

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
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<CourseForm>(initialForm)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  function update<K extends keyof CourseForm>(key: K, value: CourseForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function goBack() {
    if (step === 1) {
      navigate(ROUTES.TRAINER_COURSES)
      return
    }
    setStep((s) => (s - 1) as Step)
  }

  function goNext() {
    if (step < 5) setStep((s) => (s + 1) as Step)
  }

  function handleSubmit() {
    console.log('Course submission payload (not yet wired to backend):', form)
    setShowSuccessModal(true)
  }

  function handleSaveDraft() {
    console.log('Saved as draft (not yet wired to backend):', form)
    navigate(ROUTES.TRAINER_COURSES)
  }

  function handleBackToDashboard() {
    setShowSuccessModal(false)
    navigate(ROUTES.TRAINER_DASHBOARD)
  }

  function updateListItem(field: 'learnItems' | 'prerequisites', index: number, value: string) {
    setForm((f) => {
      const list = [...f[field]]
      list[index] = value
      return { ...f, [field]: list }
    })
  }
  function addListItem(field: 'learnItems' | 'prerequisites') {
    setForm((f) => ({ ...f, [field]: [...f[field], ''] }))
  }
  function removeListItem(field: 'learnItems' | 'prerequisites', index: number) {
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
  function removeLesson(id: string) {
    setForm((f) => ({ ...f, lessons: f.lessons.filter((l) => l.id !== id) }))
  }

  const totalLessons = form.lessons.length

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="ac-page">
        <div className="ac-card">
          <div className="ac-header">
            <button className="ac-back-btn" onClick={goBack} aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <h2 className="ac-title">Add New course</h2>
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
                    <select className="ac-select" value={form.level} onChange={(e) => update('level', e.target.value)}>
                      <option value="">e.g Beginner</option>
                      {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div className="ac-field full">
                    <label className="ac-label">Cover image</label>
                    <label className="ac-upload-box">
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => update('coverImage', e.target.files?.[0] ?? null)}
                      />
                      <Upload size={22} />
                      <span className="ac-upload-label">
                        {form.coverImage ? form.coverImage.name : 'Upload cover image'}
                      </span>
                    </label>
                    <p className="ac-hint">Recommended: 1280×720 px · JPG or PNG · max 5 MB</p>
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
                    value={form.fullDescription}
                    onChange={(e) => update('fullDescription', e.target.value)}
                  />
                  <p className="ac-hint">Aim for 150–300 words. Describe what the course covers and the value it delivers.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">What learners will learn <span className="ac-required">*</span></label>
                  {form.learnItems.map((item, i) => (
                    <div className="ac-list-item" key={i}>
                      <span className="ac-list-dot" />
                      <input
                        className="ac-input ac-list-input"
                        placeholder="e.g. Create a full project plan from initiation to closure"
                        value={item}
                        onChange={(e) => updateListItem('learnItems', i, e.target.value)}
                      />
                      <button className="ac-list-delete" onClick={() => removeListItem('learnItems', i)} aria-label="Remove item">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button className="ac-add-item-btn" onClick={() => addListItem('learnItems')}>
                    <Plus size={16} /> Add item
                  </button>
                  <p className="ac-hint">List 4–8 concrete outcomes. These appear as bullet points on the course page.</p>
                </div>

                <div className="ac-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="ac-label">Who this course is for</label>
                  <textarea
                    className="ac-textarea"
                    style={{ minHeight: 90 }}
                    placeholder="Early-career professionals (0–4 years experience) who work on or aspire to lead projects…"
                    value={form.whoFor}
                    onChange={(e) => update('whoFor', e.target.value)}
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
                    <div className="ac-lesson-uploads">
                      <label className="ac-upload-chip">
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,video/webm"
                          style={{ display: 'none' }}
                          onChange={(e) => updateLesson(lesson.id, { videoFile: e.target.files?.[0] ?? null })}
                        />
                        <div className="ac-upload-chip-icon"><Upload size={16} /></div>
                        <div>
                          <div className="ac-upload-chip-label">
                            {lesson.videoFile ? lesson.videoFile.name : 'Upload video'}
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
                          onChange={(e) => updateLesson(lesson.id, { materialFiles: Array.from(e.target.files ?? []) })}
                        />
                        <div className="ac-upload-chip-icon"><Upload size={16} /></div>
                        <div>
                          <div className="ac-upload-chip-label">
                            {lesson.materialFiles.length > 0
                              ? `${lesson.materialFiles.length} file(s) selected`
                              : 'Upload Material(s)'}
                          </div>
                          <p className="ac-upload-chip-sub">Docx, Xlsx, PDF, PPTX · max 500 MB</p>
                        </div>
                      </label>
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
                      value={form.priceNgn}
                      onChange={(e) => update('priceNgn', e.target.value)}
                    />
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
              </>
            )}

            {step === 5 && (
              <>
                <h3 className="ac-section-title">Review &amp; publish</h3>
                <p className="ac-section-sub">Check everything looks right before going live.</p>

                <div className="ac-preview-player">
                  <div className="ac-preview-video">
                    <div className="ac-preview-video-topbar">
                      <button className="ac-preview-video-back" aria-label="Back">
                        <ChevronLeft size={18} />
                      </button>
                      <div>
                        <div className="ac-preview-video-title">Critical Path Method</div>
                        <div className="ac-preview-video-sub">Module 3 · {form.title || 'Untitled course'}</div>
                      </div>
                    </div>
                    <div className="ac-preview-video-controls">
                      <button className="ac-preview-ctrl-btn" aria-label="Previous"><SkipBack size={16} /></button>
                      <button className="ac-preview-ctrl-btn primary" aria-label="Play"><Play size={20} /></button>
                      <button className="ac-preview-ctrl-btn" aria-label="Next"><SkipForward size={16} /></button>
                    </div>
                    <div className="ac-preview-video-bottom">
                      <div className="ac-preview-progress"><div className="ac-preview-progress-fill" /></div>
                      <div className="ac-preview-video-meta">
                        <span>6:54 / 22:14</span>
                        <div className="ac-preview-video-icons">
                          <Volume2 size={16} />
                          <Subtitles size={16} />
                          <span className="ac-preview-auto">Auto</span>
                          <Maximize size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ac-preview-info">
                    <p className="ac-preview-cat">{form.category || 'Category'}</p>
                    <h4 className="ac-preview-title">{form.title || 'Untitled course'}</h4>
                    <p className="ac-preview-sub">{form.subtitle || 'No subtitle provided'}</p>
                    <div className="ac-preview-badges">
                      <span className="ac-preview-badge"><Layers size={14} /> 3 modules</span>
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
                    <span className="ac-review-row-value">{form.level || '—'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Language</span>
                    <span className="ac-review-row-value">{form.language || '—'}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Modules</span>
                    <span className="ac-review-row-value">3</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Lessons</span>
                    <span className="ac-review-row-value">{totalLessons}</span>
                  </div>
                  <div className="ac-review-row">
                    <span className="ac-review-row-label">Price</span>
                    <span className="ac-review-row-value">{form.isFree ? 'Free' : `₦${form.priceNgn || '0'}`}</span>
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
                  {form.learnItems.filter((i) => i.trim()).map((item, i) => (
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
                <button className="ac-btn secondary" onClick={goBack}>
                  <ChevronLeft size={18} /> Back
                </button>
                <button className="ac-btn primary" onClick={goNext}>
                  {step === 4 ? 'Review Course' : 'Continue'} <ChevronRight size={18} />
                </button>
              </>
            ) : (
              <div className="ac-review-actions">
                <button className="ac-btn primary full" onClick={handleSubmit}>
                  <Send size={18} /> Publish course
                </button>
                <button className="ac-btn secondary full" onClick={handleSaveDraft}>
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
            <h3 className="ac-modal-title">Course Uploaded Successfully!</h3>
            <p className="ac-modal-sub">Your course has been uploaded successfully.</p>
            <button className="ac-btn primary full" onClick={handleBackToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </TrainerShell>
  )
}