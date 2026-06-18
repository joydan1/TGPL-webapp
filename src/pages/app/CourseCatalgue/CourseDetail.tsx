import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Clock, BookOpen, BarChart2, Award, Users,
  Home, Radio, Settings, Search, Bell,
  ChevronDown, PanelLeftClose, PanelLeftOpen,
  Play, CheckCircle, Lock, LogOut, User as UserIcon,
} from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { apiClient, coursesAPI } from '../../../services/api'
import type { CourseProgressResponse, EnrollmentStatusResponse } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

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

function formatTimeSpent(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Mock progress ────────────────────────────────────────────────────────────
function buildMockProgress(course: CourseDetail): CourseProgressResponse {
  const modules = course.modules.map((m, mi) => ({
    id: m.id,
    title: m.title,
    order: m.order,
    lessons: m.lessons.map((l, li) => {
      let status: CourseProgressResponse['modules'][number]['lessons'][number]['status'] = 'locked'
      if (mi < 2) status = 'completed'
      else if (mi === 2) status = li === 0 ? 'completed' : li === 1 ? 'current' : 'locked'
      return { id: l.id, title: l.title, duration_display: l.duration_display, status }
    }),
  }))

  const allLessons = modules.flatMap((m) => m.lessons)
  const completed = allLessons.filter((l) => l.status === 'completed').length
  const current = allLessons.find((l) => l.status === 'current')

  return {
    course: { slug: course.slug, title: course.title, category: course.category, thumbnail: null },
    lessons_completed: completed,
    lessons_total: allLessons.length,
    time_spent_seconds: 9900,
    progress_percentage: allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0,
    current_lesson_id: current?.id || null,
    modules,
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────
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

// ─── CSS — Public sales page ──────────────────────────────────────────────────
const PUBLIC_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    min-height: 100vh; background: #F5F5F5; padding: 2.5rem 1rem 3rem;
    display: flex; flex-direction: column; align-items: center; gap: 1.5rem; font-family: inherit;
  }
  .logo img { height: 2.5rem; display: block; }
  .outer {
    width: 100%; max-width: 1040px; background: #fff; border-radius: 2rem;
    padding: 2.5rem; display: flex; flex-direction: column; gap: 1.25rem;
  }
  .outer-title { font-size: 1.625rem; font-weight: 700; color: #111; }
  .card { width: 100%; background: #fff; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.09); display: flex; flex-direction: column; }
  .state-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 320px; gap: 0.75rem; color: #9CA3AF; font-size: 0.9375rem; }
  .state-screen.error { color: #EF4444; }
  .hero { position: relative; width: 100%; aspect-ratio: 16/7; overflow: hidden; background: #D0D0D0; }
  .hero img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .hero-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #c8c8c8 0%, #a0a0a0 100%); }
  .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.7) 100%); }
  .hero-back {
    position: absolute; top: 1rem; left: 1rem; width: 2rem; height: 2rem; border-radius: 50%;
    background: rgba(255,255,255,0.18); backdrop-filter: blur(6px); border: none; cursor: pointer;
    color: #fff; display: flex; align-items: center; justify-content: center;
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
    position: sticky; bottom: 0; background: #fff; border-top: 1px solid #F3F4F6;
    padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
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

// ─── CSS — Enrolled overview ──────────────────────────────────────────────────
const ENROLLED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root { display: flex; flex-direction: column; min-height: 100vh; background: #F5F5F5; font-family: inherit; }

  /* ── Navbar ── */
  .navbar {
    height: 64px; background: #fff; border-bottom: 1px solid #F3F4F6;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; gap: 1rem; position: sticky; top: 0; z-index: 200; width: 100%;
  }
  .navbar-logo img { height: 2.25rem; display: block; }
  .navbar-right { display: flex; align-items: center; gap: 1rem; }
  .search-wrap {
    display: flex; align-items: center; gap: 0.5rem;
    background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 2rem;
    padding: 0.45rem 1.1rem; width: 240px;
  }
  .search-wrap input { background: none; border: none; outline: none; font-size: 0.875rem; color: #111; width: 100%; }
  .search-wrap input::placeholder { color: #9CA3AF; }
  .topbar-bell {
    width: 36px; height: 36px; border-radius: 50%; background: #F9FAFB; border: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; position: relative;
  }
  .bell-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #EF4444; border: 1.5px solid #fff; }

  /* ── Profile dropdown ── */
  .profile-menu-wrap { position: relative; }
  .profile-trigger { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; cursor: pointer; padding: 0; }
  .topbar-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; border: 2px solid #E5E7EB; flex-shrink: 0; overflow: hidden; }
  .topbar-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-chevron { color: #9CA3AF; transition: transform 0.15s ease; }
  .profile-chevron.open { transform: rotate(180deg); }
  .profile-dropdown {
    position: absolute; top: calc(100% + 0.625rem); right: 0; background: #fff;
    border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    width: 220px; padding: 0.5rem; z-index: 300;
  }
  .profile-dropdown-header { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.625rem 0.75rem; border-bottom: 1px solid #F3F4F6; margin-bottom: 0.375rem; }
  .profile-dropdown-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-item {
    display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.625rem;
    border-radius: 0.6rem; border: none; background: none; font-size: 0.8125rem; font-weight: 500;
    color: #374151; cursor: pointer; text-align: left; transition: background 0.15s;
  }
  .profile-dropdown-item:hover { background: #F9FAFB; }
  .profile-dropdown-item.danger { color: #EF4444; }
  .profile-dropdown-item.danger:hover { background: #FEF2F2; }

  /* ── Layout ── */
  .db-body { display: flex; flex: 1; }
  .sidebar {
    width: 220px; min-width: 220px; background: #fff; border-right: 1px solid #F3F4F6;
    display: flex; flex-direction: column; position: sticky; top: 64px;
    height: calc(100vh - 64px); flex-shrink: 0;
    transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s; overflow: hidden;
  }
  .sidebar.collapsed { width: 64px; min-width: 64px; }
  .sidebar-top { display: flex; justify-content: flex-end; padding: 0.75rem 0.75rem 0.25rem; }
  .collapse-btn {
    width: 32px; height: 32px; border-radius: 0.5rem; background: #fff; border: 1px solid #E5E7EB;
    display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280;
    box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: background 0.15s; flex-shrink: 0;
  }
  .collapse-btn:hover { background: #F3F4F6; }
  .sidebar-nav { flex: 1; padding: 0.5rem 0.625rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden; }
  .nav-item {
    display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.6rem;
    cursor: pointer; color: #6B7280; font-size: 0.875rem; font-weight: 500; white-space: nowrap;
    transition: background 0.15s, color 0.15s;
  }
  .nav-item:hover { background: #F9FAFB; color: #111; }
  .nav-item.active { background: #EFF6FF; color: #2563EB; font-weight: 600; }
  .nav-item .nav-label { flex: 1; }
  .sidebar.collapsed .nav-label { display: none; }
  .sidebar.collapsed .nav-item { justify-content: center; padding: 0.625rem; }
  .sidebar-user { padding: 1rem 0.875rem; border-top: 1px solid #F3F4F6; display: flex; align-items: center; gap: 0.625rem; overflow: hidden; }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; }
  .user-text { overflow: hidden; }
  .user-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .user-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar.collapsed .user-text { display: none; }

  /* ── Main content ── */
  .main { flex: 1; min-width: 0; overflow-y: auto; }
  .content { padding: 2rem 2.5rem 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; max-width: 1100px; }

  /* ── Course hero ── */
  .course-hero {
    position: relative; border-radius: 1rem; overflow: hidden; aspect-ratio: 16/6;
    background: #2B3942; display: flex; flex-direction: column;
    justify-content: space-between; padding: 1.25rem;
  }
  .course-hero img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .course-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.75) 100%); z-index: 1; }
  .hero-top-row { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: flex-start; }
  .hero-back-btn {
    width: 2rem; height: 2rem; border-radius: 50%; background: rgba(255,255,255,0.18);
    backdrop-filter: blur(6px); border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
  }
  .hero-back-btn:hover { background: rgba(255,255,255,0.32); }
  .hero-trainer {
    display: flex; align-items: center; gap: 0.5rem; background: rgba(0,0,0,0.35);
    backdrop-filter: blur(6px); padding: 0.35rem 0.75rem 0.35rem 0.35rem;
    border-radius: 2rem; color: #fff; font-size: 0.8125rem; font-weight: 600;
  }
  .hero-trainer-avatar { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #EF4444; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #fff; }
  .hero-bottom { position: relative; z-index: 2; color: #fff; display: flex; flex-direction: column; gap: 0.4rem; }
  .hero-eyebrow { font-size: 0.7rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
  .hero-course-title { font-size: 1.5rem; font-weight: 700; }
  .hero-progress-wrap { background: rgba(255,255,255,0.25); border-radius: 99px; height: 6px; width: 100%; max-width: 480px; margin-top: 0.5rem; }
  .hero-progress-fill { height: 100%; background: #fff; border-radius: 99px; }
  .hero-pct { position: absolute; bottom: 1.25rem; right: 1.25rem; z-index: 2; color: #fff; font-size: 0.8125rem; font-weight: 700; }

  /* ── Stats row ── */
  .ov-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .ov-stat-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .ov-stat-icon { width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
  .ov-stat-value { font-size: 1.0625rem; font-weight: 700; color: #111; }
  .ov-stat-label { font-size: 0.8125rem; color: #6B7280; }

  /* ── Module list ── */
  .modules-header { display: flex; align-items: baseline; justify-content: space-between; }
  .modules-title { font-size: 1.0625rem; font-weight: 700; color: #111; }
  .modules-sub { font-size: 0.8125rem; color: #9CA3AF; }
  .modules-empty {
    background: #fff; border: 1px dashed #E5E7EB; border-radius: 0.875rem;
    padding: 2.5rem 1.5rem; display: flex; flex-direction: column; align-items: center;
    gap: 0.375rem; text-align: center;
  }
  .modules-empty-title { font-size: 0.9375rem; font-weight: 700; color: #374151; }
  .modules-empty-sub { font-size: 0.8125rem; color: #9CA3AF; max-width: 360px; line-height: 1.55; }
  .module-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; overflow: hidden; }
  .module-card.current { border-color: #2563EB; box-shadow: 0 0 0 1px #2563EB; }
  .module-row { display: flex; align-items: center; gap: 0.875rem; padding: 1rem 1.25rem; cursor: pointer; user-select: none; }
  .module-num {
    width: 1.75rem; height: 1.75rem; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.8125rem; font-weight: 700; background: #F3F4F6; color: #9CA3AF;
  }
  .module-num.done { background: #ECFDF3; color: #22C55E; }
  .module-num.current { background: #2563EB; color: #fff; }
  .module-info { flex: 1; min-width: 0; }
  .module-title-row { display: flex; align-items: center; gap: 0.5rem; }
  .module-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .module-current-pill { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.08em; color: #2563EB; background: #EFF6FF; padding: 0.15rem 0.5rem; border-radius: 2rem; }
  .module-prog-bar { height: 4px; background: #E5E7EB; border-radius: 99px; margin-top: 0.5rem; }
  .module-prog-fill { height: 100%; border-radius: 99px; }
  .module-prog-fill.done { background: #22C55E; }
  .module-prog-fill.current { background: #2563EB; }
  .module-prog-fill.todo { background: #E5E7EB; }
  .module-count { font-size: 0.8125rem; color: #9CA3AF; flex-shrink: 0; white-space: nowrap; }
  .module-chevron { color: #9CA3AF; flex-shrink: 0; transition: transform 0.15s ease; }
  .module-chevron.open { transform: rotate(180deg); }
  .lessons-list { border-top: 1px solid #F3F4F6; padding: 0.5rem 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 0.125rem; }
  .lesson-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.625rem; border-radius: 0.625rem; font-size: 0.875rem; transition: background 0.12s; }
  .lesson-row.clickable { cursor: pointer; }
  .lesson-row.clickable:hover { background: #F9FAFB; }
  .lesson-row.locked { color: #C0C5CC; cursor: not-allowed; }
  .lesson-row.completed { color: #6B7280; }
  .lesson-row.current { color: #111; font-weight: 700; }
  .lesson-row.available { color: #374151; }
  .lesson-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .lesson-title { flex: 1; min-width: 0; }
  .lesson-up-next { font-size: 0.75rem; color: #2563EB; font-weight: 600; }
  .lesson-duration { font-size: 0.8125rem; color: #9CA3AF; flex-shrink: 0; }

  /* ── Continue bar — inline, not floating ── */
  .continue-bar {
    background: linear-gradient(135deg, #2492EB 0%, #1560A8 100%);
    border-radius: 1rem; padding: 1.25rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    color: #fff; box-shadow: 0 4px 20px rgba(36,146,235,0.3);
    /* no position:fixed — sits naturally at the bottom of .content */
  }
  .continue-text { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
  .continue-label { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.8; }
  .continue-title { font-size: 0.9375rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .continue-right { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
  .continue-pct { font-size: 0.875rem; font-weight: 700; opacity: 0.9; white-space: nowrap; }
  .continue-btn {
    display: flex; align-items: center; gap: 0.5rem; background: #fff; color: #2563EB; border: none;
    border-radius: 2rem; padding: 0.6rem 1.4rem; font-size: 0.875rem; font-weight: 700;
    cursor: pointer; white-space: nowrap;
  }
  .continue-btn:hover { opacity: 0.92; }

  /* ── Mobile tab bar ── */
  .mobile-tabbar { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: #fff; border-top: 1px solid #F3F4F6; z-index: 300; }
  .mobile-tabbar-inner { display: flex; height: 100%; }
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #9CA3AF; font-size: 0.65rem; font-weight: 600; border: none; background: none; padding: 0; }
  .tab-item.active { color: #2563EB; }
  .tab-item span { font-size: 0.65rem; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .ov-stats { grid-template-columns: 1fr; }
    .content { padding: 1.5rem 1.25rem 2rem; }
  }
  @media (max-width: 640px) {
    .sidebar { display: none; }
    .search-wrap { display: none; }
    .content { padding: 1.25rem 1rem 5rem; }
    .navbar { padding: 0 1rem; }
    .mobile-tabbar { display: block; }
    .course-hero { aspect-ratio: 16/9; }
    .hero-course-title { font-size: 1.125rem; }
    .continue-bar { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .continue-right { width: 100%; justify-content: space-between; }
    .continue-btn { flex: 1; justify-content: center; }
  }
`

const NAV_ITEMS = [
  { key: 'home',     label: 'Home',         Icon: Home     },
  { key: 'courses',  label: 'Courses',      Icon: BookOpen },
  { key: 'live',     label: 'Live Classes', Icon: Radio    },
  { key: 'settings', label: 'Settings',     Icon: Settings },
]

function lessonIcon(status: CourseProgressResponse['modules'][number]['lessons'][number]['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={18} color="#22C55E" fill="#ECFDF3" />
    case 'current':
      return (
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Play size={9} color="#fff" fill="#fff" />
        </div>
      )
    case 'locked':
      return <Lock size={15} color="#D1D5DB" />
    default:
      return <Play size={16} color="#9CA3AF" />
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuth()

  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentStatusResponse | null>(null)
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const courseData = await fetchCourse(slug as string)
        if (cancelled) return
        setCourse(courseData)

        if (isAuthenticated) {
          const enrollRes = await coursesAPI.getEnrollmentStatus(slug as string)
          if (cancelled) return
          if (enrollRes.success) {
            setEnrollment(enrollRes.data)
            if (enrollRes.data.enrolled) {
              const progRes = await coursesAPI.getCourseProgress(slug as string)
              if (cancelled) return
              if (progRes.success) {
                setProgress(progRes.data)
              } else {
                setProgress(buildMockProgress(courseData))
              }
            }
          }
        }
      } catch (e: unknown) {
        if (cancelled) return
        const err = e as Error
        setError(err.message === 'not_found' ? 'Course not found.' : 'Failed to load course.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug, isAuthenticated])

  if (loading) {
    return (
      <>
        <style>{PUBLIC_CSS}</style>
        <div className="page">
          <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>
          <div className="outer">
            <h1 className="outer-title">Course Overview</h1>
            <div className="card"><div className="state-screen">Loading course…</div></div>
          </div>
        </div>
      </>
    )
  }

  if (error || !course) {
    return (
      <>
        <style>{PUBLIC_CSS}</style>
        <div className="page">
          <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>
          <div className="outer">
            <h1 className="outer-title">Course Overview</h1>
            <div className="card"><div className="state-screen error">{error || 'Failed to load course.'}</div></div>
          </div>
        </div>
      </>
    )
  }

  if (isAuthenticated && enrollment?.enrolled) {
    return <EnrolledCourseOverview course={course} progress={progress} />
  }

  return <PublicCourseOverview course={course} />
}

// ─── Public sales page ─────────────────────────────────────────────────────────
function PublicCourseOverview({ course }: { course: CourseDetail }) {
  const navigate = useNavigate()

  const stats = [
    { icon: Clock,     value: course.total_duration_display || `${course.duration_weeks}w`, label: 'Duration' },
    { icon: BookOpen,  value: `${course.module_count} module${course.module_count !== 1 ? 's' : ''}`, label: 'Content' },
    { icon: BarChart2, value: capitalize(course.level), label: 'Level' },
    { icon: Award,     value: course.has_certificate ? 'Included' : 'None', label: 'Certificate' },
  ]

  const goToCheckout = () => {
    navigate(ROUTES.CHECKOUT, {
      state: {
        courseSlug: course.slug,
        priceNaira: course.price_naira,
        priceKobo: course.price_kobo,
        courseTitle: course.title,
        trainerName: course.trainer?.name,
      },
    })
  }

  return (
    <>
      <style>{PUBLIC_CSS}</style>
      <div className="page">
        <div className="logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>
        <div className="outer">
          <h1 className="outer-title">Course Overview</h1>
          <div className="card">
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
              <button className="enroll-btn" onClick={goToCheckout}>Pay to Enroll</button>
            </div>
          </div>
        </div>
        <p className="footer">Join 50,000+ learners building their project management careers</p>
      </div>
    </>
  )
}

// ─── Enrolled overview ─────────────────────────────────────────────────────────
function EnrolledCourseOverview({
  course,
  progress,
}: {
  course: CourseDetail
  progress: CourseProgressResponse | null
}) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('courses')
  const [profileOpen, setProfileOpen] = useState(false)
  const [expandedModule, setExpandedModule] = useState<string | null>(
    progress?.modules.find((m) => m.lessons.some((l) => l.status === 'current'))?.id || null,
  )

  if (!user) return null

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()
  const pct = progress?.progress_percentage ?? 0
  const lessonsCompleted = progress?.lessons_completed ?? 0
  const lessonsTotal =
    progress?.lessons_total ?? course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const timeSpent = progress ? formatTimeSpent(progress.time_spent_seconds) : '0m'

  const currentModule = progress?.modules.find((m) =>
    m.lessons.some((l) => l.status === 'current'),
  )
  const currentLesson = currentModule?.lessons.find((l) => l.status === 'current')

  const modules = progress?.modules || []
  const hasModules = modules.length > 0

  function handleNav(key: string) {
    setActiveNav(key)
    if (key === 'home') navigate(ROUTES.DASHBOARD)
    if (key === 'courses') navigate(ROUTES.COURSES)
  }

  async function handleLogout() {
    setProfileOpen(false)
    await logout()
    navigate(ROUTES.LOGIN)
  }

  function goToLesson(lessonId: string, locked: boolean) {
    if (locked || !course.slug) return
    navigate(RouteBuilder.courseLearn(course.slug, lessonId))
  }

  return (
    <>
      <style>{ENROLLED_CSS}</style>
      <div className="db-root">

        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-logo">
            <img src="/Logo.png" alt="The Global Project Leaders" />
          </div>
          <div className="navbar-right">
            <div className="search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input type="text" placeholder="Search anything" />
            </div>
            <div className="topbar-bell">
              <Bell size={20} />
              <div className="bell-dot" />
            </div>
            <div className="profile-menu-wrap">
              <button
                className="profile-trigger"
                onClick={() => setProfileOpen((o) => !o)}
                aria-haspopup="true"
                aria-expanded={profileOpen}
                aria-label="Open profile menu"
              >
                <div className="topbar-avatar">{initials}</div>
                <ChevronDown size={16} className={`profile-chevron${profileOpen ? ' open' : ''}`} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu">
                  <div className="profile-dropdown-header">
                    <div className="user-avatar">{initials}</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div className="profile-dropdown-name">{user.name || user.email}</div>
                      <div className="profile-dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <button
                    className="profile-dropdown-item"
                    onClick={() => { setProfileOpen(false); navigate(ROUTES.SETTINGS) }}
                  >
                    <UserIcon size={16} />
                    Profile settings
                  </button>
                  <button className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Body */}
        <div className="db-body">

          {/* Sidebar */}
          <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <div className="sidebar-top">
              <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            </div>
            <nav className="sidebar-nav">
              {NAV_ITEMS.map(({ key, label, Icon }) => (
                <div
                  key={key}
                  className={`nav-item${activeNav === key ? ' active' : ''}`}
                  onClick={() => handleNav(key)}
                >
                  <Icon size={18} />
                  <span className="nav-label">{label}</span>
                  {key === 'settings' && !collapsed && (
                    <span style={{ marginLeft: 'auto', opacity: 0.5 }}>
                      <ChevronDown size={14} />
                    </span>
                  )}
                </div>
              ))}
            </nav>
            <div className="sidebar-user">
              <div className="user-avatar">{initials}</div>
              <div className="user-text">
                <div className="user-name">{user.name || user.email}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="main">
            <div className="content">

              {/* Course hero */}
              <div className="course-hero">
                <div className="hero-top-row">
                  <button className="hero-back-btn" onClick={() => navigate(ROUTES.DASHBOARD)}>
                    <ChevronLeft />
                  </button>
                  <div className="hero-trainer">
                    <div className="hero-trainer-avatar">
                      {course.trainer.name.charAt(0).toUpperCase()}
                    </div>
                    {course.trainer.name}
                  </div>
                </div>
                <div className="hero-bottom">
                  <span className="hero-eyebrow">{course.category} · Enrolled</span>
                  <span className="hero-course-title">{course.title}</span>
                  <div className="hero-progress-wrap">
                    <div className="hero-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="hero-pct">{pct}% complete</span>
              </div>

              {/* Stats */}
              <div className="ov-stats">
                <div className="ov-stat-card">
                  <div className="ov-stat-icon" style={{ background: '#EFF6FF' }}>
                    <BookOpen size={18} color="#2563EB" />
                  </div>
                  <span className="ov-stat-value">{lessonsCompleted} of {lessonsTotal}</span>
                  <span className="ov-stat-label">Lessons done</span>
                </div>
                <div className="ov-stat-card">
                  <div className="ov-stat-icon" style={{ background: '#F5F3FF' }}>
                    <Clock size={18} color="#8B5CF6" />
                  </div>
                  <span className="ov-stat-value">{timeSpent}</span>
                  <span className="ov-stat-label">Time spent</span>
                </div>
              </div>

              {/* Modules */}
              <div>
                <div className="modules-header" style={{ marginBottom: '0.875rem' }}>
                  <span className="modules-title">Course Modules</span>
                  <span className="modules-sub">
                    {modules.length || course.module_count} modules · {lessonsTotal} lessons
                  </span>
                </div>

                {!hasModules ? (
                  <div className="modules-empty">
                    <BookOpen size={28} color="#D1D5DB" />
                    <span className="modules-empty-title">No modules added to this course yet</span>
                    <span className="modules-empty-sub">
                      This course doesn't have any modules or lessons on the backend yet — there's nothing to display until content is added.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {modules.map((mod, mi) => {
                      const doneCount = mod.lessons.filter((l) => l.status === 'completed').length
                      const total = mod.lessons.length
                      const hasCurrent = mod.lessons.some((l) => l.status === 'current')
                      const allDone = doneCount === total
                      const isExpanded = expandedModule === mod.id

                      return (
                        <div key={mod.id} className={`module-card${hasCurrent ? ' current' : ''}`}>
                          <div
                            className="module-row"
                            onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
                          >
                            <div
                              className={`module-num${allDone ? ' done' : ''}${hasCurrent ? ' current' : ''}`}
                            >
                              {allDone ? <CheckCircle size={16} /> : mi + 1}
                            </div>
                            <div className="module-info">
                              <div className="module-title-row">
                                <span className="module-title">{mod.title}</span>
                                {hasCurrent && (
                                  <span className="module-current-pill">CURRENT</span>
                                )}
                              </div>
                              <div className="module-prog-bar">
                                <div
                                  className={`module-prog-fill ${allDone ? 'done' : hasCurrent ? 'current' : 'todo'}`}
                                  style={{ width: total ? `${(doneCount / total) * 100}%` : '0%' }}
                                />
                              </div>
                            </div>
                            <span className="module-count">{doneCount}/{total}</span>
                            <ChevronDown
                              size={16}
                              className={`module-chevron${isExpanded ? ' open' : ''}`}
                            />
                          </div>

                          {isExpanded && (
                            <div className="lessons-list">
                              {mod.lessons.map((lesson) => {
                                const locked = lesson.status === 'locked'
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`lesson-row ${lesson.status}${locked ? '' : ' clickable'}`}
                                    onClick={() => goToLesson(lesson.id, locked)}
                                  >
                                    <span className="lesson-icon">{lessonIcon(lesson.status)}</span>
                                    <span className="lesson-title">
                                      {lesson.title}
                                      {lesson.status === 'current' && (
                                        <div className="lesson-up-next">Up next</div>
                                      )}
                                    </span>
                                    <span className="lesson-duration">{lesson.duration_display}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Continue bar — inline at bottom of content, not floating ── */}
              {currentLesson && (
                <div className="continue-bar">
                  <div className="continue-text">
                    <span className="continue-label">Continue where you left off</span>
                    <span className="continue-title">{currentLesson.title}</span>
                  </div>
                  <div className="continue-right">
                    <span className="continue-pct">{pct}% complete</span>
                    <button
                      className="continue-btn"
                      onClick={() => goToLesson(currentLesson.id, false)}
                    >
                      <Play size={14} fill="#2563EB" /> Resume
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>

        {/* Mobile tab bar */}
        <div className="mobile-tabbar">
          <div className="mobile-tabbar-inner">
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`tab-item${activeNav === key ? ' active' : ''}`}
                onClick={() => handleNav(key)}
              >
                <Icon size={20} />
                <span>{label === 'Live Classes' ? 'Live' : label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}