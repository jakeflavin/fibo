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
      {disabled && !session.revealed && (
        <div className="deck-label dim">your hand — waiting for a story</div>
      )}
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
              <span className="play-card-value">{formatVote(value)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
