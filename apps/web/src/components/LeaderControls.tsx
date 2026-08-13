import { RotateCcw } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { DECK } from '@fibo/shared';
import { revealCards, revote, setResult, startTimer } from '../lib/api';
import { VoteGlyph } from './VoteGlyph';

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
];

/**
 * Every leader/owner-only round action, colocated at the top of the rail.
 * The block's structure never changes — actions enable and disable with the
 * round state instead of appearing and disappearing.
 */
export function LeaderControls({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const revealed = session.revealed && !!story;
  const timer = session.timer ?? null;

  return (
    <div className="rail-section rail-card leader-controls">
      <div className="eyebrow">Controls</div>
      {/* One toolbar row: round zone | result zone. */}
      <div className="controls-row controls-bar">
        <button
          className="btn btn-primary btn-flip"
          disabled={!story || revealed}
          onClick={() => void revealCards(session)}
        >
          Flip
        </button>
        <div className="seg">
          {PRESETS.map((p) => (
            <button
              key={p.seconds}
              className="seg-cell"
              disabled={!story || revealed || !!timer}
              onClick={() => void startTimer(session.id, p.seconds)}
              title={`Start a ${p.label} countdown — cards auto-flip at zero`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="controls-sep" />
        <div className="result-edit">
          {DECK.map((v) => (
            <button
              key={String(v)}
              className={`chip ${revealed && story?.result === v ? 'chip-active' : ''}`}
              disabled={!revealed}
              onClick={() => story && void setResult(session.id, story.id, v)}
            >
              <VoteGlyph value={v} />
            </button>
          ))}
        </div>
        <div className="controls-actions">
          <button
            className="btn btn-icon"
            disabled={!revealed}
            onClick={() => void revote(session)}
            title="Clear votes and go another round"
            aria-label="Repoint this story"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
