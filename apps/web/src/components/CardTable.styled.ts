import styled, { css } from 'styled-components'
import { Button, TextField } from '@/styles/shared.styled'
import { IdentityMark } from './Participants.styled'
import { identity, lockin, rise } from '@/styles/primitives.styled'

export const SeatCardBack = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  backface-visibility: hidden;
  font-size: calc(var(--card-h) * 0.28);
  font-weight: 700;
  transition: font-size 0.45s ease;

  background: var(--card-face);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-play);

  &::after {
    content: '';
    position: absolute;
    inset: 5px;
    border: 1px solid var(--line);
    border-radius: calc(var(--card-h) * 0.055);
    pointer-events: none;
  }

  svg${IdentityMark} {
    box-sizing: content-box;
    width: calc(var(--card-h) * 0.34);
    height: calc(var(--card-h) * 0.34);
    padding: calc(var(--card-h) * 0.09);
    border-radius: 50%;
    background: color-mix(in srgb, var(--idc) 12%, transparent);
  }
`

export const SeatCardCorner = styled.span`
  position: absolute;
  top: calc(var(--card-h) * 0.075);
  left: calc(var(--card-h) * 0.1);
  font-size: calc(var(--card-h) * 0.12);
  font-weight: 600;
  line-height: 1.2;
  opacity: 0.85;
  z-index: 1;
`

export const SeatCardCornerBr = styled(SeatCardCorner)`
  && {

    top: auto;
    left: auto;
    bottom: calc(var(--card-h) * 0.075);
    right: calc(var(--card-h) * 0.1);
    transform: rotate(180deg);
  }
`

export const SeatCardFront = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  backface-visibility: hidden;
  font-size: calc(var(--card-h) * 0.28);
  font-weight: 700;
  transition: font-size 0.45s ease;

  background: var(--surface);
  border: 1px solid var(--line-strong);
  transform: rotateY(180deg);

  &::after {
    content: '';
    position: absolute;
    inset: 5px;
    border: 1px solid color-mix(in srgb, var(--bg) 35%, transparent);
    border-radius: calc(var(--card-h) * 0.055);
    pointer-events: none;
  }
`

export const SeatUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 100%;
`

export const SeatCardInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.55s cubic-bezier(0.2, 0.7, 0.3, 1.1);
`

export const SeatCard = styled.div<{ $flipped?: boolean }>`
  --card-h: clamp(
  96px,
  min(
  calc((100cqh - 56px) / var(--rows, 1) - 36px),
  calc((100cqw / var(--cols, 1) - 24px) / 0.72)
  ),
  280px
  );

  width: calc(var(--card-h) * 0.72);
  height: var(--card-h);
  perspective: 700px;
  transform: rotate(var(--tilt, 0deg)) translateY(var(--dy, 0px));
  transition:
  width 0.45s ease,
  height 0.45s ease,
  transform 0.25s ease;

  @media (max-width: 860px) {
    --card-h: 108px;
  }

  @media (max-width: 480px) {
    --card-h: 90px;
  }

  ${(props) => props.$flipped && css`
  && ${SeatCardInner} {
    transform: rotateY(180deg);
  }
  `}
`

