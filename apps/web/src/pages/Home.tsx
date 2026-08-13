import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../lib/api';
import { getLastName, saveLastName } from '../lib/storage';
import { ThemeToggle } from '../components/ThemeToggle';
import { useToast } from '../components/Toast';

export function Home() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState(getLastName);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      saveLastName(name.trim());
      const sessionId = await createSession(name);
      navigate(`/s/${sessionId}`);
    } catch (err) {
      console.error(err);
      toast('Could not create the session. Are you online?', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="home">
      <div className="home-corner">
        <ThemeToggle />
      </div>
      <main className="home-main">
        <div className="logo" aria-hidden="true">
          <span className="logo-prompt">~ $</span> fibo
        </div>
        <h1 className="sr-only">fibo</h1>
        <p className="tagline">
          story points, no strings attached
        </p>

        <div className="rail-card home-card">
          <form className="home-form" onSubmit={submit}>
            <label className="field">
              <span className="field-label">your_name*</span>
              <div className="prompt-input">
                <span className="prompt">&gt;</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ada"
                  maxLength={40}
                  autoFocus
                  required
                />
              </div>
            </label>
            <button className="btn btn-primary btn-block" disabled={!name.trim() || busy}>
              {busy ? 'creating…' : 'create session'}
            </button>
          </form>
        </div>

        <p className="home-notes">no accounts · no signup · sessions are temporary</p>
      </main>
      <footer className="room-footer dim">
        made with <Heart size={11} aria-label="love" /> by jake
      </footer>
    </div>
  );
}
