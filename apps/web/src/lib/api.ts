import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import {
  computeWinner,
  newSessionId,
  newStoryId,
  newUserId,
  pickIdentity,
  storiesFromExport,
  type Role,
  type Session,
  type SessionExport,
  type Story,
  type VoteValue,
} from '@fibo/shared';
import { db } from '../firebase';
import { saveMyUserId } from './storage';

const sessionRef = (sessionId: string) => ref(db, `sessions/${sessionId}`);

/**
 * Stamp the session's last-activity time. The weekly cleanup and the
 * on-open expiry gate treat a session as abandoned only when this (and
 * presence) goes quiet — see packages/shared/src/expiry.ts.
 */
const touch = (sessionId: string) => set(ref(db, `sessions/${sessionId}/touchedAt`), Date.now());

/** Create a session owned by the given user; returns the session id. */
export async function createSession(ownerName: string): Promise<string> {
  const sessionId = newSessionId();
  const userId = newUserId();
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    createdAt: now,
    touchedAt: now,
    currentStoryId: null,
    revealed: false,
    users: {
      [userId]: {
        name: ownerName.trim(),
        role: 'owner',
        identity: 0,
        online: true,
        joinedAt: now,
      },
    },
  };
  await set(sessionRef(sessionId), session);
  saveMyUserId(sessionId, userId);
  return sessionId;
}

/** Add a participant with a free identity; returns their user id. */
export async function joinSession(sessionId: string, name: string): Promise<string> {
  const usersSnap = await get(ref(db, `sessions/${sessionId}/users`));
  const users = (usersSnap.val() ?? {}) as Record<string, { identity: number }>;
  const taken = Object.values(users).map((u) => u.identity);
  const userId = newUserId();
  await set(ref(db, `sessions/${sessionId}/users/${userId}`), {
    name: name.trim(),
    role: 'participant',
    identity: pickIdentity(taken),
    online: true,
    joinedAt: Date.now(),
  });
  await touch(sessionId);
  saveMyUserId(sessionId, userId);
  return userId;
}

/**
 * Keep users/{userId}/online in sync with the realtime connection.
 * Going offline REMOVES the flag rather than writing false: a write
 * against a user the admin just removed would resurrect the record as a
 * partial ghost, while removing a field of a deleted record is a no-op.
 */
export function trackPresence(sessionId: string, userId: string): () => void {
  const onlineRef = ref(db, `sessions/${sessionId}/users/${userId}/online`);
  // Session-level last-seen stamp, written server-side on disconnect: it
  // feeds the expiry clock without touching (or resurrecting) any user
  // record, and a stamp against an already-deleted session is rejected
  // by the rules' id/createdAt validation.
  const lastSeenRef = ref(db, `sessions/${sessionId}/lastSeenAt`);
  const connectedRef = ref(db, '.info/connected');
  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      void onDisconnect(onlineRef)
        .remove()
        .then(() => set(onlineRef, true));
      void onDisconnect(lastSeenRef).set(serverTimestamp());
    }
  });
  return () => {
    unsubscribe();
    void onDisconnect(onlineRef).cancel();
    void onDisconnect(lastSeenRef).cancel();
    void remove(onlineRef);
    void set(lastSeenRef, Date.now());
  };
}

/** Live-subscribe to a session; the callback gets null when it vanishes. */
export function subscribeSession(
  sessionId: string,
  callback: (session: Session | null) => void,
): () => void {
  return onValue(sessionRef(sessionId), (snap) => {
    callback(snap.exists() ? (snap.val() as Session) : null);
  });
}

