import type { Session, SessionUser, Story, VoteValue } from '@fibo/shared';

/*
 * Builders rather than literals: a Session has twelve optional fields, and a test that
 * spells all of them out buries the one that matters.
 */

export function user(over: Partial<SessionUser> = {}): SessionUser {
  return { name: 'Ada', role: 'participant', identity: 0, online: true, joinedAt: 1, ...over };
}

export function story(over: Partial<Story> = {}): Story {
  return { id: 's1', title: 'A story', status: 'active', order: 0, createdAt: 1, ...over };
}

export function session(over: Partial<Session> = {}): Session {
  return {
    id: 'sess',
    createdAt: 1,
    revealed: false,
    currentStoryId: 's1',
    users: { u1: user() },
    stories: { s1: story() },
    ...over,
  };
}

/** A session mid-round, with the votes already cast. */
export function voted(votes: Record<string, VoteValue>, over: Partial<Session> = {}): Session {
  return session({
    revealed: true,
    stories: { s1: story({ votes, result: null }) },
    ...over,
  });
}
