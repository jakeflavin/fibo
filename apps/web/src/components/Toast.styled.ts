import styled, { css } from 'styled-components'
import { rise } from '@/styles/primitives.styled'

export const ToastStack = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  pointer-events: none;
`

export const ToastNote = styled.div<{ $error?: boolean }>`
  background: var(--surface-hi);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: var(--shadow-float);
  animation: ${rise} 0.2s ease-out both;

  ${(props) => props.$error && css`
  && {
    border-color: var(--danger);
    color: var(--danger);
  }
  `}
`
