import { QRCodeSVG } from 'qrcode.react'
import { QrBox } from './ShareModal.styled'
import { Button, Dim, ShareUrl } from '@/styles/shared.styled'
import type { Session } from '@fibo/shared'
import { sessionUrl } from '@/lib/urls'
import { Modal } from './Modal'
import { useToast } from './Toast'

interface ShareModalProps {
  session: Session
  onClose: () => void
}

/** Invite modal: the session link as text and as a scannable QR code. */
export function ShareModal({ session, onClose }: ShareModalProps) {
  const toast = useToast()
  const url = sessionUrl(session.id)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copied')
    } catch {
      toast('Could not copy — select the link manually.', 'error')
    }
  }

  return (
    <Modal title="Invite your team" onClose={onClose}>
      <QrBox>
        <QRCodeSVG
          value={url}
          size={208}
          marginSize={2}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </QrBox>
      <ShareUrl>{url}</ShareUrl>
      <Button $primary $block  onClick={copy}>
        Copy link
      </Button>
      <Dim>Anyone with the link joins by entering a name.</Dim>
    </Modal>
  )
}
