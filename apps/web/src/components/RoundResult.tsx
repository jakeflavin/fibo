import type { Session, VoteValue } from '@fibo/shared';
import { formatVote } from '@fibo/shared';

/**
 * Consensus readout in the rail. Always present so the column never
 * reshuffles; shows a placeholder until the cards are up.
 */
export function RoundResult({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const revealed = session.revealed && !!story;

  let summary = '';
  if (revealed) {
    const votes = Object.values(story?.votes ?? {});
    const counts = new Map<VoteValue, number>();
    for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
    summary = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([v, n]) => `${formatVote(v)}×${n}`)
      .join(' · ');
  }

  return (
    <div className="rail-section round-result">
      <div className="eyebrow">consensus</div>
      <div className="result-headline">
        <span className={`result-value ${revealed ? '' : 'result-none'}`}>
          {revealed ? formatVote(story?.result ?? null) : '—'}
        </span>
        {revealed && summary && <span className="result-summary dim">{summary}</span>}
      </div>
    </div>
  );
}
