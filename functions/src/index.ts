import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

initializeApp();

export { mcp } from './mcp';

/**
 * Expiry rules — a small mirror of packages/shared/src/expiry.ts (the
 * canonical, unit-tested version; Cloud Functions can't import the
 * workspace package without a bundler). Keep the two in sync.
 */
const SESSION_TTL_MS = 48 * 60 * 60 * 1000;

interface SessionLike {
  createdAt?: number;
  touchedAt?: number;
  lastSeenAt?: number;
  users?: Record<string, { online?: boolean; joinedAt?: number } | undefined>;
  stories?: Record<string, { createdAt?: number; pointedAt?: number } | undefined>;
}

function lastActivityAt(session: SessionLike): number {
  let latest = session.createdAt ?? 0;
  const consider = (t: number | undefined | null) => {
    if (typeof t === 'number' && t > latest) latest = t;
  };
  consider(session.touchedAt);
  consider(session.lastSeenAt);
  for (const user of Object.values(session.users ?? {})) consider(user?.joinedAt);
  for (const story of Object.values(session.stories ?? {})) {
    consider(story?.createdAt);
    consider(story?.pointedAt);
  }
  return latest;
}

function isSessionExpired(session: SessionLike, now: number): boolean {
  const anyoneOnline = Object.values(session.users ?? {}).some((u) => u?.online);
  if (anyoneOnline) return false;
  return now - lastActivityAt(session) > SESSION_TTL_MS;
}

/**
 * Weekly sweep: delete every session where everyone has been offline and
 * nothing has happened for 48 hours. Sundays 3:00 AM Eastern.
 */
export const cleanupSessions = onSchedule(
  { schedule: '0 3 * * 0', timeZone: 'America/New_York' },
  async () => {
    const db = getDatabase();
    const snap = await db.ref('sessions').get();
    const sessions = (snap.val() ?? {}) as Record<string, SessionLike>;
    const now = Date.now();

    const stale = Object.keys(sessions).filter((id) => isSessionExpired(sessions[id], now));
    if (stale.length > 0) {
      await db.ref('sessions').update(Object.fromEntries(stale.map((id) => [id, null])));
    }
    logger.info('session cleanup', { scanned: Object.keys(sessions).length, deleted: stale.length });
  },
);
