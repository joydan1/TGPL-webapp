import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, FileText, Tag, Calendar, Plus, X, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { ROUTES } from '../../../constants/routes'
import { trainerProfileAPI, type TrainerProfile } from '../../../services/api'
import SettingsLayout from '../../../components/layout/SettingsLayout'


const BIO_MAX_LEN = 400

const PAGE_CSS = `
  /* Centers and caps the content width on large screens; full-width on small ones. */
  .tp-container { max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }

  .tp-banner { display: flex; align-items: flex-start; gap: 0.75rem; background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; border-radius: 1rem; padding: 1rem 1.25rem; margin-bottom: 1.25rem; font-size: 0.875rem; line-height: 1.45; }
  .tp-banner svg { flex-shrink: 0; margin-top: 0.1rem; }

  .field-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; }
  .field-block { padding: 1.25rem 1.5rem; border-bottom: 1px solid #F1F3F5; }
  .field-block:last-child { border-bottom: none; }
  .field-label-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; flex-wrap: wrap; }
  .field-label-row svg { color: #6B7280; flex-shrink: 0; }
  .field-label { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .field-optional { font-size: 0.8125rem; color: #9CA3AF; font-weight: 500; }

  .field-input { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; font-family: inherit; min-width: 0; }
  .field-input:focus { outline: none; border-color: #93C5FD; background: #fff; }
  .field-hint { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.5rem; line-height: 1.45; }

  .field-textarea { width: 100%; border: 1px solid #E5E7EB; background: #F9FAFB; border-radius: 0.75rem; padding: 0.85rem 1rem; font-size: 0.9375rem; color: #111; box-sizing: border-box; font-family: inherit; resize: vertical; min-height: 120px; }
  .field-textarea:focus { outline: none; border-color: #93C5FD; background: #fff; }
  .char-count { font-size: 0.8125rem; color: #9CA3AF; margin-top: 0.4rem; text-align: right; }

  .tag-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
  .tag-chip { display: flex; align-items: center; gap: 0.4rem; background: #EFF6FF; color: #2492EB; font-weight: 600; font-size: 0.85rem; padding: 0.4rem 0.7rem 0.4rem 0.85rem; border-radius: 999px; max-width: 100%; }
  .tag-chip span, .tag-chip { word-break: break-word; }
  .tag-chip-remove { background: none; border: none; color: #2492EB; cursor: pointer; padding: 0; display: flex; opacity: 0.7; flex-shrink: 0; }
  .tag-chip-remove:hover { opacity: 1; }
  .tag-input-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
  .tag-input-row .field-input { flex: 1; min-width: 140px; }
  .tag-add-btn { display: flex; align-items: center; justify-content: center; gap: 0.35rem; border: 1px solid #2492EB; background: #fff; color: #2492EB; font-weight: 700; font-size: 0.85rem; border-radius: 0.75rem; padding: 0 1rem; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .tag-add-btn:disabled { opacity: 0.5; cursor: default; }

  .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .toggle-row-text { flex: 1; min-width: 0; }
  .toggle-title { margin: 0; font-weight: 700; color: #111; font-size: 0.9375rem; }
  .toggle-sub { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8125rem; line-height: 1.4; }

  .toggle { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle .track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; transition: background 0.15s; cursor: pointer; }
  .toggle .track::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.15s; }
  .toggle input:checked + .track { background: #2492EB; }
  .toggle input:checked + .track::before { transform: translateX(18px); }

  .save-bar { position: fixed; left: 0; right: 0; bottom: 0; background: #fff; border-top: 1px solid #E5E7EB; padding: 1rem 2.5rem; display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 0.75rem; z-index: 20; }
  .save-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: none; border-radius: 0.75rem; padding: 0.9rem 1.5rem; font-weight: 700; font-size: 0.9375rem; cursor: pointer; width: 100%; max-width: 220px; }
  .save-btn.primary { background: #2492EB; color: #fff; }
  .save-btn.primary:disabled { background: #E5E7EB; color: #9CA3AF; cursor: default; }
  .save-btn.secondary { background: #fff; color: #6B7280; border: 1px solid #E5E7EB; }
  .save-btn.secondary:disabled { color: #C4C9D1; cursor: default; }

  .toast { position: fixed; bottom: 6.5rem; left: 50%; transform: translateX(-50%); background: #1F2937; color: #fff; padding: 0.85rem 1.1rem; border-radius: 0.85rem; display: flex; align-items: center; gap: 0.7rem; font-size: 0.9rem; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,0.25); z-index: 400; max-width: 90vw; }
  .toast-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .toast-icon.success { background: #22C55E; }
  .toast-icon.error { background: #EF4444; }
  .toast-close { background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 0; display: flex; margin-left: 0.25rem; flex-shrink: 0; }
  .toast-close:hover { color: #fff; }

  /* Tablet */
  @media (max-width: 900px) {
    .save-bar { padding: 1rem 1.5rem; }
  }

  /* Mobile */
  @media (max-width: 640px) {
    .field-block { padding: 1rem 1.1rem; }
    .save-bar { padding: 0.85rem 1rem; flex-direction: column-reverse; }
    .save-btn { max-width: none; }
    .toast { bottom: 5.5rem; padding: 0.75rem 0.9rem; font-size: 0.85rem; }
    .tag-input-row { flex-wrap: nowrap; }
    .tag-add-btn { padding: 0 0.85rem; }
  }

  /* Very narrow screens — stack the tag input and Add button */
  @media (max-width: 380px) {
    .tag-input-row { flex-wrap: wrap; }
    .tag-input-row .field-input { min-width: 0; flex: 1 1 100%; }
    .tag-add-btn { flex: 1 1 100%; padding: 0.7rem; }
  }
`

