import styled, { css } from 'styled-components'
import { Button, Eyebrow, RailCard } from '@/styles/shared.styled'

export const ControlsActions = styled.div`
  display: flex;
  gap: 6px;

  ${Button} {
    height: 32px;
    padding: 0 14px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
`

export const Chip = styled.button<{ $active?: boolean }>`
  background: transparent;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: var(--font-body);
  font-weight: 500;
  color: var(--dim);
  cursor: pointer;
  transition:
  color 0.1s ease,
  background 0.1s ease;

  &:hover {
    background: var(--surface-hi);
    color: var(--text);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:disabled:hover {
    background: transparent;
    color: var(--dim);
  }

  /* Selected state is a tint, not a fill — see SegCell. */
  ${(props) => props.$active && css`
  && {
    background: var(--accent-dim);
    color: var(--accent);
    font-weight: 600;
  }

  &&:hover {
    background: var(--accent-dim);
    color: var(--accent);
  }
  `}
`

export const ResultEdit = styled.div`
  display: flex;
  flex: 1;
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;

  ${Chip} {
    flex: 1;
    min-width: 0;
    height: 30px;
    padding: 0;
    border: none;
    border-radius: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-body);
  }

  ${Chip} + ${Chip} {
    border-left: 1px solid var(--line);
  }

  /*
   * Ten joined 31x30 cells on a phone, and each one silently overrides the
   * whole team's estimate. Where there is no pointer the ruler deals into a
   * 5-wide grid of finger-sized tiles instead — the same shape the hand takes
   * below 480px, so the two rows of point values match.
   */
  @media (hover: none) {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    border: 0;
    overflow: visible;

    ${Chip} {
      height: 44px;
      border: 1px solid var(--line);
      border-radius: 4px;
    }

    ${Chip} + ${Chip} {
      border-left: 1px solid var(--line);
    }
  }
`

export const ControlsSep = styled.div`
  width: 1px;
  height: 26px;
  background: var(--line);
  flex-shrink: 0;
`

export const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-body);
`

export const ControlsBar = styled(ControlsRow)`
  && {

    [data-btn-flip] {
      padding: 0 18px;
    }

    @media (max-width: 860px) {
      flex-wrap: wrap;
    }

    @media (max-width: 860px) {
      [data-btn-flip] {
        flex: 1;
      }
    }

    @media (max-width: 860px) {
      ${ResultEdit} {
        flex: 1 1 calc(100% - 44px);
      }
    }

    @media (max-width: 860px) {
      ${ControlsSep} {
        display: none;
      }
    }
  }
`

/* Its own heading sits tight against the toolbar rather than above a block of content. */
export const ControlsPanel = styled(RailCard)`
  && {

    > ${Eyebrow} {
      margin-bottom: 0;
    }

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 0 20px;
    height: var(--strip-h);
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;

    @media (max-width: 860px) {
      height: auto;
      padding-top: 12px;
      padding-bottom: 12px;
    }
  }
`
