import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FileDown,
  FileUp,
  Keyboard,
  Layers,
  LogOut,
  Moon,
  Plus,
  Settings,
  Share2,
  Sun,
} from 'lucide-react';
import type { Session } from '@fibo/shared';
import { exportSession, parseSessionExport, resultsTable, ImportError } from '@fibo/shared';
import { createSession, importStories, removeUser } from '../lib/api';
import { clearMyUserId } from '../lib/storage';
import { ConfirmModal } from './ConfirmModal';
import { DeckModal } from './DeckModal';
import { useTheme } from './ThemeToggle';
import { useToast } from './Toast';

interface Props {
  session: Session;
  myUserId: string;
  canLead: boolean;
  onShare: () => void;
  onShortcuts: () => void;
}

/**
 * The app bar: brand plus the gear menu (share, export/import, new
 * session, theme, leave session).
 */
export function RoomHeader({ session, myUserId, canLead, onShare, onShortcuts }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const isAdmin = session.users?.[myUserId]?.role === 'owner';
  const { theme, toggle } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const doExport = () => {
    const doc = exportSession(session);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fibo-session-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Session exported');
  };

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(resultsTable(session));
      toast('Results copied — paste into Jira or a spreadsheet');
    } catch {
      toast('Could not access the clipboard.', 'error');
    }
  };

  const doImport = async (file: File) => {
    try {
      const doc = parseSessionExport(await file.text());
      await importStories(session, doc);
      toast(`Imported ${doc.stories.length} stories`);
    } catch (err) {
      toast(err instanceof ImportError ? err.message : 'Import failed.', 'error');
    }
  };

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const newSession = async () => {
    const name = session.users?.[myUserId]?.name ?? '';
    if (!name) return;
    const sessionId = await createSession(name);
    navigate(`/s/${sessionId}`);
  };

  const leave = async () => {
    await removeUser(session, myUserId);
    clearMyUserId(session.id);
    navigate('/');
  };

  return (
    <header className="room-header">
      <a className="brand" href="/" title="fibo home">
        <span className="brand-name">fibo</span>
        <span className="brand-version">v{__APP_VERSION__}</span>
      </a>
      <div className="menu-wrap" ref={menuRef}>
        <button
          className="btn btn-ghost menu-button"
          aria-label="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Settings size={18} />
        </button>
        {open && (
          <div className="menu" role="menu">
            <button className="menu-item" role="menuitem" onClick={pick(onShare)}>
              <Share2 size={14} /> Share / QR
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(doExport)}>
              <FileDown size={14} /> Export JSON
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(() => void copyResults())}>
              <ClipboardList size={14} /> Copy results
            </button>
            {canLead && (
              <button
                className="menu-item"
                role="menuitem"
                onClick={pick(() => fileInput.current?.click())}
              >
                <FileUp size={14} /> Import JSON
              </button>
            )}
            <div className="menu-sep" />
            {isAdmin && (
              <button
                className="menu-item"
                role="menuitem"
                onClick={pick(() => setDeckOpen(true))}
              >
                <Layers size={14} /> Change deck
              </button>
            )}
            <button className="menu-item" role="menuitem" onClick={pick(() => void newSession())}>
              <Plus size={14} /> New session
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(onShortcuts)}>
              <Keyboard size={14} /> Keyboard shortcuts
            </button>
            <button className="menu-item" role="menuitem" onClick={pick(toggle)}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Switch to{' '}
              {theme === 'dark' ? 'light' : 'dark'} mode
            </button>
            <div className="menu-sep" />
            <button
              className="menu-item menu-item-danger"
              role="menuitem"
              onClick={pick(() => setConfirmLeave(true))}
            >
              <LogOut size={14} /> Leave session
            </button>
          </div>
        )}
      </div>
      {deckOpen && <DeckModal session={session} onClose={() => setDeckOpen(false)} />}
      {confirmLeave && (
        <ConfirmModal
          title="Leave session"
          message={<>Leave this session? You can rejoin any time with the invite link.</>}
          confirmLabel="Leave"
          onConfirm={() => {
            setConfirmLeave(false);
            void leave();
          }}
          onClose={() => setConfirmLeave(false)}
        />
      )}
      {canLead && (
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
      )}
    </header>
  );
}
