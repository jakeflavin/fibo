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
  deckCards,
  newSessionId,
  newStoryId,
  newUserId,
  pickIdentity,
  storiesFromExport,
  type DeckChoice,
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
export async function createSession(
  ownerName: string,
  deck?: DeckChoice | null,
  stories?: Record<string, Story>,
): Promise<string> {
  const sessionId = newSessionId();
  const userId = newUserId();
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    createdAt: now,
    touchedAt: now,
    currentStoryId: null,
    revealed: false,
    ...(deck && deck.preset !== 'fib' ? { deck } : {}),
    ...(stories ? { stories } : {}),
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

/** Add a member with a free identity; returns their user id. */
export async function joinSession(
  sessionId: string,
  name: string,
  role: Extract<Role, 'participant' | 'spectator'> = 'participant',
): Promise<string> {
  const usersSnap = await get(ref(db, `sessions/${sessionId}/users`));
  const users = (usersSnap.val() ?? {}) as Record<string, { identity: number; name?: string; role?: string }>;
  const taken = Object.values(users).map((u) => u.identity);
  // Ownerless sessions (created headlessly via MCP, or whose admin
  // left) seat their first arriving player as the admin. Spectators
  // never inherit the seat.
  const hasOwner = Object.values(users).some((u) => u?.name && u.role === 'owner');
  const effectiveRole = !hasOwner && role === 'participant' ? 'owner' : role;
  const userId = newUserId();
  await set(ref(db, `sessions/${sessionId}/users/${userId}`), {
    name: name.trim(),
    role: effectiveRole,
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

/**
 * Change a user's role (admin action: make/remove lead or spectator).
 * Someone stepping back to spectate takes their card off the table.
 */
export async function setRole(session: Session, userId: string, role: Role): Promise<void> {
  const updates: Record<string, unknown> = {
    [`users/${userId}/role`]: role,
    touchedAt: Date.now(),
  };
  const storyId = session.currentStoryId;
  if (role === 'spectator' && storyId) {
    updates[`stories/${storyId}/votes/${userId}`] = null;
  }
  await update(sessionRef(session.id), updates);
}

/**
 * Toggle auto-flip: cards reveal as soon as everyone online has voted.
 * Auto and the countdown are alternatives (one segment, one mode):
 * arming auto cancels a running timer, and starting a timer disarms auto.
 */
export async function setAutoFlip(sessionId: string, on: boolean): Promise<void> {
  await update(sessionRef(sessionId), {
    autoFlip: on,
    ...(on ? { timer: null } : {}),
    touchedAt: Date.now(),
  });
}

/** Admin-only: change the deck in play. Standing results keep their
 *  old values until a story is repointed. */
export async function setDeck(sessionId: string, deck: DeckChoice): Promise<void> {
  await update(sessionRef(sessionId), {
    deck: deck.preset === 'fib' ? null : deck,
    touchedAt: Date.now(),
  });
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

/**
 * Append several stories at once (bulk paste). One atomic write; the
 * first new story goes on the table only when nothing is active.
 */
export async function addStories(
  session: Session,
  titles: string[],
  startOrder: number,
): Promise<void> {
  if (titles.length === 0) return;
  const now = Date.now();
  // The first pasted story starts the round when the table is empty.
  // Its status is set inside the story object itself — a multi-path
  // update may not write both stories/x and stories/x/status.
  const dealFirst = !session.currentStoryId;
  const updates: Record<string, unknown> = { touchedAt: now };
  titles.forEach((title, i) => {
    const id = newStoryId();
    const first = i === 0;
    const story: Story = {
      id,
      title: title.trim(),
      status: dealFirst && first ? 'active' : 'queued',
      order: startOrder + i,
      result: null,
      createdAt: now,
    };
    updates[`stories/${id}`] = story;
    if (dealFirst && first) {
      updates.currentStoryId = id;
      updates.revealed = false;
    }
  });
  await update(sessionRef(session.id), updates);
}

/** Persist a drag-reorder: story orders become their new list positions. */
export async function reorderStories(sessionId: string, orderedIds: string[]): Promise<void> {
  const updates: Record<string, unknown> = { touchedAt: Date.now() };
  orderedIds.forEach((id, i) => {
    updates[`stories/${id}/order`] = i;
  });
  await update(sessionRef(sessionId), updates);
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
    [`stories/${storyId}/result`]: computeWinner(votes, deckCards(session)),
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
  await update(sessionRef(sessionId), {
    timer: { endsAt: Date.now() + seconds * 1000, seconds },
    autoFlip: false,
    touchedAt: Date.now(),
  });
}

/** Delete a whole session (the on-open expiry gate's cleanup). */
export async function deleteSession(sessionId: string): Promise<void> {
  await remove(sessionRef(sessionId));
}

/**
 * Replace the story list with an imported export document. The file's
 * deck comes with it (absent means the Fibonacci default) — an import
 * recreates the exported session, deck and all.
 */
export async function importStories(session: Session, doc: SessionExport): Promise<void> {
  await update(sessionRef(session.id), {
    stories: storiesFromExport(doc, newStoryId),
    deck: doc.deck && doc.deck.preset !== 'fib' ? doc.deck : null,
    currentStoryId: null,
    revealed: false,
    timer: null,
    touchedAt: Date.now(),
  });
}
