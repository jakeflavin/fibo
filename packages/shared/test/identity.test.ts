import { describe, expect, it } from 'vitest';
import { IDENTITY_SETS, pickIdentity } from '../src/identity';

describe('IDENTITY_SETS', () => {
  it('holds 12 sets, each with both theme colors and an 8x8 grid', () => {
    expect(IDENTITY_SETS).toHaveLength(12);
    for (const set of IDENTITY_SETS) {
      expect(set.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(set.colorLight).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(set.pixels).toHaveLength(8);
      for (const row of set.pixels) expect(row).toHaveLength(8);
    }
  });

  it('never repeats a color within a theme', () => {
    const dark = IDENTITY_SETS.map((s) => s.color.toLowerCase());
    const light = IDENTITY_SETS.map((s) => s.colorLight.toLowerCase());
    expect(new Set(dark).size).toBe(dark.length);
    expect(new Set(light).size).toBe(light.length);
  });
});

describe('pickIdentity', () => {
  it('hands out the lowest free index', () => {
    expect(pickIdentity([])).toBe(0);
    expect(pickIdentity([0, 1, 3])).toBe(2);
    expect(pickIdentity([...Array(11).keys()])).toBe(11);
  });

  it('falls back to a random index when all 12 are taken', () => {
    const all = [...Array(12).keys()];
    expect(pickIdentity(all, () => 0)).toBe(0);
    expect(pickIdentity(all, () => 0.999)).toBe(11);
  });
});
