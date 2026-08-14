import { useMemo, useState } from 'react'
import { X, UserCog, Search, BookOpen, Check } from 'lucide-react'
import type { CourseSummary, CourseTrainer } from '../../types/adminCourse'
import { MOCK_TRAINERS } from '../../types/adminCourse'

export const ASSIGN_TRAINER_MODAL_CSS = `
  .at-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .at-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; }
  .at-inner { padding: 1.5rem; }

  .at-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 1.1rem; }
  .at-head-left { display: flex; align-items: center; gap: 0.8rem; min-width: 0; }
  .at-icon { width: 44px; height: 44px; border-radius: 0.75rem; background: #EFF6FF; color: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .at-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111827; }
  .at-sub { margin: 0.1rem 0 0; font-size: 0.82rem; color: #9CA3AF; }
  .at-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.2rem; flex-shrink: 0; }

  .at-course-row { display: flex; align-items: center; gap: 0.7rem; background: #F9FAFB; border-radius: 0.85rem; padding: 0.75rem 0.9rem; margin-bottom: 1.1rem; }
  .at-course-icon { width: 36px; height: 36px; border-radius: 0.55rem; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .at-course-title { margin: 0; font-weight: 700; font-size: 0.86rem; color: #111827; }
  .at-course-sub { margin: 0; font-size: 0.76rem; color: #9CA3AF; }

  .at-search-wrap { display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 0.9rem; margin-bottom: 1rem; }
  .at-search-wrap input { flex: 1; background: none; border: none; outline: none; font-size: 0.85rem; color: #111; }
  .at-search-wrap input::placeholder { color: #9CA3AF; }

  .at-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; max-height: 260px; overflow-y: auto; }
  .at-option { display: flex; align-items: center; gap: 0.7rem; border: 1.5px solid #E5E7EB; border-radius: 0.85rem; padding: 0.65rem 0.85rem; cursor: pointer; }
  .at-option.selected { border-color: #2492EB; background: #EFF6FF; }
  .at-option-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; }
  .at-option-text { flex: 1; min-width: 0; }
  .at-option-name { margin: 0; font-size: 0.86rem; font-weight: 700; color: #111827; }
  .at-option-role { margin: 0; font-size: 0.76rem; color: #9CA3AF; }
  .at-option-current { font-size: 0.7rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; }
  .at-option-check { width: 22px; height: 22px; border-radius: 50%; background: #2492EB; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .at-empty { padding: 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.85rem; }

  .at-actions { display: flex; gap: 0.6rem; }
  .at-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .at-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .at-btn.confirm { border: none; background: #2492EB; color: #fff; }
  .at-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
`

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

interface AssignTrainerModalProps {
  course: CourseSummary
  onClose: () => void
  onConfirm: (trainer: CourseTrainer) => void
  trainers?: CourseTrainer[]
}

export default function AssignTrainerModal({
  course, onClose, onConfirm, trainers = MOCK_TRAINERS,
}: AssignTrainerModalProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(course.trainer.id)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return trainers
    return trainers.filter((t) => t.name.toLowerCase().includes(q))
  }, [trainers, query])

  const selectedTrainer = trainers.find((t) => t.id === selectedId)
  const canAssign = !!selectedTrainer && selectedId !== course.trainer.id

  function handleConfirm() {
    if (!selectedTrainer || !canAssign) return
    onConfirm(selectedTrainer)
  }

  return (
    <div className="at-overlay" onClick={onClose}>
      <div className="at-modal" onClick={(e) => e.stopPropagation()}>
        <div className="at-inner">
          <div className="at-head">
            <div className="at-head-left">
              <div className="at-icon">
                <UserCog size={20} />
              </div>
              <div>
                <h3 className="at-title">Assign trainer</h3>
                <p className="at-sub">Choose who owns this course</p>
              </div>
            </div>
            <button className="at-close" onClick={onClose} aria-label="Close" type="button">
              <X size={18} />
            </button>
          </div>

          <div className="at-course-row">
            <div className="at-course-icon">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="at-course-title">{course.title}</p>
              <p className="at-course-sub">Currently {course.trainer.name}</p>
            </div>
          </div>

          <div className="at-search-wrap">
            <Search size={15} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search trainers..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="at-list">
            {filtered.length === 0 && (
              <div className="at-empty">No trainers match your search.</div>
            )}
            {filtered.map((t) => {
              const selected = t.id === selectedId
              const isCurrent = t.id === course.trainer.id
              return (
                <div
                  key={t.id}
                  className={`at-option${selected ? ' selected' : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="at-option-avatar" style={{ background: t.avatar_color }}>
                    {initials(t.name)}
                  </div>
                  <div className="at-option-text">
                    <p className="at-option-name">{t.name}</p>
                    <p className="at-option-role">{t.role}</p>
                  </div>
                  {isCurrent && !selected && <span className="at-option-current">Current</span>}
                  {selected && (
                    <span className="at-option-check">
                      <Check size={13} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="at-actions">
            <button className="at-btn cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="at-btn confirm" onClick={handleConfirm} disabled={!canAssign} type="button">
              <UserCog size={15} /> Assign trainer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}