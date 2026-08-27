import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, ChevronRight,
  Play, Clock, Calendar, Trophy, CheckCircle, Circle,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES, RouteBuilder } from '../../constants/routes'
import { apiClient, coursesAPI } from '../../services/api'
import AppShell, { SHELL_CSS } from '../../components/layout/AppShell'

// ── Types ──────────────────────────────────────────────────────────────────
interface EnrolledCourse {
  course_id: string
  course_slug: string
  title: string
  category: string
  thumbnail_url: string
  trainer_name: string
  module_count: number
  completion_percentage: number
  last_accessed_at: string
  enrolled_at: string
  source: string
  resume_url: string
}

interface CertChecklistItem {
  requirement: string
  satisfied: boolean
  implemented?: boolean
  reason?: string
  details?: string | Record<string, string>
}

interface CertificationApiResponse {
  eligible: boolean
  checklist: CertChecklistItem[]
  completion_percentage: number
  next_incomplete: string | null
}

interface CourseCertProgress {
  course_id: string
  course_slug: string
  course_title: string
  eligible: boolean
  completion_percentage: number
  next_incomplete: string | null
  checklist: CertChecklistItem[]
}


interface LiveSessionSummary {
  id: string
  course_id: string
  title: string
  topic: string
  starts_at: string
  ends_at: string
  status: string // documented example is "upcoming"; "live" is implied by the endpoint description
  join_url: string
  trainer_name: string
}

interface AssignmentItem {
  id: string
  title: string
  course_title: string
  course_slug: string
  due_at: string
  my_submission_status: string
}

// ── Progress ring ──────────────────────────────────────────────────────────
function Ring({ pct, size = 80, stroke = 7, color = '#2492EB' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fontSize={size * 0.2} fontWeight="700" fill="#111">{pct}%</text>
    </svg>
  )
}

function SmallRing({ pct }: { pct: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, width: 36, height: 36 }}>
      <Ring pct={pct} size={36} stroke={3} color="#2492EB" />
    </div>
  )
}

function fmtSessionTime(iso: string): string {
  const d = new Date(iso)
  const datePart = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${datePart} · ${timePart} WAT`
}

function fmtDueDate(iso: string): string {
  if (!iso) return 'No due date'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'No due date'
  return `Due ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
}

const REQUIREMENT_LABELS: Record<string, string> = {
  modules_complete: 'Complete all modules',
  project_complete: 'Submit final project',
  live_session_attended: 'Attend a live session',
  quiz_passing: 'Pass all quizzes',
  final_assessment: 'Pass final assessment',
}

