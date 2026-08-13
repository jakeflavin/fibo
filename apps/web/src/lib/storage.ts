/** localStorage helpers: per-session identity plus small conveniences. */

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the user just re-joins on refresh.
  }
}

export function getMyUserId(sessionId: string): string | null {
  return safeGet(`fibo:user:${sessionId}`);
}

export function saveMyUserId(sessionId: string, userId: string): void {
  safeSet(`fibo:user:${sessionId}`, userId);
}

export function clearMyUserId(sessionId: string): void {
  try {
    localStorage.removeItem(`fibo:user:${sessionId}`);
  } catch {
    // Ignore blocked storage.
  }
}

export function getLastName(): string {
  return safeGet('fibo:name') ?? '';
}

export function saveLastName(name: string): void {
  safeSet('fibo:name', name);
}

export type ThemeChoice = 'light' | 'dark' | null;

export function getTheme(): ThemeChoice {
  const t = safeGet('fibo:theme');
  return t === 'light' || t === 'dark' ? t : null;
}

export function saveTheme(theme: ThemeChoice): void {
  try {
    if (theme === null) localStorage.removeItem('fibo:theme');
    else localStorage.setItem('fibo:theme', theme);
  } catch {
    // Ignore blocked storage.
  }
}
