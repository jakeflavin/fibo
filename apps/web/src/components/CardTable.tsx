import type { Session, VoteValue } from '@fibo/shared';
import { DECK, formatVote, IDENTITY_SETS } from '@fibo/shared';
import { finalizeStory, revealCards, revote, setResult } from '../lib/api';
import { PixelAvatar } from './PixelAvatar';
import { TimerBar } from './TimerBar';

interface Props {
  session: Session;
  myUserId: string;
  canLead: boolean;
}

export function CardTable({ session, myUserId, canLead }: Props) {
  const users = session.users ?? {};
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const revealed = session.revealed && !!story;

  const seats = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
  const voteCount = Object.keys(votes).length;
  const onlineCount = Object.values(users).filter((u) => u.online).length;
  const everyoneVoted = voteCount > 0 && voteCount >= onlineCount;

  if (!story) {
    return (
      <div className="table-panel">
        <div className="table-empty">
          <p className="dim">no story on the table.</p>
          <p className="dim">
            {canLead
              ? 'add a story to the queue and press point to start.'
              : 'waiting for a leader to pick a story…'}
            <span className="cursor">▊</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-panel">
      <div className="eyebrow">now pointing</div>
      <div className="story-line">
        <h2 className="story-title">{story.title}</h2>
      </div>

      <TimerBar session={session} canLead={canLead} />

      <div className="seats">
        {seats.map(([uid, user]) => {
          const vote = votes[uid];
          const hasVoted = vote !== undefined;
          const isMe = uid === myUserId;
          const state = revealed
            ? 'revealed'
            : hasVoted
              ? 'voted'
              : user.online
                ? 'thinking'
                : 'away';
          return (
            <div key={uid} className={`seat seat-${state} ${isMe ? 'seat-me' : ''}`}>
              <div className={`seat-card ${revealed && hasVoted ? 'flipped' : ''}`}>
                <div className="seat-card-inner">
                  <div className="seat-card-back">
                    {hasVoted ? <span className="card-check">✓</span> : <span className="card-wait">···</span>}
                  </div>
                  <div
                    className={`seat-card-front ${
                      revealed && hasVoted && vote === story.result ? 'card-winner' : ''
                    }`}
                  >
                    {/* Vote values stay out of the DOM until the flip. */}
                    {revealed ? (hasVoted ? formatVote(vote) : '—') : ''}
                  </div>
                </div>
              </div>
              <div className="seat-label">
                <PixelAvatar identity={user.identity} size={18} />
                <span
                  className="seat-name"
                  style={{ color: IDENTITY_SETS[user.identity % IDENTITY_SETS.length].color }}
                >
                  {user.name}
                </span>
              </div>
              <div className="seat-status dim">
                {state === 'voted' && '✓ locked in'}
                {state === 'thinking' && <span className="thinking">picking</span>}
                {state === 'away' && 'away'}
                {state === 'revealed' && (hasVoted ? '' : 'no vote')}
              </div>
            </div>
          );
        })}
      </div>

      {!revealed && (
        <div className="table-footer">
          <span className="dim">
            {voteCount}/{onlineCount} votes in{everyoneVoted ? ' — all set!' : ''}
          </span>
          {canLead && (
            <button
              className={`btn ${everyoneVoted ? 'btn-primary' : ''}`}
              disabled={voteCount === 0}
              onClick={() => void revealCards(session)}
            >
              flip cards
            </button>
          )}
        </div>
      )}

      {revealed && <ResultPanel session={session} canLead={canLead} />}
    </div>
  );
}

function ResultPanel({ session, canLead }: { session: Session; canLead: boolean }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  if (!story) return null;
  const votes = Object.values(story.votes ?? {});
  const counts = new Map<VoteValue, number>();
  for (const v of votes) counts.set(v, (counts.get(v) ?? 0) + 1);
  const summary = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([v, n]) => `${formatVote(v)}×${n}`)
    .join(' · ');

  return (
    <div className="result-panel">
      <div className="result-headline">
        <span className="dim">consensus:</span>
        <span className="result-value">{formatVote(story.result ?? null)}</span>
        {summary && <span className="result-summary dim">({summary})</span>}
      </div>
      {canLead ? (
        <>
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
        </>
      ) : (
        <p className="dim">waiting for a leader to accept the result…</p>
      )}
    </div>
  );
}
