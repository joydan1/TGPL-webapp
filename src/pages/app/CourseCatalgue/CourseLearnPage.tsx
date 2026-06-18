import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Home, BookOpen, Radio, Settings, Search, Bell,
  ChevronDown, PanelLeftClose, PanelLeftOpen,
  Play, CheckCircle, Lock, LogOut, User as UserIcon,
  Volume2, VolumeX, Captions, Settings2, Maximize, SkipBack, SkipForward,
  FileText, FileSpreadsheet, Presentation, Download, Headphones,
  X, Coffee, ChevronRight,
} from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { coursesAPI } from '../../../services/api'
import type { LessonDetailResponse, LessonResource } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function resourceIcon(fileType: string) {
  const t = fileType.toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return <FileSpreadsheet size={20} color="#16A34A" />
  if (t.includes('ppt') || t.includes('slide')) return <Presentation size={20} color="#EA580C" />
  return <FileText size={20} color="#7C3AED" />
}

function resourceIconBg(fileType: string) {
  const t = fileType.toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return '#ECFDF3'
  if (t.includes('ppt') || t.includes('slide')) return '#FFF4ED'
  return '#F5F0FF'
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'courses', label: 'Courses', Icon: BookOpen },
  { key: 'live', label: 'Live Classes', Icon: Radio },
  { key: 'settings', label: 'Settings', Icon: Settings },
]

