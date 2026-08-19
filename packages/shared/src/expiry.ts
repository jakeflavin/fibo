import type { Session } from './types'

/**
 * How long an abandoned session survives: once every user is offline and
 * nothing has touched the session for this long, it is expired — the
 * weekly cleanup deletes it, and the app refuses to open it.
 *
 * NOTE: functions/src/index.ts mirrors this logic (Cloud Functions can't
 * import the workspace package without a bundler). Keep them in sync.
 */
export const SESSION_TTL_MS = 48 * 60 * 60 * 1000

/**
 * The session's last sign of life. Prefers the explicit stamps
 * (touchedAt on writes, lastSeenAt on disconnect) but derives a floor
 * from user/story timestamps so sessions created before the stamps
 * existed still age correctly.
 */
export function lastActivityAt(session: Session): number {
  let latest = session.createdAt ?? 0
  const consider = (t: number | undefined | null) => {
    if (typeof t === 'number' && t > latest) latest = t
  }
  consider(session.touchedAt)
  consider(session.lastSeenAt)
  for (const user of Object.values(session.users ?? {})) consider(user?.joinedAt)
  for (const story of Object.values(session.stories ?? {})) {
    consider(story?.createdAt)
    consider(story?.pointedAt)
  }
  return latest
}

/** True when every user is offline and the session has been quiet past the TTL. */
export function isSessionExpired(session: Session, now: number = Date.now()): boolean {
  const anyoneOnline = Object.values(session.users ?? {}).some((u) => u?.online)
  if (anyoneOnline) return false
  return now - lastActivityAt(session) > SESSION_TTL_MS
}
