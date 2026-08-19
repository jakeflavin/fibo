/**
 * Writes the app icons as PNGs.
 *
 * Home-screen icons have to be PNG — iOS ignores an SVG apple-touch-icon — so they are
 * generated here rather than hand-drawn, and committed. Run `npm run icons` after
 * changing the mark. PNG is written directly: the alternative was a build-time image
 * dependency for three small files.
 *
 * The mark is the favicon's: a planning-poker card, tilted, with a question mark on it.
 * The glyph is built from an arc and a dot rather than set in a typeface, because there
 * is no font here — and a "?" is two strokes, which is exactly what this can draw.
 */
import { lerp, clamp01, writeIcons } from './icon-png.mjs'

const OUT = new URL('../apps/web/public/', import.meta.url)

/** The app's sunken surface, so the icon sits on the ground the app opens on. */
const BACKDROP = [24, 25, 26]
const CARD = [24, 104, 219]
const INK = [255, 255, 255]
/** The hairline inside the card's edge, at the favicon's 55%. */
const RULE_ALPHA = 0.55

/** The favicon tilts the card 8 degrees anticlockwise. */
const TILT = (-8 * Math.PI) / 180

const CARD_BOX = { hw: 0.3, hh: 0.406, r: 0.069 }
const RULE_BOX = { hw: 0.212, hh: 0.319, r: 0.037 }
const RULE_WIDTH = 0.025 / 2

/*
 * The question mark, as the three strokes it actually is: a hook that runs from the
 * lower left over the top and round to the right, a neck cutting back in from where the
 * hook ends, and the dot. Drawing the hook as a plain half-ring reads as an upside-down
 * U, which is what the first attempt at this looked like.
 */
const HOOK = { y: -0.1, r: 0.115, half: 0.042 }
/** The wedge the hook leaves open, in degrees, measured with y pointing down. */
const HOOK_GAP = [20, 150]
const NECK_END = [0, 0.055]
const DOT = { x: 0, y: 0.175, r: 0.052 }

/** Where the hook stops, and so where the neck begins. */
const hookEnd = [
  HOOK.r * Math.cos((HOOK_GAP[0] * Math.PI) / 180),
  HOOK.y + HOOK.r * Math.sin((HOOK_GAP[0] * Math.PI) / 180),
]

/** Signed distance to a line segment of a given half-width. */
function segment(u, v, [x1, y1], [x2, y2], half) {
  const dx = x2 - x1
  const dy = y2 - y1
  const t = clamp01(((u - x1) * dx + (v - y1) * dy) / (dx * dx + dy * dy))
  return Math.hypot(u - (x1 + t * dx), v - (y1 + t * dy)) - half
}

/** The hook: the ring, minus the wedge left open at the lower left. */
function hook(u, v) {
  const dy = v - HOOK.y
  let deg = (Math.atan2(dy, u) * 180) / Math.PI
  if (deg < 0) deg += 360
  if (deg > HOOK_GAP[0] && deg < HOOK_GAP[1]) return 1
  return Math.abs(Math.hypot(u, dy) - HOOK.r) - HOOK.half
}

/** Signed distance to a rounded rectangle: negative inside, positive outside. */
function roundRect(u, v, box) {
  const dx = Math.abs(u) - (box.hw - box.r)
  const dy = Math.abs(v) - (box.hh - box.r)
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0))
  return outside + Math.min(Math.max(dx, dy), 0) - box.r
}

function render(size) {
  const pixels = new Array(size * size)
  const edge = 1.2 / size
  const cos = Math.cos(-TILT)
  const sin = Math.sin(-TILT)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Centred coordinates, then rotated into the card's own frame.
      const cx = x / (size - 1) - 0.5
      const cy = y / (size - 1) - 0.5
      const u = cx * cos - cy * sin
      const v = cx * sin + cy * cos

      let rgb = [...BACKDROP]

      const card = clamp01(-roundRect(u, v, CARD_BOX) / edge)
      if (card > 0) rgb = rgb.map((c, i) => lerp(c, CARD[i], card))

      // The hairline, drawn as the band either side of the inner rectangle's edge.
      const rule = clamp01((RULE_WIDTH - Math.abs(roundRect(u, v, RULE_BOX))) / edge)
      if (rule > 0) rgb = rgb.map((c, i) => lerp(c, INK[i], rule * RULE_ALPHA))

      const glyph = Math.min(
        hook(u, v),
        segment(u, v, hookEnd, NECK_END, HOOK.half),
        Math.hypot(u - DOT.x, v - DOT.y) - DOT.r,
      )
      const mark = clamp01(-glyph / edge)
      if (mark > 0) rgb = rgb.map((c, i) => lerp(c, INK[i], mark))

      pixels[y * size + x] = rgb.map((c) => Math.round(clamp01(c / 255) * 255))
    }
  }

  return pixels
}

// 180 is what iOS asks for; 192 and 512 are what a manifest wants.
for (const size of writeIcons(OUT, [180, 192, 512], render)) {
  console.log(`wrote apps/web/public/icon-${size}.png`)
}
