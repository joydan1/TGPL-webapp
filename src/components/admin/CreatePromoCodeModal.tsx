import { useState, useEffect } from 'react'
import { adminPromoCodesAPI } from '../../services/adminPromoCodesApi'
import apiClient from '../../services/api'
import type { DiscountType } from '../../services/adminPromoCodesApi'

export const PROMO_MODAL_CSS = `
  .pc-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 100; }
  .pc-modal { background: #fff; border-radius: 1rem; width: 100%; max-width: 440px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; max-height: 90vh; overflow-y: auto; }
  .pc-modal-title { margin: 0; font-size: 1.15rem; font-weight: 800; color: #111827; }
  .pc-field { display: flex; flex-direction: column; gap: 0.4rem; }
  .pc-field label { font-size: 0.8rem; font-weight: 700; color: #374151; }
  .pc-field input { border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.6rem 0.8rem; font-size: 0.875rem; color: #111; outline: none; width: 100%; }
  .pc-field input:focus { border-color: #2492EB; }
  .pc-field-hint { font-size: 0.75rem; color: #9CA3AF; }
  .pc-row { display: flex; gap: 0.75rem; }
  .pc-row .pc-field { flex: 1; min-width: 0; }
  .pc-note { font-size: 0.8rem; color: #6B7280; background: #F9FAFB; border-radius: 0.6rem; padding: 0.6rem 0.8rem; }
  .pc-error { font-size: 0.8rem; color: #EF4444; background: #FEF2F2; border-radius: 0.6rem; padding: 0.6rem 0.8rem; }
  .pc-actions { display: flex; justify-content: flex-end; gap: 0.6rem; margin-top: 0.25rem; }
  .pc-btn { border-radius: 0.6rem; padding: 0.6rem 1.1rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; border: none; }
  .pc-btn-outline { background: #fff; border: 1px solid #E5E7EB; color: #374151; }
  .pc-btn-primary { background: #2492EB; color: #fff; }
  .pc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .pc-course-list { border: 1px solid #E5E7EB; border-radius: 0.6rem; max-height: 180px; overflow-y: auto; }
  .pc-course-row { display: flex; align-items: center; gap: 0.6rem; padding: 0.55rem 0.8rem; border-bottom: 1px solid #F3F4F6; cursor: pointer; min-height: 44px; }
  .pc-course-row:last-child { border-bottom: none; }
  .pc-course-row:hover { background: #FAFAFA; }
  .pc-course-row input[type="checkbox"] { flex-shrink: 0; width: 16px; height: 16px; }
  .pc-course-title { flex: 1; min-width: 0; font-size: 0.85rem; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pc-course-empty, .pc-course-loading { padding: 0.9rem; text-align: center; font-size: 0.8rem; color: #9CA3AF; }
  .pc-course-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .pc-course-toolbar label { flex-shrink: 0; }
  .pc-course-toolbar-right { display: flex; align-items: center; gap: 0.6rem; margin-left: auto; }
  .pc-course-count { font-size: 0.75rem; color: #6B7280; font-weight: 500; white-space: nowrap; }
  .pc-course-toolbar button { border: none; background: none; color: #2492EB; font-size: 0.75rem; font-weight: 700; cursor: pointer; padding: 0; white-space: nowrap; }

  @media (max-width: 480px) {
    .pc-row { flex-direction: column; }
  }

  @media (max-width: 380px) {
    .pc-modal { padding: 1.1rem; border-radius: 0.85rem; gap: 0.85rem; }
    .pc-modal-title { font-size: 1.05rem; }
    .pc-actions { flex-direction: column-reverse; }
    .pc-btn { width: 100%; padding: 0.65rem 1rem; }
  }
`

interface CreatePromoCodeModalProps {
  onClose: () => void
  onCreated: () => void
}

interface CourseOption {
  id: string
  slug: string
  title: string
}

interface PublishedCourseResponse {
  count: number
  next: string | null
  previous: string | null
  results: CourseOption[]
}

