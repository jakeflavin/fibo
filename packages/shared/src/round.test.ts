import { describe, expect, it } from 'vitest';
import { everyoneVoted } from './round';
import type { Session, SessionUser } from './types';

const user = (over: Partial<SessionUser>): SessionUser => ({
  name: 'u',
  role: 'participant',
  identity: 0,
  online: true,
  joinedAt: 0,
  ...over,
});

const base = (over: Partial<Session>): Session => ({
  id: 'abc',
  createdAt: 0,
  revealed: false,
  currentStoryId: 's1',
  stories: { s1: { id: 's1', title: 't', status: 'active', order: 0, createdAt: 0 } },
  ...over,
});

describe('everyoneVoted', () => {
  it('is true once every online player has a card down', () => {
    const s = base({
      users: { a: user({}), b: user({}) },
      stories: {
        s1: {
          id: 's1', title: 't', status: 'active', order: 0, createdAt: 0,
          votes: { a: 5, b: 'skip' },
        },
      },
    });
    expect(everyoneVoted(s)).toBe(true);
  });

  it('waits while any online player is undecided', () => {
    const s = base({
      users: { a: user({}), b: user({}) },
      stories: {
        s1: { id: 's1', title: 't', status: 'active', order: 0, createdAt: 0, votes: { a: 5 } },
      },
    });
    expect(everyoneVoted(s)).toBe(false);
  });

  it('offline members do not block the flip', () => {
    const s = base({
      users: { a: user({}), gone: user({ online: false }) },
      stories: {
        s1: { id: 's1', title: 't', status: 'active', order: 0, createdAt: 0, votes: { a: 8 } },
      },
    });
    expect(everyoneVoted(s)).toBe(true);
  });

  it('never ready without a story or without anyone online', () => {
    expect(everyoneVoted(base({ currentStoryId: null }))).toBe(false);
    expect(everyoneVoted(base({ users: { a: user({ online: false }) } }))).toBe(false);
  });

  it('spectators never block or enable the flip', () => {
    const s = base({
      users: { a: user({}), watcher: user({ role: 'spectator' }) },
      stories: {
        s1: { id: 's1', title: 't', status: 'active', order: 0, createdAt: 0, votes: { a: 5 } },
      },
    });
    expect(everyoneVoted(s)).toBe(true);
    const onlyWatchers = base({ users: { watcher: user({ role: 'spectator' }) } });
    expect(everyoneVoted(onlyWatchers)).toBe(false);
  });

  it('ignores partial ghost user records', () => {
    const s = base({
      users: { a: user({}), ghost: { online: true } as SessionUser },
      stories: {
        s1: { id: 's1', title: 't', status: 'active', order: 0, createdAt: 0, votes: { a: 3 } },
      },
    });
    expect(everyoneVoted(s)).toBe(true);
  });
});
