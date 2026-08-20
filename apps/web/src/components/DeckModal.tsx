import { useState } from 'react'
import { Button, ModalActions, PanelBody } from '@/styles/shared.styled'
import type { DeckChoice, Session } from '@fibo/shared'
import { deckCards } from '@fibo/shared'
import { setDeck } from '@/lib/api'
import { DeckPicker } from './DeckPicker'
import { Modal } from './Modal'

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

  return (
    <Modal title="Change deck" onClose={onClose}>
      <DeckPicker value={choice ?? { preset: 'custom', cards: [] }} onChange={setChoice} />
      <PanelBody $dim>
        Stories already pointed keep their values unless they're repointed.
      </PanelBody>
      <ModalActions>
        <Button  onClick={onClose}>
          Cancel
        </Button>
        <Button $primary
          
          disabled={!choice}
          onClick={() => {
            if (!choice) return
            void setDeck(session.id, choice)
            onClose()
          }}>
          Save deck
        </Button>
      </ModalActions>
    </Modal>
  )
}
