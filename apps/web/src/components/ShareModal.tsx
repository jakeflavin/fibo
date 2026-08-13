import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Session } from '@fibo/shared';
import { useToast } from './Toast';

interface Props {
  session: Session;
  onClose: () => void;
}

export function ShareModal({ session, onClose }: Props) {
  const toast = useToast();
  const url = `${window.location.origin}/s/${session.id}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast('link copied to clipboard');
    } catch {
      toast('could not copy — select the link manually', 'error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="panel modal"
        role="dialog"
        aria-modal="true"
        aria-label="Share session"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-title">
          // invite your team
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="qr-box">
          <QRCodeSVG value={url} size={208} marginSize={2} level="M" bgColor="#ffffff" fgColor="#000000" />
        </div>
        <code className="share-url">{url}</code>
        <button className="btn btn-primary btn-block" onClick={copy}>
          [ copy link ]
        </button>
        <p className="dim panel-hint">anyone with the link joins by entering a name.</p>
      </div>
    </div>
  );
}
