import { describe, expect, it } from 'vitest';
import { COFFEE, DECK, DECK_NUMBERS, formatVote, isValidVote, SKIP } from '../src/deck';

describe('DECK', () => {
  it('is the Fibonacci numbers plus skip and coffee, in play order', () => {
    expect(DECK).toEqual([...DECK_NUMBERS, SKIP, COFFEE]);
  });
});

describe('isValidVote', () => {
  it('accepts every deck card', () => {
    for (const v of DECK) expect(isValidVote(v)).toBe(true);
  });

  it('rejects everything else', () => {
    for (const v of [4, 99, -1, '5', 'Skip', null, undefined, {}, NaN]) {
      expect(isValidVote(v)).toBe(false);
    }
  });
});

describe('formatVote', () => {
  it('renders numbers as themselves', () => {
    expect(formatVote(0)).toBe('0');
    expect(formatVote(21)).toBe('21');
  });

  it('renders missing votes and skips as a question mark', () => {
    expect(formatVote(null)).toBe('?');
    expect(formatVote(undefined)).toBe('?');
    expect(formatVote('skip')).toBe('?');
  });

  it('renders coffee as the pause glyph', () => {
    expect(formatVote('coffee')).toBe('‖');
  });
});
