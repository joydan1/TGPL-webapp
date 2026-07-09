export const LOGOUT_MODAL_CSS = `
  .logout-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .logout-modal { background: #fff; border-radius: 1.25rem; padding: 2rem 1.75rem 1.75rem; width: 100%; max-width: 380px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
  .logout-modal-title { font-size: 1.375rem; font-weight: 800; color: #111; margin: 0; }
  .logout-modal-text { font-size: 0.9375rem; color: #6B7280; margin-top: 0.75rem; line-height: 1.5; }
  .logout-modal-actions { display: flex; gap: 0.75rem; margin-top: 1.75rem; }
  .logout-modal-btn { flex: 1; padding: 0.9rem 1rem; border-radius: 999px; font-weight: 700; font-size: 0.9375rem; cursor: pointer; border: none; }
  .logout-modal-btn.cancel { background: #fff; color: #6B7280; border: 1px solid #E5E7EB; }
  .logout-modal-btn.confirm { background: #F43F5E; color: #fff; }
  .logout-modal-btn.confirm:hover { background: #E11D48; }
`

interface LogoutConfirmModalProps {
  onCancel: () => void
  onConfirm: () => void
}

export default function LogoutConfirmModal({ onCancel, onConfirm }: LogoutConfirmModalProps) {
  return (
    <div className="logout-modal-overlay" onClick={onCancel}>
      <div className="logout-modal" role="dialog" aria-modal="true" aria-label="Confirm logout" onClick={(e) => e.stopPropagation()}>
        <h2 className="logout-modal-title">Logout?</h2>
        <p className="logout-modal-text">You'll need to sign in again to access your courses and progress.</p>
        <div className="logout-modal-actions">
          <button className="logout-modal-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="logout-modal-btn confirm" onClick={onConfirm}>Logout</button>
        </div>
      </div>
    </div>
  )
}