// pages/trainer/reviews/TrainerReviewsPage.tsx
import { useState } from 'react'
import { Users, BookOpen, ClipboardList, Star, Award, X, Download, FileText, Plus, CheckCircle2 } from 'lucide-react'
import TrainerShell from '../../../../layouts/TrainerShell'

type PendingReview = {
  id: string
  name: string
  avatar: string
  assignment: string
  courseTag: string
  submittedLabel: string
  overdue: boolean
  files: { name: string; size: string }[]
}

type PastReview = {
  id: string
  name: string
  avatar: string
  assignment: string
  score: number
  status: 'Pass' | 'Revision'
  date: string
}


const pendingReviews: PendingReview[] = [
  {
    id: 'fatima-al-rashidi',
    name: 'Fatima Al-Rashidi',
    avatar: '/avatars/fatima-al-rashidi.jpg',
    assignment: 'Stakeholder Map Project',
    courseTag: 'Project Management',
    submittedLabel: 'Submitted 2h ago',
    overdue: false,
    files: [
      { name: 'Stakeholder_Map_v3.pdf', size: '2.4 MB' },
      { name: 'Stakeholder_Map_v3.pdf', size: '2.4 MB' },
      { name: 'Stakeholder_Map_v3.pdf', size: '2.4 MB' },
    ],
  },
  {
    id: 'priya-sundaram',
    name: 'Priya Sundaram',
    avatar: '/avatars/priya-sundaram.jpg',
    assignment: 'Scope Planning Quiz',
    courseTag: 'Project Management',
    submittedLabel: 'Submitted 2 days ago',
    overdue: true,
    files: [{ name: 'Scope_Planning_Quiz.pdf', size: '1.1 MB' }],
  },
  {
    id: 'kwame-asante',
    name: 'Kwame Asante',
    avatar: '/avatars/kwame-asante.jpg',
    assignment: 'Stakeholder Map Project',
    courseTag: 'Project Management',
    submittedLabel: 'Submitted 1 day ago',
    overdue: true,
    files: [{ name: 'Stakeholder_Map_v2.pdf', size: '2.1 MB' }],
  },
  {
    id: 'daniel-chirwa',
    name: 'Daniel Chirwa',
    avatar: '/avatars/daniel-chirwa.jpg',
    assignment: 'Stakeholder Map Project',
    courseTag: 'Project Management',
    submittedLabel: 'Submitted 5h ago',
    overdue: false,
    files: [{ name: 'Stakeholder_Map_v1.pdf', size: '2.0 MB' }],
  },
]

const pastReviews: PastReview[] = [
  { id: 'yusuf-bello', name: 'Yusuf Bello', avatar: '/avatars/yusuf-bello.jpg', assignment: 'Leadership Reflection', score: 91, status: 'Pass', date: '30 May' },
  { id: 'chioma-eze', name: 'Chioma Eze', avatar: '/avatars/chioma-eze.jpg', assignment: 'Scope Planning Quiz', score: 78, status: 'Pass', date: '28 May' },
  { id: 'amaka-okonkwo', name: 'Amaka Okonkwo', avatar: '/avatars/amaka-okonkwo.jpg', assignment: 'Risk Register Exercise', score: 62, status: 'Revision', date: '25 May' },
  { id: 'fatima-a', name: 'Fatima A.', avatar: '/avatars/fatima-a.jpg', assignment: 'Module 1 Quiz', score: 85, status: 'Pass', date: '20 May' },
  { id: 'daniel-chirwa-2', name: 'Daniel Chirwa', avatar: '/avatars/daniel-chirwa.jpg', assignment: 'Module 1 Quiz', score: 70, status: 'Pass', date: '19 May' },
]

