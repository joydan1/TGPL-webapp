import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight } from 'lucide-react'
import type { ModeOption } from '../../hooks/useModeSwitch'

export const MODE_SWITCH_CSS = `
  /* ── Switch role (sidebar) ── */
  .switch-role-wrap { position: relative; padding: 0.75rem 0.875rem; border-top: 1px solid #F3F4F6; }
  .switch-role-btn { width: 100%; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.6rem; padding: 0.55rem 0.75rem; cursor: pointer; color: #374151; font-size: 0.8125rem; font-weight: 600; transition: background 0.15s; }
  .switch-role-btn:hover { background: #F3F4F6; }
  .sidebar.collapsed .switch-role-btn .switch-role-label { display: none; }
  .sidebar.collapsed .switch-role-btn { justify-content: center; }
  .switch-role-menu { position: absolute; bottom: calc(100% + 0.4rem); left: 0.875rem; right: 0.875rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); padding: 0.4rem; z-index: 300; }
  .switch-role-option { display: block; width: 100%; text-align: left; background: none; border: none; padding: 0.6rem 0.7rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 500; color: #374151; cursor: pointer; }
  .switch-role-option:hover { background: #F9FAFB; }
  /* The collapsed rail is only 64px wide, so float the menu beside it.
     bottom lines the menu up with the button; nudge it if your sidebar-user height changes. */
  .sidebar.collapsed .switch-role-menu { position: fixed; left: 72px; right: auto; bottom: 5rem; width: 200px; }

  /* ── Switch role (mobile: entries inside the profile dropdown) ── */
  .profile-dropdown-item.mobile-switch, .mobile-switch-divider { display: none; }
  @media (max-width: 640px) {
    .profile-dropdown-item.mobile-switch { display: flex; }
    .mobile-switch-divider { display: block; height: 1px; background: #F3F4F6; margin: 0.375rem 0; }
  }
`

/** Sidebar button + popover menu. Renders nothing when there is nothing to switch to. */
export default function ModeSwitch({ options }: { options: ModeOption[] }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (options.length === 0) return null

  return (
    <div className="switch-role-wrap" ref={wrapRef}>
      {open && (
        <div className="switch-role-menu" role="menu">
          {options.map((opt) => (
            <button
              key={opt.key}
              role="menuitem"
              className="switch-role-option"
              onClick={() => { setOpen(false); navigate(opt.route) }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <button
        className="switch-role-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <ArrowLeftRight size={15} />
        <span className="switch-role-label">Switch role</span>
      </button>
    </div>
  )
}

/** Mobile-only entries for the top of the profile dropdown (the sidebar is hidden ≤640px). */
export function MobileModeSwitchItems({
  options,
  onDone,
}: {
  options: ModeOption[]
  /** Called just before navigating, e.g. to close the profile dropdown. */
  onDone?: () => void
}) {
  const navigate = useNavigate()
  if (options.length === 0) return null

  return (
    <>
      {options.map((opt) => (
        <button
          key={opt.key}
          role="menuitem"
          className="profile-dropdown-item mobile-switch"
          onClick={() => { onDone?.(); navigate(opt.route) }}
        >
          <ArrowLeftRight size={16} /> {opt.label}
        </button>
      ))}
      <div className="mobile-switch-divider" />
    </>
  )
}