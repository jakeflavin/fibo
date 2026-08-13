import type { Session } from '@fibo/shared';
import { DECK, formatVote } from '@fibo/shared';
import { castVote } from '../lib/api';

interface Props {
  session: Session;
  myUserId: string;
}

export function Deck({ session, myUserId }: Props) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const myVote = story?.votes?.[myUserId];
  const disabled = !story || session.revealed;

  return (
    <div className="deck" data-disabled={disabled || undefined}>
      <div className="deck-label dim">
        {disabled
          ? session.revealed && story
            ? '// cards are up — waiting for the next round'
            : '// your hand (waiting for a story)'
          : myVote !== undefined
            ? '// tap again to take it back'
            : '// pick a card'}
      </div>
      <div className="deck-cards">
        {DECK.map((value) => {
          const selected = !disabled && myVote === value;
          return (
            <button
              key={String(value)}
              className={`play-card ${selected ? 'play-card-selected' : ''} ${
                value === 'skip' ? 'play-card-skip' : ''
              }`}
              disabled={disabled}
              onClick={() =>
                void castVote(session.id, story!.id, myUserId, selected ? null : value)
              }
              aria-pressed={selected}
              title={value === 'skip' ? 'Skip this story' : `${value} points`}
            >
              <span className="play-card-corner">{formatVote(value)}</span>
              <span className="play-card-value">{formatVote(value)}</span>
              <span className="play-card-corner play-card-corner-br">{formatVote(value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