const PAGE_CSS = `
  .rv-page { padding: 1rem; background: #F5F5F5; }

  .rv-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; }
  .rv-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .rv-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .rv-stat-value { margin: 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .rv-stat-title { margin: 0.3rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .rv-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rv-stat-label { margin: 0.5rem 0 0; font-size: 0.8rem; font-weight: 600; }

  .rv-section-title { margin: 1.5rem 0 0.85rem; font-size: 1.1rem; font-weight: 700; color: #111827; }
  .rv-section-header { display: flex; align-items: center; justify-content: space-between; margin: 1.5rem 0 0.85rem; }
  .rv-view-all { border: none; background: none; color: #2563EB; font-weight: 700; cursor: pointer; font-size: 0.85rem; }

  .rv-pending-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  .rv-pending-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; cursor: pointer; }
  .rv-pending-body { display: flex; align-items: flex-start; gap: 0.85rem; padding: 1.1rem; }
  .rv-pending-avatar { width: 42px; height: 42px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; }
  .rv-pending-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .rv-pending-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.95rem; }
  .rv-overdue-badge { background: #FEF3C7; color: #D97706; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; }
  .rv-pending-assignment { margin: 0.35rem 0 0; color: #2563EB; font-weight: 600; font-size: 0.875rem; }
  .rv-pending-meta { margin: 0.35rem 0 0; color: #9CA3AF; font-size: 0.8rem; }
  .rv-grade-btn { width: 100%; border: none; border-top: 1px solid #F3F4F6; background: none; color: #2563EB; font-weight: 700; cursor: pointer; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.875rem; }

  .rv-past-card { background: #fff; border-radius: 1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; margin-top: 0.85rem; }
  .rv-past-row { display: flex; align-items: center; gap: 0.85rem; padding: 1rem 1.1rem; border-top: 1px solid #F3F4F6; flex-wrap: wrap; }
  .rv-past-row:first-child { border-top: none; }
  .rv-past-avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; }
  .rv-past-info { flex: 1; min-width: 140px; }
  .rv-past-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .rv-past-assignment { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.8rem; }
  .rv-past-score-wrap { display: flex; align-items: center; gap: 0.5rem; }
  .rv-past-score { font-weight: 800; font-size: 0.95rem; }
  .rv-past-score.pass { color: #16A34A; }
  .rv-past-score.revision { color: #D97706; }
  .rv-past-status { font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }
  .rv-past-status.pass { background: #DCFCE7; color: #16A34A; }
  .rv-past-status.revision { background: #FEF3C7; color: #D97706; }
  .rv-past-date { color: #9CA3AF; font-size: 0.78rem; margin-left: auto; }

  .rv-past-table-head { display: none; }

  @media (min-width: 640px) {
    .rv-page { padding: 1.5rem; }
    .rv-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
    .rv-pending-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .rv-past-table-head { display: flex; padding: 0.85rem 1.1rem; color: #9CA3AF; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .rv-past-table-head span:nth-child(1) { flex: 1; min-width: 140px; }
    .rv-past-table-head span:nth-child(2) { width: 160px; }
    .rv-past-table-head span:nth-child(3) { width: 90px; }
    .rv-past-row { flex-wrap: nowrap; }
    .rv-past-assignment-col { width: 160px; color: #374151; font-size: 0.875rem; }
  }

  @media (min-width: 1024px) {
    .rv-page { padding: 1.5rem 2rem 2rem; }
  }

  /* ── Grade modal ── */
  .rv-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 500; }
  .rv-grade-modal { background: #fff; border-radius: 1.25rem; width: 100%; max-width: 920px; max-height: 92vh; overflow-y: auto; position: relative; display: grid; grid-template-columns: 1fr; }
  .rv-grade-close { position: absolute; top: 1rem; right: 1rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 999px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; z-index: 2; }

  .rv-grade-left { padding: 1.5rem; border-bottom: 1px solid #F3F4F6; }
  .rv-grade-header { display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap; }
  .rv-grade-avatar { width: 48px; height: 48px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; }
  .rv-grade-name { margin: 0; font-weight: 800; font-size: 1.1rem; color: #111827; }
  .rv-grade-assignment-title { margin: 0.2rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .rv-grade-meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.85rem; flex-wrap: wrap; font-size: 0.85rem; color: #6B7280; }
  .rv-grade-tag { background: #DBEAFE; color: #2563EB; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.7rem; border-radius: 999px; }

  .rv-file-list { margin-top: 1.25rem; display: grid; gap: 0.75rem; }
  .rv-file-row { display: flex; align-items: center; gap: 0.85rem; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.85rem; }
  .rv-file-icon { width: 38px; height: 38px; border-radius: 0.6rem; background: #FEF2F2; color: #DC2626; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rv-file-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.875rem; }
  .rv-file-size { margin: 0.15rem 0 0; color: #9CA3AF; font-size: 0.78rem; }
  .rv-file-download { margin-left: auto; background: none; border: none; color: #374151; cursor: pointer; padding: 0.4rem; flex-shrink: 0; }

  .rv-note-box { margin-top: 1.25rem; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 0.85rem; padding: 1rem 1.1rem; }
  .rv-note-title { margin: 0 0 0.35rem; color: #2563EB; font-weight: 800; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .rv-note-body { margin: 0; color: #1E3A8A; font-size: 0.85rem; line-height: 1.5; }

  .rv-grade-right { padding: 1.5rem; }
  .rv-grade-form-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .rv-grade-form-sub { margin: 0.4rem 0 1.25rem; color: #6B7280; font-size: 0.85rem; }
  .rv-score-label { font-weight: 700; color: #111827; font-size: 0.9rem; }
  .rv-score-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.6rem; margin-bottom: 0.5rem; }
  .rv-score-input { flex: 1; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.85rem 1rem; font-size: 1rem; }
  .rv-score-of { color: #9CA3AF; font-weight: 600; }
  .rv-add-score-btn { border: none; background: none; color: #2563EB; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; font-size: 0.875rem; margin: 0 auto; }
  .rv-add-score-hint { text-align: center; color: #9CA3AF; font-size: 0.78rem; margin-top: 0.4rem; }

  .rv-feedback-label { font-weight: 700; color: #111827; font-size: 0.9rem; display: block; margin: 1.5rem 0 0.6rem; }
  .rv-feedback-textarea { width: 100%; box-sizing: border-box; border: 1px solid #E5E7EB; border-radius: 0.85rem; padding: 0.9rem 1rem; min-height: 140px; font-family: inherit; font-size: 0.9rem; resize: vertical; }

  .rv-grade-actions { display: flex; flex-direction: column-reverse; gap: 0.75rem; margin-top: 1.5rem; }
  .rv-cancel-btn { border: none; background: none; color: #6B7280; font-weight: 700; cursor: pointer; padding: 0.9rem; }
  .rv-submit-btn { border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.9rem 1.4rem; cursor: pointer; }

  @media (min-width: 768px) {
    .rv-grade-modal { grid-template-columns: 1fr 1fr; }
    .rv-grade-left { border-bottom: none; border-right: 1px solid #F3F4F6; }
    .rv-grade-actions { flex-direction: row; justify-content: flex-end; align-items: center; }
  }

  /* ── Success modal ── */
  .rv-success-modal { background: #fff; border-radius: 1.25rem; padding: 2rem 1.5rem; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,0.25); }
  .rv-success-icon { width: 72px; height: 72px; border-radius: 999px; background: #D1FAE5; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
  .rv-success-title { margin: 0; font-size: 1.25rem; font-weight: 800; color: #111827; }
  .rv-success-sub { margin: 0.6rem 0 1.5rem; color: #6B7280; font-size: 0.9rem; }
  .rv-success-btn { width: 100%; border: none; background: #2563EB; color: #fff; font-weight: 700; border-radius: 999px; padding: 0.9rem; cursor: pointer; }
`

