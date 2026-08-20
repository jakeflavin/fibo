/**
 * The shapes more than one screen is built from: the buttons, the rail cards,
 * the menus, the fields and the home column.
 */
import styled, { css } from 'styled-components'
import { rise } from '@/styles/primitives.styled'

/** Muted body text. Also available as a mixin, for the places it is one state of two. */
export const dim = css`
  color: var(--dim);
`

export const Dim = styled.p`
  color: var(--dim);
`

export const Eyebrow = styled.div`
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--dim);
`

export const Field = styled.label`
  display: block;
  margin-bottom: 16px;
  text-align: left;
`

export const FieldLabel = styled.span`
  display: block;
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--dim);
  margin-bottom: 6px;
`

export const RailSection = styled.div`
  min-width: 0;

  > ${Eyebrow} {
    margin-bottom: 12px;
  }
`

export const RailCard = styled(RailSection)`
  && {

    padding: 16px 20px;
  }
`

/*
 * The stylesheet also gave this card padding: 24px. It never applied -- .rail-card was
 * written 962 lines further down and won on source order at equal specificity -- so
 * carrying it over would change the card's width for the first time.
 */
export const HomeCard = styled(RailCard)`
  && {
    text-align: left;
    margin-bottom: 20px;
  }
`

export const NoticeTitle = styled.h2`
  /* heading.medium (DESIGN.md §2). These screens used the 12px Eyebrow, which
     left the headline smaller and no louder than its own body copy. */
  margin: 0 0 8px;
  font-size: 20px;
  line-height: 24px;
  font-weight: 600;
  color: var(--text);
`

export const HomeCorner = styled.div`
  position: fixed;
  top: 14px;
  right: 14px;
`

export const Button = styled.button<{ $block?: boolean; $danger?: boolean; $ghost?: boolean; $icon?: boolean; $primary?: boolean }>`
  background: var(--surface-hi);
  border: none;
  border-radius: 4px;
  height: 32px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-body);
  font-weight: 500;
  cursor: pointer;
  color: var(--text);
  transition:
  color 0.1s ease,
  background 0.1s ease,
  box-shadow 0.1s ease;
  white-space: nowrap;

  /* 32px is the ADS density and right with a pointer; a finger needs 44. */
  @media (hover: none) {
    height: 44px;
  }

  &:hover:not(:disabled) {
    background: var(--surface-hover);
  }

  &:active:not(:disabled) {
    background: var(--accent-dim);
    color: var(--accent);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${(props) => props.$block && css`
  && {
    display: flex;
    width: 100%;
  }
  `}

  ${(props) => props.$danger && !props.$primary && css`
  && {
    border-color: var(--danger);
    color: var(--danger);
  }

  &&:hover {
    background: var(--danger);
    color: var(--bg);
  }
  `}

  /*
   * The confirm in a destructive dialog. It sat at the same weight as the
   * escape hatch beside it — one shared background, differing only in text
   * colour — which made the irreversible action the quieter of the two.
   * DESIGN.md §1 keeps --danger for text and the bold fill for fills.
   */
  ${(props) => props.$danger && props.$primary && css`
  && {
    background: var(--danger-bold);
    color: #ffffff;
  }

  &&:hover:not(:disabled) {
    filter: brightness(0.92);
  }
  `}

  ${(props) => props.$ghost && css`
  && {
    background: transparent;
    color: var(--dim);
  }

  &&:hover:not(:disabled) {
    color: var(--text);
  }
  `}

  ${(props) => props.$icon && css`
  && {
    height: 32px;
    width: 32px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-body);
    background: transparent;
    border: 1px solid var(--line);
    color: var(--dim);
  }

  @media (hover: none) {
    && {
      height: 44px;
      width: 44px;
    }
  }
  `}

  ${(props) => props.$primary && css`
  &&:disabled {
    background: var(--surface-hi);
    color: var(--dim);
  }

  && {
    background: var(--accent);
    color: var(--accent-ink);
    font-weight: 500;
  }

  &&:hover:not(:disabled) {
    background: var(--accent-hover);
    color: var(--accent-ink);
  }

  &&:hover:not(:disabled) {
    background: var(--accent-hover);
    color: var(--accent-ink);
  }

  &&:hover:not(:disabled) {
    background: var(--accent-hover);
    color: var(--accent-ink);
  }

  &&:active:not(:disabled) {
    background: var(--accent-hover);
    color: var(--accent-ink);
  }
  `}
`

export const HomeForm = styled.form`
  text-align: left;

  /* The form's own submit is taller than the buttons beside it; every other control in
     here is an explicit type="button", which is what distinguishes it. */
  ${Button}:not([type='button']) {
    margin-top: 4px;
    height: 40px;
    padding: 0 16px;
  }

  @media (hover: none) {
    ${Button}:not([type='button']) {
      height: 48px;
    }
  }

  ${Field} {
    margin-bottom: 12px;
  }
`

