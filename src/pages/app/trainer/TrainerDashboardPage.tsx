import { useNavigate } from 'react-router-dom'
import TrainerShell from '../../../layouts/TrainerShell'
import { Plus, Users, BookOpen, ClipboardList, Star } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'

const stats = [
  {
    title: 'Active learners',
    value: '1,842',
    label: '+34 this week',
    labelColor: '#16A34A',
    icon: Users,
    iconBg: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    title: 'Courses published',
    value: '1',
    label: '0 in draft',
    labelColor: '#16A34A',
    icon: BookOpen,
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
  },
  {
    title: 'Pending reviews',
    value: '12',
    label: '4 overdue',
    labelColor: '#D97706',
    icon: ClipboardList,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
  },
  {
    title: 'Avg. course rating',
    value: '4.8',
    label: '↑ 0.1 vs last month',
    labelColor: '#16A34A',
    icon: Star,
    iconBg: '#D1FAE5',
    iconColor: '#059669',
  },
]

const pendingReviews = [
  {
    name: 'Fatima Al-Rashidi',
    course: 'Stakeholder Map Project',
    time: '2h ago',
    avatar: '/avatars/fatima-al-rashidi.jpg',
  },
  {
    name: 'Daniel Chirwa',
    course: 'Stakeholder Map Project',
    time: '5h ago',
    avatar: '/avatars/daniel-chirwa.jpg',
  },
]

const PAGE_CSS = `
  .db-page { padding: 1rem; background: #F5F5F5; }

  .db-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .db-greeting { margin: 0; color: #6B7280; font-size: 0.9rem; }
  .db-name { margin: 0.3rem 0 0; font-size: 1.5rem; font-weight: 800; color: #111827; }
  .db-add-btn { appearance: none; border: none; border-radius: 999px; padding: 0.75rem 1.1rem; background: #2563EB; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; white-space: nowrap; }

  .db-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.85rem; margin-top: 1.25rem; }
  .db-stat-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); min-width: 0; }
  .db-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.6rem; }
  .db-stat-title { margin: 0; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.7rem; }
  .db-stat-icon { width: 32px; height: 32px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .db-stat-value { margin: 0.65rem 0 0; font-size: 1.6rem; font-weight: 800; color: #111827; }
  .db-stat-label { margin: 0.5rem 0 0; font-size: 0.8rem; font-weight: 600; }

  .db-section-title { margin: 0 0 0.75rem; font-size: 1rem; font-weight: 700; color: #111827; }

  .db-live-card { border-radius: 1rem; overflow: hidden; background: linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%); color: #fff; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
  .db-live-badge { margin: 0; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.9; display: flex; align-items: center; gap: 0.4rem; }
  .db-live-dot { width: 8px; height: 8px; border-radius: 999px; background: #4ADE80; display: inline-block; flex-shrink: 0; }
  .db-live-title { margin: 0.65rem 0 0; font-size: 1.1rem; font-weight: 700; line-height: 1.3; }
  .db-live-sub { margin: 0.65rem 0 0; color: rgba(255,255,255,0.85); font-size: 0.85rem; }
  .db-live-btn { border: none; border-radius: 999px; padding: 0.85rem 1.1rem; background: #fff; color: #1D4ED8; font-weight: 700; cursor: pointer; white-space: nowrap; align-self: flex-start; }

  .db-reviews-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); }
  .db-reviews-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .db-view-all { border: none; background: none; color: #2563EB; font-weight: 700; cursor: pointer; font-size: 0.85rem; }
  .db-review-list { margin-top: 0.85rem; display: grid; gap: 0.75rem; }
  .db-review-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.85rem; border-radius: 1rem; background: #F8FAFF; border: 1px solid #E5E7EB; flex-wrap: wrap; }
  .db-review-person { display: flex; align-items: center; gap: 0.7rem; min-width: 0; }
  .db-review-avatar { width: 36px; height: 36px; border-radius: 999px; object-fit: cover; background: #E2E8F0; flex-shrink: 0; }
  .db-review-name { margin: 0; font-weight: 700; color: #111827; font-size: 0.9rem; }
  .db-review-course { margin: 0.25rem 0 0; color: #64748B; font-size: 0.8rem; }
  .db-review-meta { text-align: right; }
  .db-review-time { margin: 0; color: #6B7280; font-size: 0.75rem; }
  .db-review-btn { margin-top: 0.5rem; border: none; border-radius: 999px; background: #2563EB; color: #fff; padding: 0.55rem 0.9rem; font-weight: 700; cursor: pointer; font-size: 0.8rem; }

  .db-course-card { background: #fff; border-radius: 1rem; padding: 1.1rem; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); max-width: 340px; }
  .db-course-img-wrap { position: relative; }
  .db-course-img { width: 100%; height: 176px; object-fit: cover; border-radius: 1rem; background: #E2E8F0; display: block; }
  .db-course-ring { position: absolute; bottom: 0.75rem; right: 0.75rem; }
  .db-course-body { margin-top: 1rem; display: grid; gap: 0.5rem; }
  .db-course-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; font-weight: 700; }
  .db-course-name { margin: 0; font-size: 1.15rem; font-weight: 700; color: #111827; }
  .db-course-date { margin: 0; color: #6B7280; font-size: 0.8rem; }
  .db-course-preview-btn { margin-top: 1rem; width: 100%; border: none; border-radius: 999px; padding: 0.8rem 1rem; background: #EFF6FF; color: #2563EB; font-weight: 700; cursor: pointer; }

  @media (min-width: 640px) {
    .db-page { padding: 1.5rem; }
    .db-name { font-size: 1.85rem; }
    .db-stats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
    .db-live-card { flex-direction: row; align-items: center; justify-content: space-between; padding: 1.5rem; }
    .db-live-title { font-size: 1.25rem; }
  }

 @media (min-width: 1024px) {
  .db-page { padding: 1.5rem 2rem 2rem; }
  .db-name { font-size: 2.25rem; }
}
`

