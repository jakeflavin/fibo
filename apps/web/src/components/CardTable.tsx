import { useLayoutEffect, useRef } from 'react';
import type { Session, VoteValue } from '@fibo/shared';
import { identityVars, PixelAvatar } from './PixelAvatar';
import { TimerBar } from './TimerBar';
import { VoteGlyph } from './VoteGlyph';

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
  // Ranges are sized against the row gap so rotated card corners can never
  // reach a neighbor: max |dx| 3px + ~6px of rotation spread stays inside
  // the 20px gap; vertical jitter stays inside the 12px row spacing plus the
  // name-label zone.
  return {
    tilt: (h % 13) - 6,
    dx: ((h >> 4) % 7) - 3,
    dy: ((h >> 8) % 8) - 3,
    gap: (h >> 12) % 9,
  };
}

/** Sort key for grouping: numbers ascending, then coffee, skip, no vote. */
function voteOrder(vote: VoteValue | undefined): number {
  if (vote === undefined) return Number.MAX_SAFE_INTEGER;
  if (vote === 'skip') return Number.MAX_SAFE_INTEGER - 1;
  if (vote === 'coffee') return Number.MAX_SAFE_INTEGER - 2;
  return vote;
}

export function CardTable({ session, myUserId, canLead }: Props) {
  const users = session.users ?? {};
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const revealed = session.revealed && !!story;

  // Leads toggle the revealed cards into one row per vote value so the
  // distribution is easy to read; the flag is shared session state.
  const grouped = revealed && !!session.grouped;

  // FLIP: remember where each seat was on the previous render and animate
  // it from there whenever the layout reshuffles.
  const seatEls = useRef(new Map<string, HTMLDivElement>());
  const prevRects = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    for (const [uid, el] of seatEls.current) {
      if (!el?.isConnected) continue;
      nextRects.set(uid, el.getBoundingClientRect());
    }
    for (const [uid, rect] of nextRects) {
      const prev = prevRects.current.get(uid);
      const el = seatEls.current.get(uid);
      if (!prev || !el) continue;
      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (Math.abs(dx) + Math.abs(dy) < 2) continue;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      void el.offsetWidth;
      el.style.transition = 'transform 0.7s cubic-bezier(0.3, 0.8, 0.3, 1)';
      el.style.transform = '';
      el.addEventListener(
        'transitionend',
        () => {
          el.style.transition = '';
        },
        { once: true },
      );
    }
    prevRects.current = nextRects;
  });

  const seats = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  let rows: (typeof seats)[];
  if (grouped) {
    // One row per distinct vote value, ascending; skip and non-voters sink
    // to the bottom.
    const byValue = new Map<number, typeof seats>();
    for (const seat of seats) {
      const key = voteOrder(votes[seat[0]]);
      const group = byValue.get(key);
      if (group) group.push(seat);
      else byValue.set(key, [seat]);
    }
    rows = [...byValue.entries()].sort((a, b) => a[0] - b[0]).map(([, group]) => group);
  } else {
    // Deal the seats into balanced rows of up to four, deterministic in
    // join order. Small teams get one row of big cards.
    const rowCount = Math.max(1, Math.ceil(seats.length / 4));
    rows = [];
    const base = Math.floor(seats.length / rowCount);
    const extra = seats.length % rowCount;
    let i = 0;
    for (let r = 0; r < rowCount; r++) {
      const size = base + (r < extra ? 1 : 0);
      rows.push(seats.slice(i, i + size));
      i += size;
    }
  }

  // Widest row: cards also size against the horizontal room they share.
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 1);

  if (!story) {
    return (
      <div className="table-panel">
        <div className="table-empty">
          <p className="dim">no story on the table.</p>
          <p className="dim">
            {canLead
              ? 'add a story to the queue and press point to start.'
              : 'waiting for a leader to pick a story…'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-panel">
      <div className="story-line">
        <h2 className="story-title" title={story.title}>
          {story.title}
        </h2>
      </div>

      <TimerBar session={session} />

      <div
        className={`seats ${grouped ? 'seats-grouped' : ''}`}
        style={{ '--rows': rows.length, '--cols': cols } as React.CSSProperties}
      >
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="seat-row"
            style={{ transform: `translateX(${grouped ? 0 : ri % 2 ? 28 : -16}px)` }}
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
                  ref={(el) => {
                    if (el) seatEls.current.set(uid, el);
                    else seatEls.current.delete(uid);
                  }}
                  className={`seat seat-${state} ${hasVoted ? 'seat-has-vote' : ''} ${
                    isMe ? 'seat-me' : ''
                  } identity`}
                  style={{
                    ...identityVars(user.identity),
                    marginLeft: grouped ? 0 : s.gap,
                  }}
                >
                  <div
                    className="seat-unit"
                    style={
                      {
                        '--tilt': grouped ? '0deg' : `${s.tilt}deg`,
                        '--dx': grouped ? '0px' : `${s.dx}px`,
                        '--dy': grouped ? '0px' : `${s.dy}px`,
                      } as React.CSSProperties
                    }
                  >
                    <div className={`seat-card ${revealed ? 'flipped' : ''}`}>
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
                          {revealed ? hasVoted ? <VoteGlyph value={vote} /> : '?' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="seat-label">
                      <span className="seat-name">{user.name}</span>
                    </div>
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
