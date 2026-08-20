import styled, { css } from 'styled-components'
import { blink } from '@/styles/primitives.styled'

export const TimerClock = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  font-size: var(--font-body);
`

export const TimerFill = styled.div`
  height: 100%;
  background: var(--accent);
  transition: width 0.25s linear;
`

export const TimerTrack = styled.div`
  flex: 1;
  min-width: 140px;
  height: 3px;
  background: var(--line);
  border-radius: 2px;
  overflow: hidden;
`

export const TimerRow = styled.div<{ $critical?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 36px;

  ${(props) => props.$critical && css`
  && ${TimerClock} {
    color: var(--danger);
    animation: ${blink} 0.6s steps(1) infinite;
  }

  && ${TimerFill} {
    background: var(--danger);
  }
  `}
`
