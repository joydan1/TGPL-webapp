import { useState } from 'react'
import { X, Tag, BookOpen, AlertCircle } from 'lucide-react'
import type { AdminCourseRow } from '../../types/adminCourse'

export const SET_PRICE_MODAL_CSS = `
  .sp-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 1rem; }
  .sp-modal { background: #fff; border-radius: 1.1rem; width: 100%; max-width: 420px; }
  .sp-inner { padding: 1.5rem; }

  .sp-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding-bottom: 1.25rem; border-bottom: 1px solid #F3F4F6; margin-bottom: 1.25rem; }
  .sp-head-left { display: flex; align-items: center; gap: 0.8rem; min-width: 0; }
  .sp-icon { width: 44px; height: 44px; border-radius: 0.75rem; background: #ECFDF5; color: #10B981; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sp-title { margin: 0; font-size: 1.05rem; font-weight: 800; color: #111827; }
  .sp-sub { margin: 0.1rem 0 0; font-size: 0.82rem; color: #9CA3AF; }
  .sp-close { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.2rem; flex-shrink: 0; }

  .sp-label { display: block; font-size: 0.85rem; font-weight: 700; color: #111827; margin: 0 0 0.6rem; }
  .sp-input-wrap { position: relative; margin-bottom: 1.5rem; }
  .sp-currency { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-weight: 700; font-size: 1.1rem; }
  .sp-input { width: 100%; border: none; background: #F9FAFB; border-radius: 0.85rem; padding: 1rem 1rem 1rem 2.1rem; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .sp-input:focus { outline: 2px solid #2492EB; outline-offset: -1px; }
  .sp-free-toggle { margin-top: 0.6rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #6B7280; }
  .sp-free-toggle button { border: none; background: none; color: #2492EB; font-weight: 700; cursor: pointer; padding: 0; font-size: 0.8rem; }

  .sp-error { display: flex; align-items: flex-start; gap: 0.5rem; background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 0.75rem; padding: 0.75rem 0.9rem; font-size: 0.82rem; line-height: 1.45; margin-bottom: 1.25rem; }
  .sp-error svg { flex-shrink: 0; margin-top: 0.1rem; }

  .sp-actions { display: flex; gap: 0.6rem; }
  .sp-btn { flex: 1; border-radius: 0.75rem; padding: 0.8rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .sp-btn.cancel { border: 1.5px solid #E5E7EB; background: #fff; color: #374151; }
  .sp-btn.confirm { border: none; background: #2492EB; color: #fff; }
  .sp-btn.confirm:disabled { opacity: 0.5; cursor: not-allowed; }
`

interface SetPriceModalProps {
  course: AdminCourseRow
  onClose: () => void
  // Kobo, matching UpdateCoursePayload.price_kobo — null means "make free".
  // The input field itself stays in naira for a sane admin UX; conversion
  // happens at submit time.
  onConfirm: (newPriceKobo: number | null) => void
  // Shown inline — this modal's overlay sits above the rest of the page,
  // so a page-level banner behind it would be invisible even when set.
  error?: string | null
  submitting?: boolean
}

export default function SetPriceModal({
  course, onClose, onConfirm, error = null, submitting = false,
}: SetPriceModalProps) {
  const initialNaira = course.is_free ? '' : String(course.price_kobo / 100)
  const [priceInput, setPriceInput] = useState(initialNaira)
  const [isFree, setIsFree] = useState(course.is_free)

  const numericNaira = Number(priceInput)
  const canSave = !submitting && (isFree || (priceInput.trim() !== '' && !isNaN(numericNaira) && numericNaira >= 0))

  function handleSave() {
    if (!canSave) return
    onConfirm(isFree ? null : Math.round(numericNaira * 100))
  }

  return (
    <div className="sp-overlay" onClick={onClose}>
      <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-inner">
          <div className="sp-head">
            <div className="sp-head-left">
              <div className="sp-icon">
                <BookOpen size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 className="sp-title">{course.title}</h3>
                <p className="sp-sub">{course.trainer.full_name}</p>
              </div>
            </div>
            <button className="sp-close" onClick={onClose} aria-label="Close" type="button">
              <X size={18} />
            </button>
          </div>

          {isFree ? (
            <>
              <label className="sp-label">This course is free</label>
              <div className="sp-free-toggle">
                Want to charge for it instead?{' '}
                <button type="button" onClick={() => setIsFree(false)}>Set a price</button>
              </div>
              <div style={{ height: '1.5rem' }} />
            </>
          ) : (
            <>
              <label className="sp-label">New price (₦)</label>
              <div className="sp-input-wrap">
                <span className="sp-currency">₦</span>
                <input
                  className="sp-input"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="sp-free-toggle" style={{ marginTop: '-1rem', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => setIsFree(true)}>Make this course free instead</button>
              </div>
            </>
          )}

          {error && (
            <div className="sp-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="sp-actions">
            <button className="sp-btn cancel" onClick={onClose} type="button" disabled={submitting}>
              Cancel
            </button>
            <button className="sp-btn confirm" onClick={handleSave} disabled={!canSave} type="button">
              <Tag size={15} /> {submitting ? 'Saving…' : 'Save price'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}