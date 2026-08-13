import { describe, expect, it } from 'vitest';
import { newSessionId, newStoryId, newUserId } from '../src/ids';

/** Ids must be lowercase and skip the ambiguous 0/o and 1/l glyphs. */
const SHAPE = /^[a-km-np-z2-9]+$/;

describe('id generation', () => {
  it('produces ids of the documented lengths', () => {
    expect(newSessionId()).toHaveLength(10);
    expect(newUserId()).toHaveLength(16);
    expect(newStoryId()).toHaveLength(12);
  });

  it('only uses the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i++) {
      expect(newSessionId()).toMatch(SHAPE);
      expect(newStoryId()).toMatch(SHAPE);
    }
  });

  it('does not collide in practice', () => {
    const ids = new Set(Array.from({ length: 1000 }, newSessionId));
    expect(ids.size).toBe(1000);
  });
});
