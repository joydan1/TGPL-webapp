import { useEffect, useState } from 'react'
import { X, UserCog, Search, BookOpen, Check, Loader2, AlertCircle } from 'lucide-react'
import type { AdminCourseRow } from '../../types/adminCourse'
import type { AdminTrainerRow } from '../../types/adminTrainer'
import { adminTrainersAPI } from '../../services/adminTrainers'

// --- UI-facing shape used inside this modal ---
export interface TrainerOption {
  id: string
  name: string
  email: string
  courses_taught: number
  active_students: number
  avatar_url: string | null
  avatar_color: string
}


const AVATAR_PALETTE = ['#2492EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777']
function colorForId(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function toTrainerOption(t: AdminTrainerRow): TrainerOption {
  return {
    id: t.id,
    name: t.full_name,
    email: t.email,
    courses_taught: t.courses_taught,
    active_students: t.active_students,
    avatar_url: t.avatar_url,
    avatar_color: colorForId(t.id),
  }
}

export const ASSIGN_TRAINER_MODAL_CSS = `
  .at-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .at-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; }
  .at-inner { padding: 1.5rem; }

  .at-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; margin-bottom: 1.1rem; }
  .at-head-left { display: flex; align-items: center; gap: 0.8rem; min-width: 0; }
  .at-icon { width: 44px; height: 44px; border-radius: 0.75rem; background: #EFF6FF; color: #2492EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
  .at-option.disabled { opacity: 0.5; cursor: not-allowed; }
  .at-option-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.8rem; flex-shrink: 0; overflow: hidden; }
  .at-option-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .at-option-text { flex: 1; min-width: 0; }
  .at-option-name { margin: 0; font-size: 0.86rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .at-option-role { margin: 0; font-size: 0.76rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .at-option-current { font-size: 0.7rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0; }
  .at-option-check { width: 22px; height: 22px; border-radius: 50%; background: #2492EB; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .at-empty { padding: 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.85rem; }
  .at-loading { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 1.5rem; color: #9CA3AF; font-size: 0.85rem; }
  .at-loading svg { animation: at-spin 0.8s linear infinite; }
  @keyframes at-spin { to { transform: rotate(360deg); } }
  .at-error-banner { display: flex; align-items: flex-start; gap: 0.5rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.65rem; padding: 0.65rem 0.8rem; font-size: 0.8rem; margin-bottom: 1rem; }

  .at-actions { display: flex; gap: 0.6rem; }
  .at-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .at-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .at-btn.confirm { border: none; background: #2492EB; color: #fff; }
  .at-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 480px) {
    .at-inner { padding: 1.1rem; }
    .at-modal { max-width: 100%; border-radius: 0.9rem; }
    .at-list { max-height: 45vh; }
  }
`

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

interface AssignTrainerModalProps {
  course: AdminCourseRow
  onClose: () => void
  // Fires with just the trainer_id — parent (AdminCoursesPage) owns the
  // POST /api/v1/admin/courses/{slug}/assign-trainer/ call and course state
  // update, since it already holds the course list / optimistic-update logic.
  onConfirm: (trainerId: string) => void
  // If the assign-trainer POST is in flight in the parent, pass this through
  // so the confirm button reflects it instead of just closing immediately.
  isAssigning?: boolean
}

const SEARCH_DEBOUNCE_MS = 300
const PAGE_SIZE = 100 // API max; roster is expected to be well under this

export default function AssignTrainerModal({
  course, onClose, onConfirm, isAssigning = false,
}: AssignTrainerModalProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedId, setSelectedId] = useState(course.trainer.id)
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search input before hitting the API's `search` param.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false

    async function fetchTrainers() {
      setIsLoading(true)
      setError(null)

      const result = await adminTrainersAPI.listTrainers({
        is_active: true,
        ordering: 'first_name',
        page_size: PAGE_SIZE,
        ...(debouncedQuery ? { search: debouncedQuery } : {}),
      })

      if (cancelled) return

      if (!result.success) {
        setError(result.error)
        setTrainers([])
      } else {
        setTrainers(result.data.results.map(toTrainerOption))
      }
      setIsLoading(false)
    }

    fetchTrainers()
    return () => { cancelled = true }
  }, [debouncedQuery])

  const selectedTrainer = trainers.find((t) => t.id === selectedId)
  const canAssign = !!selectedTrainer && selectedId !== course.trainer.id && !isAssigning

  function handleConfirm() {
    if (!selectedTrainer || !canAssign) return
    onConfirm(selectedTrainer.id)
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
              <p className="at-course-sub">Currently {course.trainer.full_name}</p>
            </div>
          </div>

          {error && (
            <div className="at-error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

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
            {isLoading && (
              <div className="at-loading">
                <Loader2 size={16} /> Loading trainers…
              </div>
            )}
            {!isLoading && !error && trainers.length === 0 && (
              <div className="at-empty">
                {debouncedQuery ? 'No trainers match your search.' : 'No active trainers found.'}
              </div>
            )}
            {!isLoading && trainers.map((t) => {
              const selected = t.id === selectedId
              const isCurrent = t.id === course.trainer.id
              return (
                <div
                  key={t.id}
                  className={`at-option${selected ? ' selected' : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <div className="at-option-avatar" style={{ background: t.avatar_color }}>
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt="" />
                    ) : (
                      initials(t.name)
                    )}
                  </div>
                  <div className="at-option-text">
                    <p className="at-option-name">{t.name}</p>
                    <p className="at-option-role">
                      {t.courses_taught} course{t.courses_taught === 1 ? '' : 's'} ·{' '}
                      {t.active_students} active student{t.active_students === 1 ? '' : 's'}
                    </p>
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
              {isAssigning ? <Loader2 size={15} /> : <UserCog size={15} />}
              {isAssigning ? 'Assigning…' : 'Assign trainer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}