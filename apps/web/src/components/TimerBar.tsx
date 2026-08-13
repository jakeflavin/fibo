import type { Session } from '@fibo/shared';
import { clearTimer, startTimer } from '../lib/api';
import { useNow } from '../lib/useSession';

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
];

export function TimerBar({ session, canLead }: { session: Session; canLead: boolean }) {
  const timer = session.timer ?? null;
  const now = useNow(!!timer);

  if (session.revealed) return null;

  if (!timer) {
    if (!canLead) return null;
    return (
      <div className="timer-row">
        <span className="dim">timer:</span>
        {PRESETS.map((p) => (
          <button
            key={p.seconds}
            className="chip"
            onClick={() => void startTimer(session.id, p.seconds)}
            title={`Start a ${p.label} countdown — cards auto-flip at zero`}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
  }

  const remainingMs = Math.max(0, timer.endsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const fraction = Math.min(1, remainingMs / (timer.seconds * 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div className={`timer-row timer-live ${remaining <= 5 ? 'timer-critical' : ''}`}>
      <span className="timer-clock">
        ⏱ {mm}:{ss}
      </span>
      <div className="timer-track" role="progressbar" aria-valuenow={remaining}>
        <div className="timer-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
      {canLead && (
        <button className="chip" onClick={() => void clearTimer(session.id)}>
          cancel
        </button>
      )}
    </div>
  );
}
