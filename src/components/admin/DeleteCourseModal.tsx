import { useState } from 'react'
import { Trash2, BookOpen } from 'lucide-react'
import type { CourseSummary } from '../../types/adminCourse'

export const DELETE_COURSE_MODAL_CSS = `
  .dc-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .dc-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 460px; position: relative; }
  .dc-topbar { height: 5px; background: #DC2626; border-radius: 1.1rem 1.1rem 0 0; }
  .dc-inner { padding: 1.5rem; }

  .dc-head { display: flex; gap: 0.9rem; margin-bottom: 1.25rem; }
  .dc-icon { width: 48px; height: 48px; border-radius: 0.85rem; background: #FEF2F2; display: flex; align-items: center; justify-content: center; color: #DC2626; flex-shrink: 0; }
  .dc-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .dc-desc { margin: 0; color: #6B7280; font-size: 0.86rem; line-height: 1.5; }

  .dc-course-row { display: flex; align-items: center; gap: 0.7rem; background: #FEF2F2; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem; }
  .dc-course-icon { width: 40px; height: 40px; border-radius: 0.6rem; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .dc-course-title { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .dc-course-sub { margin: 0; font-size: 0.78rem; color: #9CA3AF; }

  .dc-consequences { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
  .dc-consequence { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.86rem; color: #374151; }
  .dc-x-icon { width: 20px; height: 20px; border-radius: 50%; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.7rem; font-weight: 800; margin-top: 0.1rem; }

  .dc-confirm-label { font-size: 0.85rem; font-weight: 700; color: #111827; margin-bottom: 0.5rem; display: block; }
  .dc-confirm-label strong { color: #DC2626; }
  .dc-confirm-input { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.75rem 0.9rem; font-size: 0.9rem; margin-bottom: 1.25rem; }
  .dc-confirm-input:focus { outline: none; border-color: #DC2626; }

  .dc-actions { display: flex; gap: 0.6rem; }
  .dc-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .dc-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .dc-btn.confirm { border: none; background: #DC2626; color: #fff; }
  .dc-btn.confirm:disabled { opacity: 0.45; cursor: not-allowed; }
`

const CONSEQUENCES = [
  'All lesson content and assets will be permanently deleted',
  'Enrolled learner progress will be lost',
  'Revenue records will be removed from reports',
  'Issued certificates remain valid but course link breaks',
]

interface DeleteCourseModalProps {
  course: CourseSummary
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteCourseModal({ course, onClose, onConfirm }: DeleteCourseModalProps) {
  const [confirmText, setConfirmText] = useState('')
  const canDelete = confirmText === 'Delete'

  function handleConfirm() {
    if (!canDelete) return
    onConfirm()
  }

  return (
    <div className="dc-overlay" onClick={onClose}>
      <div className="dc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dc-topbar" />
        <div className="dc-inner">
          <div className="dc-head">
            <div className="dc-icon">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="dc-title">Delete this course permanently?</h3>
              <p className="dc-desc">This cannot be undone. All course data will be removed from the platform.</p>
            </div>
          </div>

          <div className="dc-course-row">
            <div className="dc-course-icon">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="dc-course-title">{course.title}</p>
              <p className="dc-course-sub">{course.category} · {course.enrolled} enrolled</p>
            </div>
          </div>

          <div className="dc-consequences">
            {CONSEQUENCES.map((c) => (
              <div key={c} className="dc-consequence">
                <span className="dc-x-icon">✕</span>
                {c}
              </div>
            ))}
          </div>

          <label className="dc-confirm-label">
            Type <strong>"Delete"</strong> to confirm
          </label>
          <input
            className="dc-confirm-input"
            type="text"
            placeholder="Delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />

          <div className="dc-actions">
            <button className="dc-btn cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="dc-btn confirm" onClick={handleConfirm} disabled={!canDelete} type="button">
              <Trash2 size={15} /> Delete permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}