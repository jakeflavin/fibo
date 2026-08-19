/** localStorage helpers: per-session identity plus small conveniences. */

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode / blocked storage: the user just re-joins on refresh.
  }
}

/** The user id previously saved for this session, if any. */
export function getMyUserId(sessionId: string): string | null {
  return safeGet(`fibo:user:${sessionId}`)
}

/** Remember which user this browser is within a session. */
export function saveMyUserId(sessionId: string, userId: string): void {
  safeSet(`fibo:user:${sessionId}`, userId)
}

/** Forget this browser's identity for a session (leave/kick). */
export function clearMyUserId(sessionId: string): void {
  try {
    localStorage.removeItem(`fibo:user:${sessionId}`)
  } catch {
    // Ignore blocked storage.
  }
}

/** The display name last used on this browser. */
export function getLastName(): string {
  return safeGet('fibo:name') ?? ''
}

/** Remember the display name for pre-filling future prompts. */
export function saveLastName(name: string): void {
  safeSet('fibo:name', name)
}

export type ThemeChoice = 'light' | 'dark' | null

/** The user's explicit theme choice, or null for the dark default. */
export function getTheme(): ThemeChoice {
  const t = safeGet('fibo:theme')
  return t === 'light' || t === 'dark' ? t : null
}

/** Persist (or with null, clear) the explicit theme choice. */
export function saveTheme(theme: ThemeChoice): void {
  try {
    if (theme === null) localStorage.removeItem('fibo:theme')
    else localStorage.setItem('fibo:theme', theme)
  } catch {
    // Ignore blocked storage.
  }
}
