import styled, { css } from 'styled-components'
import { rise } from '@/styles/primitives.styled'
import { TextField } from '@/styles/shared.styled'

export const StoryAdd = styled.form`
  margin-bottom: 12px;
  flex-shrink: 0;

  ${TextField} {
    padding: 6px 10px;
  }
`

export const StoryBadge = styled.span`
  color: var(--dim);
  flex-shrink: 0;
  font-size: var(--font-small);
  min-width: 26px;
`

export const StoryRowTitle = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--font-body);
`

export const QueueRow = styled.li<{ $clickable?: boolean; $dragging?: boolean }>`
  /* The story on the table: tinted row, visible on the card surface. */
  &[data-status='active'] {
    background: var(--accent-dim);
  }

  &[data-status='active'] ${StoryBadge},
  &[data-status='done'] ${StoryBadge} {
    color: var(--accent);
  }

  &[data-status='done'] ${StoryRowTitle} {
    color: var(--dim);
  }

  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 4px 8px;
  border-left: 2px solid transparent;
  border-radius: 0 6px 6px 0;
  animation: ${rise} 0.2s ease-out both;
  min-width: 0;

  &:hover {
    background: var(--surface-hi);
  }

  ${(props) => props.$clickable && css`
  && {
    cursor: pointer;
  }

  &&:hover ${StoryRowTitle} {
    color: var(--accent);
  }

  &&:focus-visible ${StoryRowTitle} {
    color: var(--accent);
  }

  &&:focus-visible {
    outline: 1px solid var(--accent);
    outline-offset: -1px;
  }
  `}

  ${(props) => props.$dragging && css`
  && {
    position: relative;
    z-index: 5;
    background: var(--surface);
    box-shadow: var(--shadow-float);
    cursor: grabbing;
  }
  `}
`

export const StoryList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 2px;
  align-content: start;
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  @media (max-width: 860px) {
    max-height: 44vh;
  }
`
