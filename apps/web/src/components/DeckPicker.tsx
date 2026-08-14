import { useState } from 'react';
import type { DeckChoice, DeckPreset } from '@fibo/shared';
import { DECK_PRESETS, parseCustomDeck } from '@fibo/shared';

interface Props {
  value: DeckChoice;
  onChange: (deck: DeckChoice | null) => void;
}

const PRESETS: Array<{ id: DeckPreset; label: string }> = [
  { id: 'fib', label: 'Fibonacci' },
  { id: 'tshirt', label: 'T-shirt' },
  { id: 'custom', label: 'Custom' },
];

/**
 * Deck chooser shared by the home page and the in-session deck modal:
 * a segmented preset picker, a free-form input for custom decks, and a
 * live preview of the cards in rank order. Reports null while a custom
 * deck has fewer than two cards.
 */
export function DeckPicker({ value, onChange }: Props) {
  const [customText, setCustomText] = useState(
    value.preset === 'custom' ? value.cards.map(String).join(', ') : '',
  );

  const pick = (preset: DeckPreset) => {
    if (preset === 'custom') {
      const cards = parseCustomDeck(customText);
      onChange(cards ? { preset, cards } : null);
    } else {
      onChange({ preset, cards: DECK_PRESETS[preset] });
    }
  };

  return (
    <div className="deck-picker">
      <div className="seg deck-picker-seg" role="radiogroup" aria-label="Deck">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`seg-cell ${value.preset === p.id ? 'seg-cell-active' : ''}`}
            role="radio"
            aria-checked={value.preset === p.id}
            onClick={() => pick(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="text-field deck-picker-custom">
          <input
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              const cards = parseCustomDeck(e.target.value);
              onChange(cards ? { preset: 'custom', cards } : null);
            }}
            placeholder="XS, S, M, L, XL — low to high"
            aria-label="Custom deck cards"
            maxLength={80}
            autoFocus
          />
        </div>
      )}
      {value.preset === 'custom' && (
        <div className="deck-picker-preview dim">Enter at least two cards, lowest first.</div>
      )}
    </div>
  );
}