function ProgressRing({ percent, size = 44 }: { percent: number; size?: number }) {
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.35)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#fff"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: '#fff',
        }}
      >
        {percent}%
      </span>
    </div>
  )
}

export default function TrainerDashboardPage() {
  const navigate = useNavigate()

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="db-page">
        <div className="db-header">
          <div>
            <p className="db-greeting">Good morning,</p>
            <h1 className="db-name">Amara 👋</h1>
          </div>
          <button className="db-add-btn" onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}>
  <Plus size={18} />
  Add new course
</button>
        </div>

        <div className="db-stats">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.title} className="db-stat-card">
                <div className="db-stat-top">
                  <p className="db-stat-title">{stat.title}</p>
                  <div className="db-stat-icon" style={{ background: stat.iconBg }}>
                    <Icon size={16} color={stat.iconColor} />
                  </div>
                </div>
                <p className="db-stat-value">{stat.value}</p>
                <p className="db-stat-label" style={{ color: stat.labelColor }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        <section className="db-sections">
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h3 className="db-section-title">Upcoming Live Session(s)</h3>
              <div className="db-live-card">
                <div>
                  <p className="db-live-badge">
                    <span className="db-live-dot" />
                    Starting in 2h
                  </p>
                  <h2 className="db-live-title">Q&A: Stakeholder Communication in Practice</h2>
                  <p className="db-live-sub">Today · 3:00 PM WAT · 47 registered</p>
                </div>
                <button className="db-live-btn">Begin Session</button>
              </div>
            </div>

            <div className="db-reviews-card">
              <div className="db-reviews-header">
                <h3 className="db-section-title" style={{ margin: 0 }}>Pending reviews</h3>
                <button className="db-view-all">View all</button>
              </div>
              <div className="db-review-list">
                {pendingReviews.map((review) => (
                  <div key={review.name} className="db-review-row">
                    <div className="db-review-person">
                      <img src={review.avatar} alt={review.name} className="db-review-avatar" />
                      <div style={{ minWidth: 0 }}>
                        <p className="db-review-name">{review.name}</p>
                        <p className="db-review-course">{review.course}</p>
                      </div>
                    </div>
                    <div className="db-review-meta">
                      <p className="db-review-time">{review.time}</p>
                      <button className="db-review-btn">Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="db-section-title">Active Course</h3>
            <div className="db-course-card">
              <div className="db-course-img-wrap">
                <img src="/image1.png" alt="Active course" className="db-course-img" />
                <div className="db-course-ring">
                  <ProgressRing percent={37} />
                </div>
              </div>
              <div className="db-course-body">
                <p className="db-course-cat">Management</p>
                <h4 className="db-course-name">Project Management Course</h4>
                <p className="db-course-date">Uploaded 2 months ago</p>
              </div>
              <button className="db-course-preview-btn">Preview</button>
            </div>
          </div>
        </section>
      </div>
    </TrainerShell>
  )
}