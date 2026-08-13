import { describe, expect, it } from 'vitest';
import { exportSession, ImportError, parseSessionExport, storiesFromExport } from '../src/codec';
import type { Session, Story } from '../src/types';

const story = (over: Partial<Story>): Story => ({
  id: 'sid',
  title: 'a story',
  status: 'queued',
  order: 0,
  result: null,
  createdAt: 0,
  ...over,
});

const session = (stories: Story[]): Session => ({
  id: 'abc',
  createdAt: 0,
  revealed: false,
  stories: Object.fromEntries(stories.map((s) => [s.id, s])),
});

describe('exportSession', () => {
  it('emits a v3 document sorted by queue order', () => {
    const doc = exportSession(
      session([
        story({ id: 'b', title: 'second', order: 1, status: 'done', result: 8 }),
        story({ id: 'a', title: 'first', order: 0 }),
      ]),
    );
    expect(doc.app).toBe('fibo');
    expect(doc.version).toBe(3);
    expect(doc.deck).toEqual({ preset: 'fib', cards: [0, 1, 2, 3, 5, 8, 13, 21] });
    expect(Date.parse(doc.exportedAt)).not.toBeNaN();
    expect(doc.stories).toEqual([{ title: 'first' }, { title: 'second', points: 8 }]);
  });

  it('only done stories with a result carry points', () => {
    const doc = exportSession(
      session([
        story({ id: 'a', title: 'active with votes', order: 0, status: 'active', result: 5 }),
        story({ id: 'b', title: 'done unset', order: 1, status: 'done', result: null }),
      ]),
    );
    expect(doc.stories).toEqual([{ title: 'active with votes' }, { title: 'done unset' }]);
  });

  it('handles a session with no stories', () => {
    expect(exportSession(session([])).stories).toEqual([]);
  });
});

describe('parseSessionExport', () => {
  it('round-trips a v2 export', () => {
    const doc = exportSession(
      session([story({ id: 'a', title: 'first', order: 0, status: 'done', result: 13 })]),
    );
    const parsed = parseSessionExport(JSON.stringify(doc));
    expect(parsed.stories).toEqual([{ title: 'first', points: 13 }]);
  });

  it('accepts legacy v1 documents (status + result)', () => {
    const v1 = {
      app: 'fibo',
      version: 1,
      exportedAt: 1700000000000,
      stories: [
        { title: 'pointed', status: 'done', result: 5 },
        { title: 'open', status: 'queued', result: null },
      ],
    };
    const parsed = parseSessionExport(JSON.stringify(v1));
    expect(parsed.version).toBe(3);
    expect(parsed.stories).toEqual([{ title: 'pointed', points: 5 }, { title: 'open' }]);
  });

  it('drops invalid point values instead of importing garbage', () => {
    const parsed = parseSessionExport(
      JSON.stringify({
        app: 'fibo',
        version: 2,
        exportedAt: new Date().toISOString(),
        stories: [{ title: 'weird', points: 99 }],
      }),
    );
    expect(parsed.stories).toEqual([{ title: 'weird' }]);
  });

  it.each([
    ['not json at all', 'nope{'],
    ['a non-object', '42'],
    ['missing the app marker', '{"version":2,"stories":[]}'],
    ['an unknown version', '{"app":"fibo","version":4,"stories":[]}'],
    ['a missing stories list', '{"app":"fibo","version":2}'],
    ['a story without a title', '{"app":"fibo","version":2,"stories":[{"points":5}]}'],
  ])('rejects %s', (_label, json) => {
    expect(() => parseSessionExport(json)).toThrow(ImportError);
  });
});

describe('parseSessionExport deck handling', () => {
  it('round-trips a t-shirt deck with string points', () => {
    const parsed = parseSessionExport(
      JSON.stringify({
        app: 'fibo',
        version: 3,
        exportedAt: new Date().toISOString(),
        deck: { preset: 'tshirt' },
        stories: [{ title: 'sized', points: 'XL' }],
      }),
    );
    expect(parsed.deck?.cards).toContain('XL');
    expect(parsed.stories).toEqual([{ title: 'sized', points: 'XL' }]);
  });

  it('drops points that are not in the imported deck', () => {
    const parsed = parseSessionExport(
      JSON.stringify({
        app: 'fibo',
        version: 3,
        exportedAt: new Date().toISOString(),
        deck: { preset: 'custom', cards: ['A', 'B'] },
        stories: [{ title: 'stray', points: 5 }],
      }),
    );
    expect(parsed.stories).toEqual([{ title: 'stray' }]);
  });
});

describe('storiesFromExport', () => {
  it('materializes fresh records: pointed stories done, the rest queued', () => {
    let n = 0;
    const out = storiesFromExport(
      {
        app: 'fibo',
        version: 2,
        exportedAt: new Date().toISOString(),
        stories: [{ title: 'done one', points: 8 }, { title: 'todo one' }],
      },
      () => `id${n++}`,
      123,
    );
    expect(out).toEqual({
      id0: { id: 'id0', title: 'done one', status: 'done', order: 0, result: 8, createdAt: 123 },
      id1: { id: 'id1', title: 'todo one', status: 'queued', order: 1, result: null, createdAt: 123 },
    });
  });
});
