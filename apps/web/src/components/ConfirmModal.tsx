import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ConfirmModalProps {
  title: string
  message: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** Small confirmation dialog in the same shell as the share modal. */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <span className="eyebrow">{title}</span>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <p className="panel-body">{message}</p>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
