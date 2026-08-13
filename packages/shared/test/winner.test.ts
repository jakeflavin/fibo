import { describe, expect, it } from 'vitest';
import { computeWinner } from '../src/winner';
import type { VoteValue } from '../src/types';

const votes = (...values: VoteValue[]): Record<string, VoteValue> =>
  Object.fromEntries(values.map((v, i) => [`u${i}`, v]));

describe('computeWinner', () => {
  it('returns null for missing or empty votes', () => {
    expect(computeWinner(null)).toBeNull();
    expect(computeWinner(undefined)).toBeNull();
    expect(computeWinner({})).toBeNull();
  });

  it('picks the most repeated number', () => {
    expect(computeWinner(votes(5, 5, 8))).toBe(5);
    expect(computeWinner(votes(1, 3, 3, 3, 21))).toBe(3);
  });

  it('breaks ties toward the higher value', () => {
    expect(computeWinner(votes(5, 8))).toBe(8);
    expect(computeWinner(votes(0, 0, 13, 13))).toBe(13);
  });

  it('a lone number beats any pile of skips', () => {
    expect(computeWinner(votes('skip', 'skip', 2))).toBe(2);
  });

  it('wins as skip only when nobody voted a number', () => {
    expect(computeWinner(votes('skip', 'skip'))).toBe('skip');
    expect(computeWinner(votes('coffee'))).toBe('skip');
  });

  it('handles a single vote', () => {
    expect(computeWinner(votes(13))).toBe(13);
  });
});
