import { describe, expect, it } from 'vitest';
import {
  COFFEE,
  DECK_NUMBERS,
  DECK_PRESETS,
  formatVote,
  isValidVote,
  parseCustomDeck,
  sanitizeDeck,
  SKIP,
} from '../src/deck';

describe('DECK_PRESETS', () => {
  it('fib is the Fibonacci numbers in rank order', () => {
    expect(DECK_PRESETS.fib).toEqual([...DECK_NUMBERS]);
  });

  it('tshirt runs XS to XXL', () => {
    expect(DECK_PRESETS.tshirt[0]).toBe('XS');
    expect(DECK_PRESETS.tshirt.at(-1)).toBe('XXL');
  });
});

describe('isValidVote', () => {
  it('accepts every card of the deck in play, plus skip and coffee', () => {
    for (const v of [...DECK_PRESETS.fib, SKIP, COFFEE]) expect(isValidVote(v)).toBe(true);
    expect(isValidVote('M', DECK_PRESETS.tshirt)).toBe(true);
  });

  it('rejects values outside the deck in play', () => {
    for (const v of [4, 99, -1, '5', 'Skip', null, undefined, {}, NaN]) {
      expect(isValidVote(v)).toBe(false);
    }
    expect(isValidVote(5, DECK_PRESETS.tshirt)).toBe(false);
  });
});

describe('parseCustomDeck', () => {
  it('splits on commas and whitespace, dedupes, and ranks in entry order', () => {
    expect(parseCustomDeck('XS, S,M  L')).toEqual(['XS', 'S', 'M', 'L']);
  });

  it('converts pure numbers and drops reserved sentinels', () => {
    expect(parseCustomDeck('1 2 skip coffee 4')).toEqual([1, 2, 4]);
  });

  it('needs at least two cards', () => {
    expect(parseCustomDeck('XL')).toBeNull();
    expect(parseCustomDeck('')).toBeNull();
  });

  it('caps the deck at twelve cards', () => {
    const twenty = Array.from({ length: 20 }, (_, i) => `c${i}`).join(' ');
    expect(parseCustomDeck(twenty)).toHaveLength(12);
  });
});

describe('sanitizeDeck', () => {
  it('resolves presets to their canonical cards', () => {
    expect(sanitizeDeck({ preset: 'tshirt' })).toEqual({
      preset: 'tshirt',
      cards: DECK_PRESETS.tshirt,
    });
  });

  it('keeps valid custom cards and rejects unusable input', () => {
    expect(sanitizeDeck({ preset: 'custom', cards: ['A', 'B'] })).toEqual({
      preset: 'custom',
      cards: ['A', 'B'],
    });
    expect(sanitizeDeck({ preset: 'custom', cards: ['skip'] })).toBeNull();
    expect(sanitizeDeck('nope')).toBeNull();
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
