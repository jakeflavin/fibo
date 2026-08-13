import { useLayoutEffect, useRef, useState } from 'react';
import type { Session } from '@fibo/shared';
import { identityVars, PixelAvatar } from './PixelAvatar';
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

export function CardTable({ session, myUserId, canLead }: Props) {
  const users = session.users ?? {};
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const revealed = session.revealed && !!story;

  // The table never scrolls: the pile re-packs and the cards resize to
  // whatever space the stage offers. The stage is measured live; when it
  // can't be measured yet the pile renders at scale and corrects itself
  // on the first layout pass.
  const seatsRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null);
  const [fitScale, setFitScale] = useState(1);
  useLayoutEffect(() => {
    const fit = () => {
      const outer = seatsRef.current;
      const inner = innerRef.current;
      if (!outer || !inner || inner.offsetHeight === 0) return;
      setStage((prev) => {
        const w = outer.clientWidth;
        const h = outer.clientHeight;
        return prev && prev.w === w && prev.h === h ? prev : { w, h };
      });
      // Last-resort uniform shrink for layouts no packing can fit.
      // +24 covers the alternating row stagger offsets.
      const s = Math.min(
        1,
        outer.clientHeight / inner.offsetHeight,
        outer.clientWidth / (inner.offsetWidth + 24),
      );
      setFitScale((prev) => (Math.abs(prev - s) > 0.01 ? s : prev));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (seatsRef.current) ro.observe(seatsRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  });

  const seats = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  // Pick the row count that gives the biggest cards for the measured
  // stage: fewer, wider rows on big screens; extra rows appear as the
  // screen narrows and a wide row would squeeze the cards too small.
  // Mirrors the CSS budget: height (H-48)/rows - 40, width via the 0.72
  // card aspect with 46px of per-seat label/gap overhead.
  const n = Math.max(1, seats.length);
  let rowCount = 1;
  if (stage) {
    let best = -Infinity;
    for (let r = 1; r <= n; r++) {
      const cols = Math.ceil(n / r);
      const size = Math.min(
        (stage.h - 48) / r - 40,
        ((stage.w - 28) / cols - 46) / 0.72,
        260,
      );
      if (size > best) {
        best = size;
        rowCount = r;
      }
    }
  } else {
    rowCount = Math.max(1, Math.ceil(n / 4));
  }

  // Deal the seats into balanced rows, deterministic in join order.
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

      <div
        className="seats"
        ref={seatsRef}
        style={{ '--rows': rows.length, '--cols': cols } as React.CSSProperties}
      >
        <div
          className="seats-inner"
          ref={innerRef}
          style={{ transform: fitScale < 1 ? `scale(${fitScale})` : undefined }}
        >
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="seat-row"
              style={{ transform: `translateX(${ri % 2 ? 12 : -12}px)` }}
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
                      marginLeft: s.gap,
                    }}
                  >
                    <div
                      className="seat-unit"
                      style={
                        {
                          '--tilt': `${s.tilt}deg`,
                          '--dx': `${s.dx}px`,
                          '--dy': `${s.dy}px`,
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
    </div>
  );
}