export const HomeImport = styled(Button)`
  && {

    margin-top: 8px;
    color: var(--dim);
    gap: 6px;
  }
`

export const HomeMain = styled.main`
  margin: auto;

  width: 100%;
  max-width: 360px;
  text-align: center;
`

export const HomeNotes = styled.p`
  margin: 0;
  color: var(--dim);
  font-size: var(--font-small);
  text-align: center;
  opacity: 0.8;
`

export const HomeShell = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 24px 14px;
`

export const Logo = styled.div`
  color: var(--accent);
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin: 0 0 4px;
  user-select: none;
`

export const Menu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 240px;
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  padding: 6px;
  box-shadow: var(--shadow-float);
  z-index: 60;
  animation: ${rise} 0.15s ease-out both;
`

export const MenuButton = styled(Button)`
  && {

    font-size: 18px;
    line-height: 1;
    padding: 4px 12px;
    border-radius: 8px;
  }

  @media (hover: none) {
    && {
      height: 44px;
      min-width: 44px;
    }
  }
`

export const MenuSep = styled.div`
  height: 1px;
  background: var(--line);
  margin: 6px 8px;
`

export const MenuWrap = styled.div`
  position: relative;
  z-index: 60;
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

export const PanelBody = styled.p<{ $dim?: boolean }>`
  ${(props) => props.$dim && dim}

  margin: 0;
  font-size: var(--font-small);
`

export const PanelHint = styled.p`
  ${dim}

  margin: -6px 0 14px;
  font-size: var(--font-small);
  text-align: left;
`

export const RoomFooter = styled.footer`
  ${dim}

  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  border-top: 1px solid var(--line);
  font-size: var(--font-small);
  opacity: 0.75;
`

export const Seg = styled.div`
  display: flex;
  border: 1px solid var(--line);
  border-radius: 4px;
  overflow: hidden;
`

export const ShareUrl = styled.code`
  /*
   * The one exception to "monospace is retired everywhere" (DESIGN.md §2).
   * A URL and a shell command are read character by character before being
   * pasted somewhere else, which is what the face is for; the rule is about
   * chrome and numbers. It was monospace by accident before — a bare <code>
   * inheriting the UA default — so the stack is declared rather than assumed.
   */
  display: block;
  background: var(--surface-hi);
  border-radius: 4px;
  padding: 8px 12px;
  font-family: var(--font-mono);
  font-size: var(--font-small);
  line-height: 1.5;
  overflow-wrap: anywhere;
  margin-bottom: 12px;
  user-select: all;
  color: var(--text);
`

export const SrOnly = styled.h1`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
`

export const Tagline = styled.p`
  color: var(--dim);
  margin: 0 0 32px;
  font-size: var(--font-body);
`

export const TextField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--control);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: var(--font-body);
  transition:
  border-color 0.1s ease,
  box-shadow 0.1s ease;

  &:focus-within {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }

  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    caret-color: var(--accent);
  }

  input::placeholder {
    color: var(--dim);
    opacity: 0.55;
  }

  @media (max-width: 860px) {
    font-size: 16px;
  }

  @media (max-width: 860px) {
    input {
      font-size: 16px;
    }
  }
`

export const SegCell = styled.button<{ $active?: boolean }>`
  border: none;
  background: transparent;
  height: 30px;
  padding: 0 12px;
  min-width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-body);
  font-weight: 500;
  color: var(--dim);
  cursor: pointer;
  transition:
  color 0.1s ease,
  background 0.1s ease;

  & + & {
    border-left: 1px solid var(--line);
  }

  &:hover:not(:disabled) {
    background: var(--surface-hi);
    color: var(--text);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /*
   * The Jira selected pattern, not a solid fill. DESIGN.md §5 asked for both —
   * "--accent-dim bg + --accent text" for segmented groups and "solid primary
   * fill" for segmented pickers — and the timer segment appears in both lists.
   * One rule now: a solid accent fill means an action you can take, a tint
   * means state that is already true. That matches the queue's active row and
   * the hand's selected card, which is what these sit beside.
   */
  ${(props) => props.$active && css`
  && {
    background: var(--accent-dim);
    color: var(--accent);
    font-weight: 600;
  }

  &&:hover:not(:disabled) {
    background: var(--accent-dim);
    color: var(--accent);
  }
  `}
  /*
   * 30px is the desktop density DESIGN.md §2 asks for: a joined cell inside a
   * 1px group border. A finger needs 44, so touch gets its own height rather
   * than the whole set being sized for the smaller case.
   */
  @media (hover: none) {
    height: 44px;
  }

`

export const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: var(--font-body);
  color: var(--text);
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: var(--surface-hi);
  }

  ${(props) => props.$danger && css`
  && {
    color: var(--danger);
  }
  `}
`
