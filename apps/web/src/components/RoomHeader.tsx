import { useRef } from 'react';
import type { Session, SessionUser } from '@fibo/shared';
import { exportSession, parseSessionExport, ImportError } from '@fibo/shared';
import { importStories } from '../lib/api';
import { useToast } from './Toast';

interface Props {
  session: Session;
  me: SessionUser;
  canLead: boolean;
  onShare: () => void;
  themeToggle: React.ReactNode;
}

export function RoomHeader({ session, me, canLead, onShare, themeToggle }: Props) {
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const users = session.users ?? {};
  const online = Object.values(users).filter((u) => u.online).length;

  const doExport = () => {
    const doc = exportSession(session);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = session.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'session';
    a.href = url;
    a.download = `fibo-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('session exported');
  };

  const doImport = async (file: File) => {
    try {
      const doc = parseSessionExport(await file.text());
      await importStories(session, doc);
      toast(`imported ${doc.stories.length} stories`);
    } catch (err) {
      toast(err instanceof ImportError ? err.message : 'Import failed.', 'error');
    }
  };

  return (
    <header className="room-header">
      <a className="brand" href="/" title="fibo home">
        fibo<span className="cursor">▊</span>
      </a>
      <div className="room-title">
        <span className="room-name">{session.name}</span>
        <span className="room-meta dim">
          /s/{session.id} · {online}/{Object.keys(users).length} online · you: {me.name} [
          {me.role}]
        </span>
      </div>
      <div className="room-actions">
        <button className="btn btn-ghost" onClick={onShare} title="Share link / QR code">
          share
        </button>
        <button className="btn btn-ghost" onClick={doExport} title="Download session as JSON">
          export
        </button>
        {canLead && (
          <>
            <button
              className="btn btn-ghost"
              onClick={() => fileInput.current?.click()}
              title="Import stories from a fibo JSON export (replaces the current list)"
            >
              import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void doImport(f);
                e.target.value = '';
              }}
            />
          </>
        )}
        {themeToggle}
      </div>
    </header>
  );
}
