import type { Session } from '@fibo/shared';
import { DECK, formatVote } from '@fibo/shared';
import {
  clearTimer,
  finalizeStory,
  revealCards,
  revote,
  setResult,
  startTimer,
} from '../lib/api';

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
];

/** Every leader/owner-only round action, colocated at the top of the rail. */
export function LeaderControls({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;

  if (!story) {
    return (
      <div className="rail-section leader-controls">
        <div className="eyebrow">controls</div>
        <p className="dim controls-hint">point a story from the queue to begin.</p>
      </div>
    );
  }

  if (!session.revealed) {
    const votes = story.votes ?? {};
    const voteCount = Object.keys(votes).length;
    const onlineCount = Object.values(session.users ?? {}).filter((u) => u.online).length;
    const everyoneVoted = voteCount > 0 && voteCount >= onlineCount;
    const timer = session.timer ?? null;

    return (
      <div className="rail-section leader-controls">
        <div className="eyebrow">controls</div>
        <button
          className={`btn ${everyoneVoted ? 'btn-primary' : ''}`}
          disabled={voteCount === 0}
          onClick={() => void revealCards(session)}
        >
          flip cards
        </button>
        <div className="controls-row">
          <span className="dim">timer:</span>
          {timer ? (
            <button className="chip" onClick={() => void clearTimer(session.id)}>
              cancel
            </button>
          ) : (
            PRESETS.map((p) => (
              <button
                key={p.seconds}
                className="chip"
                onClick={() => void startTimer(session.id, p.seconds)}
                title={`Start a ${p.label} countdown — cards auto-flip at zero`}
              >
                {p.label}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rail-section leader-controls">
      <div className="eyebrow">controls</div>
      <div className="result-edit">
        <span className="dim">override:</span>
        {DECK.map((v) => (
          <button
            key={String(v)}
            className={`chip ${story.result === v ? 'chip-active' : ''}`}
            onClick={() => void setResult(session.id, story.id, v)}
          >
            {formatVote(v)}
          </button>
        ))}
      </div>
      <div className="result-actions">
        <button className="btn" onClick={() => void revote(session)}>
          revote
        </button>
        <button className="btn btn-primary" onClick={() => void finalizeStory(session)}>
          accept &amp; next
        </button>
      </div>
    </div>
  );
}
