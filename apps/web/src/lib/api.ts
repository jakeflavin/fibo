import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  onDisconnect,
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

export async function createSession(ownerName: string): Promise<string> {
  const sessionId = newSessionId();
  const userId = newUserId();
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    createdAt: now,
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
  saveMyUserId(sessionId, userId);
  return userId;
}

/** Keep users/{userId}/online in sync with the realtime connection. */
export function trackPresence(sessionId: string, userId: string): () => void {
  const onlineRef = ref(db, `sessions/${sessionId}/users/${userId}/online`);
  const connectedRef = ref(db, '.info/connected');
  const unsubscribe = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      void onDisconnect(onlineRef)
        .set(false)
        .then(() => set(onlineRef, true));
    }
  });
  return () => {
    unsubscribe();
    void onDisconnect(onlineRef).cancel();
    void set(onlineRef, false);
  };
}

export function subscribeSession(
  sessionId: string,
  callback: (session: Session | null) => void,
): () => void {
  return onValue(sessionRef(sessionId), (snap) => {
    callback(snap.exists() ? (snap.val() as Session) : null);
  });
}

export async function setRole(sessionId: string, userId: string, role: Role): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/users/${userId}/role`), role);
}

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
  return id;
}

export async function deleteStory(session: Session, storyId: string): Promise<void> {
  if (session.currentStoryId === storyId) {
    await update(sessionRef(session.id), {
      currentStoryId: null,
      revealed: false,
      timer: null,
      [`stories/${storyId}`]: null,
    });
  } else {
    await remove(ref(db, `sessions/${session.id}/stories/${storyId}`));
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

export async function castVote(
  sessionId: string,
  storyId: string,
  userId: string,
  value: VoteValue | null,
): Promise<void> {
  const voteRef = ref(db, `sessions/${sessionId}/stories/${storyId}/votes/${userId}`);
  if (value === null) await remove(voteRef);
  else await set(voteRef, value);
}

/** Flip the cards: everyone sees the votes and the default winner is written. */
export async function revealCards(session: Session): Promise<void> {
  const storyId = session.currentStoryId;
  if (!storyId) return;
  const votes = session.stories?.[storyId]?.votes ?? {};
  await update(sessionRef(session.id), {
    revealed: true,
    timer: null,
    [`stories/${storyId}/result`]: computeWinner(votes),
  });
}

/** Leaders can override the winning value after the flip. */
export async function setResult(
  sessionId: string,
  storyId: string,
  value: VoteValue,
): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/stories/${storyId}/result`), value);
}

/** Clear votes and flip cards back down for another round on the same story. */
export async function revote(session: Session): Promise<void> {
  const storyId = session.currentStoryId;
  if (!storyId) return;
  await update(sessionRef(session.id), {
    revealed: false,
    timer: null,
    [`stories/${storyId}/votes`]: null,
    [`stories/${storyId}/result`]: null,
  });
}

export async function startTimer(sessionId: string, seconds: number): Promise<void> {
  await set(ref(db, `sessions/${sessionId}/timer`), {
    endsAt: Date.now() + seconds * 1000,
    seconds,
  });
}

/** Replace the story list with an imported export document. */
export async function importStories(session: Session, doc: SessionExport): Promise<void> {
  await update(sessionRef(session.id), {
    stories: storiesFromExport(doc, newStoryId),
    currentStoryId: null,
    revealed: false,
    timer: null,
  });
}
