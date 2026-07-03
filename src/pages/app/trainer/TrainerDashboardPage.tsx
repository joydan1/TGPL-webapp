import TrainerShell from '../../../layouts/TrainerShell'

const stats = [
  { title: 'Active learners', value: '1,842', label: '+34 this week' },
  { title: 'Courses published', value: '1', label: '0 in draft' },
  { title: 'Pending reviews', value: '12', label: '4 overdue' },
  { title: 'Avg. course rating', value: '4.8', label: '1.0 vs last month' },
]

const pendingReviews = [
  { name: 'Fatima Al-Rashidi', course: 'Stakeholder Map Project', time: '2h ago' },
  { name: 'Daniel Chirwa', course: 'Stakeholder Map Project', time: '5h ago' },
]

export default function TrainerDashboardPage() {
  return (
    <TrainerShell>
      <div style={{ padding: '1.5rem 2rem 2rem', background: '#F4F7FB', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.95rem' }}>Good morning,</p>
            <h1 style={{ margin: '0.35rem 0 0', fontSize: '2.25rem', fontWeight: 800, color: '#111827' }}>
              Amara <span style={{ fontSize: '2.25rem' }}>👋</span>
            </h1>
          </div>
          <button style={{ appearance: 'none', border: 'none', borderRadius: '999px', padding: '0.95rem 1.2rem', background: '#2563EB', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Add new course
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {stats.map((stat) => (
            <div key={stat.title} style={{ background: '#fff', borderRadius: '1rem', padding: '1.35rem', boxShadow: '0 16px 48px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <p style={{ margin: 0, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.8rem' }}>{stat.title}</p>
              <p style={{ margin: '0.85rem 0 0', fontSize: '2rem', fontWeight: 800, color: '#111827' }}>{stat.value}</p>
              <p style={{ margin: '0.75rem 0 0', color: '#475569', fontSize: '0.9rem' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        <section style={{ marginTop: '1.75rem', display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ borderRadius: '1rem', overflow: 'hidden', background: 'linear-gradient(90deg, #2563EB 0%, #1D4ED8 100%)', color: '#fff', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.9 }}>Starting in 2h</p>
                <h2 style={{ margin: '0.75rem 0 0', fontSize: '1.35rem', fontWeight: 700 }}>Q&A: Stakeholder Communication in Practice</h2>
                <p style={{ margin: '0.75rem 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>Today · 3:00 PM WAT · 47 registered</p>
              </div>
              <button style={{ border: 'none', borderRadius: '999px', padding: '0.95rem 1.2rem', background: '#fff', color: '#1D4ED8', fontWeight: 700, cursor: 'pointer' }}>
                Begin Session
              </button>
            </div>

            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.4rem', boxShadow: '0 16px 46px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>Pending reviews</h3>
                  <p style={{ margin: '0.5rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>Review the latest learner submissions.</p>
                </div>
                <button style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>View all</button>
              </div>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.85rem' }}>
                {pendingReviews.map((review) => (
                  <div key={review.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem', borderRadius: '1rem', background: '#F8FAFF', border: '1px solid #E5E7EB' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#111827' }}>{review.name}</p>
                      <p style={{ margin: '0.35rem 0 0', color: '#64748B', fontSize: '0.9rem' }}>{review.course}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.85rem' }}>{review.time}</p>
                      <button style={{ marginTop: '0.65rem', border: 'none', borderRadius: '999px', background: '#2563EB', color: '#fff', padding: '0.7rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Review</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 16px 46px rgba(15, 23, 42, 0.06)', border: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#111827' }}>Active course</h3>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem' }}>
              <img src="/trainer-course-card.png" alt="Active course" style={{ width: '100%', minHeight: 176, objectFit: 'cover', borderRadius: '1rem', background: '#E2E8F0' }} />
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748B' }}>Management</p>
                <h4 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#111827' }}>Project Management Course</h4>
                <p style={{ margin: 0, color: '#475569', lineHeight: 1.7 }}>Build your next course with comments, live sessions, and materials all in one place.</p>
              </div>
              <button style={{ border: 'none', borderRadius: '999px', padding: '0.9rem 1rem', background: '#EFF6FF', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>Preview</button>
            </div>
          </div>
        </section>
      </div>
    </TrainerShell>
  )
}
