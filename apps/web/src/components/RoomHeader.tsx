import { useEffect, useRef, useState } from 'react';
import { FileDown, FileUp, Moon, Settings, Share2, Sun } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { exportSession, parseSessionExport, ImportError } from '@fibo/shared';
import { importStories } from '../lib/api';
import { useTheme } from './ThemeToggle';
import { useToast } from './Toast';

interface Props {
  session: Session;
  canLead: boolean;
  onShare: () => void;
}

export function RoomHeader({ session, canLead, onShare }: Props) {
  const toast = useToast();
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

  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
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
            <button className="menu-item" role="menuitem" onClick={pick(toggle)}>
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Switch to{' '}
              {theme === 'dark' ? 'light' : 'dark'} mode
            </button>
          </div>
        )}
      </div>
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
