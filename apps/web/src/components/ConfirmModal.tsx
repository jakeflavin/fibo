import { Modal } from './Modal'

interface ConfirmModalProps {
  title: string
  message: React.ReactNode
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}

/** Small confirmation dialog. `alertdialog`, since it interrupts to ask about something destructive. */
export function ConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose} role="alertdialog">
      <p className="panel-body">{message}</p>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          cancel
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
