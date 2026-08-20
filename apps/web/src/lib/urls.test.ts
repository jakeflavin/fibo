import { afterEach, describe, expect, it, vi } from 'vitest'
import { appPath, appUrl, sessionUrl } from './urls'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('urls', () => {
  it('keeps exactly one slash between the base and the path', () => {
    expect(appPath('/s/abc')).toBe('/s/abc')
    expect(appPath('s/abc')).toBe('/s/abc')
  })

  it('defaults to the app root', () => {
    expect(appPath()).toBe('/')
  })

  it('builds an absolute URL on the current origin', () => {
    expect(appUrl('/mcp')).toBe(`${window.location.origin}/mcp`)
  })

  // The bug this module exists for: an invite link that drops `/fibo/` is
  // answered by the portfolio's catch-all with a 200 and its own index.
  it('carries the deployed sub-path into every link it builds', () => {
    vi.stubEnv('BASE_URL', '/fibo/')
    expect(appPath('/s/abc')).toBe('/fibo/s/abc')
    expect(appPath()).toBe('/fibo/')
    expect(sessionUrl('n4vp6v8tbv')).toBe(`${window.location.origin}/fibo/s/n4vp6v8tbv`)
    expect(appUrl('/mcp')).toBe(`${window.location.origin}/fibo/mcp`)
  })
})
