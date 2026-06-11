import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTES } from '../../../constants/routes'
import { apiClient } from '../../../services/api'

// ─── API types ────────────────────────────────────────────────────────────────
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

interface CoursePreview {
  title: string
  category: string
  price_naira: string
  price_kobo: number
  trainer: { id: string; name: string; credential: string }
  modules: Module[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchPreview(slug: string): Promise<CoursePreview> {
  try {
    const response = await apiClient.get<CoursePreview>(`/v1/courses/${slug}/`)
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

interface PlaylistItem {
  id: string
  title: string
  duration_display: string
  moduleTitle: string
}

function buildPlaylist(modules: Module[]): PlaylistItem[] {
  return modules
    .sort((a, b) => a.order - b.order)
    .flatMap((mod) =>
      mod.lessons
        .sort((a, b) => a.order - b.order)
        .map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          duration_display: lesson.duration_display,
          moduleTitle: mod.title,
        }))
    )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
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
    background: #111827;
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow: 0 1px 8px rgba(0,0,0,0.12);
  }

  .state-screen {
    display: flex; align-items: center; justify-content: center;
    min-height: 320px; color: #9CA3AF; font-size: 0.9375rem;
  }
  .state-screen.error { color: #EF4444; }

  .video-wrap { position: relative; width: 100%; aspect-ratio: 16/9; overflow: hidden; background: #000; }
  .video-wrap img { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; display: block; }
  .video-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.65) 100%); }

  .video-back {
    position: absolute; top: 1rem; left: 1rem; z-index: 10;
    width: 2rem; height: 2rem; border-radius: 50%;
    background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
    border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .video-back:hover { background: rgba(255,255,255,0.28); }

  .video-title-overlay {
    position: absolute; top: 1rem; left: 50%; transform: translateX(-50%);
    text-align: center; color: #fff; z-index: 10; white-space: nowrap;
  }
  .vt-category { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.05em; }
  .vt-title { font-size: 0.6875rem; font-weight: 600; opacity: 0.5; }

  .center-controls {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    display: flex; align-items: center; gap: 1.5rem; z-index: 10;
  }
  .play-main {
    width: 3rem; height: 3rem; border-radius: 50%;
    background: rgba(255,255,255,0.92); color: #111;
    display: flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; transition: transform 0.15s;
  }
  .play-main:hover { transform: scale(1.06); }
  .ctrl-btn { background: none; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0.85; }
  .ctrl-btn:hover { opacity: 1; }

  .video-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; z-index: 10; }
  .progress-wrap { width: 100%; height: 3px; background: rgba(255,255,255,0.25); border-radius: 2px; margin-bottom: 0.625rem; cursor: pointer; }
  .progress-fill { height: 100%; background: #2563EB; border-radius: 2px; position: relative; }
  .progress-thumb { position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
  .controls-row { display: flex; align-items: center; justify-content: space-between; }
  .time { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-variant-numeric: tabular-nums; }
  .controls-right { display: flex; align-items: center; gap: 1rem; }

  .info { background: #111827; padding: 1.25rem 1.5rem; border-top: 1px solid #1F2937; }
  .info-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .info-category { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em; color: #2563EB; text-transform: uppercase; margin-bottom: 0.3rem; }
  .info-title { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.35; margin-bottom: 0.25rem; }
  .info-instructor { font-size: 0.8125rem; color: #9CA3AF; }
  .info-instructor span { color: #6B7280; font-size: 0.75rem; }
  .avatar-circle { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #2563EB; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 0.875rem; flex-shrink: 0; border: 2px solid #374151; }

  .playlist { background: #111827; border-top: 1px solid #1F2937; padding: 1rem 1.5rem; }
  .playlist-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; color: #6B7280; text-transform: uppercase; margin-bottom: 0.75rem; }
  .pl-item { display: flex; align-items: center; gap: 0.875rem; padding: 0.75rem 1rem; border-radius: 0.625rem; cursor: pointer; transition: background 0.15s; margin-bottom: 0.375rem; }
  .pl-item:last-child { margin-bottom: 0; }
  .pl-item.active { background: #1F2937; }
  .pl-item:not(.active):hover { background: rgba(255,255,255,0.04); }
  .pl-num { width: 1.75rem; height: 1.75rem; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; color: #9CA3AF; flex-shrink: 0; }
  .pl-item.active .pl-num { background: #2563EB; color: #fff; }
  .pl-title { flex: 1; font-size: 0.875rem; color: #D1D5DB; font-weight: 500; }
  .pl-item.active .pl-title { color: #fff; }
  .pl-dur { font-size: 0.75rem; color: #6B7280; font-variant-numeric: tabular-nums; }

  .enroll-bar { background: #1F2937; border-top: 1px solid #374151; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .enroll-label { font-size: 0.72rem; color: #9CA3AF; margin-bottom: 0.125rem; }
  .enroll-price { font-size: 1.125rem; font-weight: 700; color: #fff; }
  .enroll-btn { padding: 0.65rem 1.5rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
  .enroll-btn:hover { opacity: 0.88; }

  .footer { font-size: 0.85rem; color: #ABABAB; text-align: center; }

  @media (max-width: 768px) {
    .page { padding: 1.5rem 0.75rem 2.5rem; }
    .outer { padding: 1.25rem; border-radius: 1.25rem; }
    .outer-title { font-size: 1.25rem; }
    .info, .playlist, .enroll-bar { padding: 1rem; }
    .info-title { font-size: 0.9375rem; }
  }

  @media (max-width: 400px) {
    .enroll-bar { flex-direction: column; align-items: flex-start; }
    .enroll-btn { width: 100%; text-align: center; }
    .video-title-overlay { display: none; }
  }
`

// ─── Component ────────────────────────────────────────────────────────────────
export default function CoursePlayerPage() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()

  const [course, setCourse] = useState<CoursePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(18)
  const [activeLesson, setActiveLesson] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetchPreview(slug)
      .then((data) => {
        setCourse(data)
        const playlist = buildPlaylist(data.modules)
        if (playlist.length > 0) setActiveLesson(playlist[0].id)
      })
      .catch((e: Error) => {
        setError(e.message === 'not_found' ? 'Course not found.' : 'Failed to load preview.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  const playlist = course ? buildPlaylist(course.modules) : []

  const goToCheckout = () => {
    navigate(ROUTES.CHECKOUT, {
      state: {
        courseSlug: slug,
        priceNaira: course?.price_naira,
        priceKobo: course?.price_kobo,
        courseTitle: course?.title,
        trainerName: course?.trainer?.name,
      },
    })
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="page">
        <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>

        <div className="outer">
          <h1 className="outer-title">Course Preview</h1>

          <div className="card">
            {loading && <div className="state-screen">Loading preview…</div>}
            {error && !loading && <div className="state-screen error">{error}</div>}

            {!loading && !error && course && (
              <>
                <div className="video-wrap">
                  <img src="/imagee2.png" alt="Video thumbnail" />
                  <div className="video-overlay" />

                  <button className="video-back" onClick={() => navigate(ROUTES.COURSES)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>

                  <div className="video-title-overlay">
                    <div className="vt-category">{course.category}</div>
                    <div className="vt-title">{course.title}</div>
                  </div>

                  <div className="center-controls">
                    <button className="ctrl-btn" onClick={() => setProgress(Math.max(0, progress - 5))}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
                    </button>
                    <button className="play-main" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21" /></svg>
                      }
                    </button>
                    <button className="ctrl-btn" onClick={() => setProgress(Math.min(100, progress + 5))}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                  </div>

                  <div className="video-controls">
                    <div className="progress-wrap" onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setProgress(Math.round(((e.clientX - rect.left) / rect.width) * 100))
                    }}>
                      <div className="progress-fill" style={{ width: `${progress}%` }}>
                        <div className="progress-thumb" />
                      </div>
                    </div>
                    <div className="controls-row">
                      <span className="time">
                        {playlist.find((p) => p.id === activeLesson)?.duration_display ?? '--:--'}
                      </span>
                      <div className="controls-right">
                        <button className="ctrl-btn" onClick={() => setMuted(!muted)}>
                          {!muted
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" /></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                          }
                        </button>
                        <button className="ctrl-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" />
                            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="info">
                  <div className="info-row">
                    <div>
                      <p className="info-category">INTRODUCTORY VIDEO</p>
                      <p className="info-title">{course.title}</p>
                      <p className="info-instructor">
                        {course.trainer.name}
                        <span> · {course.trainer.credential}</span>
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div className="avatar-circle">
                        {course.trainer.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {playlist.length > 0 && (
                  <div className="playlist">
                    <p className="playlist-label">Up Next</p>
                    {playlist.map((item, index) => (
                      <div
                        key={item.id}
                        className={`pl-item ${activeLesson === item.id ? 'active' : ''}`}
                        onClick={() => setActiveLesson(item.id)}
                      >
                        <div className="pl-num">
                          {activeLesson === item.id
                            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                            : index + 1}
                        </div>
                        <span className="pl-title">{item.title}</span>
                        <span className="pl-dur">{item.duration_display}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="enroll-bar">
                  <div>
                    <p className="enroll-label">Ready to enrol?</p>
                    <p className="enroll-price">{formatNaira(course.price_naira)}</p>
                  </div>
                  <button className="enroll-btn" onClick={goToCheckout}>
                    Enrol now
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