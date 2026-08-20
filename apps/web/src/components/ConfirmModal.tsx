import { Modal } from './Modal'
import { Button, ModalActions, PanelBody } from '@/styles/shared.styled'

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
      <PanelBody>{message}</PanelBody>
      <ModalActions>
        <Button  onClick={onClose}>
          Cancel
        </Button>
        <Button $danger $primary onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </ModalActions>
    </Modal>
  )
}
