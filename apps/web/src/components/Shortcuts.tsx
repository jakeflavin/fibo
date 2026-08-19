import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { COFFEE, deckCards, SKIP } from '@fibo/shared';
import { castVote, revealCards, revote } from '../lib/api';

interface ShortcutsProps {
  session: Session;
  myUserId: string;
  canLead: boolean;
  /** True while this user can play cards (not a spectator). */
  canVote: boolean;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Fixed keyboard shortcuts for the room, plus the cheat-sheet modal
 * (gear menu → "Keyboard shortcuts", or the ? key). Keys never fire
 * while typing in a field or with a modifier held.
 */
export function Shortcuts({ session, myUserId, canLead, canVote, open, onOpen, onClose }: ShortcutsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as Element | null;
      if (target?.closest('input, textarea, [contenteditable="true"]')) return;

      if (e.key === '?') {
        e.preventDefault();
        onOpen();
        return;
      }
      if (e.key === 'Escape' && open) {
        onClose();
        return;
      }

      const story = session.currentStoryId
        ? session.stories?.[session.currentStoryId]
        : undefined;
      const key = e.key.toLowerCase();

      // Round controls (leads).
      if (canLead && story) {
        if (key === 'f' && !session.revealed) {
          void revealCards(session);
          return;
        }
        if (key === 'r' && session.revealed) {
          void revote(session);
          return;
        }
      }

      // Playing cards: digits pick the nth card; pressing it again
      // takes the card back, exactly like clicking.
      if (!canVote || !story || session.revealed) return;
      const cards = deckCards(session);
      let value = null;
      if (/^[0-9]$/.test(e.key)) {
        // Reading the card decides it: the bounds test alone left `value` a maybe, and a
        // digit past the end of the deck should do nothing rather than clear the vote.
        const index = e.key === '0' ? 9 : Number(e.key) - 1;
        value = cards[index] ?? null;
      } else if (key === 's') {
        value = SKIP;
      } else if (key === 'c') {
        value = COFFEE;
      }
      if (value === null) return;
      const mine = story.votes?.[myUserId] ?? null;
      void castVote(session.id, story.id, myUserId, mine === value ? null : value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, myUserId, canLead, canVote, open, onOpen, onClose]);

  if (!open) return null;

  const cardCount = Math.min(deckCards(session).length, 10);
  const rows: Array<[string, string, boolean]> = [
    [`1–${Math.min(cardCount, 9)}${cardCount === 10 ? ', 0' : ''}`, 'Play a card (deck order)', canVote],
    ['S', 'Play the skip card', canVote],
    ['C', 'Play the coffee card', canVote],
    ['F', 'Flip the cards', canLead],
    ['R', 'Repoint the story', canLead],
    ['?', 'Show this dialog', true],
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <span className="eyebrow">Keyboard shortcuts</span>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <ul className="shortcut-list">
          {rows
            .filter(([, , show]) => show)
            .map(([keys, what]) => (
              <li key={keys} className="shortcut-row">
                <kbd className="kbd">{keys}</kbd>
                <span>{what}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
