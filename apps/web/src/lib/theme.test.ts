import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyTheme, resolveTheme } from './theme'

const systemIs = (scheme: 'light' | 'dark') => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('dark') && scheme === 'dark',
    media: q,
  }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolveTheme', () => {
  it('follows the system when nothing has been chosen', () => {
    systemIs('dark')
    expect(resolveTheme(null)).toBe('dark')
    systemIs('light')
    expect(resolveTheme(null)).toBe('light')
  })

  // Both directions: the bug was a stored choice being overwritten by the OS.
  it('lets an explicit choice beat the system, either way', () => {
    systemIs('dark')
    expect(resolveTheme('light')).toBe('light')
    systemIs('light')
    expect(resolveTheme('dark')).toBe('dark')
  })

  it('reads the stored choice under the key the app writes', () => {
    systemIs('dark')
    localStorage.setItem('fibo:theme', 'light')
    expect(resolveTheme()).toBe('light')
  })

  it('ignores a value it did not write', () => {
    systemIs('dark')
    localStorage.setItem('fibo:theme', 'sepia')
    expect(resolveTheme()).toBe('dark')
  })
})

describe('applyTheme', () => {
  it('switches the tokens and the address-bar colour together', () => {
    const meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.append(meta)

    applyTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(meta.getAttribute('content')).toBe('#f8f8f8')

    applyTheme('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.getAttribute('content')).toBe('#18191a')

    meta.remove()
  })
})
