import styled, { css } from 'styled-components'
import { RailCard, dim } from '@/styles/shared.styled'
import { pop, rise } from '@/styles/primitives.styled'

export const ResultHeadline = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
`

export const ResultStrip = styled(RailCard)`
  && {

    animation: ${rise} 0.25s ease-out both;
    height: var(--strip-h);
    border-bottom: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: 0;
    padding-bottom: 0;

    @media (max-width: 860px) {
      height: auto;
      padding-top: 12px;
      padding-bottom: 12px;
    }
  }
`

export const ResultSummary = styled.span`
  ${dim}

  line-height: 1.6;

  font-size: var(--font-small);
`

export const ResultValue = styled.span<{ $none?: boolean }>`
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  animation: ${pop} 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.4) both;

  @media (max-height: 800px) and (min-width: 861px) {
    font-size: 24px;
  }

  ${(props) => props.$none && css`
  && {
    color: var(--dim);
    opacity: 0.5;
    animation: none;
  }
  `}
`
