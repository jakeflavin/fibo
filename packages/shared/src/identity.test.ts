import { describe, expect, it } from 'vitest';
import { IDENTITY_SETS, pickIdentity } from './identity';

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

/*
 * Player names render in the identity colour at 14px on the raised surface, so
 * every one of the 24 has to clear AA for normal text on the ground it sits on.
 * Three light variants shipped below it — cat 4.44, slime 4.12, fox 4.23 —
 * which is a fifth of the roster on the fourth, sixth and eighth person to
 * join. Checked rather than remembered: the grounds are DESIGN.md §1's
 * elevation.surface.raised in each theme.
 */
const SURFACE = { light: '#FFFFFF', dark: '#242528' };

function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (linear[0] ?? 0) + 0.7152 * (linear[1] ?? 0) + 0.0722 * (linear[2] ?? 0);
}

function contrast(a: string, b: string): number {
  const [x, y] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

describe('identity contrast', () => {
  it('clears AA for 14px text in light mode', () => {
    for (const set of IDENTITY_SETS) {
      expect(
        contrast(set.colorLight, SURFACE.light),
        `${set.name} on ${SURFACE.light}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('clears AA for 14px text in dark mode', () => {
    for (const set of IDENTITY_SETS) {
      expect(
        contrast(set.color, SURFACE.dark),
        `${set.name} on ${SURFACE.dark}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
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
