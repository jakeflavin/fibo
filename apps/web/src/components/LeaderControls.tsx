import { RotateCcw } from 'lucide-react'
import { Chip, ControlsActions, ControlsBar, ControlsPanel, ControlsSep, ResultEdit } from './LeaderControls.styled'
import { Button, Eyebrow, Seg, SegCell } from '@/styles/shared.styled'
import type { Session } from '@fibo/shared'
import { COFFEE, SKIP, deckCards } from '@fibo/shared'
import { revealCards, revote, setAutoFlip, setResult, startTimer } from '@/lib/api'
import { VoteGlyph } from './VoteGlyph'

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '2m', seconds: 120 },
]

/**
 * Every leader/owner-only round action, colocated at the top of the rail.
 * The block's structure never changes — actions enable and disable with the
 * round state instead of appearing and disappearing.
 */
export function LeaderControls({ session }: { session: Session }) {
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined
  const revealed = session.revealed && !!story
  const timer = session.timer ?? null

  return (
    <ControlsPanel>
      <Eyebrow>Controls</Eyebrow>
      {/* One toolbar row: round zone | result zone. */}
      <ControlsBar>
        <Button $primary data-btn-flip
          
          disabled={!story || revealed}
          onClick={() => void revealCards(session)}>
          Flip
        </Button>
        <Seg>
          {PRESETS.map((p) => (
            <SegCell as="button"
              key={p.seconds}
              
              disabled={!story || revealed || !!timer}
              onClick={() => void startTimer(session.id, p.seconds)}
              title={`Start a ${p.label} countdown — cards auto-flip at zero`}>
              {p.label}
            </SegCell>
          ))}
          <SegCell
            $active={!!session.autoFlip}
            aria-pressed={!!session.autoFlip}
            onClick={() => void setAutoFlip(session.id, !session.autoFlip)}
            title="Flip automatically once everyone online has voted"
          >
            Auto
          </SegCell>
        </Seg>
        <ControlsSep/>
        <ResultEdit>
          {[...deckCards(session), SKIP, COFFEE].map((v) => (
            <Chip
              key={String(v)}
              $active={revealed && story?.result === v}
              disabled={!revealed}
              onClick={() => story && void setResult(session.id, story.id, v)}
            >
              <VoteGlyph value={v} />
            </Chip>
          ))}
        </ResultEdit>
        <ControlsActions>
          <Button $icon
            
            disabled={!revealed}
            onClick={() => void revote(session)}
            title="Clear votes and go another round"
            aria-label="Repoint this story">
            <RotateCcw size={15} />
          </Button>
        </ControlsActions>
      </ControlsBar>
    </ControlsPanel>
  )
}
