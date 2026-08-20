import styled from 'styled-components'
import { ResultStrip } from '@/components/RoundResult.styled'
import { TeamCard } from '@/components/Participants.styled'
import { Seats, TablePanel } from '@/components/CardTable.styled'
import { Eyebrow, RailSection } from '@/styles/shared.styled'

export const RoomGrid = styled.main`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 0;
  flex: 1;
  min-height: 0;

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }
`

export const RoomMain = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  min-width: 0;
`

export const RoomShell = styled.div`
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--surface);

  /*
   * Below 860 the shell grows with its content instead of being clipped to the
   * window, and the hand leaves the stage to become a fixed bottom bar. It used
   * to take height:auto, which is right on a phone — where the page always
   * overflows — and left 261px of empty ground on a tablet in portrait, where
   * it does not: a footer floating mid-page with the deck parked at the bottom
   * of the glass. A minimum of one viewport keeps the room filling the window,
   * and the padding reserves the bar's real height so the footer lands just
   * above it rather than behind it.
   */
  @media (max-width: 860px) {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    padding-bottom: 116px;
  }

  /* The hand deals into a 5x2 grid here, so the bar is taller. */
  @media (max-width: 480px) {
    padding-bottom: 176px;
  }
`

export const RoomSide = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 0;
  font-size: var(--font-body);
  min-width: 0;
  min-height: 0;
  border-left: 1px solid var(--line);

  > ${RailSection} + ${RailSection} {
    border-top: 1px solid var(--line);
  }

  > ${ResultStrip} + ${RailSection} {
    border-top: 0;
  }

  > ${RailSection} {
    flex-shrink: 0;
  }

  > ${TeamCard} {
    flex: none;
    height: 300px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  > ${RailSection}:last-child {
    flex: 1 1 auto;
    min-height: 200px;
    display: flex;
    flex-direction: column;
  }

  > ${RailSection}:last-child > ${Eyebrow} {
    flex-shrink: 0;
  }

  @media (max-width: 860px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-left: none;
    border-top: 1px solid var(--line);
  }

  @media (max-width: 860px) {
    > ${ResultStrip} {
      grid-column: 1 / -1;
      border-bottom: 0;
    }
  }

  @media (max-width: 860px) {
    > ${ResultStrip} + ${RailSection} {
      border-top: 1px solid var(--line);
    }
  }

  @media (max-width: 860px) {
    > ${RailSection}:last-child {
      flex: none;
      min-height: 0;
      display: block;
    }
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }

  /* When team and queue share a row, a vertical hairline splits them. */
  @media (max-width: 860px) and (min-width: 481px) {
    > ${RailSection}:last-child {
      border-left: 1px solid var(--line);
    }
  }
`

export const RoomTable = styled.section`
  flex: 1;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
  min-width: 0;
  padding: 8px 20px 12px;

  > ${TablePanel} {
    align-self: stretch;
    min-height: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  ${Seats} {
    flex: 1;
  }

  @media (max-height: 800px) and (min-width: 861px) {
    gap: 16px;
  }

  @media (max-width: 860px) {
    grid-template-rows: none;
  }

  @media (max-width: 860px) {
    > ${TablePanel} {
      max-height: none;
      overflow-y: visible;
    }
  }
`
