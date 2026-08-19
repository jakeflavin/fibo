import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { DeckChoice, Session } from '@fibo/shared'
import { deckCards } from '@fibo/shared'
import { setDeck } from '../lib/api'
import { DeckPicker } from './DeckPicker'

interface DeckModalProps {
  session: Session
  onClose: () => void
}

/**
 * Admin-only deck switcher. Changing the deck restyles the hand and the
 * point ruler for everyone; stories already pointed keep their values
 * until someone repoints them.
 */
export function DeckModal({ session, onClose }: DeckModalProps) {
  const [choice, setChoice] = useState<DeckChoice | null>(() => ({
    preset: session.deck?.preset ?? 'fib',
    cards: deckCards(session),
  }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Change deck"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <span className="eyebrow">Change deck</span>
          <button className="btn btn-ghost modal-close" onClick={onClose} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <DeckPicker value={choice ?? { preset: 'custom', cards: [] }} onChange={setChoice} />
        <p className="panel-body dim">
          Stories already pointed keep their values unless they're repointed.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!choice}
            onClick={() => {
              if (!choice) return
              void setDeck(session.id, choice)
              onClose()
            }}
          >
            Save deck
          </button>
        </div>
      </div>
    </div>
  )
}
