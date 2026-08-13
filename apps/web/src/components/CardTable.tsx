import type { Session } from '@fibo/shared';
import { formatVote } from '@fibo/shared';
import { identityVars, PixelAvatar } from './PixelAvatar';
import { TimerBar } from './TimerBar';

interface Props {
  session: Session;
  myUserId: string;
  canLead: boolean;
}

/**
 * Deterministic per-user "thrown on the table" scatter: tilt, offset, and
 * irregular spacing derived from the user id, so cards never reshuffle
 * mid-round.
 */
function scatter(uid: string) {
  let h = 0;
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return {
    tilt: (h % 15) - 7,
    dx: ((h >> 4) % 11) - 5,
    dy: ((h >> 8) % 13) - 4,
    gap: (h >> 12) % 12,
  };
}

export function CardTable({ session, myUserId, canLead }: Props) {
  const users = session.users ?? {};
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const revealed = session.revealed && !!story;

  const seats = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  // Deal the seats into at least two staggered rows so the table reads as a
  // pile of thrown cards rather than a lineup. Rows stay balanced (max ~4 per
  // row) and the split is deterministic in join order.
  const rowCount = Math.min(seats.length, Math.max(2, Math.ceil(seats.length / 4)));
  const rows: (typeof seats)[] = [];
  {
    const base = Math.floor(seats.length / rowCount);
    const extra = seats.length % rowCount;
    let i = 0;
    for (let r = 0; r < rowCount; r++) {
      const size = base + (r < extra ? 1 : 0);
      rows.push(seats.slice(i, i + size));
      i += size;
    }
  }

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
      <div className="story-line">
        <h2 className="story-title">{story.title}</h2>
      </div>

      <TimerBar session={session} />

      <div className="seats">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="seat-row"
            style={{ transform: `translateX(${ri % 2 ? 28 : -16}px)` }}
          >
            {row.map(([uid, user]) => {
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
          const s = scatter(uid);
          return (
            <div
              key={uid}
              className={`seat seat-${state} ${hasVoted ? 'seat-has-vote' : ''} ${
                isMe ? 'seat-me' : ''
              } identity`}
              style={{
                ...identityVars(user.identity),
                transform: `translate(${s.dx}px, ${s.dy}px)`,
                marginLeft: s.gap,
              }}
            >
              <div
                className={`seat-card ${revealed && hasVoted ? 'flipped' : ''}`}
                style={{ '--tilt': `${s.tilt}deg` } as React.CSSProperties}
              >
                <div className="seat-card-inner">
                  <div className="seat-card-back">
                    <PixelAvatar
                      identity={user.identity}
                      size={38}
                      ink={hasVoted ? 'var(--bg)' : 'var(--dim)'}
                    />
                  </div>
                  <div className="seat-card-front">
                    {/* Vote values stay out of the DOM until the flip. */}
                    {revealed ? (hasVoted ? formatVote(vote) : '—') : ''}
                  </div>
                </div>
              </div>
              <div className="seat-label">
                <span className="seat-name">{user.name}</span>
              </div>
            </div>
          );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}