export default function TrainerReviewsPage() {
  const [activeReview, setActiveReview] = useState<PendingReview | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [scores, setScores] = useState<string[]>([''])
  const [feedback, setFeedback] = useState('')

  function openGradeModal(review: PendingReview) {
    setActiveReview(review)
    setScores([''])
    setFeedback('')
  }

  function closeGradeModal() {
    setActiveReview(null)
  }

  function updateScore(index: number, value: string) {
    setScores((s) => {
      const next = [...s]
      next[index] = value
      return next
    })
  }

  function addScoreField() {
    setScores((s) => [...s, ''])
  }

  function handleSubmitGrade() {
    // TODO: no grading endpoint exists yet.
    // Wire this up to POST /api/v1/trainer/submissions/{id}/grade/ (or similar)
    // with { scores, feedback } once the backend exposes it.
    console.log('Grade submitted (not yet wired to backend):', {
      learner: activeReview?.name,
      assignment: activeReview?.assignment,
      scores,
      feedback,
    })
    setActiveReview(null)
    setShowSuccess(true)
  }

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="rv-page">
        <div className="rv-stats">
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">54</p>
                <p className="rv-stat-title">Total Reviews</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#DBEAFE' }}><Users size={16} color="#2563EB" /></div>
            </div>
            <p className="rv-stat-label" style={{ color: '#16A34A' }}>+4 this week</p>
          </div>
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">4</p>
                <p className="rv-stat-title">Active Reviews</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#EDE9FE' }}><BookOpen size={16} color="#7C3AED" /></div>
            </div>
            <p className="rv-stat-label" style={{ color: '#16A34A' }}>+2 this week</p>
          </div>
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">12</p>
                <p className="rv-stat-title">Pending reviews</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#FEF3C7' }}><ClipboardList size={16} color="#D97706" /></div>
            </div>
            <p className="rv-stat-label" style={{ color: '#D97706' }}>4 overdue</p>
          </div>
          <div className="rv-stat-card">
            <div className="rv-stat-top">
              <div>
                <p className="rv-stat-value">4.8</p>
                <p className="rv-stat-title">Avg. course rating</p>
              </div>
              <div className="rv-stat-icon" style={{ background: '#D1FAE5' }}><Star size={16} color="#059669" /></div>
            </div>
            <p className="rv-stat-label" style={{ color: '#16A34A' }}>↑ 0.1 vs last month</p>
          </div>
        </div>

        <h3 className="rv-section-title">Pending Reviews</h3>
        <div className="rv-pending-grid">
          {pendingReviews.map((review) => (
            <div key={review.id} className="rv-pending-card" onClick={() => openGradeModal(review)}>
              <div className="rv-pending-body">
                <img src={review.avatar} alt={review.name} className="rv-pending-avatar" />
                <div style={{ minWidth: 0 }}>
                  <div className="rv-pending-name-row">
                    <p className="rv-pending-name">{review.name}</p>
                    {review.overdue && <span className="rv-overdue-badge">Overdue</span>}
                  </div>
                  <p className="rv-pending-assignment">{review.assignment}</p>
                  <p className="rv-pending-meta">{review.courseTag} · {review.submittedLabel}</p>
                </div>
              </div>
              <button
                type="button"
                className="rv-grade-btn"
                onClick={(e) => { e.stopPropagation(); openGradeModal(review) }}
              >
                <Award size={16} /> Grade
              </button>
            </div>
          ))}
        </div>

        <div className="rv-section-header">
          <h3 className="rv-section-title" style={{ margin: 0 }}>Past Reviews</h3>
          <button className="rv-view-all">View all</button>
        </div>
        <div className="rv-past-card">
          <div className="rv-past-table-head">
            <span>Learner</span>
            <span>Assignment</span>
            <span>Score</span>
          </div>
          {pastReviews.map((review) => (
            <div key={review.id} className="rv-past-row">
              <img src={review.avatar} alt={review.name} className="rv-past-avatar" />
              <div className="rv-past-info">
                <p className="rv-past-name">{review.name}</p>
                <p className="rv-past-assignment">{review.assignment}</p>
              </div>
              <div className="rv-past-score-wrap">
                <span className={`rv-past-score ${review.status === 'Pass' ? 'pass' : 'revision'}`}>{review.score}</span>
                <span className={`rv-past-status ${review.status === 'Pass' ? 'pass' : 'revision'}`}>{review.status}</span>
              </div>
              <span className="rv-past-date">{review.date}</span>
            </div>
          ))}
        </div>
      </div>

      {activeReview && (
        <div className="rv-modal-overlay" onClick={closeGradeModal}>
          <div className="rv-grade-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rv-grade-close" onClick={closeGradeModal} aria-label="Close">
              <X size={18} />
            </button>

            <div className="rv-grade-left">
              <div className="rv-grade-header">
                <img src={activeReview.avatar} alt={activeReview.name} className="rv-grade-avatar" />
                <div>
                  <p className="rv-grade-name">{activeReview.name}</p>
                  <p className="rv-grade-assignment-title">{activeReview.assignment}</p>
                </div>
                {activeReview.overdue && <span className="rv-overdue-badge">Overdue</span>}
              </div>
              <div className="rv-grade-meta">
                <span>Submitted {activeReview.submittedLabel.replace('Submitted ', '')}</span>
                <span className="rv-grade-tag">{activeReview.courseTag.toUpperCase()}</span>
              </div>

              <div className="rv-file-list">
                {activeReview.files.map((file, i) => (
                  <div className="rv-file-row" key={i}>
                    <div className="rv-file-icon"><FileText size={18} /></div>
                    <div>
                      <p className="rv-file-name">{file.name}</p>
                      <p className="rv-file-size">{file.size}</p>
                    </div>
                    <button className="rv-file-download" aria-label={`Download ${file.name}`}>
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rv-note-box">
                <p className="rv-note-title">Note to trainer</p>
                <p className="rv-note-body">Kindly download the file(s), read through and input the grade(s) on the right-side panel.</p>
              </div>
            </div>

            <div className="rv-grade-right">
              <h3 className="rv-grade-form-title">Grade Assignment</h3>
              <p className="rv-grade-form-sub">Any score below 70%, the students will be required to review</p>

              {scores.map((score, i) => (
                <div key={i}>
                  <label className="rv-score-label">
                    Score {i + 1}{i === 0 && <span style={{ color: '#EF4444' }}>*</span>}
                  </label>
                  <div className="rv-score-row">
                    <input
                      type="number"
                      className="rv-score-input"
                      placeholder="—"
                      value={score}
                      onChange={(e) => updateScore(i, e.target.value)}
                    />
                    <span className="rv-score-of">/ 100</span>
                  </div>
                </div>
              ))}
              <button type="button" className="rv-add-score-btn" onClick={addScoreField}>
                <Plus size={16} /> Add score
              </button>
              <p className="rv-add-score-hint">Use this if there are more than one paper that needs to be graded</p>

              <label className="rv-feedback-label">Feedback</label>
              <textarea
                className="rv-feedback-textarea"
                placeholder="Add your feedback here…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <div className="rv-grade-actions">
                <button className="rv-cancel-btn" onClick={closeGradeModal}>Cancel</button>
                <button className="rv-submit-btn" onClick={handleSubmitGrade}>Submit Grade</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="rv-modal-overlay">
          <div className="rv-success-modal">
            <div className="rv-success-icon"><CheckCircle2 size={40} /></div>
            <h3 className="rv-success-title">Successful</h3>
            <p className="rv-success-sub">The assessment has been graded successfully.</p>
            <button className="rv-success-btn" onClick={() => setShowSuccess(false)}>Close</button>
          </div>
        </div>
      )}
    </TrainerShell>
  )
}