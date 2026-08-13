import { Timer } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { useNow } from '../lib/useSession';

/**
 * Countdown readout everyone sees; starting/cancelling lives in LeaderControls.
 * The row always occupies its slot so the table doesn't jump when a timer
 * starts or stops — the contents just become visible.
 */
export function TimerBar({ session }: { session: Session }) {
  const timer = session.timer ?? null;
  const active = !!timer && !session.revealed;
  const now = useNow(active);

  const remainingMs = active ? Math.max(0, timer.endsAt - now) : 0;
  const remaining = Math.ceil(remainingMs / 1000);
  const fraction = active ? Math.min(1, remainingMs / (timer.seconds * 1000)) : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div
      className={`timer-row ${active && remaining <= 5 ? 'timer-critical' : ''}`}
      style={{ visibility: active ? 'visible' : 'hidden' }}
      aria-hidden={!active}
    >
      <span className="timer-clock">
        <Timer size={13} /> {mm}:{ss}
      </span>
      <div className="timer-track" role="progressbar" aria-valuenow={remaining}>
        <div className="timer-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}
