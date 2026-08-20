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
  /*
   * Three states, matching the token block: an explicit choice wins in either
   * direction, and a visitor who never chose follows their system. The base
   * declaration has to be light, because a rule that only exists inside a
   * [data-theme] block never applies to the un-stamped document.
   */
  --idc: var(--id-light);

  :root[data-theme='dark'] & {
    --idc: var(--id-dark);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) & {
      --idc: var(--id-dark);
    }
  }
`

/** The small hop a seat's card makes the moment its vote lands. */
export const lockin = keyframes`
  40% { transform: translateY(-4px); }
`
