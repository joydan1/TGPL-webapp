import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, BookOpen, BarChart2, Award, Users } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'
import { apiClient } from '../../../services/api'

// ─── API types ────────────────────────────────────────────────────────────────
interface Trainer {
  id: string
  name: string
  credential: string
}

interface Lesson {
  id: string
  title: string
  order: number
  duration_seconds: number
  duration_display: string
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
}

interface CourseDetail {
  id: string
  slug: string
  title: string
  category: string
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  price_kobo: number
  price_naira: string
  description: string
  duration_weeks: number
  expected_outcomes: string[]
  prerequisites: string[]
  target_audience: string[]
  audience_description: string
  has_certificate: boolean
  has_live_support: boolean
  module_count: number
  total_duration_seconds: number
  total_duration_display: string
  enrolled_count: number
  trainer: Trainer
  modules: Module[]
  created_at: string
  updated_at: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchCourse(slug: string): Promise<CourseDetail> {
  try {
    const response = await apiClient.get<CourseDetail>(`/v1/courses/${slug}/`)
    return response.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 404) throw new Error('not_found')
    throw new Error('fetch_failed')
  }
}

function formatNaira(raw: string): string {
  const num = parseFloat(raw)
  if (isNaN(num)) return `₦${raw}`
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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

// ─── CSS ───────────────────
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

  .card {
    width: 100%;
    background: #fff;
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.09);
    display: flex;
    flex-direction: column;
  }

  .state-screen {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 320px; gap: 0.75rem; color: #9CA3AF; font-size: 0.9375rem;
  }
  .state-screen.error { color: #EF4444; }

  .hero { position: relative; width: 100%; aspect-ratio: 16/7; overflow: hidden; background: #D0D0D0; }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #c8c8c8 0%, #a0a0a0 100%); }
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

  .body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.75rem; }

  .instructor { display: flex; align-items: center; gap: 0.75rem; }
  .instructor-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background: #E5E7EB; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #2563EB; font-size: 1rem; flex-shrink: 0; border: 2px solid #E8E8E8; }
  .instructor-name { font-size: 0.9375rem; font-weight: 600; color: #111; }
  .instructor-role { font-size: 0.8rem; color: #6B7280; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #F3F4F6; border-radius: 0.75rem; overflow: hidden; }
  .stat { display: flex; flex-direction: column; align-items: center; padding: 1rem 0.5rem; gap: 0.3rem; border-right: 1px solid #F3F4F6; }
  .stat:last-child { border-right: none; }
  .stat-value { font-size: 0.875rem; font-weight: 700; color: #111; }
  .stat-label { font-size: 0.72rem; color: #9CA3AF; }

  .section { display: flex; flex-direction: column; gap: 0.625rem; }
  .section h2 { font-size: 0.9375rem; font-weight: 700; color: #111; }

  .outcome { display: flex; align-items: flex-start; gap: 0.5rem; }
  .outcome p { font-size: 0.875rem; color: #374151; line-height: 1.55; }

  .prereq { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.875rem; color: #374151; line-height: 1.55; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: #9CA3AF; flex-shrink: 0; margin-top: 0.5rem; }

  .audience-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .chip { display: flex; align-items: center; gap: 0.375rem; padding: 0.45rem 0.8rem; border: 1px solid #E5E7EB; border-radius: 0.5rem; font-size: 0.8375rem; color: #374151; }

  .who-text { font-size: 0.875rem; color: #374151; line-height: 1.7; }

  .enroll-bar {
    position: sticky; bottom: 0;
    background: #fff; border-top: 1px solid #F3F4F6;
    padding: 1rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    border-radius: 0 0 1.25rem 1.25rem; z-index: 10;
  }
  .enroll-label { font-size: 0.65rem; color: #9CA3AF; }
  .enroll-price { font-size: 1.3rem; font-weight: 700; color: #111; }
  .enroll-sub { font-size: 0.72rem; color: #9CA3AF; }
  .enroll-btn { padding: 0.75rem 1.75rem; border-radius: 0.625rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .enroll-btn:hover { opacity: 0.88; }

  .footer { font-size: 0.85rem; color: #ABABAB; text-align: center; }

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetchCourse(slug)
      .then(setCourse)
      .catch((e: Error) => {
        setError(e.message === 'not_found' ? 'Course not found.' : 'Failed to load course.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const stats = course
    ? [
        { icon: Clock,     value: course.total_duration_display || `${course.duration_weeks}w`, label: 'Duration' },
        { icon: BookOpen,  value: `${course.module_count} module${course.module_count !== 1 ? 's' : ''}`, label: 'Content' },
        { icon: BarChart2, value: capitalize(course.level), label: 'Level' },
        { icon: Award,     value: course.has_certificate ? 'Included' : 'None', label: 'Certificate' },
      ]
    : []

  // Pass slug via route state so CheckoutPage knows which course to purchase
  const goToCheckout = () => {
    navigate(ROUTES.CHECKOUT, { state: { courseSlug: slug } })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>

        <div className="outer">
          <h1 className="outer-title">Course Overview</h1>

          <div className="card">
            {loading && <div className="state-screen">Loading course…</div>}
            {error && !loading && <div className="state-screen error">{error}</div>}

            {!loading && !error && course && (
              <>
                <div className="hero">
                  <div className="hero-placeholder" />
                  <div className="hero-overlay" />
                  <button className="hero-back" onClick={() => navigate(ROUTES.COURSES)}>
                    <ChevronLeft />
                  </button>
                  <div className="hero-content">
                    <span className="badge">{course.category}</span>
                    <h1 className="hero-title">{course.title}</h1>
                  </div>
                </div>

                <div className="body">
                  <div className="instructor">
                    <div className="instructor-avatar">
                      {course.trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="instructor-name">{course.trainer.name}</p>
                      <p className="instructor-role">{course.trainer.credential}</p>
                    </div>
                  </div>

                  <div className="stats">
                    {stats.map(({ icon: Icon, value, label }, i) => (
                      <div key={i} className="stat">
                        <Icon size={18} color="#2563EB" />
                        <span className="stat-value">{value}</span>
                        <span className="stat-label">{label}</span>
                      </div>
                    ))}
                  </div>

                  {course.expected_outcomes.length > 0 && (
                    <div className="section">
                      <h2>What you'll learn</h2>
                      {course.expected_outcomes.map((item, i) => (
                        <div key={i} className="outcome"><CheckIcon /><p>{item}</p></div>
                      ))}
                    </div>
                  )}

                  {course.prerequisites.length > 0 && (
                    <div className="section">
                      <h2>Prerequisites</h2>
                      {course.prerequisites.map((item, i) => (
                        <div key={i} className="prereq"><div className="dot" />{item}</div>
                      ))}
                    </div>
                  )}

                  {(course.audience_description || course.target_audience.length > 0) && (
                    <div className="section">
                      <h2>Who this is for</h2>
                      {course.audience_description && (
                        <p className="who-text">{course.audience_description}</p>
                      )}
                      {course.target_audience.length > 0 && (
                        <div className="audience-grid">
                          {course.target_audience.map((item, i) => (
                            <div key={i} className="chip">
                              <Users size={13} color="#2563EB" />
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="enroll-bar">
                  <div>
                    <p className="enroll-label">Course price</p>
                    <p className="enroll-price">{formatNaira(course.price_naira)}</p>
                    <p className="enroll-sub">{course.enrolled_count.toLocaleString()} learners enrolled</p>
                  </div>
                  <button className="enroll-btn" onClick={goToCheckout}>
                    Pay to Enroll
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="footer">Join 50,000+ learners building their project management careers</p>
      </div>
    </>
  )
}