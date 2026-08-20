import styled, { css } from 'styled-components'

export const DeckBox = styled.div`
  display: grid;
  gap: 8px;
  justify-items: center;

  @media (max-width: 860px) {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    margin: 0;
    background: var(--surface);
    border-top: 1px solid var(--line);
    padding: 10px 14px calc(12px + env(safe-area-inset-bottom));
    z-index: 40;
    gap: 8px;
  }
`

export const DeckCards = styled.div`
  background: var(--bg);
  padding: 12px 16px;
  border-radius: 8px;

  display: flex;
  gap: 10px;
  width: 100%;

  @media (max-width: 860px) {
    justify-content: flex-start;
    flex-wrap: nowrap;
    max-width: 100%;
    padding: 8px 10px;
  }

  @media (max-width: 480px) {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
`

export const PlayCardValue = styled.span`
  font-size: 18px;
  font-weight: 600;

  @media (max-height: 800px) and (min-width: 861px) {
    font-size: 18px;
  }

  @media (max-width: 860px) {
    font-size: 17px;
  }
`

export const PlayCard = styled.button<{ $selected?: boolean }>`
  &::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid var(--line);
    border-radius: 5px;
    pointer-events: none;
  }

  flex: 1;
  min-width: 0;
  height: 76px;
  position: relative;
  background: var(--card-face);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow-play);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
  transform 0.12s ease,
  border-color 0.15s ease,
  background 0.15s ease,
  box-shadow 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: var(--control);
    box-shadow: var(--shadow-play-hover);
  }

  &:active:not(:disabled) {
    transform: none;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  @media (max-height: 800px) and (min-width: 861px) {
    height: 68px;
  }

  @media (max-width: 860px) {
    flex: 1 1 0;
    min-width: 0;
    height: 62px;
  }

  @media (max-width: 480px) {
    height: 56px;
  }

  ${(props) => props.$selected && css`
  &&::after {
    border-color: color-mix(in srgb, var(--accent) 35%, transparent);
  }

  && {
    transform: none;
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  &&:hover:not(:disabled) {
    transform: none;
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  `}
`
