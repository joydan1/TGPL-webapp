import { useState, useEffect, useRef, useCallback } from 'react'
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
  is_preview: boolean
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
  thumbnail_url: string
  trainer: { id: string; name: string; credential: string }
  modules: Module[]
}

interface LessonDetail {
  id: string
  title: string
  duration_display: string
  is_preview: boolean
  video_url: string | null
  body: string
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

async function fetchLesson(slug: string, lessonId: string): Promise<LessonDetail> {
  try {
    const response = await apiClient.get<LessonDetail>(`/v1/courses/${slug}/lessons/${lessonId}/`)
    return response.data
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 403) throw new Error('not_preview')
    throw new Error('fetch_failed')
  }
}

function formatNaira(raw: string): string {
  const num = parseFloat(raw)
  if (isNaN(num)) return `₦${raw}`
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface PlaylistItem {
  id: string
  title: string
  duration_display: string
  moduleTitle: string
  is_preview: boolean
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
          is_preview: lesson.is_preview,
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

  /* Video */
  .video-wrap {
    position: relative; width: 100%; aspect-ratio: 16/9;
    overflow: hidden; background: #000; cursor: pointer;
  }
  .video-wrap video {
    width: 100%; height: 100%; object-fit: contain;
    display: block; background: #000;
  }
  .video-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.65) 100%);
    pointer-events: none;
  }

  /* Thumbnail shown before play */
  .video-thumb {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover;
    opacity: 0.75; display: block;
  }

  /* No video fallback */
  .no-video {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 0.625rem; color: rgba(255,255,255,0.7);
    font-size: 0.875rem; pointer-events: none;
  }
  .no-video-icon {
    width: 3rem; height: 3rem; border-radius: 50%;
    background: rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
  }

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
    text-align: center; color: #fff; z-index: 10; white-space: nowrap; pointer-events: none;
  }
  .vt-category { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.05em; }
  .vt-title { font-size: 0.6875rem; font-weight: 600; opacity: 0.5; }

  /* Buffering spinner */
  .buffering {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%,-50%); z-index: 15; pointer-events: none;
  }
  .buffering svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

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
  .ctrl-btn {
    background: none; border: none; cursor: pointer;
    color: #fff; display: flex; align-items: center;
    justify-content: center; opacity: 0.85;
  }
  .ctrl-btn:hover { opacity: 1; }

  .video-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; z-index: 10; }
  .progress-wrap {
    width: 100%; height: 4px; background: rgba(255,255,255,0.25);
    border-radius: 2px; margin-bottom: 0.625rem; cursor: pointer;
    transition: height 0.1s;
  }
  .progress-wrap:hover { height: 6px; }
  .progress-fill { height: 100%; background: #2563EB; border-radius: 2px; position: relative; pointer-events: none; }
  .progress-thumb {
    position: absolute; right: -5px; top: 50%; transform: translateY(-50%);
    width: 10px; height: 10px; border-radius: 50%;
    background: #fff; box-shadow: 0 0 4px rgba(0,0,0,0.3);
  }
  .controls-row { display: flex; align-items: center; justify-content: space-between; }
  .time { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-variant-numeric: tabular-nums; }
  .controls-right { display: flex; align-items: center; gap: 1rem; }

  /* Volume */
  .volume-slider {
    -webkit-appearance: none; appearance: none;
    width: 64px; height: 3px; background: rgba(255,255,255,0.3);
    border-radius: 2px; outline: none; cursor: pointer; vertical-align: middle;
  }
  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none; width: 10px; height: 10px;
    border-radius: 50%; background: #fff; cursor: pointer;
    margin-top: -3.5px;
  }

  /* Preview badge */
  .preview-badge {
    position: absolute; top: 1rem; right: 1rem; z-index: 10;
    background: rgba(37,99,235,0.85); backdrop-filter: blur(4px);
    color: #fff; font-size: 0.6875rem; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 0.25rem 0.625rem; border-radius: 2rem;
  }

  .info { background: #111827; padding: 1.25rem 1.5rem; border-top: 1px solid #1F2937; }
  .info-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .info-category { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em; color: #2563EB; text-transform: uppercase; margin-bottom: 0.3rem; }
  .info-title { font-size: 1rem; font-weight: 700; color: #fff; line-height: 1.35; margin-bottom: 0.25rem; }
  .info-instructor { font-size: 0.8125rem; color: #9CA3AF; }
  .info-instructor span { color: #6B7280; font-size: 0.75rem; }
  .avatar-circle {
    width: 2.25rem; height: 2.25rem; border-radius: 50%;
    background: #2563EB; display: flex; align-items: center;
    justify-content: center; font-weight: 700; color: #fff;
    font-size: 0.875rem; flex-shrink: 0; border: 2px solid #374151;
  }

  .playlist { background: #111827; border-top: 1px solid #1F2937; padding: 1rem 1.5rem; }
  .playlist-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; color: #6B7280; text-transform: uppercase; margin-bottom: 0.75rem; }
  .pl-item {
    display: flex; align-items: center; gap: 0.875rem;
    padding: 0.75rem 1rem; border-radius: 0.625rem;
    cursor: pointer; transition: background 0.15s; margin-bottom: 0.375rem;
  }
  .pl-item:last-child { margin-bottom: 0; }
  .pl-item.active { background: #1F2937; }
  .pl-item:not(.active):hover { background: rgba(255,255,255,0.04); }
  .pl-num {
    width: 1.75rem; height: 1.75rem; border-radius: 50%;
    background: #374151; display: flex; align-items: center;
    justify-content: center; font-size: 0.75rem; font-weight: 600;
    color: #9CA3AF; flex-shrink: 0;
  }
  .pl-item.active .pl-num { background: #2563EB; color: #fff; }
  .pl-title { flex: 1; font-size: 0.875rem; color: #D1D5DB; font-weight: 500; }
  .pl-item.active .pl-title { color: #fff; }
  .pl-dur { font-size: 0.75rem; color: #6B7280; font-variant-numeric: tabular-nums; }
  .enroll-bar {
    background: #1F2937; border-top: 1px solid #374151;
    padding: 1rem 1.5rem; display: flex;
    align-items: center; justify-content: space-between; gap: 1rem;
  }
  .enroll-label { font-size: 0.72rem; color: #9CA3AF; margin-bottom: 0.125rem; }
  .enroll-price { font-size: 1.125rem; font-weight: 700; color: #fff; }
  .enroll-btn {
    padding: 0.65rem 1.5rem; border-radius: 2rem; border: none;
    background: #2563EB; color: #fff; font-size: 0.9375rem;
    font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0;
  }
  .enroll-btn:hover { opacity: 0.88; }

  .footer { font-size: 0.85rem; color: #ABABAB; text-align: center; }

  @media (max-width: 768px) {
    .page { padding: 1.5rem 0.75rem 2.5rem; }
    .outer { padding: 1.25rem; border-radius: 1.25rem; }
    .outer-title { font-size: 1.25rem; }
    .info, .playlist, .enroll-bar { padding: 1rem; }
    .info-title { font-size: 0.9375rem; }
    .volume-slider { display: none; }
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

  const [course, setCourse]   = useState<CoursePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Active lesson being previewed
  const [activeLesson, setActiveLesson] = useState<PlaylistItem | null>(null)
  // Fetched lesson detail (has video_url)
  const [lessonDetail, setLessonDetail]     = useState<LessonDetail | null>(null)
  const [lessonLoading, setLessonLoading]   = useState(false)

  // Real video state
  const videoRef                            = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying]           = useState(false)
  const [currentTime, setCurrentTime]       = useState(0)
  const [duration, setDuration]             = useState(0)
  const [volume, setVolume]                 = useState(1)
  const [muted, setMuted]                   = useState(false)
  const [buffering, setBuffering]           = useState(false)
  const [hasStarted, setHasStarted]         = useState(false)

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Load course ──
  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetchPreview(slug)
      .then((data) => {
        setCourse(data)
        const playlist = buildPlaylist(data.modules)
        setActiveLesson(playlist[0] ?? null)
      })
      .catch((e: Error) => {
        setError(e.message === 'not_found' ? 'Course not found.' : 'Failed to load preview.')
      })
      .finally(() => setLoading(false))
  }, [slug])

  // ── Fetch lesson detail when activeLesson changes ──
  useEffect(() => {
    if (!slug || !activeLesson) return
    setLessonLoading(true)
    setLessonDetail(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setHasStarted(false)
    fetchLesson(slug, activeLesson.id)
      .then(setLessonDetail)
      .catch(() => setLessonDetail(null))
      .finally(() => setLessonLoading(false))
  }, [slug, activeLesson])

  // ── Wire video events ──
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onPlay         = () => { setIsPlaying(true); setHasStarted(true) }
    const onPause        = () => setIsPlaying(false)
    const onTimeUpdate   = () => setCurrentTime(v.currentTime)
    const onDuration     = () => setDuration(v.duration)
    const onWaiting      = () => setBuffering(true)
    const onCanPlay      = () => setBuffering(false)
    const onVolumeChange = () => { setVolume(v.volume); setMuted(v.muted) }

    v.addEventListener('play',           onPlay)
    v.addEventListener('pause',          onPause)
    v.addEventListener('timeupdate',     onTimeUpdate)
    v.addEventListener('loadedmetadata', onDuration)
    v.addEventListener('durationchange', onDuration)
    v.addEventListener('waiting',        onWaiting)
    v.addEventListener('canplay',        onCanPlay)
    v.addEventListener('playing',        onCanPlay)
    v.addEventListener('volumechange',   onVolumeChange)
    return () => {
      v.removeEventListener('play',           onPlay)
      v.removeEventListener('pause',          onPause)
      v.removeEventListener('timeupdate',     onTimeUpdate)
      v.removeEventListener('loadedmetadata', onDuration)
      v.removeEventListener('durationchange', onDuration)
      v.removeEventListener('waiting',        onWaiting)
      v.removeEventListener('canplay',        onCanPlay)
      v.removeEventListener('playing',        onCanPlay)
      v.removeEventListener('volumechange',   onVolumeChange)
    }
  }, [lessonDetail]) // re-wire when a new lesson detail loads (new video src)

  // ── Video controls ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.paused ? v.play().catch(() => {}) : v.pause()
  }, [])

  const seekBy = useCallback((secs: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + secs))
  }, [])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val
    v.muted  = val === 0
  }, [])

  const toggleMute = useCallback(() => {
    const v = videoRef.current
    if (v) v.muted = !v.muted
  }, [])

  const goToCheckout = () => {
    navigate(ROUTES.CHECKOUT, {
      state: {
        courseSlug:  slug,
        priceNaira:  course?.price_naira,
        priceKobo:   course?.price_kobo,
        courseTitle: course?.title,
        trainerName: course?.trainer?.name,
      },
    })
  }

  const playlist = course ? buildPlaylist(course.modules) : []
  const hasVideo  = Boolean(lessonDetail?.video_url)

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
                {/* ── Video ── */}
                <div className="video-wrap" onClick={togglePlay}>

                  {/* Real video element — always mounted so ref is stable */}
                  <video
                    ref={videoRef}
                    src={lessonDetail?.video_url ?? undefined}
                    preload="metadata"
                    playsInline
                    muted={muted}
                    style={{ display: hasVideo ? 'block' : 'none' }}
                  />

                  {/* Thumbnail: shown until user starts playing */}
                  {(!hasStarted || !hasVideo) && course.thumbnail_url && (
                    <img
                      className="video-thumb"
                      src={course.thumbnail_url}
                      alt="Course thumbnail"
                    />
                  )}

                  {/* No video fallback */}
                  {!hasVideo && !lessonLoading && (
                    <div className="no-video">
                      <div className="no-video-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
                          <rect x="2" y="6" width="16" height="12" rx="2" />
                          <path d="M22 8l-4 4 4 4V8z" fill="rgba(255,255,255,0.9)" stroke="none"/>
                        </svg>
                      </div>
                      <span>
                        {activeLesson && !activeLesson.is_preview
                          ? 'Enrol to watch this lesson'
                          : 'Preview video not available yet'}
                      </span>
                    </div>
                  )}

                  {lessonLoading && (
                    <div className="no-video">
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>Loading preview…</span>
                    </div>
                  )}

                  <div className="video-overlay" />

                  <button
                    className="video-back"
                    onClick={(e) => { e.stopPropagation(); navigate(ROUTES.COURSES) }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>

                  <div className="video-title-overlay">
                    <div className="vt-category">{course.category}</div>
                    <div className="vt-title">{activeLesson?.title ?? course.title}</div>
                  </div>

                  {activeLesson?.is_preview && (
                    <div className="preview-badge">Free preview</div>
                  )}

                  {buffering && (
                    <div className="buffering">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5">
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  <div className="center-controls" onClick={(e) => e.stopPropagation()}>
                    <button className="ctrl-btn" onClick={() => seekBy(-10)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                    </button>
                    <button
                      className="play-main"
                      onClick={togglePlay}
                      disabled={!hasVideo || lessonLoading}
                    >
                      {isPlaying
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><polygon points="5,3 19,12 5,21"/></svg>
                      }
                    </button>
                    <button className="ctrl-btn" onClick={() => seekBy(10)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                  </div>

                  <div className="video-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="progress-wrap" onClick={handleProgressClick}>
                      <div className="progress-fill" style={{ width: `${progressPct}%` }}>
                        <div className="progress-thumb" />
                      </div>
                    </div>
                    <div className="controls-row">
                      <span className="time">
                        {duration > 0
                          ? `${fmtTime(currentTime)} / ${fmtTime(duration)}`
                          : activeLesson?.duration_display ?? '--:--'}
                      </span>
                      <div className="controls-right">
                        <button className="ctrl-btn" onClick={toggleMute}>
                          {muted || volume === 0
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>
                          }
                        </button>
                        <input
                          className="volume-slider"
                          type="range" min={0} max={1} step={0.05}
                          value={muted ? 0 : volume}
                          onChange={handleVolumeChange}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Info ── */}
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
                    <div className="avatar-circle">
                      {course.trainer.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* ── Playlist ── */}
                {playlist.length > 0 && (
                  <div className="playlist">
                    <p className="playlist-label">Course Lessons</p>
                    {playlist.map((item, index) => {
                      const isActive = activeLesson?.id === item.id
                      return (
                        <div
                          key={item.id}
                          className={`pl-item${isActive ? ' active' : ''}`}
                          onClick={() => setActiveLesson(item)}
                        >
                          <div className="pl-num">
                            {isActive
                              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                              : index + 1}
                          </div>
                          <span className="pl-title">{item.title}</span>
                          <span className="pl-dur">{item.duration_display}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* ── Enrol bar ── */}
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