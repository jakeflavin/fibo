import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import type { Session } from '@fibo/shared'
import { deleteStory, updateStoryTitle } from '@/lib/api'
import { ConfirmModal } from './ConfirmModal'
import { identityVars, PixelAvatar } from './PixelAvatar'
import { VoteGlyph } from './VoteGlyph'

interface CardTableProps {
  session: Session
  myUserId: string
  canLead: boolean
}

/**
 * The stage: the active story's title (with lead-only inline edit and
 * delete), every player's seat card packed to fit the space, and the
 * round's reveal state.
 */
/**
 * Deterministic per-user "thrown on the table" scatter: a small tilt and
 * drop derived from the user id, so cards land naturally but never
 * reshuffle mid-round (and agree across every client).
 */
function scatter(uid: string) {
  let h = 0
  for (const c of uid) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { tilt: (h % 11) - 5, dy: (h >> 4) % 6 }
}

export function CardTable({ session, myUserId, canLead }: CardTableProps) {
  const users = session.users ?? {}
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined
  const votes = story?.votes ?? {}
  const revealed = session.revealed && !!story

  // The table never scrolls: the pile re-packs and the cards resize to
  // whatever space the stage offers. The stage is measured live; when it
  // can't be measured yet the pile renders at scale and corrects itself
  // on the first layout pass.
  const seatsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null)
  // Inline title editing + delete confirmation (leads only).
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // The hover actions live inline after the last character; when the
  // title truncates they'd be clipped, so they overlay the corner instead.
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [titleClipped, setTitleClipped] = useState(false)
  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    const check = () => setTitleClipped(el.scrollHeight > el.clientHeight + 1)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    return () => ro.disconnect()
  })
  const [fitScale, setFitScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => {
      const outer = seatsRef.current
      const inner = innerRef.current
      if (!outer || !inner || inner.offsetHeight === 0) return
      setStage((prev) => {
        const w = outer.clientWidth
        const h = outer.clientHeight
        return prev && prev.w === w && prev.h === h ? prev : { w, h }
      })
      // Last-resort uniform shrink for layouts no packing can fit.
      const s = Math.min(
        1,
        outer.clientHeight / inner.offsetHeight,
        outer.clientWidth / inner.offsetWidth,
      )
      setFitScale((prev) => (Math.abs(prev - s) > 0.01 ? s : prev))
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (seatsRef.current) ro.observe(seatsRef.current)
    if (innerRef.current) ro.observe(innerRef.current)
    return () => ro.disconnect()
  })

  // Guard against partial records (e.g. a kicked client's presence
  // write); spectators watch from the rail, not the table.
  const seats = Object.entries(users)
    .filter(([, u]) => u && u.name && u.role !== 'spectator')
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)

  // Pick the row count that gives the biggest cards for the measured
  // stage: fewer, wider rows on big screens; extra rows appear as the
  // screen narrows and a wide row would squeeze the cards too small.
  // Mirrors the CSS budget: height (H-56)/rows - 36, width via the 0.72
  // card aspect with 24px of per-seat label/gap overhead.
  const n = Math.max(1, seats.length)
  let rowCount = 1
  if (stage) {
    let best = -Infinity
    for (let r = 1; r <= n; r++) {
      const cols = Math.ceil(n / r)
      const size = Math.min((stage.h - 56) / r - 36, ((stage.w - 24) / cols - 28) / 0.72, 280)
      if (size > best) {
        best = size
        rowCount = r
      }
    }
  } else {
    rowCount = Math.max(1, Math.ceil(n / 4))
  }

  // Deal the seats into balanced rows, deterministic in join order.
  const rows: (typeof seats)[] = []
  {
    const base = Math.floor(seats.length / rowCount)
    const extra = seats.length % rowCount
    let i = 0
    for (let r = 0; r < rowCount; r++) {
      const size = base + (r < extra ? 1 : 0)
      rows.push(seats.slice(i, i + size))
      i += size
    }
  }

  // Widest row: cards also size against the horizontal room they share.
  const cols = rows.reduce((m, r) => Math.max(m, r.length), 1)

  if (!story) {
    return (
      <div className="table-panel">
        <div className="table-empty">
          <p className="dim">No story on the table.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-panel">
      <div className="story-line">
        {editingTitle === null ? (
          <h2
            className={`story-title ${titleClipped ? 'story-title-overflow' : ''}`}
            ref={titleRef}
            title={story.title}
          >
            {story.title}
            {canLead && (
              <span className="title-actions">
                <button
                  className="btn btn-ghost title-action"
                  aria-label="Edit story title"
                  onClick={() => setEditingTitle(story.title)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-ghost title-action"
                  aria-label="Delete story"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            )}
          </h2>
        ) : (
          <form
            className="title-edit"
            onSubmit={(e) => {
              e.preventDefault()
              const t = editingTitle.trim()
              if (t && t !== story.title) void updateStoryTitle(session.id, story.id, t)
              setEditingTitle(null)
            }}
            onBlur={(e) => {
              // Clicking anywhere outside the editor cancels.
              if (!e.currentTarget.contains(e.relatedTarget)) setEditingTitle(null)
            }}
          >
            <div className="text-field title-edit-field">
              <input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                maxLength={200}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingTitle(null)
                }}
              />
            </div>
            <span className="title-edit-actions">
              <button
                className="btn title-edit-action"
                type="submit"
                disabled={!editingTitle.trim()}
                aria-label="Save title"
              >
                <Check size={14} />
              </button>
              <button
                className="btn title-edit-action"
                type="button"
                onClick={() => setEditingTitle(null)}
                aria-label="Cancel editing"
              >
                <X size={14} />
              </button>
            </span>
          </form>
        )}
      </div>
      {confirmDelete &&
        createPortal(
          <ConfirmModal
            title="Delete story"
            message={
              <>
                Remove <strong>{story.title}</strong> from the queue?
              </>
            }
            confirmLabel="Delete"
            onConfirm={() => {
              setConfirmDelete(false)
              void deleteStory(session, story.id)
            }}
            onClose={() => setConfirmDelete(false)}
          />,
          document.body,
        )}

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
            <div key={ri} className="seat-row">
              {row.map(([uid, user]) => {
                const vote = votes[uid]
                const hasVoted = vote !== undefined
                const isMe = uid === myUserId
                const state = revealed
                  ? 'revealed'
                  : hasVoted
                    ? 'voted'
                    : user.online
                      ? 'thinking'
                      : 'away'
                return (
                  <div
                    key={uid}
                    className={`seat seat-${state} ${hasVoted ? 'seat-has-vote' : ''} ${
                      isMe ? 'seat-me' : ''
                    } identity`}
                    style={identityVars(user.identity)}
                  >
                    <div className="seat-unit">
                      <div
                        className={`seat-card ${revealed ? 'flipped' : ''}`}
                        style={
                          {
                            '--tilt': `${scatter(uid).tilt}deg`,
                            '--dy': `${scatter(uid).dy}px`,
                          } as React.CSSProperties
                        }
                      >
                        <div className="seat-card-inner">
                          <div className="seat-card-back">
                            <PixelAvatar
                              identity={user.identity}
                              size={38}
                              ink={hasVoted ? 'var(--bg)' : 'var(--idc)'}
                            />
                          </div>
                          <div className="seat-card-front">
                            {/* Corner indices, like a real playing card. */}
                            {revealed && (
                              <>
                                <span className="seat-card-corner">
                                  {hasVoted ? <VoteGlyph value={vote} /> : '?'}
                                </span>
                                <span className="seat-card-corner seat-card-corner-br">
                                  {hasVoted ? <VoteGlyph value={vote} /> : '?'}
                                </span>
                              </>
                            )}
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
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
