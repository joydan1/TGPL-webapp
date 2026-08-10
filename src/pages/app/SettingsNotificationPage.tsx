import { useState } from 'react'
import SettingsLayout from '../../components/layout/SettingsLayout'
import { useAuth } from '../../hooks/useAuth' 

type Channel = 'inApp' | 'email' | 'push'

type CategoryPrefs = {
  id: string
  label: string
  inApp: boolean
  email: boolean
  push: boolean
}

// ---------- LEARNER CONTENT ----------
const LEARNER_CATEGORIES: CategoryPrefs[] = [
  { id: 'deadlines', label: 'Deadlines & assignments', inApp: false, email: false, push: true },
  { id: 'liveSessions', label: 'Live sessions', inApp: true, email: false, push: true },
  { id: 'feedback', label: 'Feedback & grades', inApp: false, email: true, push: true },
]

// ---------- TRAINER CONTENT ----------
const TRAINER_CATEGORIES: CategoryPrefs[] = [
  { id: 'assignmentSubmission', label: 'Assignments submission', inApp: false, email: false, push: true },
  { id: 'studentQuestions', label: 'Students questions & feedback', inApp: true, email: false, push: true },
  { id: 'liveClassReminder', label: 'Live class reminder', inApp: false, email: true, push: true },
]

const PAGE_CSS = `
  .notif-card { max-width: 720px; margin: 1.5rem auto 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; overflow: hidden; }
  .notif-pause-row { display:flex; align-items:center; justify-content:space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #E5E7EB; }
  .notif-pause-title { font-weight: 700; font-size: 1rem; color: #111; margin: 0; }
  .notif-pause-sub { font-size: 0.875rem; color: #6B7280; margin: 0.25rem 0 0; }
  .notif-table { width: 100%; border-collapse: collapse; }
  .notif-table th { text-align: left; font-weight: 600; color: #6B7280; font-size: 0.875rem; padding: 1rem 1.5rem 0.75rem; }
  .notif-table th.col-toggle { text-align: center; }
  .notif-table td { padding: 1rem 1.5rem; border-top: 1px solid #F3F4F6; }
  .notif-table td.col-toggle { text-align: center; }
  .notif-cat-label { font-size: 0.9375rem; color: #111; }
  .toggle { position: relative; display: inline-block; width: 42px; height: 24px; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle .track { position: absolute; inset: 0; background: #D1D5DB; border-radius: 999px; transition: background 0.15s; cursor: pointer; }
  .toggle .track::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: transform 0.15s; }
  .toggle input:checked + .track { background: #2492EB; }
  .toggle input:checked + .track::before { transform: translateX(18px); }
  .toggle input:disabled + .track { opacity: 0.5; cursor: not-allowed; }
  .actions { display:flex; flex-direction: column; gap:0.75rem; margin-top: 1.5rem; max-width: 720px; margin-left: auto; margin-right: auto; }
  .btn { width:100%; padding: 0.85rem 1rem; border-radius: 0.75rem; font-weight:700; cursor:pointer; border: none; }
  .btn.primary { background: #2492EB; color:#fff; }
  .btn.secondary { background:#fff; color:#6B7280; border:1px solid #E5E7EB }
  .saved-msg { color: #059669; font-weight: 600; font-size: 0.875rem; text-align: center; margin-top: 0.75rem; }
  @media (max-width:640px){
    .notif-table th, .notif-table td { padding: 0.75rem 0.75rem; }
    .notif-cat-label { font-size: 0.8125rem; }
  }
`

function Toggle({ checked, disabled, onChange, label }: { checked: boolean; disabled?: boolean; onChange: () => void; label: string }) {
  return (
    <label className="toggle" aria-label={label}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
      <span className="track" />
    </label>
  )
}

export default function SettingsNotificationPage() {
 const { user } = useAuth()
const isTrainer = user?.role === 'trainer' 

  const DEFAULT_CATEGORIES = isTrainer ? TRAINER_CATEGORIES : LEARNER_CATEGORIES

  const [pauseAll, setPauseAll] = useState(false)
  const [categories, setCategories] = useState<CategoryPrefs[]>(DEFAULT_CATEGORIES)
  const [saved, setSaved] = useState(false)

  const toggleChannel = (id: string, channel: Channel) => {
    setSaved(false)
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [channel]: !c[channel] } : c))
    )
  }

  const handleSave = () => {
    // No notification-preferences endpoint exists yet — persisting locally only.
    // Wire this up to PATCH /api/v1/users/me/notification-preferences/ (or similar)
    // once the backend exposes it.
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCancel = () => {
    setCategories(DEFAULT_CATEGORIES)
    setPauseAll(false)
    setSaved(false)
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <SettingsLayout title="Notification" subtitle="Choose what you're notified about and how">
        <div className="notif-card">
          <div className="notif-pause-row">
            <div>
              <p className="notif-pause-title">Pause all notifications</p>
              <p className="notif-pause-sub">Temporary stop every notification</p>
            </div>
            <Toggle
              checked={pauseAll}
              onChange={() => { setSaved(false); setPauseAll((v) => !v) }}
              label="Pause all notifications"
            />
          </div>

          <table className="notif-table">
            <thead>
              <tr>
                <th>Category</th>
                <th className="col-toggle">In-app</th>
                <th className="col-toggle">Email</th>
                <th className="col-toggle">Push</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td><span className="notif-cat-label">{cat.label}</span></td>
                  <td className="col-toggle">
                    <Toggle
                      checked={cat.inApp}
                      disabled={pauseAll}
                      onChange={() => toggleChannel(cat.id, 'inApp')}
                      label={`${cat.label} in-app`}
                    />
                  </td>
                  <td className="col-toggle">
                    <Toggle
                      checked={cat.email}
                      disabled={pauseAll}
                      onChange={() => toggleChannel(cat.id, 'email')}
                      label={`${cat.label} email`}
                    />
                  </td>
                  <td className="col-toggle">
                    <Toggle
                      checked={cat.push}
                      disabled={pauseAll}
                      onChange={() => toggleChannel(cat.id, 'push')}
                      label={`${cat.label} push`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="actions">
          <button className="btn primary" type="button" onClick={handleSave}>Save changes</button>
          <button className="btn secondary" type="button" onClick={handleCancel}>Cancel</button>
        </div>
        {saved && <p className="saved-msg">Preferences saved (locally — no backend yet)</p>}
      </SettingsLayout>
    </>
  )
}