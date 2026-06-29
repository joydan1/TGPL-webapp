import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Play, Pause, CheckCircle, Lock,
  Volume2, VolumeX, Captions, Settings2, Maximize, SkipBack, SkipForward,
  FileText, FileSpreadsheet, Presentation, Download, Headphones,
  X, Coffee, ChevronRight,
} from 'lucide-react'
import { ROUTES, RouteBuilder } from '../../../constants/routes'
import { coursesAPI } from '../../../services/api'
import type { LessonDetailResponse, LessonResource } from '../../../services/api'
import { useAuth } from '../../../hooks/useAuth'
import AppShell, { SHELL_CSS } from '../../../components/layout/AppShell'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function resourceIcon(fileType: string) {
  const t = (fileType || '').toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return <FileSpreadsheet size={20} color="#16A34A" />
  if (t.includes('ppt') || t.includes('slide')) return <Presentation size={20} color="#EA580C" />
  return <FileText size={20} color="#7C3AED" />
}

function resourceIconBg(fileType: string) {
  const t = (fileType || '').toLowerCase()
  if (t.includes('xls') || t.includes('sheet')) return '#ECFDF3'
  if (t.includes('ppt') || t.includes('slide')) return '#FFF4ED'
  return '#F5F0FF'
}

const QUALITY_OPTIONS = [
  { label: 'Auto', sub: 'Adjusts automatically', kbps: '—'          },
  { label: '720p', sub: 'High quality',           kbps: '~2500 kbps' },
  { label: '480p', sub: 'Standard quality',       kbps: '~1000 kbps' },
  { label: '240p', sub: 'Low data usage',         kbps: '~300 kbps'  },
]

