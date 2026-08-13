/**
 * 12 identity sets: a color paired with a minimal fat-pixel avatar.
 * Avatars are 8x8 grids: 'X' = main color, 'O' = shade, 'W' = light, '.' = transparent.
 */

export interface IdentitySet {
  name: string;
  /** Main color, chosen to read on both light and dark backgrounds. */
  color: string;
  /** Darker shade used for eyes / details. */
  shade: string;
  /** 8 rows x 8 cols pixel grid. */
  pixels: string[];
}

export const IDENTITY_SETS: IdentitySet[] = [
  {
    name: 'bot',
    color: '#e5484d',
    shade: '#7f1d1d',
    pixels: [
      '...XX...',
      '.XXXXXX.',
      '.XOXXOX.',
      '.XXXXXX.',
      '.XXOOXX.',
      '.XXXXXX.',
      '..X..X..',
      '........',
    ],
  },
  {
    name: 'invader',
    color: '#46a758',
    shade: '#14532d',
    pixels: [
      '..X..X..',
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      'X.XOOX.X',
      'X.XXXX.X',
      '...XX...',
      '..X..X..',
    ],
  },
  {
    name: 'ghost',
    color: '#0091ff',
    shade: '#1e3a8a',
    pixels: [
      '..XXXX..',
      '.XXXXXX.',
      '.XOXXOX.',
      '.XXXXXX.',
      '.XXXXXX.',
      '.XXXXXX.',
      '.XXXXXX.',
      '.X.XX.X.',
    ],
  },
  {
    name: 'cat',
    color: '#ffb224',
    shade: '#854d0e',
    pixels: [
      '.X....X.',
      '.XX..XX.',
      '.XXXXXX.',
      '.XOXXOX.',
      '.XXXXXX.',
      '..XXXX..',
      '..X..X..',
      '........',
    ],
  },
  {
    name: 'skull',
    color: '#8e4ec6',
    shade: '#3b0764',
    pixels: [
      '..XXXX..',
      '.XXXXXX.',
      '.XXXXXX.',
      '.XOXXOX.',
      '.XXXXXX.',
      '..XXXX..',
      '..XOOX..',
      '..XXXX..',
    ],
  },
  {
    name: 'slime',
    color: '#12a594',
    shade: '#134e4a',
    pixels: [
      '........',
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      '.XOXXOX.',
      'XXXXXXXX',
      'XXXXXXXX',
      '.XXXXXX.',
    ],
  },
  {
    name: 'shroom',
    color: '#e93d82',
    shade: '#831843',
    pixels: [
      '..XXXX..',
      '.XXXXXX.',
      'XXWXXWXX',
      'XXXXXXXX',
      '..WWWW..',
      '..WOOW..',
      '..WWWW..',
      '........',
    ],
  },
  {
    name: 'fox',
    color: '#f76b15',
    shade: '#7c2d12',
    pixels: [
      'X......X',
      'XX....XX',
      'XXXXXXXX',
      '.XOXXOX.',
      '.XXXXXX.',
      '..XWWX..',
      '...XX...',
      '........',
    ],
  },
  {
    name: 'frog',
    color: '#7cb305',
    shade: '#3f6212',
    pixels: [
      '.XX..XX.',
      'XOXXXXOX',
      'XXXXXXXX',
      'XXXXXXXX',
      '.XXXXXX.',
      '.X.XX.X.',
      '........',
      '........',
    ],
  },
  {
    name: 'alien',
    color: '#05a2c2',
    shade: '#164e63',
    pixels: [
      '...XX...',
      '..XXXX..',
      '.XXXXXX.',
      '.XOXXOX.',
      '.XXXXXX.',
      '..X..X..',
      '..X..X..',
      '........',
    ],
  },
  {
    name: 'crab',
    color: '#d6409f',
    shade: '#701a75',
    pixels: [
      'X..XX..X',
      '.X.XX.X.',
      '..XXXX..',
      '.XXXXXX.',
      'XXOXXOXX',
      '.XXXXXX.',
      '..X..X..',
      '.X....X.',
    ],
  },
  {
    name: 'owl',
    color: '#5b5bd6',
    shade: '#312e81',
    pixels: [
      '.X....X.',
      '.XXXXXX.',
      'XXOXXOXX',
      'XXXXXXXX',
      '.XXXXXX.',
      '.XWWWWX.',
      '..XXXX..',
      '..X..X..',
    ],
  },
];

/**
 * Pick the identity for a new user: the lowest set index not already taken.
 * Falls back to a random index when all 12 are in use.
 */
export function pickIdentity(taken: number[], random: () => number = Math.random): number {
  for (let i = 0; i < IDENTITY_SETS.length; i++) {
    if (!taken.includes(i)) return i;
  }
  return Math.floor(random() * IDENTITY_SETS.length);
}