export default function TrainerProfilePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [profile, setProfile] = useState<TrainerProfile | null>(null)
  const [original, setOriginal] = useState<TrainerProfile | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3200)
  }

  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const result = await trainerProfileAPI.getTrainerProfile()
      if (result.success) {
        setProfile(result.data)
        setOriginal(result.data)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
    load()
  }, [])

  const isDirty =
    !!profile &&
    !!original &&
    (profile.credential !== original.credential ||
      profile.bio !== original.bio ||
      profile.accepts_bookings !== original.accepts_bookings ||
      JSON.stringify(profile.subject_areas) !== JSON.stringify(original.subject_areas))

  function updateField<K extends keyof TrainerProfile>(key: K, value: TrainerProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function addTag() {
    const trimmed = tagInput.trim()
    if (!trimmed || !profile) return
    if (profile.subject_areas.includes(trimmed)) {
      setTagInput('')
      return
    }
    updateField('subject_areas', [...profile.subject_areas, trimmed])
    setTagInput('')
  }

  function removeTag(tag: string) {
    if (!profile) return
    updateField(
      'subject_areas',
      profile.subject_areas.filter((t) => t !== tag),
    )
  }

  async function handleSave() {
    if (!profile || !isDirty) return
    setSaving(true)
    setError(null)

    const result = await trainerProfileAPI.updateTrainerProfile({
      credential: profile.credential,
      bio: profile.bio,
      subject_areas: profile.subject_areas,
      accepts_bookings: profile.accepts_bookings,
    })

    setSaving(false)
    if (!result.success) {
      setError(result.error)
      showToast('Failed to update trainer profile. Please try again.', 'error')
      return
    }
    setProfile(result.data)
    setOriginal(result.data)
    showToast('Trainer profile updated successfully', 'success')
  }

  function handleCancel() {
    if (original) setProfile(original)
    setTagInput('')
  }

  const bioLength = profile?.bio?.length ?? 0

  return (
    <>
      <style>{PAGE_CSS}</style>
      <SettingsLayout
        title="Trainer Profile"
        subtitle="Shown to learners when they view your courses or book a session."
        backTo={ROUTES.SETTINGS}
      >
        <div className="tp-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Loading trainer profile…</div>
        ) : error && !profile ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
        ) : profile && (
          <>
            {profile.completion_status !== 'complete' && (
              <div className="tp-banner">
                <AlertCircle size={18} />
                <span>Your trainer profile is incomplete. Add your credentials and subject areas so learners know what you teach.</span>
              </div>
            )}

            <div className="field-card">
              <div className="field-block">
                <div className="field-label-row">
                  <Award size={16} />
                  <span className="field-label">Credential</span>
                  <span className="field-optional">optional</span>
                </div>
                <input
                  className="field-input"
                  type="text"
                  placeholder="e.g. PMP-certified Project Manager"
                  value={profile.credential ?? ''}
                  onChange={(e) => updateField('credential', e.target.value)}
                />
                <p className="field-hint">A short qualification or title shown next to your name.</p>
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <FileText size={16} />
                  <span className="field-label">Trainer bio</span>
                  <span className="field-optional">optional</span>
                </div>
                <textarea
                  className="field-textarea"
                  placeholder="Tell learners about your teaching background and experience…"
                  maxLength={BIO_MAX_LEN}
                  value={profile.bio ?? ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                />
                <div className="char-count">{bioLength}/{BIO_MAX_LEN}</div>
                <p className="field-hint">This is separate from the personal bio on your main Profile page — this one appears on your public trainer listing.</p>
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <Tag size={16} />
                  <span className="field-label">Subject areas</span>
                  <span className="field-optional">optional</span>
                </div>
                {profile.subject_areas.length > 0 && (
                  <div className="tag-list">
                    {profile.subject_areas.map((tag) => (
                      <span className="tag-chip" key={tag}>
                        {tag}
                        <button className="tag-chip-remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="tag-input-row">
                  <input
                    className="field-input"
                    type="text"
                    placeholder="e.g. Agile, Risk Management"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <button className="tag-add-btn" onClick={addTag} disabled={!tagInput.trim()}>
                    <Plus size={15} /> Add
                  </button>
                </div>
                <p className="field-hint">Topics you teach — helps learners find you when browsing trainers.</p>
              </div>

              <div className="field-block">
                <div className="field-label-row">
                  <Calendar size={16} />
                  <span className="field-label">Accept bookings</span>
                </div>
                <div className="toggle-row">
                  <div className="toggle-row-text">
                    <p className="toggle-title">Open to 1-on-1 sessions</p>
                    <p className="toggle-sub">Learners can request live session slots with you when this is on.</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={profile.accepts_bookings}
                      onChange={(e) => updateField('accepts_bookings', e.target.checked)}
                    />
                    <span className="track" />
                  </label>
                </div>
              </div>
            </div>

            {error && <div style={{ color: '#EF4444', fontSize: '0.875rem', marginTop: '0.85rem' }}>{error}</div>}
          </>
        )}
        </div>

        {toast && (
          <div className="toast" role="status">
            <span className={`toast-icon ${toast.type}`}>
              {toast.type === 'success' ? <Check size={13} color="#fff" /> : <AlertCircle size={13} color="#fff" />}
            </span>
            <span>{toast.message}</span>
            <button className="toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        {profile && (
          <div className="save-bar">
            <button className="save-btn primary" disabled={!isDirty || saving} onClick={handleSave}>
              <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="save-btn secondary" disabled={!isDirty || saving} onClick={handleCancel}>
              <X size={16} /> Cancel
            </button>
          </div>
        )}
      </SettingsLayout>
    </>
  )
}