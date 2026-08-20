import type { Session } from '@fibo/shared'
import { DeckBox, DeckCards, PlayCard, PlayCardValue } from './Deck.styled'
import { COFFEE, deckCards, SKIP } from '@fibo/shared'
import { castVote } from '@/lib/api'
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
    <DeckBox  data-disabled={disabled || undefined}>
      <DeckCards>
        {[...deckCards(session), SKIP, COFFEE].map((value) => {
          const selected = !disabled && myVote === value
          return (
            <PlayCard
              key={String(value)}
              $selected={selected}
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
              <PlayCardValue>
                <VoteGlyph value={value} />
              </PlayCardValue>
            </PlayCard>
          )
        })}
      </DeckCards>
    </DeckBox>
  )
}
