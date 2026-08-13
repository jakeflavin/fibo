/**
 * 12 identity sets: a unique color paired with a minimal fat-pixel avatar.
 * Avatars are 8x8 grids: 'X'/'W' = body, 'O' = punched-out detail (eyes,
 * teeth), '.' = transparent. Avatars render in a single color.
 *
 * Colors extend the shared Goals palette: the six original chromatic hues
 * plus six new ones built to the same recipe — bright pastel on a dark
 * canvas, deep saturated variant on the light printout.
 */

export interface IdentitySet {
  name: string;
  /** Color on a dark canvas (bright pastel). */
  color: string;
  /** Color on a light canvas (deep saturated variant of the same hue). */
  colorLight: string;
  /** 8 rows x 8 cols pixel grid. */
  pixels: string[];
}

export const IDENTITY_SETS: IdentitySet[] = [
  {
    name: 'bot', // rose
    color: '#F0909E',
    colorLight: '#B23A54',
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
    name: 'invader', // green
    color: '#6FCF97',
    colorLight: '#1F7A4D',
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
    name: 'ghost', // cyan
    color: '#5CC9DE',
    colorLight: '#0E7C90',
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
    name: 'cat', // amber
    color: '#E2C069',
    colorLight: '#9A6A0C',
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
    name: 'skull', // violet
    color: '#B49CF0',
    colorLight: '#6B4FC4',
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
    name: 'slime', // lime
    color: '#B9D46E',
    colorLight: '#68791B',
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
    name: 'shroom', // coral
    color: '#F09A82',
    colorLight: '#B2502E',
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
    name: 'fox', // orange
    color: '#E89A5C',
    colorLight: '#B2611E',
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
    name: 'frog', // teal
    color: '#6FD0C7',
    colorLight: '#12766B',
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
    name: 'alien', // sky
    color: '#7FB5F0',
    colorLight: '#2E62B2',
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
    name: 'crab', // magenta
    color: '#E093DC',
    colorLight: '#9C2F96',
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
    name: 'owl', // periwinkle
    color: '#94A4F0',
    colorLight: '#4053C0',
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
