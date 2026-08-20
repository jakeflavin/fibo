import { css, keyframes } from 'styled-components'

export const blink = keyframes`
  50% { opacity: 0; }
`

export const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
`

export const pop = keyframes`
  from {
    transform: scale(0.5);
    opacity: 0;
  }
`

/**
 * The per-identity colour, which resolves to its dark or light variant with the theme.
 * A mixin rather than a component: it is always applied alongside something else.
 */
export const identity = css`
  --idc: var(--id-dark);

  :root[data-theme='light'] & {
    --idc: var(--id-light);
  }
`

/** The small hop a seat's card makes the moment its vote lands. */
export const lockin = keyframes`
  40% { transform: translateY(-4px); }
`
