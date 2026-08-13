/**
 * 12 identity sets: a color paired with a minimal fat-pixel avatar.
 * Avatars are 8x8 grids: 'X' = main color, 'O' = shade, 'W' = light, '.' = transparent.
 * Colors are the six chromatic hues of the shared Goals palette (two avatars
 * per hue), as scheme-aware dark/light pairs.
 */

export interface IdentitySet {
  name: string;
  /** Main color on a dark canvas (bright pastel from the shared palette). */
  color: string;
  /** Main color on a light canvas (deep saturated variant of the same hue). */
  colorLight: string;
  /** Darker shade used for eyes / details. */
  shade: string;
  /** 8 rows x 8 cols pixel grid. */
  pixels: string[];
}

export const IDENTITY_SETS: IdentitySet[] = [
  {
    name: 'bot',
    color: '#F0909E',
    colorLight: '#B23A54',
    shade: '#4A1520',
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
    color: '#6FCF97',
    colorLight: '#1F7A4D',
    shade: '#123B26',
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
    color: '#5CC9DE',
    colorLight: '#0E7C90',
    shade: '#093E48',
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
    color: '#E2C069',
    colorLight: '#9A6A0C',
    shade: '#453305',
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
    color: '#B49CF0',
    colorLight: '#6B4FC4',
    shade: '#2E2354',
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
    color: '#B49CF0',
    colorLight: '#6B4FC4',
    shade: '#2E2354',
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
    color: '#F0909E',
    colorLight: '#B23A54',
    shade: '#4A1520',
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
    color: '#E89A5C',
    colorLight: '#B2611E',
    shade: '#4A2408',
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
    color: '#6FCF97',
    colorLight: '#1F7A4D',
    shade: '#123B26',
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
    color: '#5CC9DE',
    colorLight: '#0E7C90',
    shade: '#093E48',
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
    color: '#E89A5C',
    colorLight: '#B2611E',
    shade: '#4A2408',
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
    color: '#E2C069',
    colorLight: '#9A6A0C',
    shade: '#453305',
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
