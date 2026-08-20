import { type MouseEvent, type ReactNode, useEffect, useId, useRef } from 'react'
import { Dialog, ModalClose, ModalTitle } from './Modal.styled'
import { Eyebrow } from '@/styles/shared.styled'
import { X } from 'lucide-react'

interface ModalProps {
  /** Shown in the title bar, and used as the dialog's accessible name. */
  title: string
  onClose: () => void
  /** `alertdialog` for a destructive confirmation, which asks for more attention. */
  role?: 'dialog' | 'alertdialog'
  className?: string
  children: ReactNode
}

/**
 * The shell every modal in this app wears, on a native `<dialog>`.
 *
 * Four components each carried their own copy of a backdrop div, an Escape listener and
 * a `stopPropagation` guard. The platform does all three, and does them better: opening
 * with `showModal()` traps focus, restores it to whatever was focused before, makes the
 * rest of the page inert rather than merely `aria-hidden`, and puts the dialog in the top
 * layer — which is why nothing here needs a portal or a z-index to escape a stacking
 * context.
 *
 * The parent's state is the one source of truth for whether this is open, so every exit
 * routes through `onClose` and the parent unmounts us. Escape is caught as `cancel` and
 * its default prevented, rather than letting the element close itself behind React's
 * back and leaving the parent believing the modal is still open.
 */
export function Modal({ title, onClose, role = 'dialog', className, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // Opened on mount, because these modals are mounted only while they are open.
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  /*
   * A click anywhere inside the dialog's box counts as inside, including its padding —
   * comparing against the event target alone would treat the padding as backdrop.
   */
  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== ref.current) return
    const { top, right, bottom, left } = ref.current.getBoundingClientRect()
    const outside =
      event.clientX < left ||
      event.clientX > right ||
      event.clientY < top ||
      event.clientY > bottom
    if (outside) onClose()
  }

  return (
    <Dialog
      ref={ref}
      className={className}
      role={role}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={onDialogClick}
    >
      <ModalTitle>
        <Eyebrow as="span"  id={titleId}>
          {title}
        </Eyebrow>
        <ModalClose $ghost onClick={onClose} aria-label="Close">
          <X size={15} />
        </ModalClose>
      </ModalTitle>
      {children}
    </Dialog>
  )
}
