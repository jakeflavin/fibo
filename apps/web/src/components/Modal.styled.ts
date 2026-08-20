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
  margin-bottom: 16px;

  ${Eyebrow} {
    font-size: 16px;
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
  text-align: center;
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
    text-align: center;
    margin: 10px 0 0;
  }

  ${PanelBody} {
    margin: 0 0 20px;
    overflow-wrap: break-word;
  }
`
