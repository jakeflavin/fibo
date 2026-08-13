import type { VoteValue } from './types';

/** The Fibo deck: Fibonacci numbers plus an explicit skip card. */
export const DECK_NUMBERS = [0, 1, 2, 3, 5, 8, 13, 21] as const;

export const SKIP: VoteValue = 'skip';

export const DECK: VoteValue[] = [...DECK_NUMBERS, SKIP];

export function isValidVote(value: unknown): value is VoteValue {
  return value === 'skip' || DECK_NUMBERS.includes(value as (typeof DECK_NUMBERS)[number]);
}

export function formatVote(value: VoteValue | null | undefined): string {
  if (value === null || value === undefined) return '·';
  return value === 'skip' ? '»' : String(value);
}
