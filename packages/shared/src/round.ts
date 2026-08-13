import type { Session } from './types';

/**
 * Whether every online player has locked in a card for the current
 * round. Offline members don't block the flip (they reveal as ?),
 * spectators never count, and an empty table or a round with nobody
 * online never counts as ready.
 */
export function everyoneVoted(session: Session): boolean {
  const storyId = session.currentStoryId;
  if (!storyId) return false;
  const votes = session.stories?.[storyId]?.votes ?? {};
  const online = Object.entries(session.users ?? {}).filter(
    ([, u]) => u?.name && u.online && u.role !== 'spectator',
  );
  if (online.length === 0) return false;
  return online.every(([uid]) => votes[uid] !== undefined);
}