export const Seat = styled.div<{ $hasVote?: boolean }>`
  ${identity}
  &[data-state='away'] {
    opacity: 0.35;
  }

  /* A played card takes the user's colour, whether it is face-up or still face-down. */
  &[data-state='revealed'] ${SeatCardFront},
  &[data-has-vote] ${SeatCardFront} {
    background: var(--idc);
    border-color: transparent;
    color: var(--bg);
    box-shadow: var(--shadow-vote);
  }

  --card-h: clamp(
  96px,
  min(
  calc((100cqh - 56px) / var(--rows, 1) - 36px),
  calc((100cqw / var(--cols, 1) - 24px) / 0.72)
  ),
  280px
  );

  width: calc(var(--card-h) * 0.72 + 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  animation: ${rise} 0.25s ease-out both;
  transition:
  width 0.45s ease,
  margin-left 0.45s ease;

  &:hover ${SeatCard} {
    transform: rotate(0deg) translateY(0);
  }

  @media (max-width: 860px) {
    --card-h: 108px;
  }

  @media (max-width: 480px) {
    --card-h: 90px;
  }

  ${(props) => props.$hasVote && css`
  && ${SeatCardBack}::after {
    border-color: color-mix(in srgb, var(--bg) 35%, transparent);
  }

  && ${SeatCardBack} svg${IdentityMark} {
    background: color-mix(in srgb, var(--bg) 22%, transparent);
  }

  && ${SeatCardBack} {
    background: var(--idc);
    border: 1px solid transparent;
    box-shadow: var(--shadow-vote);
  }

  && ${SeatUnit} {
    animation: ${lockin} 0.25s ease-out;
  }

  && ${SeatCardFront} {
    background: var(--idc);
    border-color: transparent;
    color: var(--bg);
    box-shadow: var(--shadow-vote);
  }
  `}
`

export const SeatLabel = styled.div`
  display: flex;
  justify-content: center;
  max-width: 100%;
`

/*
 * The stylesheet coloured this from .seat-name.identity, which needed both classes on the
 * element -- the name only ever had one, so the rule never applied. The seat itself does
 * carry the identity, which is what the cards read.
 */
export const SeatName = styled.span`

  &${IdentityMark} {
    color: var(--idc);
  }

  font-size: var(--font-small);
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const SeatRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  width: max-content;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;

  & + & {
    margin-top: 10px;
  }

  @media (max-width: 480px) {
    gap: 14px;
  }
`

export const Seats = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  padding: 12px 16px;
  background: var(--bg);
  border-radius: 8px;
  min-width: 0;
  max-width: 100%;
  container-type: size;

  @media (max-height: 800px) and (min-width: 861px) {
    padding: 12px 0 4px;
  }

  @media (max-width: 860px) {
    container-type: normal;
  }
`

export const SeatsInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  transform-origin: 50% 50%;
  transition: transform 0.3s ease;
`

export const TitleActions = styled.span`
  display: inline-flex;
  gap: 2px;
  margin-left: 8px;
  vertical-align: middle;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
`

export const StoryLine = styled.div`
  padding: 8px 0;
  text-align: left;
  min-height: 44px;

  &:hover ${TitleActions} {
    opacity: 1;
    pointer-events: auto;
  }

  &:focus-within ${TitleActions} {
    opacity: 1;
    pointer-events: auto;
  }
`

export const TableEmpty = styled.div`
  padding: 96px 8px 64px;

  @media (max-width: 860px) {
    padding: 56px 8px 32px;
  }
`

export const TablePanel = styled.div`
  text-align: center;
  animation: ${rise} 0.25s ease-out both;
`

export const TitleAction = styled(Button)`
  && {

    width: 28px;
    height: 28px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--dim);
  }
`

export const TitleEdit = styled.div`
  position: relative;
`

export const TitleEditAction = styled(Button)`
  && {

    width: 32px;
    height: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    box-shadow: var(--shadow-float);
  }
`

export const TitleEditActions = styled.span`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  display: flex;
  gap: 4px;
  z-index: 5;
`

export const TitleEditField = styled(TextField)`
  && {

  }
`

export const StoryTitle = styled.h2<{ $overflow?: boolean }>`
  font-size: clamp(20px, 2.2vw, 24px);
  font-weight: 600;
  margin: 0;
  overflow-wrap: anywhere;
  line-height: 1.25;
  position: relative;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;

  @media (max-height: 800px) and (min-width: 861px) {
    font-size: clamp(18px, 2.4vw, 24px);
  }

  ${(props) => props.$overflow && css`
  && ${TitleActions} {
    position: absolute;
    right: 0;
    bottom: 0;
    margin-left: 0;
    padding-left: 6px;
    background: var(--surface);
  }
  `}
`
