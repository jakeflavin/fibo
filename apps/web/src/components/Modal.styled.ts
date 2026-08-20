import styled from 'styled-components'
import { rise } from '@/styles/primitives.styled'
import { Button, Eyebrow, PanelBody, PanelHint } from '@/styles/shared.styled'

export const ModalClose = styled(Button)`
  && {

    font-size: 16px;
    line-height: 1;
  }
`

export const ModalTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  /* heading.medium, 20/24 (DESIGN.md §5). The Eyebrow primitive underneath is
     12px; it used to be nudged to 16, which is neither size the spec names. */
  ${Eyebrow} {
    font-size: 20px;
    line-height: 24px;
    font-weight: 600;
    color: var(--text);
  }
`

/**
 * The dialog itself. `::backdrop` is only reachable from a real stylesheet rule on the
 * element, which is exactly what a styled component gives it.
 */
export const Dialog = styled.dialog`
  /* Centred by the UA's margin:auto on an open modal dialog. The 40px is the gutter the
     backdrop's padding used to provide on a narrow screen. */
  width: calc(100% - 40px);
  max-width: 320px;
  /* Left, per DESIGN.md §5. Centred prose is fine for a one-line confirm and
     poor for the four paragraphs in Connect Claude, which is what shipped. */
  text-align: left;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-float);
  animation: ${rise} 0.2s ease-out both;

  &::backdrop {
    background: var(--backdrop);
    backdrop-filter: blur(6px);
  }

  ${PanelHint} {
    margin: 10px 0 0;
  }

  ${PanelBody} {
    margin: 0 0 20px;
    overflow-wrap: break-word;
  }
`
