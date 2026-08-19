import type { Session, VoteValue } from '@fibo/shared'
import { TimerBar } from './TimerBar'
import { VoteGlyph } from './VoteGlyph'

/**
 * Consensus readout: its own card in the rail. Always present so the
 * column never reshuffles; shows a placeholder until the cards are up.
 */
export function RoundResult({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined
  const revealed = session.revealed && !!story
  const timerRunning = !!session.timer && !revealed

  let tally: [VoteValue, number][] = []
  let questionMarks = 0
  if (revealed) {
    const votes = Object.values(story?.votes ?? {})
    const counts = new Map<VoteValue, number>()
    for (const v of votes) {
      // Skip votes render as ? — count them with the non-voters below.
      if (v === 'skip') continue
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
    tally = [...counts.entries()].sort((a, b) => b[1] - a[1])
    // Every ? card on the table: explicit skips plus missing votes.
    // Spectators have no card, so they never count as missing.
    const skips = votes.filter((v) => v === 'skip').length
    const players = Object.values(session.users ?? {}).filter(
      (u) => u?.name && u.role !== 'spectator',
    ).length
    questionMarks = skips + players - votes.length
  }

  return (
    <div className="rail-section rail-card round-result">
      <div className="eyebrow">Consensus</div>
      {timerRunning ? (
        <TimerBar session={session} />
      ) : (
        <div className="result-headline">
          <span className={`result-value ${revealed ? '' : 'result-none'}`}>
            {revealed ? <VoteGlyph value={story?.result ?? null} /> : '?'}
          </span>
          {revealed && (tally.length > 0 || questionMarks > 0) && (
            <span className="result-summary dim">
              {tally.map(([v, n], i) => (
                <span key={String(v)}>
                  {i > 0 && ' · '}
                  <VoteGlyph value={v} />×{n}
                </span>
              ))}
              {questionMarks > 0 && (
                <span>
                  {tally.length > 0 && ' · '}?×{questionMarks}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
