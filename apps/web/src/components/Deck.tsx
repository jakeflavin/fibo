import type { Session } from '@fibo/shared'
import { COFFEE, deckCards, SKIP } from '@fibo/shared'
import { castVote } from '../lib/api'
import { VoteGlyph } from './VoteGlyph'

interface DeckProps {
  session: Session
  myUserId: string
}

/**
 * The player's hand: one card per deck value, played face-down with a
 * second click to take it back. Locks while no story is on the table or
 * after the flip.
 */
export function Deck({ session, myUserId }: DeckProps) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined
  const myVote = story?.votes?.[myUserId]
  const disabled = !story || session.revealed

  return (
    <div className="deck" data-disabled={disabled || undefined}>
      <div className="deck-cards">
        {[...deckCards(session), SKIP, COFFEE].map((value) => {
          const selected = !disabled && myVote === value
          return (
            <button
              key={String(value)}
              className={`play-card ${selected ? 'play-card-selected' : ''} ${
                typeof value !== 'number' ? 'play-card-skip' : ''
              }`}
              disabled={disabled}
              onClick={() =>
                void castVote(session.id, story!.id, myUserId, selected ? null : value)
              }
              aria-pressed={selected}
              title={
                value === 'skip'
                  ? 'Skip this story'
                  : value === 'coffee'
                    ? 'Coffee break'
                    : typeof value === 'number'
                      ? `${value} points`
                      : String(value)
              }
            >
              <span className="play-card-value">
                <VoteGlyph value={value} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