// ─── CSS ──────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  .content { padding: 2rem 2.5rem 2.5rem; display: flex; flex-direction: column; gap: 1.5rem; width: 100%; }

  .state-screen { display: flex; align-items: center; justify-content: center; min-height: 320px; color: #9CA3AF; font-size: 0.9375rem; }
  .state-screen.error { color: #EF4444; }

  .player-card { width: 100%; background: #111827; border-radius: 1.25rem; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.12); }
  .video-wrap { position: relative; width: 100%; aspect-ratio: 16/7.2; overflow: hidden; background: #000; cursor: pointer; }
  .video-wrap video { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; }
  .video-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, transparent 55%, rgba(0,0,0,0.65) 100%); pointer-events: none; }
  .video-back { position: absolute; top: 1rem; left: 1rem; z-index: 10; width: 2rem; height: 2rem; border-radius: 50%; background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; }
  .video-back:hover { background: rgba(255,255,255,0.28); }
  .video-title-overlay { position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); text-align: center; color: #fff; z-index: 10; white-space: nowrap; pointer-events: none; }
  .vt-title { font-size: 0.9375rem; font-weight: 700; }
  .vt-sub { font-size: 0.75rem; font-weight: 500; opacity: 0.65; margin-top: 0.125rem; }
  .center-controls { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; gap: 1.5rem; z-index: 10; }
  .play-main { width: 3rem; height: 3rem; border-radius: 50%; background: rgba(0,0,0,0.45); color: #fff; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: transform 0.15s, background 0.15s; }
  .play-main:hover { transform: scale(1.06); background: rgba(0,0,0,0.6); }
  .ctrl-btn { background: none; border: none; cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0.85; }
  .ctrl-btn:hover { opacity: 1; }
  .video-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; z-index: 10; }
  .progress-wrap { width: 100%; height: 4px; background: rgba(255,255,255,0.25); border-radius: 2px; margin-bottom: 0.625rem; cursor: pointer; transition: height 0.1s; }
  .progress-wrap:hover { height: 6px; }
  .progress-fill { height: 100%; background: #2563EB; border-radius: 2px; position: relative; pointer-events: none; }
  .progress-thumb { position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 4px rgba(0,0,0,0.3); }
  .controls-row { display: flex; align-items: center; justify-content: space-between; }
  .time { font-size: 0.75rem; color: rgba(255,255,255,0.8); font-variant-numeric: tabular-nums; }
  .controls-right { display: flex; align-items: center; gap: 0.875rem; position: relative; }

  .buffering { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 15; pointer-events: none; }
  .buffering svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .no-video { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.625rem; color: rgba(255,255,255,0.7); font-size: 0.875rem; pointer-events: none; }
  .no-video-thumb { position: absolute; inset: 0; object-fit: cover; width: 100%; height: 100%; opacity: 0.35; display: block; }
  .no-video-label { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .no-video-icon { width: 3rem; height: 3rem; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; }

  /* ── CC popover ── */
  .popover { position: absolute; bottom: calc(100% + 0.625rem); left: 50%; transform: translateX(-50%); background: #1F2937; border: 1px solid #374151; border-radius: 0.75rem; padding: 0.5rem; min-width: 140px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); z-index: 30; }
  .popover-item { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.5rem 0.625rem; border-radius: 0.5rem; font-size: 0.8125rem; color: #D1D5DB; cursor: pointer; white-space: nowrap; }
  .popover-item:hover { background: #2D3748; }
  .popover-item.active { color: #fff; font-weight: 600; }

  .quality-trigger { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: #fff; opacity: 0.85; }
  .quality-trigger:hover { opacity: 1; }

  /* ── Quality popover — centred and clamped so it never overflows on mobile ── */
  .quality-popover { position: absolute; bottom: calc(100% + 0.625rem); left: 50%; transform: translateX(-50%); background: #1a2030; border: 1px solid #2d3748; border-radius: 1rem; width: min(280px, calc(100vw - 2rem)); overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.45); z-index: 30; }
  .qp-save { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.875rem 1rem; border-bottom: 1px solid #2d3748; }
  .qp-save-left { display: flex; align-items: center; gap: 0.625rem; min-width: 0; }
  .qp-save-title { font-size: 0.9375rem; font-weight: 700; color: #fff; }
  .qp-save-sub { font-size: 0.8125rem; color: #9CA3AF; }
  .qp-toggle { width: 40px; height: 22px; border-radius: 99px; border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; padding: 0; }
  .qp-toggle-thumb { position: absolute; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: left 0.2s; }
  .qp-section-label { font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; color: #6B7280; text-transform: uppercase; padding: 0.75rem 1rem 0.375rem; }
  .qp-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; cursor: pointer; transition: background 0.15s; }
  .qp-item:hover { background: rgba(255,255,255,0.05); }
  .qp-item-left { display: flex; flex-direction: column; gap: 0.1rem; }
  .qp-item-label { font-size: 0.9375rem; font-weight: 700; color: #fff; }
  .qp-item-label.active { color: #2563EB; }
  .qp-item-sub { font-size: 0.8125rem; color: #6B7280; }
  .qp-item-right { display: flex; align-items: center; gap: 0.625rem; }
  .qp-kbps { font-size: 0.8125rem; color: #6B7280; }
  .qp-check-ring { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #2563EB; background: #2563EB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .qp-check-ring-empty { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #4B5563; background: transparent; flex-shrink: 0; }

  /* ── Volume ── */
  .volume-wrap { display: flex; align-items: center; gap: 0.5rem; }
  .volume-slider { -webkit-appearance: none; appearance: none; width: 64px; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; outline: none; cursor: pointer; vertical-align: middle; }
  .volume-slider::-webkit-slider-runnable-track { -webkit-appearance: none; height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; border: none; }
  .volume-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #fff; cursor: pointer; margin-top: -3.5px; box-shadow: none; border: none; }
  .volume-slider::-moz-range-track { height: 3px; background: rgba(255,255,255,0.3); border-radius: 2px; border: none; }
  .volume-slider::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #fff; border: none; cursor: pointer; box-shadow: none; }
  .volume-slider:focus { outline: none; }
  .volume-slider:focus::-webkit-slider-thumb { box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }

  .lesson-meta { padding: 1.25rem 0 0; display: flex; flex-direction: column; gap: 0.25rem; }
  .crumb { font-size: 0.8125rem; color: #9CA3AF; }
  .crumb .crumb-link { color: #2563EB; font-weight: 600; cursor: pointer; }
  .lesson-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
  .lesson-title { font-size: 1.375rem; font-weight: 700; color: #111; }
  .lesson-sub { font-size: 0.875rem; color: #6B7280; }
  .mark-done-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; border-radius: 2rem; border: 1.5px solid #2563EB; background: #fff; color: #2563EB; font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: background 0.15s; }
  .mark-done-btn:hover { background: #EFF6FF; }
  .mark-done-btn.done { border-color: #22C55E; color: #22C55E; background: #ECFDF3; }
  .mark-done-btn:disabled { opacity: 0.6; cursor: default; }

  .tabs-row { display: flex; gap: 2rem; border-bottom: 1px solid #E5E7EB; }
  .tab-btn { padding: 0.875rem 0; background: none; border: none; border-bottom: 2px solid transparent; font-size: 0.9375rem; font-weight: 600; color: #9CA3AF; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
  .tab-btn.active { color: #2563EB; border-bottom-color: #2563EB; }
  .tab-btn:disabled { cursor: not-allowed; color: #D1D5DB; }
  .tab-btn .tab-lock-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; color: #D1D5DB; margin-left: 0.375rem; }
  .tab-panel { display: flex; flex-direction: column; gap: 1rem; }

  .notes-textarea { width: 100%; min-height: 180px; border: 1px solid #E5E7EB; border-radius: 0.875rem; padding: 1rem; font-size: 0.9375rem; color: #111; font-family: inherit; resize: vertical; outline: none; transition: border-color 0.15s; background: #fff; }
  .notes-textarea:focus { border-color: #2563EB; }
  .notes-textarea::placeholder { color: #9CA3AF; }
  .notes-hint-row { display: flex; align-items: center; justify-content: space-between; }
  .notes-hint { font-size: 0.8125rem; color: #9CA3AF; }
  .notes-save-status { font-size: 0.8125rem; color: #22C55E; font-weight: 600; display: flex; align-items: center; gap: 0.3rem; }

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
  .resource-download { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #EFF6FF; border: none; color: #2563EB; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.15s; }
  .resource-download:hover { background: #DBEAFE; }
  .resources-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
  .resources-footer-text { font-size: 0.9375rem; color: #111; font-weight: 600; }
  .download-all-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.5rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .download-all-btn:hover { opacity: 0.9; }
  .resources-empty { padding: 2.5rem 1rem; text-align: center; color: #9CA3AF; font-size: 0.9375rem; }

  .discussion-locked { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; padding: 3rem 1rem; color: #9CA3AF; text-align: center; }
  .discussion-locked-title { font-size: 0.9375rem; font-weight: 700; color: #6B7280; }
  .discussion-locked-sub { font-size: 0.8125rem; max-width: 320px; line-height: 1.6; }

  .nav-row { display: flex; align-items: stretch; gap: 1rem; }
  .nav-card { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem 1.25rem; border-radius: 0.875rem; border: 1px solid #E5E7EB; background: #fff; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .nav-card:hover { border-color: #D1D5DB; }
  .nav-card.disabled { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
  .nav-card.up-next { border-color: #BFDBFE; background: #EFF6FF; }
  .nav-card.up-next:hover { background: #DBEAFE; }
  .nav-card-label { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: #9CA3AF; text-transform: uppercase; }
  .nav-card.up-next .nav-card-label { color: #2563EB; justify-content: flex-end; }
  .nav-card-title { font-size: 0.9375rem; font-weight: 700; color: #111; }
  .nav-card.up-next .nav-card-title { text-align: right; }
  .nav-card-sub { font-size: 0.8125rem; color: #9CA3AF; }
  .nav-card.up-next .nav-card-sub { text-align: right; }

  .ask-help-wrap { position: relative; }
  .ask-help-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 2rem; border: none; background: #2563EB; color: #fff; font-size: 0.9375rem; font-weight: 700; cursor: pointer; white-space: nowrap; letter-spacing: 0.01em; box-shadow: 0 2px 8px rgba(37,99,235,0.35); }
  .ask-help-btn:hover { background: #1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.45); }
  .ask-help-popover { position: absolute; bottom: calc(100% + 0.75rem); right: 0; background: #1a2030; border-radius: 1.25rem; box-shadow: 0 12px 40px rgba(0,0,0,0.45); width: 320px; padding: 1.5rem; z-index: 50; display: flex; flex-direction: column; gap: 0.75rem; }
  .ask-help-popover-title { font-size: 1.125rem; font-weight: 700; color: #fff; }
  .ask-help-popover-sub { font-size: 0.875rem; color: #9CA3AF; line-height: 1.5; margin-top: -0.25rem; }
  .ask-help-item { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 0.875rem 1rem; border-radius: 2rem; border: none; font-size: 0.9375rem; font-weight: 700; cursor: pointer; text-align: center; transition: opacity 0.15s; }
  .ask-help-item.primary { background: #2563EB; color: #fff; }
  .ask-help-item.primary:hover { opacity: 0.9; }
  .ask-help-item.secondary { background: #2d3748; color: #fff; }
  .ask-help-item.secondary:hover { opacity: 0.85; }

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

  @media (max-width: 900px) {
    .content { padding: 1.5rem 1.25rem 2rem; }
    .resources-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .content { padding: 1.25rem 1rem 5rem; }
    .video-wrap { aspect-ratio: 16/9; }
    .video-title-overlay { display: none; }
    .nav-row { flex-direction: column; }
    .ask-help-wrap { align-self: stretch; }
    .ask-help-btn { width: 100%; justify-content: center; }
    /* Hide the entire volume control (icon + slider) on mobile */
    .volume-wrap { display: none; }
    /* Tighten the right controls gap */
    .controls-right { gap: 0.5rem; }
    /* Ensure popovers never overflow the screen width */
    .quality-popover { width: min(260px, calc(100vw - 1.5rem)); }
    .popover { min-width: 120px; }
    /* Ask-for-help popover: clamp width on small screens */
    .ask-help-popover { width: min(320px, calc(100vw - 2rem)); right: 0; left: auto; }
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────
interface CompleteInfo {
  before: number
  after: number
  lessonsCompleted: number
  lessonsTotal: number
  nextLesson: { id: string; title: string; duration_display: string } | null
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CourseLearnPage() {
  const navigate = useNavigate()
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>()
  const location = useLocation()
  const { user } = useAuth()

  const { courseTitle, moduleTitle, thumbnailUrl } =
    (location.state as { courseTitle?: string; moduleTitle?: string; thumbnailUrl?: string }) ?? {}

  const [lesson, setLesson]   = useState<LessonDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [activeNav, setActiveNav] = useState('courses')

  // ── Video ──
  const videoRef                              = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying]             = useState(false)
  const [currentTime, setCurrentTime]         = useState(0)
  const [duration, setDuration]               = useState(0)
  const [volume, setVolume]                   = useState(1)
  const [muted, setMuted]                     = useState(false)
  const [buffering, setBuffering]             = useState(false)
  const [qualityOpen, setQualityOpen]         = useState(false)
  const [quality, setQuality]                 = useState('Auto')
  const [saveData, setSaveData]               = useState(false)
  const [ccOpen, setCcOpen]                   = useState(false)
  const [ccOn, setCcOn]                       = useState(false)
  const positionTimerRef                      = useRef<ReturnType<typeof setInterval> | null>(null)

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  // ── Notes / tabs ──
  const [activeTab, setActiveTab]             = useState<'notes' | 'resources' | 'discussion'>('notes')
  const [notes, setNotes]                     = useState('')
  const [savingNotes, setSavingNotes]         = useState(false)
  const [justSaved, setJustSaved]             = useState(false)
  const notesTimer                            = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notesLoadedRef                        = useRef(false)

  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set())
  const [askHelpOpen, setAskHelpOpen]         = useState(false)
  const [marking, setMarking]                 = useState(false)
  const [completeInfo, setCompleteInfo]       = useState<CompleteInfo | null>(null)
  const [countdown, setCountdown]             = useState(5)
  const countdownRef                          = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load lesson ──
  useEffect(() => {
    if (!slug || !lessonId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    notesLoadedRef.current = false

    coursesAPI.getLesson(slug, lessonId).then((res) => {
      if (cancelled) return
      if (res.success) {
        setLesson(res.data)
        setNotes(res.data.notes ?? '')
        notesLoadedRef.current = true
      } else {
        setError(res.statusCode === 404 ? 'Lesson not found.' : res.error)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [slug, lessonId])

  // ── Reset on lesson change ──
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setBuffering(false)
    setActiveTab('notes')
    setSelectedResources(new Set())
    setAskHelpOpen(false)
    setCompleteInfo(null)
  }, [lessonId])

  // ── Wire video events ──
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const resumePos = lesson?.resume_position_seconds
    if (resumePos && resumePos > 0) {
      const onMeta = () => { v.currentTime = resumePos }
      v.addEventListener('loadedmetadata', onMeta, { once: true })
    }
    const onPlay         = () => setIsPlaying(true)
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
  }, [lesson])

  // ── Position heartbeat ──
  useEffect(() => {
    if (!slug || !lessonId) return
    if (positionTimerRef.current) clearInterval(positionTimerRef.current)
    positionTimerRef.current = setInterval(() => {
      const v = videoRef.current
      if (!v || v.paused || v.ended) return
      const pos = Math.floor(v.currentTime)
      if (pos > 0) coursesAPI.savePosition(slug, lessonId, pos).catch(() => {})
    }, 10_000)
    return () => { if (positionTimerRef.current) clearInterval(positionTimerRef.current) }
  }, [slug, lessonId])

  // ── Notes autosave ──
  useEffect(() => {
    if (!notesLoadedRef.current || !slug || !lessonId) return
    if (notesTimer.current) clearTimeout(notesTimer.current)
    setJustSaved(false)
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true)
      const res = await coursesAPI.saveLessonNotes(slug, lessonId, notes)
      setSavingNotes(false)
      if (res.success) { setJustSaved(true); setTimeout(() => setJustSaved(false), 2000) }
    }, 800)
    return () => { if (notesTimer.current) clearTimeout(notesTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  // ── Auto-advance countdown ──
  useEffect(() => {
    if (!completeInfo?.nextLesson) return
    setCountdown(5)
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(countdownRef.current!); goToNext(); return 0 }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completeInfo])

  if (!user) return null

  // ── Video controls ──
  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
    } else {
      v.pause()
      const pos = Math.floor(v.currentTime)
      if (slug && lessonId && pos > 0) coursesAPI.savePosition(slug, lessonId, pos).catch(() => {})
    }
  }, [slug, lessonId])

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

  const handleFullscreen = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    document.fullscreenElement ? document.exitFullscreen().catch(() => {}) : v.requestFullscreen().catch(() => {})
  }, [])

  function goToLesson(id: string) {
    if (!slug) return
    setCompleteInfo(null)
    navigate(RouteBuilder.courseLearn(slug, id), {
      state: { courseTitle, moduleTitle, thumbnailUrl },
    })
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
      setLesson((prev) => prev ? { ...prev, status: 'completed' } : prev)
      const next = res.data.next_lesson ?? lesson?.next_lesson ?? null
      setCompleteInfo({
        before:           res.data.course_progress_percentage_before ?? 0,
        after:            res.data.course_progress_percentage_after  ?? 0,
        lessonsCompleted: res.data.lessons_completed ?? 0,
        lessonsTotal:     res.data.lessons_total     ?? 0,
        nextLesson: next ? { id: next.id, title: next.title, duration_display: next.duration_display } : null,
      })
    }
  }

  function toggleResource(id: string) {
    setSelectedResources((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll(resources: LessonResource[]) {
    setSelectedResources((prev) =>
      prev.size === resources.length ? new Set() : new Set(resources.map((r) => r.id))
    )
  }

  async function downloadResource(r: LessonResource) {
    if (!slug || !lessonId) return
    const res = await coursesAPI.getResourceDownloadUrl(slug, lessonId, r.id)
    if (res.success) window.open(res.data.download_url, '_blank')
  }

  async function downloadAll(resources: LessonResource[]) {
    await Promise.all(resources.map((r) => downloadResource(r)))
  }

  function getFileTypeLabel(r: LessonResource): string {
    return r.file_format ?? r.resource_type ?? 'file'
  }

  function formatBytes(bytes: number): string {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const hasVideo   = Boolean(lesson?.video_url)
  const prevLesson = lesson?.previous_lesson ?? null
  const nextLesson = lesson?.next_lesson ?? null

  return (
    <>
      <style>{SHELL_CSS + PAGE_CSS}</style>
      <AppShell activeNav={activeNav} onNavChange={setActiveNav}>
        <div className="content">
          {loading && <div className="state-screen">Loading lesson…</div>}
          {error && !loading && <div className="state-screen error">{error}</div>}

          {!loading && !error && lesson && (
            <>
              {/* ── Video player ── */}
              <div className="player-card">
                <div className="video-wrap" onClick={togglePlay}>
                  <video
                    ref={videoRef}
                    src={lesson.video_url || undefined}
                    preload="metadata"
                    playsInline
                    muted={muted}
                    style={{ display: hasVideo ? 'block' : 'none' }}
                  />

                  {!hasVideo && (
                    <div className="no-video">
                      {thumbnailUrl && <img className="no-video-thumb" src={thumbnailUrl} alt="" />}
                      <div className="no-video-label">
                        <div className="no-video-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
                            <rect x="2" y="6" width="16" height="12" rx="2" />
                            <path d="M22 8l-4 4 4 4V8z" fill="rgba(255,255,255,0.9)" stroke="none"/>
                          </svg>
                        </div>
                        <span>Video not available yet</span>
                      </div>
                    </div>
                  )}

                  <div className="video-overlay" />

                  <button className="video-back" onClick={(e) => { e.stopPropagation(); navigate(RouteBuilder.course(slug as string)) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
                  </button>

                  <div className="video-title-overlay">
                    <div className="vt-title">{lesson.title}</div>
                    {(moduleTitle || courseTitle) && (
                      <div className="vt-sub">{[moduleTitle, courseTitle].filter(Boolean).join(' · ')}</div>
                    )}
                  </div>

                  {buffering && (
                    <div className="buffering">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5">
                        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                      </svg>
                    </div>
                  )}

                  <div className="center-controls" onClick={(e) => e.stopPropagation()}>
                    <button className="ctrl-btn" onClick={() => seekBy(-10)}><SkipBack size={22} /></button>
                    <button className="play-main" onClick={togglePlay} disabled={!hasVideo}>
                      {isPlaying
                        ? <Pause size={20} fill="currentColor" />
                        : <Play  size={20} fill="currentColor" style={{ marginLeft: 2 }} />}
                    </button>
                    <button className="ctrl-btn" onClick={() => seekBy(10)}><SkipForward size={22} /></button>
                  </div>

                  <div className="video-controls" onClick={(e) => e.stopPropagation()}>
                    <div className="progress-wrap" onClick={handleProgressClick}>
                      <div className="progress-fill" style={{ width: `${progressPct}%` }}>
                        <div className="progress-thumb" />
                      </div>
                    </div>
                    <div className="controls-row">
                      <span className="time">
                        {fmtTime(currentTime)} / {duration > 0 ? fmtTime(duration) : lesson.duration_display}
                      </span>
                      <div className="controls-right">
                        {/* Volume — hidden entirely on mobile via CSS */}
                        <div className="volume-wrap">
                          <button className="ctrl-btn" onClick={toggleMute}>
                            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                          </button>
                          <input
                            className="volume-slider"
                            type="range" min={0} max={1} step={0.05}
                            value={muted ? 0 : volume}
                            onChange={handleVolumeChange}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* CC */}
                        <div style={{ position: 'relative' }}>
                          <button className="ctrl-btn" onClick={() => { setCcOpen(o => !o); setQualityOpen(false) }}>
                            <Captions size={16} style={{ opacity: ccOn ? 1 : 0.6 }} />
                          </button>
                          {ccOpen && (
                            <div className="popover">
                              <div className={`popover-item${!ccOn ? ' active' : ''}`} onClick={() => { setCcOn(false); setCcOpen(false) }}>Off</div>
                              <div className={`popover-item${ccOn  ? ' active' : ''}`} onClick={() => { setCcOn(true);  setCcOpen(false) }}>English</div>
                            </div>
                          )}
                        </div>

                        {/* Quality */}
                        <div style={{ position: 'relative' }}>
                          <button className="ctrl-btn quality-trigger" onClick={() => { setQualityOpen(o => !o); setCcOpen(false) }}>
                            <Settings2 size={14} style={{ marginRight: 3 }} />{quality}
                          </button>
                          {qualityOpen && (
                            <div className="quality-popover">
                              <div className="qp-save">
                                <div className="qp-save-left">
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" style={{ flexShrink: 0 }}>
                                    <path d="M1.5 8.5C5 4 10 2 12 2s7 2 10.5 6.5"/>
                                    <path d="M5 12c1.8-2.4 4.2-4 7-4s5.2 1.6 7 4"/>
                                    <path d="M8.5 15.5c.9-1.2 2.1-2 3.5-2s2.6.8 3.5 2"/>
                                    <circle cx="12" cy="19" r="1.5" fill="#9CA3AF"/>
                                  </svg>
                                  <div>
                                    <div className="qp-save-title">Save data</div>
                                    <div className="qp-save-sub">Sets quality to 240p</div>
                                  </div>
                                </div>
                                <button
                                  className="qp-toggle"
                                  style={{ background: saveData ? '#2563EB' : '#374151' }}
                                  onClick={(e) => { e.stopPropagation(); setSaveData(s => { if (!s) setQuality('240p'); return !s }) }}
                                >
                                  <div className="qp-toggle-thumb" style={{ left: saveData ? '21px' : '3px' }} />
                                </button>
                              </div>
                              <div className="qp-section-label">Video Quality</div>
                              {QUALITY_OPTIONS.map((q) => {
                                const active = quality === q.label
                                return (
                                  <div key={q.label} className="qp-item" onClick={() => { setQuality(q.label); setQualityOpen(false); setSaveData(false) }}>
                                    <div className="qp-item-left">
                                      <span className={`qp-item-label${active ? ' active' : ''}`}>{q.label}</span>
                                      <span className="qp-item-sub">{q.sub}</span>
                                    </div>
                                    <div className="qp-item-right">
                                      <span className="qp-kbps">{q.kbps}</span>
                                      {active
                                        ? <div className="qp-check-ring"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20,6 9,17 4,12" /></svg></div>
                                        : <div className="qp-check-ring-empty" />}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        <button className="ctrl-btn" onClick={handleFullscreen}>
                          <Maximize size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Breadcrumb + title ── */}
              <div className="lesson-meta">
                <div className="crumb">
                  <span className="crumb-link" onClick={() => navigate(RouteBuilder.course(slug as string))}>
                    {courseTitle ?? slug}
                  </span>
                  {moduleTitle && <>{' › '}<span>{moduleTitle}</span></>}
                </div>
                <div className="lesson-title-row">
                  <div>
                    <div className="lesson-title">{lesson.title}</div>
                    <div className="lesson-sub">{moduleTitle ? `${moduleTitle} — ` : ''}{lesson.duration_display}</div>
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

              {/* ── Tabs ── */}
              <div>
                <div className="tabs-row">
                  <button className={`tab-btn${activeTab === 'notes'     ? ' active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
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
                        <span className="notes-hint">Notes are saved per lesson and available even after completion.</span>
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
                            {lesson.resources.map((r) => {
                              const fileType = getFileTypeLabel(r)
                              return (
                                <div className="resource-card" key={r.id}>
                                  <input type="checkbox" checked={selectedResources.has(r.id)} onChange={() => toggleResource(r.id)} />
                                  <div className="resource-icon-wrap" style={{ background: resourceIconBg(fileType) }}>
                                    {resourceIcon(fileType)}
                                  </div>
                                  <div className="resource-info">
                                    <div className="resource-title">{r.title}</div>
                                    <div className="resource-meta">
                                      {fileType.toUpperCase()}
                                      <span className="resource-meta-light"> · {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    {r.file_size > 0 && (
                                      <div className="resource-meta-light" style={{ marginTop: 2 }}>{formatBytes(r.file_size)}</div>
                                    )}
                                  </div>
                                  <button className="resource-download" onClick={() => downloadResource(r)}>
                                    <Download size={16} />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                          <div className="resources-footer">
                            <div className="resources-footer-text">{lesson.resources.length} file{lesson.resources.length !== 1 ? 's' : ''}</div>
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

              {/* ── Prev / Next ── */}
              <div className="nav-row">
                <div className={`nav-card${!prevLesson ? ' disabled' : ''}`} onClick={() => prevLesson && goToLesson(prevLesson.id)}>
                  <span className="nav-card-label">‹ Previous</span>
                  <span className="nav-card-title">{prevLesson?.title ?? 'No previous lesson'}</span>
                  {prevLesson && <span className="nav-card-sub">{prevLesson.duration_display}</span>}
                </div>
                <div className={`nav-card up-next${!nextLesson ? ' disabled' : ''}`} onClick={() => nextLesson && goToLesson(nextLesson.id)}>
                  <span className="nav-card-label">Up next <ChevronRight size={12} /></span>
                  <span className="nav-card-title">{nextLesson?.title ?? 'No more lessons'}</span>
                  {nextLesson && <span className="nav-card-sub">{nextLesson.duration_display}</span>}
                </div>
              </div>

              {/* ── Ask for help ── */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div className="ask-help-wrap">
                  <button className="ask-help-btn" onClick={() => setAskHelpOpen(o => !o)}>
                    <Headphones size={16} />Ask for help
                  </button>
                  {askHelpOpen && (
                    <div className="ask-help-popover">
                      <div className="ask-help-popover-title">Get help from a tutor</div>
                      <div className="ask-help-popover-sub">Book a 1-on-1 session with Amara Osei or a course assistant.</div>
                      <button className="ask-help-item primary" onClick={() => { setAskHelpOpen(false); navigate(ROUTES.TUTOR_BOOKING) }}>
                        Book a session
                      </button>
                      <button className="ask-help-item secondary" onClick={() => setAskHelpOpen(false)}>
                        Ask in community forum
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>

      {/* ── Lesson complete modal ── */}
      {completeInfo && lesson && (
        <div className="modal-backdrop" onClick={() => setCompleteInfo(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setCompleteInfo(null)}><X size={16} /></button>
            <div className="modal-check">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="modal-title">Lesson complete!</div>
              <div className="modal-sub">{lesson.title}</div>
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