/**
 * Theme resolution, in one place.
 *
 * `index.html` carries a parser-blocking mirror of `resolveTheme` so the
 * attribute is right before the first paint — React can only set it on mount,
 * which is a frame too late and shows as a flash on a dark screen. The two
 * used to disagree: a second copy of that script read `fibo.theme` where
 * everything else writes `fibo:theme`, so it always fell through to the system
 * preference and React then corrected it — the flash it existed to prevent.
 * Changing the rule here means changing the script there.
 */
import { getTheme, type ThemeChoice } from './storage'

export type Theme = 'light' | 'dark'

/** The ADS ground for each theme, mirrored into the address-bar colour. */
const THEME_COLOR: Record<Theme, string> = {
  light: '#f8f8f8',
  dark: '#18191a',
}

/** A stored choice wins in either direction; otherwise follow the system. */
export function resolveTheme(stored: ThemeChoice = getTheme()): Theme {
  if (stored) return stored
  return systemPrefersDark() ? 'dark' : 'light'
}

/** Whether the OS is asking for dark. Guarded: jsdom has no matchMedia. */
export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

/**
 * Put the resolved theme on the document. The tokens switch off `data-theme`;
 * `theme-color` is a meta tag no stylesheet can reach, so it is set here too or
 * the browser chrome stays dark on a light page.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}
