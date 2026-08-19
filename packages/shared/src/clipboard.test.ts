import { describe, expect, it } from 'vitest';
import { committedPoints, resultsTable, splitPastedTitles } from './clipboard';
import type { Session, Story } from './types';

const story = (over: Partial<Story>): Story => ({
  id: 'sid',
  title: 't',
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

describe('resultsTable', () => {
  it('emits title<TAB>points rows in queue order', () => {
    const out = resultsTable(
      session([
        story({ id: 'b', title: 'second', order: 1, status: 'done', result: 8 }),
        story({ id: 'a', title: 'first', order: 0, status: 'done', result: 'M' }),
      ]),
    );
    expect(out).toBe('first\tM\nsecond\t8');
  });

  it('leaves unpointed and face-down mid-round stories blank', () => {
    const out = resultsTable(
      session([
        story({ id: 'a', title: 'open', order: 0 }),
        story({ id: 'b', title: 'active', order: 1, status: 'active', result: 5 }),
      ]),
    );
    expect(out).toBe('open\t\nactive\t');
  });

  it('counts the active story once its cards are flipped with a result', () => {
    const s = session([story({ id: 'a', title: 'active', order: 0, status: 'active', result: 8 })]);
    s.revealed = true;
    expect(resultsTable(s)).toBe('active\t8');
  });

  it('renders a skipped story as ?', () => {
    const out = resultsTable(
      session([story({ id: 'a', title: 'skipped', order: 0, status: 'done', result: 'skip' })]),
    );
    expect(out).toBe('skipped\t?');
  });
});

describe('committedPoints', () => {
  it('done stories always count; active only when revealed with a result', () => {
    expect(committedPoints({ status: 'done', result: 5 }, { revealed: false })).toBe(5);
    expect(committedPoints({ status: 'active', result: 5 }, { revealed: false })).toBeNull();
    expect(committedPoints({ status: 'active', result: 5 }, { revealed: true })).toBe(5);
    expect(committedPoints({ status: 'active', result: null }, { revealed: true })).toBeNull();
    expect(committedPoints({ status: 'queued', result: 5 }, { revealed: true })).toBeNull();
  });
});

describe('splitPastedTitles', () => {
  it('splits lines, trims, and drops blanks', () => {
    expect(splitPastedTitles('  A-1 one \n\nA-2 two\r\n   \nA-3 three')).toEqual([
      'A-1 one',
      'A-2 two',
      'A-3 three',
    ]);
  });

  it('strips markdown bullets', () => {
    expect(splitPastedTitles('- first\n* second\n• third')).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('caps titles at 200 characters', () => {
    expect(splitPastedTitles('x'.repeat(300))[0]).toHaveLength(200);
  });
});
