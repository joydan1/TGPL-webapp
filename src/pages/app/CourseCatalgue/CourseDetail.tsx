import { useNavigate } from 'react-router-dom'
import { Clock, BookOpen, BarChart2, Award, Users } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'

const COURSE = {
  title: 'Project Management Course',
  category: 'MANAGEMENT',
  rating: 4.8,
  reviews: 234,
  thumbnail: '/intro.png',
  instructor: { name: 'Amara Osei', title: 'PMP-certified Project Manager', avatar: '/ceo.png' },
  stats: [
    { icon: Clock, value: '20h 30m', label: 'Duration' },
    { icon: BookOpen, value: '8 modules', label: 'Content' },
    { icon: BarChart2, value: 'Beginner', label: 'Level' },
    { icon: Award, value: 'Included', label: 'Certificate' },
  ],
  learningOutcomes: [
    'Create and manage a full project plan from initiation to closure',
    'Build and use Work Breakdown Structures (WBS) confidently',
    'Apply Gantt charts and Critical Path Method to real projects',
    'Identify, assess, and mitigate project risks systematically',
    'Communicate effectively with stakeholders at all levels',
    'Prepare a strong foundation for the PMP certification exam',
  ],
  prerequisites: [
    'No prior project management experience required',
    'Basic computer literacy and internet access',
    'Commitment to completing the weekly exercises',
  ],
  audience: ['Graduate students', 'Entrepreneurs', 'Junior project coordinators', 'NGO professionals'],
  price: '₦49,999.99',
  enrolledCount: '1,842',
}

function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i <= Math.floor(rating) ? '#F59E0B' : '#D1D5DB'}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', marginLeft: '0.25rem' }}>
        {rating} ({COURSE.reviews} reviews)
      </span>
    </div>
  )
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
    <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
  </svg>
)

const ChevronLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15,18 9,12 15,6" />
  </svg>
)

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh;
    background: #F5F5F5;
    padding: 2.5rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    font-family: inherit;
  }

  .logo img { height: 2.5rem; display: block; }

  .outer {
    width: 100%;
    max-width: 1040px;
    background: #fff;
    border-radius: 2rem;
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .outer-title { font-size: 1.625rem; font-weight: 700; color: #111; }

  /* Card */
  .card {
    width: 100%;
    background: #fff;
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.09);
    display: flex;
    flex-direction: column;
  }

  /* Hero */
  .hero { position: relative; width: 100%; aspect-ratio: 16/7; overflow: hidden; }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.7) 100%); }
  .hero-back {
    position: absolute; top: 1rem; left: 1rem;
    width: 2rem; height: 2rem; border-radius: 50%;
    background: rgba(255,255,255,0.18); backdrop-filter: blur(6px);
    border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-back:hover { background: rgba(255,255,255,0.32); }
  .hero-content { position: absolute; bottom: 1.25rem; left: 1.25rem; right: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
  .badge { display: inline-block; background: #2563EB; color: #fff; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.2rem 0.6rem; border-radius: 2rem; width: fit-content; }
  .hero-title { font-size: 1.3rem; font-weight: 700; color: #fff; line-height: 1.25; }

  /* Body */
  .body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.75rem; }

  /* Instructor */
  .instructor { display: flex; align-items: center; gap: 0.75rem; }
  .instructor img { width: 2.5rem; height: 2.5rem; border-radius: 50%; object-fit: cover; border: 2px solid #E8E8E8; flex-shrink: 0; }
  .instructor-name { font-size: 0.9375rem; font-weight: 600; color: #111; }
  .instructor-role { font-size: 0.8rem; color: #6B7280; }

  /* Stats */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #F3F4F6; border-radius: 0.75rem; overflow: hidden; }
  .stat { display: flex; flex-direction: column; align-items: center; padding: 1rem 0.5rem; gap: 0.3rem; border-right: 1px solid #F3F4F6; }
  .stat:last-child { border-right: none; }
  .stat-value { font-size: 0.875rem; font-weight: 700; color: #111; }
  .stat-label { font-size: 0.72rem; color: #9CA3AF; }

  /* Sections */
  .section { display: flex; flex-direction: column; gap: 0.625rem; }
  .section h2 { font-size: 0.9375rem; font-weight: 700; color: #111; }

  .outcome { display: flex; align-items: flex-start; gap: 0.5rem; }
  .outcome p { font-size: 0.875rem; color: #374151; line-height: 1.55; }

  .prereq { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; color: #374151; line-height: 1.55; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #9CA3AF; flex-shrink: 0; margin-top: 0.5rem; }

  .audience-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip { display: flex; align-items: center; gap: 0.375rem; padding: 0.45rem 0.8rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.8375rem; color: #374151; }

  .who-text { font-size: 0.875rem; color: #374151; line-height: 1.7; }

  /* Enroll bar — sticky so card height is natural */
  .enroll-bar {
    position: sticky;
    bottom: 0;
    background: #fff;
    border-top: 1px solid #F3F4F6;
    padding: 1rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 0 0 1.25rem 1.25rem;
    z-index: 10;
  }
  .enroll-label { font-size: 0.65rem; color: #9CA3AF; }
  .enroll-price { font-size: 1.3rem; font-weight: 700; color: #111; }
  .enroll-sub { font-size: 0.72rem; color: #9CA3AF; }
  .enroll-btn { padding: 0.75rem 1.75rem; border-radius: 0.625rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .enroll-btn:hover { opacity: 0.88; }

  .footer { font-size: 0.85rem; color: #ABABAB; text-align: center; }

  /* Responsive */
  @media (max-width: 768px) {
    .page { padding: 1.5rem 0.75rem 2.5rem; }
    .outer { padding: 1.25rem; border-radius: 1.25rem; }
    .outer-title { font-size: 1.25rem; }
    .hero { aspect-ratio: 16/9; }
    .hero-title { font-size: 1.1rem; }
    .stats { grid-template-columns: repeat(2, 1fr); }
    .stat:nth-child(2) { border-right: none; }
    .stat:nth-child(3), .stat:nth-child(4) { border-top: 1px solid #F3F4F6; }
    .enroll-price { font-size: 1.1rem; }
    .enroll-btn { padding: 0.65rem 1.25rem; font-size: 0.875rem; }
  }

  @media (max-width: 400px) {
    .enroll-bar { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .enroll-btn { width: 100%; text-align: center; }
  }
`

export default function CourseDetailPage() {
  const navigate = useNavigate()

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>

        <div className="outer">
          <h1 className="outer-title">Course Overview</h1>

          <div className="card">
            {/* Hero */}
            <div className="hero">
              <img src={COURSE.thumbnail} alt={COURSE.title} />
              <div className="hero-overlay" />
              <button className="hero-back" onClick={() => navigate(ROUTES.COURSES)}><ChevronLeft /></button>
              <div className="hero-content">
                <span className="badge">{COURSE.category}</span>
                <h1 className="hero-title">{COURSE.title}</h1>
                <Stars rating={COURSE.rating} />
              </div>
            </div>

            {/* Body */}
            <div className="body">
              <div className="instructor">
                <img src={COURSE.instructor.avatar} alt={COURSE.instructor.name} />
                <div>
                  <p className="instructor-name">{COURSE.instructor.name}</p>
                  <p className="instructor-role">{COURSE.instructor.title}</p>
                </div>
              </div>

              <div className="stats">
                {COURSE.stats.map(({ icon: Icon, value, label }, i) => (
                  <div key={i} className="stat">
                    <Icon size={18} color="#2563EB" />
                    <span className="stat-value">{value}</span>
                    <span className="stat-label">{label}</span>
                  </div>
                ))}
              </div>

              <div className="section">
                <h2>What you'll learn</h2>
                {COURSE.learningOutcomes.map((item, i) => (
                  <div key={i} className="outcome"><CheckIcon /><p>{item}</p></div>
                ))}
              </div>

              <div className="section">
                <h2>Prerequisites</h2>
                {COURSE.prerequisites.map((item, i) => (
                  <div key={i} className="prereq"><div className="dot" />{item}</div>
                ))}
              </div>

              <div className="section">
                <h2>Who this is for</h2>
                <p className="who-text">
                  Built for early-career professionals (0–2 years) who work on or aspire to lead projects.
                  Especially valuable for professionals in emerging markets seeking internationally recognised skills.
                </p>
                <div className="audience-grid">
                  {COURSE.audience.map((item, i) => (
                    <div key={i} className="chip"><Users size={13} color="#2563EB" />{item}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enroll bar */}
            <div className="enroll-bar">
              <div>
                <p className="enroll-label">Course price</p>
                <p className="enroll-price">{COURSE.price}</p>
                <p className="enroll-sub">{COURSE.enrolledCount} learners enrolled</p>
              </div>
              <button className="enroll-btn" onClick={() => navigate(ROUTES.CHECKOUT)}>Pay to Enroll</button>
            </div>
          </div>
        </div>

        <p className="footer">Join 50,000+ learners building their project management careers</p>
      </div>
    </>
  )
}