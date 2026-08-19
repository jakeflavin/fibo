import { QRCodeSVG } from 'qrcode.react'
import type { Session } from '@fibo/shared'
import { Modal } from './Modal'
import { useToast } from './Toast'

interface ShareModalProps {
  session: Session
  onClose: () => void
}

/** Invite modal: the session link as text and as a scannable QR code. */
export function ShareModal({ session, onClose }: ShareModalProps) {
  const toast = useToast()
  const url = `${window.location.origin}/s/${session.id}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast('link copied to clipboard')
    } catch {
      toast('could not copy — select the link manually', 'error')
    }
  }

  return (
    <Modal title="Invite your team" onClose={onClose}>
      <div className="qr-box">
        <QRCodeSVG
          value={url}
          size={208}
          marginSize={2}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <code className="share-url">{url}</code>
      <button className="btn btn-primary btn-block" onClick={copy}>
        Copy link
      </button>
      <p className="dim panel-hint">Anyone with the link joins by entering a name.</p>
    </Modal>
  )
}
