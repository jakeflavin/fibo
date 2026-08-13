import { DECK_PRESETS, SKIP, COFFEE } from './deck';
import type { VoteValue } from './types';

/**
 * Compute the default winning value for a revealed round: the most
 * repeated card wins; ties break toward the higher deck rank (the
 * card's position in the deck, low → high). Values no longer in the
 * deck (the admin swapped decks mid-round) rank lowest. Skips only win
 * when nobody played a card. Returns null when there are no votes.
 */
export function computeWinner(
  votes: Record<string, VoteValue> | undefined | null,
  cards: VoteValue[] = DECK_PRESETS.fib,
): VoteValue | null {
  if (!votes) return null;
  const values = Object.values(votes);
  if (values.length === 0) return null;

  const played = values.filter((v) => v !== SKIP && v !== COFFEE);
  if (played.length === 0) return SKIP;

  const rank = (v: VoteValue) => cards.findIndex((c) => c === v);
  const counts = new Map<VoteValue, number>();
  for (const v of played) counts.set(v, (counts.get(v) ?? 0) + 1);

  let winner = played[0];
  let best = 0;
  for (const [value, count] of counts) {
    if (count > best || (count === best && rank(value) > rank(winner))) {
      winner = value;
      best = count;
    }
  }
  return winner;
}
