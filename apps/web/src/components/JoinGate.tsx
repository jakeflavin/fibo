import { useState } from 'react';
import { Heart } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { joinSession } from '../lib/api';
import { getLastName, saveLastName } from '../lib/storage';
import { useToast } from './Toast';
import { SettingsMenu } from './ThemeToggle';

interface Props {
  session: Session;
  onJoined: (userId: string) => void;
}

/** Name prompt shown to visitors who open a session they haven't joined. */
export function JoinGate({ session, onJoined }: Props) {
  const toast = useToast();
  const [name, setName] = useState(getLastName);
  const [busy, setBusy] = useState(false);
  const count = Object.keys(session.users ?? {}).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      saveLastName(name.trim());
      const userId = await joinSession(session.id, name);
      onJoined(userId);
    } catch (err) {
      console.error(err);
      toast('Could not join the session. Are you online?', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="home">
      <div className="home-corner">
        <SettingsMenu />
      </div>
      <main className="home-main">
        <div className="logo" aria-hidden="true">
          fibo
        </div>
        <h1 className="sr-only">Join this fibo session</h1>
        <p className="tagline">
          You've been invited to point some stories
        </p>

        <div className="rail-card home-card">
          <form className="home-form" onSubmit={submit}>
            <label className="field">
              <span className="field-label">Your name *</span>
              <div className="text-field">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Grace"
                  maxLength={40}
                  autoFocus
                  required
                />
              </div>
            </label>
            <button className="btn btn-primary btn-block" disabled={!name.trim() || busy}>
              {busy ? 'Joining…' : 'Join session'}
            </button>
          </form>
        </div>

        <p className="home-notes">
          {count} {count === 1 ? 'person is' : 'people are'} here — no account needed
        </p>
      </main>
      <footer className="room-footer dim">
        made with <Heart size={11} aria-label="love" /> by jake
      </footer>
    </div>
  );
}
