import { describe, expect, it } from 'vitest';
import {
  buildSessionDoc,
  committedPoints,
  parseSessionRef,
  RateLimiter,
  resolveDeck,
  resultsTable,
  type StoryRecord,
} from './mcp-helpers';

describe('parseSessionRef', () => {
  it('accepts bare ids and full links', () => {
    expect(parseSessionRef('rvu5xsn6ee')).toBe('rvu5xsn6ee');
    expect(parseSessionRef('https://fibo-49d58.web.app/s/rvu5xsn6ee')).toBe('rvu5xsn6ee');
    expect(parseSessionRef('http://localhost:5173/s/rvu5xsn6ee?x=1')).toBe('rvu5xsn6ee');
  });

  it('rejects garbage, wrong lengths, and forbidden characters', () => {
    expect(parseSessionRef('')).toBeNull();
    expect(parseSessionRef('not a link')).toBeNull();
    expect(parseSessionRef('/s/short')).toBeNull();
    expect(parseSessionRef('rvu5xsn6e1')).toBeNull(); // '1' not in alphabet
  });
});

describe('resolveDeck', () => {
  it('fib and absent mean the default', () => {
    expect(resolveDeck(undefined, undefined)).toBeNull();
    expect(resolveDeck('fib', undefined)).toBeNull();
  });

  it('tshirt resolves to the preset cards', () => {
    expect(resolveDeck('tshirt', undefined)?.cards).toContain('XL');
  });

  it('custom cleans labels and needs at least two', () => {
    expect(resolveDeck('custom', ['low', 'skip', 'high'])?.cards).toEqual(['low', 'high']);
    expect(resolveDeck('custom', ['solo'])).toBeNull();
  });
});

describe('buildSessionDoc', () => {
  it('creates an ownerless session with ordered stories', () => {
    const doc = buildSessionDoc([{ title: 'A' }, { title: 'B', points: 5 }], null, 123);
    expect(doc.createdAt).toBe(123);
    expect(doc.currentStoryId).toBeNull();
    expect('users' in doc).toBe(false);
    const stories = Object.values(doc.stories).sort((a, b) => a.order - b.order);
    expect(stories.map((s) => [s.title, s.status, s.result])).toEqual([
      ['A', 'queued', null],
      ['B', 'done', 5],
    ]);
  });

  it('keeps sane points from any deck era, drops garbage', () => {
    const doc = buildSessionDoc(
      [{ title: 'off-deck', points: 99 }, { title: 'junk', points: 'ENORMOUS' }],
      null,
      1,
    );
    const stories = Object.values(doc.stories).sort((a, b) => a.order - b.order);
    expect(stories[0].status).toBe('done');
    expect(stories[0].result).toBe(99);
    expect(stories[1].status).toBe('queued');
  });
});

describe('resultsTable', () => {
  it('mirrors the shared title<TAB>points format', () => {
    const stories: Record<string, StoryRecord> = {
      b: { id: 'b', title: 'second', status: 'queued', order: 1, result: null, createdAt: 0 },
      a: { id: 'a', title: 'first', status: 'done', order: 0, result: 'skip', createdAt: 0 },
    };
    expect(resultsTable(stories, false)).toBe('first\t?\nsecond\t');
  });

  it('counts a revealed active story\'s standing result', () => {
    const stories: Record<string, StoryRecord> = {
      a: { id: 'a', title: 'live one', status: 'active', order: 0, result: 8, createdAt: 0 },
    };
    expect(resultsTable(stories, false)).toBe('live one\t');
    expect(resultsTable(stories, true)).toBe('live one\t8');
  });
});

describe('committedPoints', () => {
  it('done always counts; active needs the flip', () => {
    expect(committedPoints({ status: 'done', result: 5 }, false)).toBe(5);
    expect(committedPoints({ status: 'active', result: 5 }, false)).toBeNull();
    expect(committedPoints({ status: 'active', result: 5 }, true)).toBe(5);
  });
});

describe('RateLimiter', () => {
  it('exhausts and refills over time', () => {
    const limiter = new RateLimiter(2, 1 / 1000); // 2 burst, 1/sec refill
    expect(limiter.allow('ip', 0)).toBe(true);
    expect(limiter.allow('ip', 0)).toBe(true);
    expect(limiter.allow('ip', 0)).toBe(false);
    expect(limiter.allow('ip', 1000)).toBe(true);
    expect(limiter.allow('other', 0)).toBe(true); // keys are independent
  });
});
