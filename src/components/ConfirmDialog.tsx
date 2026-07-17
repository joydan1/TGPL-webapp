import { useEffect, useRef } from 'react'

const DIALOG_CSS = `
  .confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.25rem;
  }
  .confirm-card {
    width: 100%;
    max-width: 380px;
    background: #fff;
    border-radius: 1.25rem;
    padding: 1.75rem 1.5rem 1.5rem;
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
    text-align: center;
  }
  .confirm-title {
    margin: 0 0 0.6rem;
    font-size: 1.3rem;
    font-weight: 800;
    color: #111827;
  }
  .confirm-message {
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
    line-height: 1.45;
    color: #6B7280;
  }
  .confirm-actions {
    display: flex;
    gap: 0.75rem;
  }
  .confirm-btn {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.95rem 1rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
  }
  .confirm-btn.cancel {
    background: #fff;
    color: #6B7280;
    border: 1px solid #E5E7EB;
  }
  .confirm-btn.cancel:hover {
    background: #F9FAFB;
  }
  .confirm-btn.confirm {
    background: #EF4444;
    color: #fff;
  }
  .confirm-btn.confirm:hover {
    background: #DC2626;
  }
  .confirm-btn.confirm.non-destructive {
    background: #2563EB;
  }
  .confirm-btn.confirm.non-destructive:hover {
    background: #1D4ED8;
  }
`

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmBtnRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <>
      <style>{DIALOG_CSS}</style>
      <div
        className="confirm-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={onCancel}
      >
        <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
          <h2 id="confirm-dialog-title" className="confirm-title">
            {title}
          </h2>
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button type="button" className="confirm-btn cancel" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              type="button"
              className={`confirm-btn confirm ${destructive ? '' : 'non-destructive'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}