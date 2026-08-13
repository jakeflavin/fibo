import type { VoteValue } from './types';

/**
 * Compute the default winning value for a revealed round:
 * the most repeated number wins; ties break toward the higher value.
 * Skips only win when nobody voted a number. Returns null when there
 * are no votes at all.
 */
export function computeWinner(votes: Record<string, VoteValue> | undefined | null): VoteValue | null {
  if (!votes) return null;
  const values = Object.values(votes);
  if (values.length === 0) return null;

  const numbers = values.filter((v): v is number => typeof v === 'number');
  if (numbers.length === 0) return 'skip';

  const counts = new Map<number, number>();
  for (const n of numbers) counts.set(n, (counts.get(n) ?? 0) + 1);

  let winner = numbers[0];
  let best = 0;
  for (const [value, count] of counts) {
    if (count > best || (count === best && value > winner)) {
      winner = value;
      best = count;
    }
  }
  return winner;
}
