import type { Session, VoteValue } from '@fibo/shared';
import { VoteGlyph } from './VoteGlyph';

/**
 * Consensus readout: its own card in the rail. Always present so the
 * column never reshuffles; shows a placeholder until the cards are up.
 */
export function RoundResult({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const revealed = session.revealed && !!story;

  let tally: [VoteValue, number][] = [];
  let noVotes = 0;
  if (revealed) {
    const votes = Object.values(story?.votes ?? {});
    const counts = new Map<VoteValue, number>();
    for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
    tally = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    // Seats that flipped without a vote — the ? cards on the table.
    noVotes = Object.keys(session.users ?? {}).length - votes.length;
  }

  return (
    <div className="rail-section rail-card round-result">
      <div className="eyebrow">consensus</div>
      <div className="result-headline">
        <span className={`result-value ${revealed ? '' : 'result-none'}`}>
          {revealed ? <VoteGlyph value={story?.result ?? null} /> : '?'}
        </span>
        {revealed && (tally.length > 0 || noVotes > 0) && (
          <span className="result-summary dim">
            {tally.map(([v, n], i) => (
              <span key={String(v)}>
                {i > 0 && ' · '}
                <VoteGlyph value={v} />
                ×{n}
              </span>
            ))}
            {noVotes > 0 && (
              <span>
                {tally.length > 0 && ' · '}?×{noVotes}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