/** Change a user's role (admin action: make/remove lead). */
export async function setRole(sessionId: string, userId: string, role: Role): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/users/${userId}/role`), role);
  await touch(sessionId);
}

/**
 * Hand the admin seat to another user, atomically: they become the
 * owner and the previous owner steps down to lead. There is always
 * exactly one admin.
 */
export async function transferAdmin(
  sessionId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  await update(sessionRef(sessionId), {
    [`users/${toUserId}/role`]: 'owner',
    [`users/${fromUserId}/role`]: 'leader',
    touchedAt: Date.now(),
  });
}

/** Remove a user from the session, along with their vote on the table. */
export async function removeUser(session: Session, userId: string): Promise<void> {
  const updates: Record<string, unknown> = { [`users/${userId}`]: null, touchedAt: Date.now() };
  const storyId = session.currentStoryId;
  if (storyId) updates[`stories/${storyId}/votes/${userId}`] = null;
  await update(sessionRef(session.id), updates);
}

/** Append a story to the queue; returns its id. */
export async function addStory(sessionId: string, title: string, order: number): Promise<string> {
  const id = newStoryId();
  const story: Story = {
    id,
    title: title.trim(),
    status: 'queued',
    order,
    result: null,
    createdAt: Date.now(),
  };
  await set(ref(db, `sessions/${sessionId}/stories/${id}`), story);
  await touch(sessionId);
  return id;
}

/** Delete a story; deleting the active story also clears the table. */
export async function deleteStory(session: Session, storyId: string): Promise<void> {
  if (session.currentStoryId === storyId) {
    await update(sessionRef(session.id), {
      currentStoryId: null,
      revealed: false,
      timer: null,
      touchedAt: Date.now(),
      [`stories/${storyId}`]: null,
    });
  } else {
    await remove(ref(db, `sessions/${session.id}/stories/${storyId}`));
    await touch(session.id);
  }
}

/**
 * Put a story on the table: it becomes the single story in discussion.
 * A fresh story starts a clean round; a pointed story reopens revealed, with
 * everyone's cards and the consensus intact (revote clears it for a new round).
 */
export async function activateStory(session: Session, storyId: string): Promise<void> {
  const reopen = session.stories?.[storyId]?.status === 'done';
  const updates: Record<string, unknown> = {
    currentStoryId: storyId,
    revealed: reopen,
    timer: null,
    touchedAt: Date.now(),
    [`stories/${storyId}/status`]: 'active',
  };
  if (!reopen) {
    updates[`stories/${storyId}/votes`] = null;
    updates[`stories/${storyId}/result`] = null;
  }
  const previousId = session.currentStoryId;
  const previous = previousId ? session.stories?.[previousId] : undefined;
  if (previous && previousId !== storyId) {
    if (session.revealed && previous.result != null) {
      // Cards were flipped and a result stands: switching away accepts it.
      updates[`stories/${previousId}/status`] = 'done';
      updates[`stories/${previousId}/pointedAt`] = Date.now();
    } else {
      updates[`stories/${previousId}/status`] = 'queued';
      updates[`stories/${previousId}/votes`] = null;
    }
  }
  await update(sessionRef(session.id), updates);
}

/** Play (or with null, take back) a card for the current round. */
export async function castVote(
  sessionId: string,
  storyId: string,
  userId: string,
  value: VoteValue | null,
): Promise<void> {
  const voteRef = ref(db, `sessions/${sessionId}/stories/${storyId}/votes/${userId}`);
  if (value === null) await remove(voteRef);
  else await set(voteRef, value);
  await touch(sessionId);
}

/** Flip the cards: everyone sees the votes and the default winner is written. */
export async function revealCards(session: Session): Promise<void> {
  const storyId = session.currentStoryId;
  if (!storyId) return;
  const votes = session.stories?.[storyId]?.votes ?? {};
  await update(sessionRef(session.id), {
    revealed: true,
    timer: null,
    touchedAt: Date.now(),
    [`stories/${storyId}/result`]: computeWinner(votes),
  });
}

/** Rename a story (from the inline title editor). */
export async function updateStoryTitle(
  sessionId: string,
  storyId: string,
  title: string,
): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/stories/${storyId}/title`), title.trim());
  await touch(sessionId);
}

/** Leaders can override the winning value after the flip. */
export async function setResult(
  sessionId: string,
  storyId: string,
  value: VoteValue,
): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/stories/${storyId}/result`), value);
  await touch(sessionId);
}

/** Clear votes and flip cards back down for another round on the same story. */
export async function revote(session: Session): Promise<void> {
  const storyId = session.currentStoryId;
  if (!storyId) return;
  await update(sessionRef(session.id), {
    revealed: false,
    timer: null,
    touchedAt: Date.now(),
    [`stories/${storyId}/votes`]: null,
    [`stories/${storyId}/result`]: null,
  });
}

/** Start the shared countdown; cards auto-flip when it ends. */
export async function startTimer(sessionId: string, seconds: number): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/timer`), {
    endsAt: Date.now() + seconds * 1000,
    seconds,
  });
  await touch(sessionId);
}

/** Delete a whole session (the on-open expiry gate's cleanup). */
export async function deleteSession(sessionId: string): Promise<void> {
  await remove(sessionRef(sessionId));
}

/** Replace the story list with an imported export document. */
export async function importStories(session: Session, doc: SessionExport): Promise<void> {
  await update(sessionRef(session.id), {
    stories: storiesFromExport(doc, newStoryId),
    currentStoryId: null,
    revealed: false,
    timer: null,
    touchedAt: Date.now(),
  });
}
