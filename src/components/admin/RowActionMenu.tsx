import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Loader2 } from 'lucide-react'

export interface RowActionMenuItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
  /** Renders a link instead of a button (e.g. a mailto: link). */
  href?: string
  onClick?: () => void
}

interface RowActionMenuProps {
  items: RowActionMenuItem[]
  /** aria-label for the three-dot button */
  label?: string
  /** Shows a spinner and disables the trigger while an action is running */
  loading?: boolean
  disabled?: boolean
}

const MENU_WIDTH = 190 // keep in sync with .au-row-menu { width }
const GAP = 6
const EDGE = 8
const ITEM_HEIGHT_FALLBACK = 40

/**
 * Three-dot action menu that renders into document.body with fixed positioning.
 *
 * Why: table wrappers use `overflow-x: auto` (which also clips vertically) and the
 * panel uses `overflow: hidden`, so an absolutely positioned dropdown gets cut off
 * inside the table. A portal escapes every clipping ancestor. The menu flips upward
 * when there isn't room below and is clamped to the viewport, so it works on phones too.
 */
export default function RowActionMenu({
  items,
  label = 'Row actions',
  loading = false,
  disabled = false,
}: RowActionMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setPos(null)
  }, [])

  const place = useCallback(() => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? items.length * ITEM_HEIGHT_FALLBACK + 12
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const openUp = spaceBelow < menuHeight + GAP + EDGE && spaceAbove > spaceBelow

    const top = openUp ? Math.max(EDGE, rect.top - menuHeight - GAP) : rect.bottom + GAP
    // Right-align to the button, then keep the menu inside the viewport
    const left = Math.min(
      Math.max(EDGE, rect.right - MENU_WIDTH),
      Math.max(EDGE, window.innerWidth - MENU_WIDTH - EDGE),
    )
    setPos({ top, left })
  }, [items.length])

  // Measure after the menu is in the DOM but before paint, so it never flashes in the wrong spot
  useLayoutEffect(() => {
    if (open) place()
  }, [open, place])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // The menu is fixed-position, so close it when the page or any scroll container moves
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open, close])

  return (
    <div className="au-row-menu-wrap">
      <button
        ref={buttonRef}
        className="au-row-menu-btn"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled || loading}
        onClick={(e) => {
          // Rows can be clickable (they open a detail modal) — don't trigger that
          e.stopPropagation()
          if (open) close()
          else setOpen(true)
        }}
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <MoreVertical size={17} />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="au-row-menu"
            role="menu"
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              right: 'auto',
              zIndex: 1000,
              visibility: pos ? 'visible' : 'hidden',
            }}
            // React events bubble through portals to the parent row — stop that
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => {
              const className = `au-row-menu-item${item.danger ? ' danger' : ''}`
              if (item.href) {
                return (
                  <a key={item.label} className={className} href={item.href} role="menuitem" onClick={close}>
                    {item.icon} {item.label}
                  </a>
                )
              }
              return (
                <button
                  key={item.label}
                  className={className}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    close()
                    item.onClick?.()
                  }}
                >
                  {item.icon} {item.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}