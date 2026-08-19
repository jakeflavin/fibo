import { describe, expect, it } from 'vitest';
import { isSessionExpired, lastActivityAt, SESSION_TTL_MS } from './expiry';
import type { Session, SessionUser } from './types';

const HOUR = 60 * 60 * 1000;
const NOW = 1_800_000_000_000;

const user = (over: Partial<SessionUser>): SessionUser => ({
  name: 'u',
  role: 'participant',
  identity: 0,
  online: false,
  joinedAt: NOW - 100 * HOUR,
  ...over,
});

const session = (over: Partial<Session>): Session => ({
  id: 'abc',
  createdAt: NOW - 100 * HOUR,
  revealed: false,
  ...over,
});

describe('lastActivityAt', () => {
  it('prefers the newest explicit stamp', () => {
    const s = session({ touchedAt: NOW - 2 * HOUR, lastSeenAt: NOW - 1 * HOUR });
    expect(lastActivityAt(s)).toBe(NOW - 1 * HOUR);
  });

  it('derives a floor from user and story timestamps for legacy sessions', () => {
    const s = session({
      users: { a: user({ joinedAt: NOW - 10 * HOUR }) },
      stories: {
        s1: {
          id: 's1',
          title: 't',
          status: 'done',
          order: 0,
          createdAt: NOW - 60 * HOUR,
          pointedAt: NOW - 5 * HOUR,
        },
      },
    });
    expect(lastActivityAt(s)).toBe(NOW - 5 * HOUR);
  });

  it('falls back to createdAt when nothing else exists', () => {
    expect(lastActivityAt(session({}))).toBe(NOW - 100 * HOUR);
  });
});

describe('isSessionExpired', () => {
  it('never expires while anyone is online, however old', () => {
    const s = session({ users: { a: user({ online: true }) } });
    expect(isSessionExpired(s, NOW)).toBe(false);
  });

  it('survives while quiet but inside the TTL', () => {
    const s = session({ touchedAt: NOW - SESSION_TTL_MS + HOUR, users: { a: user({}) } });
    expect(isSessionExpired(s, NOW)).toBe(false);
  });

  it('expires once everyone is offline past the TTL', () => {
    const s = session({ touchedAt: NOW - SESSION_TTL_MS - HOUR, users: { a: user({}) } });
    expect(isSessionExpired(s, NOW)).toBe(true);
  });

  it('handles partial ghost user records without crashing', () => {
    const s = session({
      touchedAt: NOW - SESSION_TTL_MS - HOUR,
      users: { ghost: { online: false } as SessionUser },
    });
    expect(isSessionExpired(s, NOW)).toBe(true);
  });

  it('expires legacy sessions by derived activity', () => {
    const s = session({ users: { a: user({ joinedAt: NOW - 50 * HOUR }) } });
    expect(isSessionExpired(s, NOW)).toBe(true);
  });
});
