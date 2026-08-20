import { useState } from 'react'
import { Archive, BookOpen, Check } from 'lucide-react'
import type { AdminCourseRow, ArchiveReason, ArchiveCoursePayload } from '../../types/adminCourse'

export const ARCHIVE_COURSE_MODAL_CSS = `
  .ac-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .ac-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 440px; position: relative; }
  .ac-topbar { height: 5px; background: linear-gradient(90deg, #F59E0B, #FBBF24); border-radius: 1.1rem 1.1rem 0 0; }
  .ac-inner { padding: 1.5rem; }

  .ac-head { display: flex; gap: 0.9rem; margin-bottom: 1.25rem; }
  .ac-icon { width: 48px; height: 48px; border-radius: 0.85rem; background: #FEF3C7; display: flex; align-items: center; justify-content: center; color: #D97706; flex-shrink: 0; }
  .ac-title { margin: 0 0 0.3rem; font-size: 1.2rem; font-weight: 800; color: #111827; }
  .ac-desc { margin: 0; color: #6B7280; font-size: 0.88rem; line-height: 1.5; }

  .ac-course-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.85rem 1rem; margin-bottom: 1.25rem; }
  .ac-course-left { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
  .ac-course-icon { width: 40px; height: 40px; border-radius: 0.6rem; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ac-course-title { margin: 0; font-weight: 700; font-size: 0.9rem; color: #111827; }
  .ac-course-sub { margin: 0; font-size: 0.78rem; color: #9CA3AF; }
  .ac-course-enrolled { text-align: right; flex-shrink: 0; }
  .ac-course-enrolled-num { font-weight: 800; font-size: 0.95rem; color: #111827; }
  .ac-course-enrolled-label { font-size: 0.75rem; color: #9CA3AF; }

  .ac-list { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
  .ac-list-item { display: flex; align-items: flex-start; gap: 0.6rem; font-size: 0.86rem; color: #374151; line-height: 1.4; }
  .ac-check { color: #D97706; flex-shrink: 0; margin-top: 0.15rem; }

  .ac-label { display: block; font-size: 0.82rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
  .ac-select { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.7rem 0.85rem; font-size: 0.86rem; color: #111827; background: #fff; margin-bottom: 1rem; }
  .ac-select:focus { outline: none; border-color: #F59E0B; }
  .ac-note { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 0.75rem; padding: 0.7rem 0.85rem; font-size: 0.86rem; color: #111827; resize: vertical; min-height: 64px; margin-bottom: 1.25rem; font-family: inherit; }
  .ac-note:focus { outline: none; border-color: #F59E0B; }

  .ac-actions { display: flex; gap: 0.6rem; }
  .ac-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .ac-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .ac-btn.confirm { border: 1.5px solid #F59E0B; background: #fff; color: #D97706; }
  .ac-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
`

const CONSEQUENCES = [
  'Course will be removed from the public catalog immediately',
  'Current enrollees retain access to their progress',
  'Revenue history and certificates are preserved',
  'You can restore it to draft at any time',
]

const REASON_OPTIONS: { value: ArchiveReason; label: string }[] = [
  { value: 'low_completion',   label: 'Low completion rate' },
  { value: 'outdated_content', label: 'Outdated content' },
  { value: 'trainer_departed', label: 'Trainer departed' },
  { value: 'policy_violation', label: 'Policy violation' },
  { value: 'other',            label: 'Other' },
]

interface ArchiveCourseModalProps {
  course: AdminCourseRow
  onClose: () => void
  // The endpoint requires {reason, note?} — recorded server-side with who
  // archived it and why, so this can no longer be a bare confirm().
  onConfirm: (payload: ArchiveCoursePayload) => void
}

export default function ArchiveCourseModal({ course, onClose, onConfirm }: ArchiveCourseModalProps) {
  const [reason, setReason] = useState<ArchiveReason>('low_completion')
  const [note, setNote] = useState('')

  function handleConfirm() {
    onConfirm({ reason, note: note.trim() || undefined })
  }

  return (
    <div className="ac-overlay" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ac-topbar" />
        <div className="ac-inner">
          <div className="ac-head">
            <div className="ac-icon">
              <Archive size={22} />
            </div>
            <div>
              <h3 className="ac-title">Archive this course?</h3>
              <p className="ac-desc">Archived courses are hidden from learners but all data is preserved.</p>
            </div>
          </div>

          <div className="ac-course-row">
            <div className="ac-course-left">
              <div className="ac-course-icon">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="ac-course-title">{course.title}</p>
                {/* No `category` on the list row — trainer name in its place. */}
                <p className="ac-course-sub">{course.trainer.full_name}</p>
              </div>
            </div>
            <div className="ac-course-enrolled">
              <div className="ac-course-enrolled-num">{course.enrollment_count}</div>
              <div className="ac-course-enrolled-label">enrolled</div>
            </div>
          </div>

          <div className="ac-list">
            {CONSEQUENCES.map((c) => (
              <div key={c} className="ac-list-item">
                <Check size={16} className="ac-check" />
                {c}
              </div>
            ))}
          </div>

          <label className="ac-label" htmlFor="ac-reason">Reason</label>
          <select
            id="ac-reason"
            className="ac-select"
            value={reason}
            onChange={(e) => setReason(e.target.value as ArchiveReason)}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <label className="ac-label" htmlFor="ac-note">Note (optional)</label>
          <textarea
            id="ac-note"
            className="ac-note"
            placeholder="Any extra context for this archive decision..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="ac-actions">
            <button className="ac-btn cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="ac-btn confirm" onClick={handleConfirm} type="button">
              <Archive size={15} /> Archive course
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}