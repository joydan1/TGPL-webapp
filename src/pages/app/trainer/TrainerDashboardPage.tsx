import TrainerShell from '../../../layouts/TrainerShell'
import { Plus, Users, BookOpen, ClipboardList, Star } from 'lucide-react'

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
  return (
    <TrainerShell>
      <div style={{ padding: '1.5rem 2rem 2rem', background: '#F5F5F5' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.95rem' }}>Good morning,</p>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>
              Amara <span style={{ fontSize: '2.25rem' }}>👋</span>
            </h1>
          </div>
          <button
            style={{
              appearance: 'none',
              border: 'none',
              borderRadius: '999px',
              padding: '0.95rem 1.2rem',
              background: '#2563EB',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Plus size={18} />
            Add new course
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.title}
                style={{
                  background: '#fff',
                  borderRadius: '1rem',
                  padding: '1.35rem',
                  boxShadow: '0 16px 48px rgba(15, 23, 42, 0.06)',
                  border: '1px solid rgba(148, 163, 184, 0.12)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <p style={{ margin: 0, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>
                    {stat.title}
                  </p>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '999px',
                      background: stat.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={stat.iconColor} />
                  </div>
                </div>
                <p style={{ margin: '0.85rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#111827' }}>{stat.value}</p>
                <p style={{ margin: '0.75rem 0 0', color: stat.labelColor, fontSize: '0.9rem', fontWeight: 600 }}>{stat.label}</p>
              </div>
            )
          })}
        </div>

        <section style={{ marginTop: '1.75rem', display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.85rem', fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>Upcoming Live Session(s)</h3>
              <div
                style={{
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#fff',
                  padding: '1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.75rem',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      opacity: 0.9,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '999px', background: '#4ADE80', display: 'inline-block' }} />
                    Starting in 2h
                  </p>
                  <h2 style={{ margin: '0.75rem 0 0', fontSize: '1.35rem', fontWeight: 700 }}>Q&A: Stakeholder Communication in Practice</h2>
                  <p style={{ margin: '0.75rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>Today · 3:00 PM WAT · 47 registered</p>
                </div>
                <button
                  style={{
                    border: 'none',
                    borderRadius: '999px',
                    padding: '0.95rem 1.2rem',
                    background: '#fff',
                    color: '#1D4ED8',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Begin Session
                </button>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.4rem', boxShadow: '0 16px 46px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>Pending reviews</h3>
                <button style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>View all</button>
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
                {pendingReviews.map((review) => (
                  <div
                    key={review.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1rem',
                      borderRadius: '1rem',
                      background: '#F8FAFF',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={review.avatar}
                        alt={review.name}
                        style={{ width: 40, height: 40, borderRadius: '999px', objectFit: 'cover', background: '#E2E8F0', flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{review.name}</p>
                        <p style={{ margin: '0.35rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>{review.course}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>{review.time}</p>
                      <button style={{ marginTop: '0.65rem', border: 'none', borderRadius: '999px', background: '#2563EB', color: '#fff', padding: '0.7rem 1rem', fontWeight: 700, cursor: 'pointer' }}>
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 16px 46px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>Active Course</h3>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src="/trainer-course-card.png"
                  alt="Active course"
                  style={{ width: '100%', minHeight: 176, objectFit: 'cover', borderRadius: '1rem', background: '#E2E8F0', display: 'block' }}
                />
                <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem' }}>
                  <ProgressRing percent={37} />
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2563EB', fontWeight: 700 }}>
                  Management
                </p>
                <h4 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>Project Management Course</h4>
                <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>Uploaded 2 months ago</p>
              </div>
              <button style={{ border: 'none', borderRadius: '999px', padding: '0.9rem 1rem', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>
                Preview
              </button>
            </div>
          </div>
        </section>
      </div>
    </TrainerShell>
  )
}