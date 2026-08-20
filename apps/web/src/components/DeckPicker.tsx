import { useState } from 'react'

import { DeckPickerCustom, DeckPickerPreview, DeckPickerSeg, PickerGrid } from './DeckPicker.styled'
import { SegCell } from '@/styles/shared.styled'
import type { DeckChoice, DeckPreset } from '@fibo/shared'
import { DECK_PRESETS, parseCustomDeck } from '@fibo/shared'

interface DeckPickerProps {
  value: DeckChoice
  onChange: (deck: DeckChoice | null) => void
}

const PRESETS: Array<{ id: DeckPreset; label: string }> = [
  { id: 'fib', label: 'Fibonacci' },
  { id: 'tshirt', label: 'T-shirt' },
  { id: 'custom', label: 'Custom' },
]

/**
 * Deck chooser shared by the home page and the in-session deck modal:
 * a segmented preset picker, a free-form input for custom decks, and a
 * live preview of the cards in rank order. Reports null while a custom
 * deck has fewer than two cards.
 */
export function DeckPicker({ value, onChange }: DeckPickerProps) {
  const [customText, setCustomText] = useState(
    value.preset === 'custom' ? value.cards.map(String).join(', ') : '',
  )

  const pick = (preset: DeckPreset) => {
    if (preset === 'custom') {
      const cards = parseCustomDeck(customText)
      onChange(cards ? { preset, cards } : null)
    } else {
      onChange({ preset, cards: DECK_PRESETS[preset] })
    }
  }

  return (
    <PickerGrid>
      <DeckPickerSeg role="radiogroup" aria-label="Deck">
        {PRESETS.map((p) => (
          <SegCell
            key={p.id}
            type="button"
            $active={value.preset === p.id}
            role="radio"
            aria-checked={value.preset === p.id}
            onClick={() => pick(p.id)}
          >
            {p.label}
          </SegCell>
        ))}
      </DeckPickerSeg>
      {value.preset === 'custom' && (
        <DeckPickerCustom>
          <input
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value)
              const cards = parseCustomDeck(e.target.value)
              onChange(cards ? { preset: 'custom', cards } : null)
            }}
            placeholder="XS, S, M, L, XL — low to high"
            aria-label="Custom deck cards"
            maxLength={80}
            autoFocus
          />
        </DeckPickerCustom>
      )}
      {value.preset === 'custom' && (
        <DeckPickerPreview>Enter at least two cards, lowest first.</DeckPickerPreview>
      )}
    </PickerGrid>
  )
}