export default function CreatePromoCodeModal({ onClose, onCreated }: CreatePromoCodeModalProps) {
  const [code, setCode] = useState('')
  const [discountValue, setDiscountValue] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [maxPerUser, setMaxPerUser] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  
  const discountType: DiscountType = 'percentage'

  // ─── Course scoping ───
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)
  const [courseCount, setCourseCount] = useState(0)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function loadCourses() {
      setCoursesLoading(true)
      setCoursesError(null)
      try {
        const response = await apiClient.get<PublishedCourseResponse>('/v1/courses/', {
          params: { page_size: 100 },
        })
        if (cancelled) return
        const payload = response.data
        const results = Array.isArray(payload) ? payload : payload.results
        setCourses(results ?? [])
        setCourseCount(Array.isArray(payload) ? results.length : payload.count)
      } catch {
        if (!cancelled) {
          setCoursesError('Failed to load published courses.')
        }
      }
      if (!cancelled) setCoursesLoading(false)
    }
    loadCourses()
    return () => { cancelled = true }
  }, [])

  function toggleCourse(id: string) {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((courseId) => courseId !== id) : [...prev, id],
    )
  }

  const canSubmit = code.trim().length > 0 && discountValue.trim().length > 0 && !isSubmitting

  async function handleSubmit() {
    setIsSubmitting(true)
    setError(null)

    const res = await adminPromoCodesAPI.createCode({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue.trim(),
      ...(maxRedemptions.trim() ? { max_redemptions: Number(maxRedemptions) } : {}),
      ...(maxPerUser.trim() ? { max_redemptions_per_user: Number(maxPerUser) } : {}),
      applicable_course_ids: selectedCourseIds,
    })

    setIsSubmitting(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="pc-modal-overlay" onClick={onClose}>
      <div className="pc-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pc-modal-title">Create promo code</h2>

        <div className="pc-field">
          <label>Code</label>
          <input
            placeholder="SAVE20"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <span className="pc-field-hint"> SAVE20 and save20 are the same code.</span>
        </div>

        <div className="pc-field">
          <label>Discount (%)</label>
          <input
            placeholder="20.00"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
          />
          <span className="pc-field-hint">Percentage-off is the only confirmed discount type for now.</span>
        </div>

        <div className="pc-row">
          <div className="pc-field">
            <label>Max total redemptions</label>
            <input
              placeholder="Unlimited"
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="pc-field">
            <label>Max per learner</label>
            <input
              placeholder="Unlimited"
              value={maxPerUser}
              onChange={(e) => setMaxPerUser(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="pc-field">
          <div className="pc-course-toolbar">
            <label>Applies to</label>
            <span className="pc-course-count">
              {courseCount} published course{courseCount === 1 ? '' : 's'}
            </span>
            {selectedCourseIds.length > 0 && (
              <button type="button" onClick={() => setSelectedCourseIds([])}>Clear selection</button>
            )}
          </div>

          <div className="pc-course-list">
            {coursesLoading && <div className="pc-course-loading">Loading courses…</div>}
            {!coursesLoading && coursesError && <div className="pc-course-empty">{coursesError}</div>}
            {!coursesLoading && !coursesError && courses.length === 0 && (
              <div className="pc-course-empty">No courses found.</div>
            )}
            {!coursesLoading && !coursesError && courses.map((c) => (
              <label key={c.id} className="pc-course-row">
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                />
                <span className="pc-course-title">{c.title}</span>
              </label>
            ))}
          </div>

          <span className="pc-field-hint">
            {selectedCourseIds.length === 0
              ? 'No courses selected — this code will apply platform-wide.'
              : `Scoped to ${selectedCourseIds.length} course${selectedCourseIds.length > 1 ? 's' : ''}.`}
          </span>
        </div>

        {error && <p className="pc-error">{error}</p>}

        <div className="pc-actions">
          <button type="button" className="pc-btn pc-btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="pc-btn pc-btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting ? 'Creating\u2026' : 'Create code'}
          </button>
        </div>
      </div>
    </div>
  )
}