const QUALITY_OPTIONS = ['Auto', '720p', '480p', '240p']

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root { display: flex; flex-direction: column; min-height: 100vh; background: #F5F5F5; font-family: inherit; }

  /* Navbar */
  .navbar { height: 64px; background: #fff; border-bottom: 1px solid #F3F4F6; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; gap: 1rem; position: sticky; top: 0; z-index: 200; width: 100%; }
  .navbar-logo img { height: 2.25rem; display: block; }
  .navbar-right { display: flex; align-items: center; gap: 1rem; }
  .search-wrap { display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 2rem; padding: 0.45rem 1.1rem; width: 240px; }
  .search-wrap input { background: none; border: none; outline: none; font-size: 0.875rem; color: #111; width: 100%; }
  .search-wrap input::placeholder { color: #9CA3AF; }
  .topbar-bell { width: 36px; height: 36px; border-radius: 50%; background: #F9FAFB; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; position: relative; }
  .bell-dot { position: absolute; top: 6px; right: 6px; width: 7px; height: 7px; border-radius: 50%; background: #EF4444; border: 1.5px solid #fff; }

  .profile-menu-wrap { position: relative; }
  .profile-trigger { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; cursor: pointer; padding: 0; }
  .topbar-avatar { width: 36px; height: 36px; border-radius: 50%; background: #2563EB; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.875rem; border: 2px solid #E5E7EB; flex-shrink: 0; overflow: hidden; }
  .profile-chevron { color: #9CA3AF; transition: transform 0.15s ease; }
  .profile-chevron.open { transform: rotate(180deg); }
  .profile-dropdown { position: absolute; top: calc(100% + 0.625rem); right: 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 220px; padding: 0.5rem; z-index: 300; }
  .profile-dropdown-header { display: flex; align-items: center; gap: 0.625rem; padding: 0.625rem 0.625rem 0.75rem; border-bottom: 1px solid #F3F4F6; margin-bottom: 0.375rem; }
  .profile-dropdown-name { font-size: 0.8125rem; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-email { font-size: 0.72rem; color: #9CA3AF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .profile-dropdown-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.625rem; border-radius: 0.6rem; border: none; background: none; font-size: 0.8125rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; transition: background 0.15s; }
  .profile-dropdown-item:hover { background: #F9FAFB; }
  .profile-dropdown-item.danger { color: #EF4444; }
  .profile-dropdown-item.danger:hover { background: #FEF2F2; }

  /* Layout */
  .db-body { display: flex; flex: 1; }
  .sidebar { width: 220px; min-width: 220px; background: #fff; border-right: 1px solid #F3F4F6; display: flex; flex-direction: column; position: sticky; top: 64px; height: calc(100vh - 64px); flex-shrink: 0; transition: width 0.22s cubic-bezier(.4,0,.2,1), min-width 0.22s; overflow: hidden; }
  .sidebar.collapsed { width: 64px; min-width: 64px; }
  .sidebar-top { display: flex; justify-content: flex-end; padding: 0.75rem 0.75rem 0.25rem; }
  .collapse-btn { width: 32px; height: 32px; border-radius: 0.5rem; background: #fff; border: 1px solid #E5E7EB; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #6B7280; box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: background 0.15s; flex-shrink: 0; }
  .collapse-btn:hover { background: #F3F4F6; }
  .sidebar-nav { flex: 1; padding: 0.5rem 0.625rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; overflow: hidden; }
  .nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.6rem; cursor: pointer; color: #6B7280; font-size: 0.875rem; font-weight: 500; white-space: nowrap; transition: background 0.15s, color 0.15s; }
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

  .main { flex: 1; min-width: 0; overflow-y: auto; }
  .content { padding: 2rem 2.5rem 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; max-width: 1100px; }

  .state-screen { display: flex; align-items: center; justify-content: center; min-height: 320px; color: #9CA3AF; font-size: 0.9375rem; }
  .state-screen.error { color: #EF4444; }

  /* Video player */
  .player-card { width: 100%; background: #111827; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.12); }
  .video-wrap { position: relative; width: 100%; aspect-ratio: 16/7.2; overflow: hidden; background: #000; }
  .video-wrap img { width: 100%; height: 100%; object-fit: cover; opacity: 0.75; display: block; }
  .video-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.65) 100%); }
  .video-back { position: absolute; top: 1rem; left: 1rem; z-index: 10; width: 2rem; height: 2rem; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; }
  .video-back:hover { background: rgba(255,255,255,0.28); }
  .video-title-overlay { position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); text-align: center; color: #fff; z-index: 10; white-space: nowrap; }
  .vt-title { font-size: 0.9375rem; font-weight: 700; }
  .vt-sub { font-size: 0.75rem; font-weight: 500; opacity: 0.65; margin-top: 0.125rem; }
  .center-controls { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 1.5rem; z-index: 10; }
  .play-main { width: 3rem; height: 3rem; border-radius: 50%; background: rgba(0,0,0,0.45); color: #fff; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: transform 0.15s, background 0.15s; }
  .play-main:hover { transform: scale(1.06); background: rgba(0,0,0,0.6); }
  .ctrl-btn { background: none; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0.85; }
  .ctrl-btn:hover { opacity: 1; }
  .video-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; z-index: 10; }
  .progress-wrap { width: 100%; height: 3px; background: rgba(255,255,255,0.25); border-radius: 2px; margin-bottom: 0.625rem; cursor: pointer; }
  .progress-fill { height: 100%; background: #2563EB; border-radius: 2px; position: relative; }
  .progress-thumb { position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
  .controls-row { display: flex; align-items: center; justify-content: space-between; }
  .time { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-variant-numeric: tabular-nums; }
  .controls-right { display: flex; align-items: center; gap: 0.875rem; position: relative; }

  .popover { position: absolute; bottom: calc(100% + 0.625rem); right: 0; background: #1F2937; border: 1px solid #374151; border-radius: 0.75rem; padding: 0.5rem; min-width: 140px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); z-index: 30; }
  .popover-item { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; font-size: 0.8125rem; color: #D1D5DB; cursor: pointer; white-space: nowrap; }
  .popover-item:hover { background: #2D3748; }
  .popover-item.active { color: #fff; font-weight: 600; }
  .quality-trigger { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; }

  /* Info / breadcrumb */
  .lesson-meta { padding: 1.25rem 0 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .crumb { font-size: 0.8125rem; color: #9CA3AF; }
  .crumb a, .crumb span.crumb-current { color: inherit; }
  .crumb .crumb-link { color: #2563EB; font-weight: 600; cursor: pointer; }
  .lesson-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .lesson-title { font-size: 1.375rem; font-weight: 700; color: #111; }
  .lesson-sub { font-size: 0.875rem; color: #6B7280; }
  .mark-done-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 2rem; border: 1.5px solid #2563EB; background: #fff; color: #2563EB; font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s; }
  .mark-done-btn:hover { background: #EFF6FF; }
  .mark-done-btn.done { border-color: #22C55E; color: #22C55E; background: #ECFDF3; }
  .mark-done-btn:disabled { opacity: 0.6; cursor: default; }

  /* Tabs */
  .tabs-row { display: flex; gap: 2rem; border-bottom: 1px solid #E5E7EB; }
  .tab-btn { padding: 0.875rem 0; background: none; border: none; border-bottom: 2px solid transparent; font-size: 0.9375rem; font-weight: 600; color: #9CA3AF; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .tab-btn.active { color: #2563EB; border-bottom-color: #2563EB; }
  .tab-btn:disabled { cursor: not-allowed; color: #D1D5DB; }
  .tab-btn .tab-lock-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; color: #D1D5DB; margin-left: 0.375rem; }

  .tab-panel { display: flex; flex-direction: column; gap: 1rem; }

  /* Notes */
  .notes-textarea { width: 100%; min-height: 180px; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem; font-size: 0.9375rem; color: #111; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; background: #fff; }
  .notes-textarea:focus { border-color: #2563EB; }
  .notes-textarea::placeholder { color: #9CA3AF; }
  .notes-hint-row { display: flex; align-items: center; justify-content: space-between; }
  .notes-hint { font-size: 0.8125rem; color: #9CA3AF; }
  .notes-save-status { font-size: 0.8125rem; color: #22C55E; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }

  /* Resources */
  .resources-select-all { display: flex; align-items: center; gap: 0.625rem; font-size: 0.875rem; color: #374151; font-weight: 500; cursor: pointer; }
  .resources-select-all input { width: 16px; height: 16px; accent-color: #2563EB; cursor: pointer; }
  .resources-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .resource-card { display: flex; align-items: flex-start; gap: 0.875rem; padding: 1rem; border: 1px solid #E5E7EB; border-radius: 0.875rem; background: #fff; }
  .resource-card input { margin-top: 0.25rem; width: 16px; height: 16px; accent-color: #2563EB; cursor: pointer; flex-shrink: 0; }
  .resource-icon-wrap { width: 2.5rem; height: 2.5rem; border-radius: 0.625rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .resource-info { flex: 1; min-width: 0; }
  .resource-title { font-size: 0.9375rem; font-weight: 700; color: #111; margin-bottom: 0.25rem; }
  .resource-meta { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.03em; color: #9CA3AF; text-transform: uppercase; }
  .resource-meta-light { font-size: 0.8125rem; color: #9CA3AF; font-weight: 400; text-transform: none; }
  .resource-module { font-size: 0.78rem; color: #B0B5BD; margin-top: 0.25rem; }
  .resource-download { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #EFF6FF; border: none; color: #2563EB; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .resource-download:hover { background: #DBEAFE; }
  .resources-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  .resources-footer-text { font-size: 0.9375rem; color: #111; font-weight: 600; }
  .resources-footer-sub { font-size: 0.8125rem; color: #EA580C; font-weight: 600; }
  .download-all-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.5rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .download-all-btn:hover { opacity: 0.9; }
  .resources-empty { padding: 2.5rem 1rem; text-align: center; color: #9CA3AF; font-size: 0.9375rem; }

  /* Discussion (locked) */
  .discussion-locked { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem 1rem; color: #9CA3AF; text-align: center; }
  .discussion-locked-title { font-size: 0.9375rem; font-weight: 700; color: #6B7280; }
  .discussion-locked-sub { font-size: 0.8125rem; max-width: 320px; line-height: 1.6; }

  /* Prev / Up next + Ask for help row */
  .nav-row { display: flex; align-items: stretch; gap: 1rem; flex-wrap: wrap; }
  .nav-card { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 1.25rem; border-radius: 0.875rem; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .nav-card:hover { border-color: #D1D5DB; }
  .nav-card.disabled { opacity: 0.45; cursor: not-allowed; }
  .nav-card.up-next { border-color: #BFDBFE; background: #EFF6FF; }
  .nav-card.up-next:hover { background: #DBEAFE; }
  .nav-card-label { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: #9CA3AF; text-transform: uppercase; }
  .nav-card.up-next .nav-card-label { color: #2563EB; justify-content: flex-end; }
  .nav-card-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .nav-card.up-next .nav-card-title { text-align: right; }
  .nav-card-sub { font-size: 0.8125rem; color: #9CA3AF; }
  .nav-card.up-next .nav-card-sub { text-align: right; }

  .ask-help-wrap { position: relative; flex-shrink: 0; align-self: center; }
  .ask-help-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; height: 100%; }
  .ask-help-btn:hover { opacity: 0.9; }
  .ask-help-popover { position: absolute; bottom: calc(100% + 0.625rem); right: 0; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.875rem; box-shadow: 0 8px 24px rgba(0,0,0,0.12); width: 240px; padding: 0.5rem; z-index: 50; }
  .ask-help-item { display: flex; align-items: center; gap: 0.625rem; width: 100%; padding: 0.7rem 0.75rem; border-radius: 0.6rem; border: none; background: none; font-size: 0.8438rem; font-weight: 600; color: #374151; cursor: pointer; text-align: left; transition: background 0.15s; }
  .ask-help-item:hover { background: #F9FAFB; }
  .ask-help-item svg { flex-shrink: 0; color: #2563EB; }

  /* Lesson complete modal */
  .modal-backdrop { position: fixed; inset: 0; background: rgba(17,24,39,0.55); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 1.5rem; }
  .modal-card { width: 100%; max-width: 460px; background: #fff; border-radius: 1.25rem; padding: 2rem 1.75rem 1.75rem; display: flex; flex-direction: column; align-items: center; gap: 1.25rem; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
  .modal-close { position: absolute; top: 1rem; right: 1rem; width: 1.75rem; height: 1.75rem; border-radius: 50%; border: none; background: #F3F4F6; color: #6B7280; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .modal-close:hover { background: #E5E7EB; }
  .modal-check { width: 4.5rem; height: 4.5rem; border-radius: 50%; background: #22C55E; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 12px rgba(34,197,94,0.12); }
  .modal-title { font-size: 1.25rem; font-weight: 700; color: #111; }
  .modal-sub { font-size: 0.9375rem; color: #6B7280; margin-top: -0.5rem; }
  .modal-progress-card { width: 100%; background: #F9FAFB; border-radius: 0.875rem; padding: 1rem 1.125rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .modal-progress-row { display: flex; align-items: center; justify-content: space-between; font-size: 0.875rem; }
  .modal-progress-row span:first-child { color: #6B7280; }
  .modal-progress-row span:last-child { color: #2563EB; font-weight: 700; }
  .modal-progress-bar { height: 6px; background: #E5E7EB; border-radius: 99px; }
  .modal-progress-fill { height: 100%; background: #2563EB; border-radius: 99px; transition: width 0.4s ease; }
  .modal-progress-footer { display: flex; align-items: center; justify-content: space-between; font-size: 0.8125rem; }
  .modal-progress-footer .before { color: #9CA3AF; }
  .modal-progress-footer .after { color: #22C55E; font-weight: 700; }

  .modal-upnext-card { width: 100%; border: 1px solid #BFDBFE; background: #EFF6FF; border-radius: 0.875rem; padding: 0.875rem 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .modal-upnext-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em; color: #2563EB; text-transform: uppercase; }
  .modal-upnext-row { display: flex; align-items: center; gap: 0.75rem; }
  .modal-upnext-thumb { width: 56px; height: 42px; border-radius: 0.5rem; background: linear-gradient(135deg,#c8c8c8,#a0a0a0); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; }
  .modal-upnext-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .modal-upnext-dur { font-size: 0.8125rem; color: #9CA3AF; }
  .modal-countdown { text-align: center; font-size: 0.8125rem; color: #6B7280; }
  .modal-countdown b { color: #111; }
  .modal-actions { display: flex; align-items: center; justify-content: center; gap: 1rem; }
  .modal-cancel { background: none; border: none; color: #6B7280; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .modal-start-now { display: flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.25rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.875rem; font-weight: 700; cursor: pointer; }
  .modal-break-link { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8438rem; color: #6B7280; text-decoration: underline; cursor: pointer; background: none; border: none; }

  .mobile-tabbar { display: none; position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: #fff; border-top: 1px solid #F3F4F6; z-index: 300; }
  .mobile-tabbar-inner { display: flex; height: 100%; }
  .tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #9CA3AF; font-size: 0.65rem; font-weight: 600; border: none; background: none; padding: 0; }
  .tab-item.active { color: #2563EB; }

  @media (max-width: 900px) {
    .content { padding: 1.5rem 1.25rem 2rem; }
    .resources-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .sidebar { display: none; }
    .search-wrap { display: none; }
    .content { padding: 1.25rem 1rem 5rem; }
    .navbar { padding: 0 1rem; }
    .mobile-tabbar { display: block; }
    .video-wrap { aspect-ratio: 16/9; }
    .video-title-overlay { display: none; }
    .nav-row { flex-direction: column; }
    .ask-help-wrap { align-self: stretch; }
    .ask-help-btn { width: 100%; justify-content: center; }
  }
`

// ─── Lesson-complete modal state ───────────────────────────────────────────────
interface CompleteInfo {
  before: number
  after: number
  lessonsCompleted: number
  lessonsTotal: number
  nextLesson: { id: string; title: string; duration_display: string } | null
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CourseLearnPage() {
  const navigate = useNavigate()
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const { user, logout } = useAuth()

  const [lesson, setLesson] = useState<LessonDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('courses')
  const [profileOpen, setProfileOpen] = useState(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [quality, setQuality] = useState('Auto')
  const [ccOpen, setCcOpen] = useState(false)
  const [ccOn, setCcOn] = useState(false)

  const [activeTab, setActiveTab] = useState<'notes' | 'resources' | 'discussion'>('notes')
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesLoadedRef = useRef(false)

  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())

  const [askHelpOpen, setAskHelpOpen] = useState(false)

  const [marking, setMarking] = useState(false)
  const [completeInfo, setCompleteInfo] = useState<CompleteInfo | null>(null)
  const [countdown, setCountdown] = useState(5)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load lesson ──
  useEffect(() => {
    if (!slug || !lessonId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      notesLoadedRef.current = false
      const res = await coursesAPI.getLesson(slug as string, lessonId as string)
      if (cancelled) return
      if (res.success) {
        setLesson(res.data)
        setNotes(res.data.notes ?? '')
        notesLoadedRef.current = true
      } else {
        setError(res.statusCode === 404 ? 'Lesson not found.' : res.error)
      }
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [slug, lessonId])

  // ── Reset transient player/tab state on lesson change ──
  useEffect(() => {
    setIsPlaying(false)
    setProgress(0)
    setActiveTab('notes')
    setSelectedResources(new Set())
    setAskHelpOpen(false)
  }, [lessonId])

  // ── Debounced notes autosave ──
  useEffect(() => {
    if (!notesLoadedRef.current || !slug || !lessonId) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    setJustSaved(false)
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true)
      const res = await coursesAPI.saveLessonNotes(slug, lessonId, notes)
      setSavingNotes(false)
      if (res.success) {
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2000)
      }
    }, 800)
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  // ── Auto-advance countdown when complete modal is showing ──
  useEffect(() => {
    if (!completeInfo?.nextLesson) return
    setCountdown(5)
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          goToNext()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeInfo])

  if (!user) return null
  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase()

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

  function goToLesson(id: string) {
    if (!slug) return
    setCompleteInfo(null)
    navigate(RouteBuilder.courseLearn(slug, id))
  }

  function goToNext() {
    if (lesson?.next_lesson) goToLesson(lesson.next_lesson.id)
    else setCompleteInfo(null)
  }

  async function handleMarkDone() {
    if (!slug || !lessonId || lesson?.status === 'completed') return
    setMarking(true)
    const res = await coursesAPI.completeLesson(slug, lessonId)
    setMarking(false)
    if (res.success) {
      setLesson((prev) => (prev ? { ...prev, status: 'completed' } : prev))
      setCompleteInfo({
        before: res.data.course_progress_percentage_before,
        after: res.data.course_progress_percentage_after,
        lessonsCompleted: res.data.lessons_completed,
        lessonsTotal: res.data.lessons_total,
        nextLesson: res.data.next_lesson
          ? { id: res.data.next_lesson.id, title: res.data.next_lesson.title, duration_display: res.data.next_lesson.duration_display }
          : null,
      })
    }
  }

  function toggleResource(id: string) {
    setSelectedResources((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(resources: LessonResource[]) {
    setSelectedResources((prev) =>
      prev.size === resources.length ? new Set() : new Set(resources.map((r) => r.id)),
    )
  }

  function downloadResource(r: LessonResource) {
    window.open(r.file_url, '_blank')
  }

  function downloadAll(resources: LessonResource[]) {
    resources.forEach((r) => window.open(r.file_url, '_blank'))
  }

  const totalSizeLabel = lesson?.resources?.length
    ? `${lesson.resources.length} file${lesson.resources.length !== 1 ? 's' : ''}`
    : null

  return (
    <>
      <style>{CSS}</style>
      <div className="db-root">
        {/* Navbar */}
        <nav className="navbar">
          <div className="navbar-logo"><img src="/Logo.png" alt="The Global Project Leaders" /></div>
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
                  <button className="profile-dropdown-item" onClick={() => { setProfileOpen(false); navigate(ROUTES.SETTINGS) }}>
                    <UserIcon size={16} />Profile settings
                  </button>
                  <button className="profile-dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} />Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

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
                <div key={key} className={`nav-item${activeNav === key ? ' active' : ''}`} onClick={() => handleNav(key)}>
                  <Icon size={18} />
                  <span className="nav-label">{label}</span>
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
              {loading && <div className="state-screen">Loading lesson…</div>}
              {error && !loading && <div className="state-screen error">{error}</div>}

              {!loading && !error && lesson && (
                <>
                  {/* Video player */}
                  <div className="player-card">
                    <div className="video-wrap">
                      <img src="/imagee2.png" alt={lesson.title} />
                      <div className="video-overlay" />

                      <button className="video-back" onClick={() => navigate(RouteBuilder.course(slug as string))}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="15,18 9,12 15,6" />
                        </svg>
                      </button>

                      <div className="video-title-overlay">
                        <div className="vt-title">{lesson.title}</div>
                        <div className="vt-sub">{lesson.module.title} · {lesson.course.title}</div>
                      </div>

                      <div className="center-controls">
                        <button className="ctrl-btn" onClick={() => setProgress((p) => Math.max(0, p - 5))}>
                          <SkipBack size={22} />
                        </button>
                        <button className="play-main" onClick={() => setIsPlaying((p) => !p)}>
                          {isPlaying
                            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                            : <Play size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
                        </button>
                        <button className="ctrl-btn" onClick={() => setProgress((p) => Math.min(100, p + 5))}>
                          <SkipForward size={22} />
                        </button>
                      </div>

                      <div className="video-controls">
                        <div
                          className="progress-wrap"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setProgress(Math.round(((e.clientX - rect.left) / rect.width) * 100))
                          }}
                        >
                          <div className="progress-fill" style={{ width: `${progress}%` }}>
                            <div className="progress-thumb" />
                          </div>
                        </div>
                        <div className="controls-row">
                          <span className="time">
                            {fmtTime((progress / 100) * lesson.duration_seconds)} / {lesson.duration_display}
                          </span>
                          <div className="controls-right">
                            <button className="ctrl-btn" onClick={() => setMuted((m) => !m)}>
                              {!muted ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            </button>

                            <button className="ctrl-btn" onClick={() => { setCcOpen((o) => !o); setQualityOpen(false) }}>
                              <Captions size={16} />
                            </button>
                            {ccOpen && (
                              <div className="popover" style={{ right: 64 }}>
                                <div className={`popover-item${!ccOn ? ' active' : ''}`} onClick={() => { setCcOn(false); setCcOpen(false) }}>Off</div>
                                <div className={`popover-item${ccOn ? ' active' : ''}`} onClick={() => { setCcOn(true); setCcOpen(false) }}>English</div>
                              </div>
                            )}

                            <button className="ctrl-btn quality-trigger" onClick={() => { setQualityOpen((o) => !o); setCcOpen(false) }}>
                              <Settings2 size={14} />{quality}
                            </button>
                            {qualityOpen && (
                              <div className="popover">
                                {QUALITY_OPTIONS.map((q) => (
                                  <div key={q} className={`popover-item${quality === q ? ' active' : ''}`} onClick={() => { setQuality(q); setQualityOpen(false) }}>
                                    {q}
                                  </div>
                                ))}
                              </div>
                            )}

                            <button className="ctrl-btn">
                              <Maximize size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breadcrumb + title */}
                  <div className="lesson-meta">
                    <div className="crumb">
                      <span className="crumb-link" onClick={() => navigate(RouteBuilder.course(slug as string))}>
                        {lesson.course.title}
                      </span>
                      {' › '}
                      <span className="crumb-current">{lesson.module.title}</span>
                    </div>
                    <div className="lesson-title-row">
                      <div>
                        <div className="lesson-title">{lesson.title}</div>
                        <div className="lesson-sub">{lesson.module.title} — {lesson.duration_display}</div>
                      </div>
                      <button
                        className={`mark-done-btn${lesson.status === 'completed' ? ' done' : ''}`}
                        onClick={handleMarkDone}
                        disabled={marking || lesson.status === 'completed'}
                      >
                        <CheckCircle size={16} />
                        {lesson.status === 'completed' ? 'Completed' : marking ? 'Marking…' : 'Mark done'}
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div>
                    <div className="tabs-row">
                      <button className={`tab-btn${activeTab === 'notes' ? ' active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
                      <button className={`tab-btn${activeTab === 'resources' ? ' active' : ''}`} onClick={() => setActiveTab('resources')}>Resources</button>
                      <button className="tab-btn" disabled>
                        Discussion <span className="tab-lock-label">LIVE CLASSES ONLY</span>
                      </button>
                    </div>

                    <div style={{ paddingTop: '1.25rem' }}>
                      {activeTab === 'notes' && (
                        <div className="tab-panel">
                          <textarea
                            className="notes-textarea"
                            placeholder="Take notes while you watch — they're saved automatically."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                          <div className="notes-hint-row">
                            <span className="notes-hint">Notes are saved per lesson and available in this same section even after lesson completion.</span>
                            {(savingNotes || justSaved) && (
                              <span className="notes-save-status">
                                {savingNotes ? 'Saving…' : <><CheckCircle size={14} />Saved</>}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'resources' && (
                        <div className="tab-panel">
                          {!lesson.resources || lesson.resources.length === 0 ? (
                            <div className="resources-empty">No resources attached to this lesson yet.</div>
                          ) : (
                            <>
                              <label className="resources-select-all">
                                <input
                                  type="checkbox"
                                  checked={selectedResources.size === lesson.resources.length}
                                  onChange={() => toggleSelectAll(lesson.resources)}
                                />
                                Select all
                              </label>

                              <div className="resources-grid">
                                {lesson.resources.map((r) => (
                                  <div className="resource-card" key={r.id}>
                                    <input
                                      type="checkbox"
                                      checked={selectedResources.has(r.id)}
                                      onChange={() => toggleResource(r.id)}
                                    />
                                    <div className="resource-icon-wrap" style={{ background: resourceIconBg(r.file_type) }}>
                                      {resourceIcon(r.file_type)}
                                    </div>
                                    <div className="resource-info">
                                      <div className="resource-title">{r.title}</div>
                                      <div className="resource-meta">
                                        {r.file_type}
                                        <span className="resource-meta-light"> · {new Date(r.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                      </div>
                                      <div className="resource-meta-light" style={{ marginTop: 2 }}>{r.size_display}</div>
                                      <div className="resource-module">{r.module_title}</div>
                                    </div>
                                    <button className="resource-download" onClick={() => downloadResource(r)} aria-label={`Download ${r.title}`}>
                                      <Download size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              <div className="resources-footer">
                                <div>
                                  <div className="resources-footer-text">{totalSizeLabel}</div>
                                </div>
                                <button className="download-all-btn" onClick={() => downloadAll(lesson.resources)}>
                                  <Download size={16} />Download all
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {activeTab === 'discussion' && (
                        <div className="discussion-locked">
                          <Lock size={28} color="#D1D5DB" />
                          <div className="discussion-locked-title">Discussion is available in Live Classes</div>
                          <div className="discussion-locked-sub">Join a live session to ask questions and discuss this topic with your trainer and peers in real time.</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prev / Up next + Ask for help */}
                  <div className="nav-row">
                    <div
                      className={`nav-card${!lesson.previous_lesson ? ' disabled' : ''}`}
                      onClick={() => lesson.previous_lesson && goToLesson(lesson.previous_lesson.id)}
                    >
                      <span className="nav-card-label">‹ Previous</span>
                      <span className="nav-card-title">{lesson.previous_lesson?.title ?? 'No previous lesson'}</span>
                      {lesson.previous_lesson && <span className="nav-card-sub">{lesson.previous_lesson.duration_display}</span>}
                    </div>

                    <div
                      className={`nav-card up-next${!lesson.next_lesson ? ' disabled' : ''}`}
                      onClick={() => lesson.next_lesson && goToLesson(lesson.next_lesson.id)}
                    >
                      <span className="nav-card-label">Up next <ChevronRight size={12} /></span>
                      <span className="nav-card-title">{lesson.next_lesson?.title ?? 'No more lessons'}</span>
                      {lesson.next_lesson && <span className="nav-card-sub">{lesson.next_lesson.duration_display}</span>}
                    </div>

                    <div className="ask-help-wrap">
                      <button className="ask-help-btn" onClick={() => setAskHelpOpen((o) => !o)}>
                        <Headphones size={16} />Ask for help
                      </button>
                      {askHelpOpen && (
                        <div className="ask-help-popover">
                          <button className="ask-help-item" onClick={() => { setAskHelpOpen(false); navigate(ROUTES.TUTOR_BOOKING) }}>
                            <UserIcon size={16} />Book a session
                          </button>
                          <button className="ask-help-item" onClick={() => setAskHelpOpen(false)}>
                            <Headphones size={16} />Ask in community forum
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {/* Mobile tab bar */}
        <div className="mobile-tabbar">
          <div className="mobile-tabbar-inner">
            {NAV_ITEMS.map(({ key, label, Icon }) => (
              <button key={key} className={`tab-item${activeNav === key ? ' active' : ''}`} onClick={() => handleNav(key)}>
                <Icon size={20} />
                <span>{label === 'Live Classes' ? 'Live' : label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson complete modal */}
      {completeInfo && (
        <div className="modal-backdrop" onClick={() => setCompleteInfo(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCompleteInfo(null)} aria-label="Close">
              <X size={16} />
            </button>

            <div className="modal-check">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20,6 9,17 4,12" /></svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="modal-title">Lesson complete!</div>
              <div className="modal-sub">{lesson?.title}</div>
            </div>

            <div className="modal-progress-card">
              <div className="modal-progress-row">
                <span>Course progress</span>
                <span>{completeInfo.lessonsCompleted} of {completeInfo.lessonsTotal} lessons</span>
              </div>
              <div className="modal-progress-bar">
                <div className="modal-progress-fill" style={{ width: `${completeInfo.after}%` }} />
              </div>
              <div className="modal-progress-footer">
                <span className="before">{completeInfo.before}% before</span>
                <span className="after">{completeInfo.after}% complete</span>
              </div>
            </div>

            {completeInfo.nextLesson && (
              <>
                <div className="modal-upnext-card">
                  <span className="modal-upnext-label">Up next</span>
                  <div className="modal-upnext-row">
                    <div className="modal-upnext-thumb"><Play size={16} fill="#fff" /></div>
                    <div style={{ flex: 1 }}>
                      <div className="modal-upnext-title">{completeInfo.nextLesson.title}</div>
                      <div className="modal-upnext-dur">{completeInfo.nextLesson.duration_display}</div>
                    </div>
                  </div>
                </div>

                <div className="modal-countdown">Starting in <b>{countdown}s</b></div>

                <div className="modal-actions">
                  <button className="modal-cancel" onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); setCompleteInfo(null) }}>Cancel</button>
                  <button className="modal-start-now" onClick={goToNext}>Start now <ChevronRight size={15} /></button>
                </div>
              </>
            )}

            <button className="modal-break-link" onClick={() => navigate(ROUTES.DASHBOARD)}>
              <Coffee size={14} />Take a break — go to dashboard
            </button>
          </div>
        </div>
      )}
    </>
  )
}