function labelForRequirement(requirement: string): string {
  return REQUIREMENT_LABELS[requirement] ?? requirement
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Page CSS ───────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .content { padding: 2rem 2.5rem 3rem; display: flex; flex-direction: column; gap: 1.75rem; }

  .greeting-line { font-size: 0.9375rem; color: #6B7280; }
  .greeting-name { font-size: 1.625rem; font-weight: 700; color: #111; margin-top: 0.125rem; }

 .resume-banner {
  background: linear-gradient(135deg, #2492EB 0%, #1560A8 100%);
  border-radius: 1rem;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  color: #fff;
  min-height: 140px;
  box-shadow: 0px 10px 15px -3px rgba(190,219,255,0.6), 0px 4px 6px -4px rgba(190,219,255,0.6);
}

.resume-banner-left {
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.resume-label {
  font-size: 0.625rem; /* 10px */
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.6);
  margin-bottom: 0.35rem;
}
.resume-module {
  font-size: 0.9375rem; /* 15px */
  line-height: 21px;
  font-weight: 700;
}
.resume-progress-wrap { background: rgba(255,255,255,0.2); border-radius: 9999px; height: 12px; width: 100%; }
.resume-progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 9999px;
}
.resume-sub {
  font-size: 0.625rem; /* 10px */
  line-height: 15px;
  color: #fff;
  margin-top: 0.4rem;
}
.resume-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  color: #2492EB;
  border: none;
  border-radius: 12px;
  padding: 10px 20px;
  min-width: 121px;
  height: 40px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  justify-content: center;
}
.resume-btn:hover { opacity: 0.9; }

  .resume-banner-empty { background: linear-gradient(135deg, #2492EB 0%, #1560A8 100%); border-radius: 1rem; padding: 1.5rem 1.75rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; color: #fff; min-height: 110px; overflow: hidden; position: relative; }
  .resume-empty-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.75rem; }
  .resume-you-badge { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.9; }
  .resume-empty-title { font-size: 1.0625rem; font-weight: 700; }
  .resume-empty-sub { font-size: 0.8125rem; opacity: 0.85; max-width: 460px; line-height: 1.5; }
  .resume-empty-bar-wrap { display: flex; flex-direction: column; width: 100%; }
  .resume-empty-bar { height: 12px; background: rgba(255,255,255,0.25); border-radius: 99px; width: 100%; }
  .resume-empty-fill { height: 100%; background: #fff; border-radius: 99px; width: 2%; }
  .resume-empty-sub2 { font-size: 0.75rem; opacity: 0.75; margin-top: 0.4rem; }
  .resume-empty-right { flex-shrink: 0; }
  .start-course-btn { display: flex; align-items: center; gap: 0.5rem; background: #fff; color: #2492EB; border: none; border-radius: 2rem; padding: 0.65rem 1.4rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
  .start-course-btn:hover { opacity: 0.9; }

  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.875rem; }
  .section-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .see-all { font-size: 0.8125rem; color: #2492EB; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.2rem; background: none; border: none; }

  .empty-inline { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; }
  .empty-inline-icon { width: 56px; height: 56px; border-radius: 0.875rem; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .empty-inline-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .empty-inline-sub { font-size: 0.8125rem; color: #6B7280; max-width: 280px; line-height: 1.6; }

  .assignments-wrap { position: relative; }
  .assignments-scroll { display: flex; gap: 0.875rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
  .assignments-scroll::-webkit-scrollbar { display: none; }
  .asgn-next-btn { position: absolute; right: -14px; top: 50%; transform: translateY(-50%); width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 1px solid #E5E7EB; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; cursor: pointer; color: #374151; z-index: 2; }
  .asgn-next-btn:hover { background: #F9FAFB; }
 .asgn-card {
  box-sizing: border-box;
  min-width: 240px;
  max-width: 240px;
  height: 106px;
  background: #fff;
  border: none;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.asgn-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
.asgn-card.active {
  background: #E9F5FF;
  border: 0.5px solid #2492EB;
}

.asgn-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Sora';
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.45px;
  text-transform: uppercase;
}
.asgn-badge.active { color: #2492EB; }
.asgn-badge.upcoming { color: #6A7282; opacity: 0.7; }
.asgn-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.asgn-badge.upcoming::before { background: #D1D5DC; }

.asgn-title {
  font-family: 'Sora';
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: #2B3942;
  padding-top: 8px;
}
.asgn-course {
  font-family: 'Sora';
  font-size: 10px;
  font-weight: 400;
  line-height: 15px;
  color: #99A1AF;
  margin-top: 4px;
}
.asgn-due-note {
  font-family: 'Montserrat';
  font-style: italic;
  font-weight: 300;
  font-size: 12px;
  color: #616873;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}
 .sessions-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
.session-card { background: #fff; border: none; border-radius: 16px; padding: 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 540px; width: 100%; height: 107.25px; box-sizing: border-box; }
.live-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: #FB2C36; border-radius: 6px; font-size: 9px; font-weight: 700; letter-spacing: 0.45px; color: #fff; text-transform: uppercase; margin-bottom: 0.3rem; }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff; opacity: 0.57; animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: 0.57; } 50% { opacity: 0.2; } }
.session-title { font-size: 12px; font-weight: 600; color: #2B3942; line-height: 16px; }
.session-sub { font-size: 10px; color: #99A1AF; margin-top: 0.2rem; }
.session-time { font-size: 10px; color: #99A1AF; display: flex; align-items: center; gap: 4px; margin-top: 0.2rem; }
.join-btn { width: 49.42px; height: 28.5px; border-radius: 8px; border: none; background: #FB2C36; color: #fff; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.join-btn:hover { opacity: 0.9; }
.remind-btn { padding: 0.5rem 1.1rem; border-radius: 2rem; border: 1.5px solid #E5E7EB; background: #fff; color: #374151; font-size: 0.8125rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.remind-btn:hover { background: #F9FAFB; }

  .empty-state-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.625rem; }
  .empty-state-icon { width: 3.5rem; height: 3.5rem; border-radius: 50%; background: #EFF6FF; display: flex; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
  .empty-state-title { font-size: 1.0625rem; font-weight: 700; color: #111; }
  .empty-state-sub { font-size: 0.875rem; color: #6B7280; max-width: 420px; line-height: 1.6; }
  .empty-state-btn { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.875rem; background: #2492EB; color: #fff; border: none; border-radius: 2rem; padding: 0.7rem 1.5rem; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  .empty-state-btn:hover { opacity: 0.9; }

  .course-card { background: #fff; border: 1px solid #F3F4F6; border-radius: 16px; overflow: hidden; width: 385.5px; flex-shrink: 0; cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
.course-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-color: #D1D5DB; }
.course-thumb { position: relative; width: 100%; height: 215.72px; overflow: hidden; background: #D0D0D0; }
.course-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.course-thumb::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 100%); }
.course-body { padding: 10px; }
.course-tag { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #2492EB; margin-bottom: 0.2rem; }
.course-title { font-size: 12px; font-weight: 600; color: #2B3942; line-height: 16px; }
.course-last { font-size: 9px; color: #99A1AF; margin-top: 4px; }
.course-prog-bar { height: 4px; background: #F3F4F6; border-radius: 99px; margin-top: 8px; }
.course-prog-fill { height: 100%; background: #2492EB; border-radius: 99px; }

  .cert-section { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.5rem; display: flex; gap: 2rem; align-items: flex-start; }
  .cert-left { flex: 1; }
  .cert-badge { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.3rem; }
  .cert-badge-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; }
  .cert-name { font-size: 1rem; font-weight: 700; color: #111; margin-bottom: 0.625rem; }
  .cert-desc { font-size: 0.8375rem; color: #6B7280; margin-bottom: 1rem; line-height: 1.55; }
  .cert-desc strong { color: #2492EB; }
  .cert-config-note { font-size: 0.8125rem; color: #B45309; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 0.5rem; padding: 0.625rem 0.75rem; margin-bottom: 0.875rem; line-height: 1.5; }
  .cert-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8375rem; color: #374151; padding: 0.3rem 0; }
  .cert-item.done { color: #6B7280; }
  .cert-view { display: flex; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.8125rem; color: #2492EB; font-weight: 600; cursor: pointer; background: none; border: none; margin-top: 0.875rem; width: 100%; }
  .cert-right { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  .cert-empty { background: #fff; border: 1px solid #E5E7EB; border-radius: 1rem; padding: 1.5rem 1.75rem; }
  .cert-empty-top { display: flex; align-items: flex-start; gap: 0.875rem; margin-bottom: 1.25rem; }
  .cert-empty-icon { width: 48px; height: 48px; border-radius: 50%; background: #FEF9EC; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cert-empty-eyebrow { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #F59E0B; margin-bottom: 0.2rem; }
  .cert-empty-title { font-size: 1rem; font-weight: 700; color: #111; }
  .cert-empty-sub { font-size: 0.8375rem; color: #6B7280; margin-top: 0.2rem; line-height: 1.5; }
  .cert-empty-progress-label { display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; color: #6B7280; margin-bottom: 0.4rem; }
  .cert-empty-bar { height: 6px; background: #E5E7EB; border-radius: 99px; }
  .cert-empty-fill { height: 100%; background: #2492EB; border-radius: 99px; width: 0%; }
  .cert-empty-hint { text-align: center; font-size: 0.8125rem; color: #9CA3AF; margin-top: 1rem; padding: 0 1rem; }
  .cert-empty-cta { display: flex; align-items: center; justify-content: center; gap: 0.375rem; width: 100%; margin-top: 1.25rem; padding: 1rem 0; border-top: 1px solid #F3F4F6; border-left: none; border-right: none; border-bottom: none; font-size: 0.9375rem; font-weight: 600; color: #2492EB; background: none; cursor: pointer; }
  .cert-empty-cta:hover { background: #F9FAFB; }

  @media (max-width: 900px) {
    .sessions-row { grid-template-columns: 1fr; }
    .session-card { height: auto; }
    .content { padding: 1.5rem 1.25rem 2.5rem; }
  }
  @media (max-width: 640px) {
    .session-card { width: 100%; height: auto; }
    .content { padding: 1.25rem 1rem 5rem; }
    .resume-banner { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .resume-btn { align-self: flex-start; }
    .resume-banner-empty { flex-direction: column; align-items: flex-start; }
    .course-card { width: 100%; }
  }
`

interface DashboardResponse {
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    profile_completion_status: string
  }
  continue_learning: string | null
  assignments: { active: unknown[]; upcoming: unknown[] }
  live_sessions: { live_now: unknown[]; upcoming: unknown[] }
  enrolled_courses: EnrolledCourse[]
  certification_progress: unknown[]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [activeNav, setActiveNav] = useState('home')
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [certProgress, setCertProgress] = useState<CourseCertProgress[]>([])
  const [certProgressLoaded, setCertProgressLoaded] = useState(false)
  const [assignmentsActive, setAssignmentsActive] = useState<AssignmentItem[]>([])
  const [assignmentsUpcoming, setAssignmentsUpcoming] = useState<AssignmentItem[]>([])
  const [assignmentsLoaded, setAssignmentsLoaded] = useState(false)
  const [liveSessions, setLiveSessions] = useState<LiveSessionSummary[]>([])
  const [liveSessionsLoaded, setLiveSessionsLoaded] = useState(false)
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (!isAuthenticated) navigate(ROUTES.LOGIN)
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await apiClient.get<DashboardResponse>('/v1/me/dashboard/')
        setEnrolledCourses(response.data.enrolled_courses || [])
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchDashboardData()
  }, [user])

  useEffect(() => {
    const fetchAssignments = async () => {
      if (enrolledCourses.length === 0) {
        setAssignmentsLoaded(true)
        return
      }
      try {
        const results = await Promise.all(
          enrolledCourses.map((c) => coursesAPI.getCourseLearnView(c.course_slug)),
        )

        const all: AssignmentItem[] = []
        results.forEach((res, i) => {
          if (!res.success) return
          const course = enrolledCourses[i]
          res.data.modules.forEach((m) => {
            m.assignments.forEach((a) => {
              all.push({
                id: a.id,
                title: a.title,
                course_title: course.title,
                course_slug: course.course_slug,
                due_at: a.deadline ?? '',
                my_submission_status: a.my_submission_status,
              })
            })
          })
        })


        const byDueDate = (a: AssignmentItem, b: AssignmentItem) => {
          if (!a.due_at) return 1
          if (!b.due_at) return -1
          return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
        }

        const active = all
  .filter((a) => a.my_submission_status === 'in_progress')
  .sort(byDueDate)
const upcoming = all
  .filter((a) => a.my_submission_status === 'not_started' || a.my_submission_status == null)
  .sort(byDueDate)

        setAssignmentsActive(active)
        setAssignmentsUpcoming(upcoming)
      } catch (err) {
        console.error('Failed to fetch assignments:', err)
      } finally {
        setAssignmentsLoaded(true)
      }
    }
    if (user && !loading) fetchAssignments()
  }, [user, loading, enrolledCourses])

  
  useEffect(() => {
    const fetchCertProgress = async () => {
      if (enrolledCourses.length === 0) {
        setCertProgressLoaded(true)
        return
      }
      try {
        const results = await Promise.allSettled(
          enrolledCourses.map((c) =>
            apiClient.get<CertificationApiResponse>(`/v1/learner/courses/${c.course_slug}/certification/`),
          ),
        )

        const all: CourseCertProgress[] = []
        results.forEach((res, i) => {
          if (res.status !== 'fulfilled') return
          const course = enrolledCourses[i]
          const data = res.value.data
          all.push({
            course_id: course.course_id,
            course_slug: course.course_slug,
            course_title: course.title,
            eligible: data.eligible,
            completion_percentage: data.completion_percentage ?? 0,
            next_incomplete: data.next_incomplete ?? null,
            
            checklist: (data.checklist || []).filter((item) => item.implemented !== false),
          })
        })

        setCertProgress(all)
      } catch (err) {
        console.error('Failed to fetch certification progress:', err)
      } finally {
        setCertProgressLoaded(true)
      }
    }
    if (user && !loading) fetchCertProgress()
  }, [user, loading, enrolledCourses])

  useEffect(() => {
    const fetchLiveSessions = async () => {
      try {
        const response = await apiClient.get<LiveSessionSummary[]>('/v1/live/sessions/')
        setLiveSessions(response.data || [])
      } catch (err) {
        console.error('Failed to fetch live sessions:', err)
      } finally {
        setLiveSessionsLoaded(true)
      }
    }
    if (user) fetchLiveSessions()
  }, [user])

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading…</p></div>

  const firstName = (user.name || user.email || '').split(' ')[0]
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const hasCourses                  = enrolledCourses.length > 0
  const showEmptyState              = !loading && !error && !hasCourses
  const showCourseDependentSections = !loading && !error && hasCourses

  const hasAssignments = assignmentsActive.length > 0 || assignmentsUpcoming.length > 0

  const liveNowSessions = liveSessions
    .filter((s) => s.status === 'live')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  const upcomingSessions = liveSessions
    .filter((s) => s.status !== 'live')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  const nextLiveSession     = liveNowSessions[0] ?? null
  const nextUpcomingSession = upcomingSessions[0] ?? null
  const hasLiveOrUpcoming   = liveNowSessions.length > 0 || upcomingSessions.length > 0

  function toggleReminder(sessionId: string) {
    setRemindedIds((prev) => {
      const next = new Set(prev)
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId)
      return next
    })
  }

  const resumeCourse = hasCourses
    ? [...enrolledCourses].sort((a, b) => {
        const ta = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
        const tb = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
        return tb - ta
      })[0]
    : null


  const activeCert = certProgress.length > 0
    ? (certProgress.find((c) => c.course_slug === resumeCourse?.course_slug)
        ?? certProgress.find((c) => !c.eligible)
        ?? certProgress[0])
    : null

  const configMissingNote = activeCert?.checklist.find((c) => c.reason === 'config_missing')

  function goToCourse(slug: string) {
    if (!slug) return
    navigate(RouteBuilder.course(slug))
  }

  function goToAssignment(a: AssignmentItem) {
    navigate(RouteBuilder.assignmentDetail(a.id), {
      state: { courseSlug: a.course_slug, courseTitle: a.course_title },
    })
  }
function goToCertification() {
  navigate(ROUTES.CERTIFICATES)
}
  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="content">

          {/* Greeting */}
          <div>
            <div className="greeting-line">{greeting},</div>
            <div className="greeting-name">{firstName} 👋</div>
          </div>

          {/* Resume banner (has progress) */}
          {showCourseDependentSections && resumeCourse && resumeCourse.completion_percentage > 0 && (
            <div className="resume-banner">
              <div className="resume-banner-left">
                <div className="resume-banner-top">
                  <div className="resume-label">Continue where you left off</div>
                  <div className="resume-module">{resumeCourse.title}</div>
                </div>
                <div className="resume-banner-bottom">
                  <div className="resume-progress-wrap">
                    <div className="resume-progress-fill" style={{ width: `${resumeCourse.completion_percentage}%` }} />
                  </div>
                  <div className="resume-sub">{resumeCourse.completion_percentage}% complete</div>
                </div>
              </div>
              <button className="resume-btn" onClick={() => {
                if (resumeCourse.resume_url) navigate(resumeCourse.resume_url)
                else goToCourse(resumeCourse.course_slug)
              }}>
                <Play size={14} fill="#2492EB" /> Resume
              </button>
            </div>
          )}

          {/* Resume banner (enrolled, but hasn't started anything yet) */}
          {showCourseDependentSections && resumeCourse && resumeCourse.completion_percentage === 0 && (
            <div className="resume-banner-empty">
              <div className="resume-empty-left">
                <div className="resume-you-badge">✨ You're all set to begin!</div>
                <div className="resume-empty-title">Start your first module</div>
                <div className="resume-empty-sub">
                  You haven't started your course yet. Begin Module 1 to kick off your learning journey.
                </div>
                <div className="resume-empty-bar-wrap">
                  <div className="resume-empty-bar"><div className="resume-empty-fill" /></div>
                  <div className="resume-empty-sub2">0% complete</div>
                </div>
              </div>
              <div className="resume-empty-right">
                <button className="start-course-btn" onClick={() => {
                  if (resumeCourse.resume_url) navigate(resumeCourse.resume_url)
                  else goToCourse(resumeCourse.course_slug)
                }}>
                  <Play size={14} fill="#2492EB" /> Start Course
                </button>
              </div>
            </div>
          )}

          {/* Assignments */}
          <div>
            <div className="section-header">
              <span className="section-title">Assignment(s)</span>
            </div>
            {assignmentsLoaded && !hasAssignments && (
              <div className="empty-inline">
                <div className="empty-inline-icon" style={{ background: '#EFF6FF' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2492EB" strokeWidth="1.8">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                    <path d="M9 16l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="empty-inline-title">No assignments yet</div>
                <div className="empty-inline-sub">Assignments will appear here once you start progressing through your course.</div>
              </div>
            )}

            {assignmentsLoaded && hasAssignments && (
              <div className="assignments-wrap">
                <div className="assignments-scroll">
                  {[...assignmentsActive, ...assignmentsUpcoming].map((a) => {
                    const isActive = assignmentsActive.some((x) => x.id === a.id)
                    return (
                      <div
                        key={a.id}
                        className={`asgn-card${isActive ? ' active' : ''}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => goToAssignment(a)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToAssignment(a) }}
                      >
                        <div className={`asgn-badge ${isActive ? 'active' : 'upcoming'}`}>
                          {isActive ? 'Active' : 'Upcoming'}
                        </div>
                        <div className="asgn-title">{a.title}</div>
                        {a.course_title && <div className="asgn-course">{a.course_title}</div>}
                        <div className="asgn-due-note"><Clock size={12} /> {fmtDueDate(a.due_at)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sessions — real data from GET /v1/live/sessions/ */}
          {liveSessionsLoaded && !hasLiveOrUpcoming && (
            <div>
              <div className="section-header"><span className="section-title">Live Sessions</span></div>
              <div className="empty-inline">
                <div className="empty-inline-icon" style={{ background: '#FFF1F1' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className="empty-inline-title">No scheduled sessions yet</div>
                <div className="empty-inline-sub">Live sessions with your trainer will be listed here. Check back once your course is underway.</div>
              </div>
            </div>
          )}
          {liveSessionsLoaded && hasLiveOrUpcoming && (
            <div className="sessions-row">
              <div>
                <div className="section-header">
                  <span className="section-title">Live Session</span>
                  <button className="see-all" onClick={() => navigate(ROUTES.LIVE_SESSIONS)}>
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                {nextLiveSession ? (
                  <div className="session-card">
                    <div>
                      <div className="live-badge"><div className="live-dot" /> Live</div>
                      <div className="session-title">{nextLiveSession.title}</div>
                      <div className="session-sub">{nextLiveSession.trainer_name}</div>
                      <div className="session-time"><Clock size={12} /> Live now</div>
                    </div>
                    <button
                      className="join-btn"
                      disabled={!nextLiveSession.join_url}
                      style={{ opacity: nextLiveSession.join_url ? 1 : 0.5, cursor: nextLiveSession.join_url ? 'pointer' : 'default' }}
                      onClick={() => nextLiveSession.join_url && window.open(nextLiveSession.join_url, '_blank')}
                    >
                      Join
                    </button>
                  </div>
                ) : (
                  <div className="empty-inline" style={{ padding: '1.75rem 1rem' }}>
                    <div className="empty-inline-sub">No session live right now.</div>
                  </div>
                )}
              </div>
              <div>
                <div className="section-header">
                  <span className="section-title">Upcoming Session</span>
                  <button className="see-all" onClick={() => navigate(ROUTES.LIVE_SESSIONS)}>
                    See all <ChevronRight size={14} />
                  </button>
                </div>
                {nextUpcomingSession ? (
                  <div className="session-card">
                    <div>
                      <div className="session-title">{nextUpcomingSession.title}</div>
                      <div className="session-sub">{nextUpcomingSession.trainer_name}</div>
                      <div className="session-time"><Calendar size={12} /> {fmtSessionTime(nextUpcomingSession.starts_at)}</div>
                    </div>
                    <button className="remind-btn" onClick={() => toggleReminder(nextUpcomingSession.id)}>
                      {remindedIds.has(nextUpcomingSession.id) ? 'Reminder set' : 'Remind me'}
                    </button>
                  </div>
                ) : (
                  <div className="empty-inline" style={{ padding: '1.75rem 1rem' }}>
                    <div className="empty-inline-sub">Nothing scheduled yet.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Courses */}
          <div>
            <div className="section-header"><span className="section-title">My Courses</span></div>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Loading courses...</div>
            ) : error ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>{error}</div>
            ) : showEmptyState ? (
              <div className="empty-state-card">
                <div className="empty-state-icon"><BookOpen size={26} color="#2492EB" /></div>
                <div className="empty-state-title">You haven't enrolled in a course yet</div>
                <div className="empty-state-sub">Browse the catalog and enroll in your first course — your progress, assignments, and certificate tracker will show up right here once you do.</div>
                <button className="empty-state-btn" onClick={() => navigate(RouteBuilder.courseCatalogPage())}>
                  <BookOpen size={16} /> Browse Courses
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {enrolledCourses.map((course) => {
                  const lastAccessedDate = course.last_accessed_at ? new Date(course.last_accessed_at) : null
                  const lastAccessedText = (() => {
                    if (!lastAccessedDate || isNaN(lastAccessedDate.getTime()) || lastAccessedDate.getFullYear() < 2000) {
                      return course.completion_percentage > 0 ? 'In progress' : 'Not accessed yet'
                    }
                    const hoursAgo = Math.floor((Date.now() - lastAccessedDate.getTime()) / (1000 * 60 * 60))
                    if (hoursAgo < 1) return 'Just now'
                    if (hoursAgo < 24) return `${hoursAgo}h ago`
                    return `${Math.floor(hoursAgo / 24)}d ago`
                  })()
                  return (
                    <div key={course.course_id} className="course-card" role="button" tabIndex={0}
                      onClick={() => goToCourse(course.course_slug)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') goToCourse(course.course_slug) }}>
                      <div className="course-thumb">
                        <img src={course.thumbnail_url || '/intro.png'} alt={course.title}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/intro.png' }} />
                        <SmallRing pct={course.completion_percentage} />
                      </div>
                      <div className="course-body">
                        <div className="course-tag">{course.category || 'Course'}</div>
                        <div className="course-title">{course.title}</div>
                        <div className="course-last">last opened {lastAccessedText}</div>
                        <div className="course-prog-bar">
                          <div className="course-prog-fill" style={{ width: `${course.completion_percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Certificate tracker — GET /learner/courses/{slug}/certification/ */}
          {showCourseDependentSections && certProgressLoaded && activeCert && (
            <div className="cert-section">
              <div className="cert-left">
                <div className="cert-badge">
                  <Trophy size={20} color="#F59E0B" />
                  <span className="cert-badge-label">Certificate</span>
                </div>
                <div className="cert-name">{activeCert.course_title}</div>

                {configMissingNote ? (
                  <div className="cert-config-note">
                    This course doesn't have a final assignment configured yet — that's on the course admin, not something you can complete from your side.
                  </div>
                ) : activeCert.eligible ? (
                  <div className="cert-desc">
                    You've met all the requirements — your certificate is being generated and will show up under My Certificates shortly.
                  </div>
                ) : (
                  <div className="cert-desc">
                    You're <strong>{activeCert.completion_percentage}%</strong> to your {activeCert.course_title} certificate — keep going!
                  </div>
                )}

                {activeCert.checklist.map((item, i) => (
                  <div key={i} className={`cert-item${item.satisfied ? ' done' : ''}`}>
                    {item.satisfied
                      ? <CheckCircle size={16} color="#00C950" fill="#EFF6FF" />
                      : <Circle size={16} color="#D1D5DB" />}
                    <span>{labelForRequirement(item.requirement)}</span>
                  </div>
                ))}
                <button className="cert-view" onClick={goToCertification}>
  View all requirements <ChevronRight size={14} />
</button>
              </div>
              <div className="cert-right">
                <Ring pct={activeCert.completion_percentage} size={110} stroke={10} color="#2492EB" />
              </div>
            </div>
          )}

          {showCourseDependentSections && certProgressLoaded && !activeCert && (
            <div className="cert-empty">
              <div className="cert-empty-top">
                <div className="cert-empty-icon"><Trophy size={24} color="#F59E0B" /></div>
                <div>
                  <div className="cert-empty-eyebrow">Certificate</div>
                  <div className="cert-empty-title">Your journey begins here!</div>
                  <div className="cert-empty-sub">Complete your first lesson to start tracking progress toward your certificate.</div>
                </div>
              </div>
              <div className="cert-empty-progress-label">
                <span>Certificate progress</span><span>0%</span>
              </div>
              <div className="cert-empty-bar"><div className="cert-empty-fill" /></div>
              <div className="cert-empty-hint">Complete all modules, quizzes, and submit your project to earn your certificate.</div>
              <button className="cert-empty-cta" onClick={() => navigate(RouteBuilder.courseCatalogPage())}>
                Let's get started <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </AppShell>
    </>
  )
}