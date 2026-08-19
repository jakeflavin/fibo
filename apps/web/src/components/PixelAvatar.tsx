import { IDENTITY_SETS } from '@fibo/shared'

interface PixelAvatarProps {
  identity: number
  size?: number
  className?: string
  /** Single-tone silhouette color; overrides the identity's own tones. */
  ink?: string
}

/**
 * Renders one of the 12 fat-pixel avatars as a crisp single-color SVG.
 * Detail pixels ('O' — eyes, teeth) punch through to whatever the avatar
 * sits on. The color is scheme-aware: --idc resolves to the identity's dark
 * or light variant depending on the active theme (see .identity in
 * styles.css); `ink` overrides it for stamped renderings.
 */
/**
 * Resolves an identity to its pixel set. Normalised for negatives — only the upper bound
 * was handled, so a negative identity indexed off the front of the list.
 */
function identitySet(identity: number) {
  const count = IDENTITY_SETS.length
  return IDENTITY_SETS[((identity % count) + count) % count] ?? IDENTITY_SETS[0]
}

export function PixelAvatar({ identity, size = 32, className, ink }: PixelAvatarProps) {
  const set = identitySet(identity)
  const fill = ink ?? 'var(--idc)'
  const rects: React.ReactElement[] = []
  set.pixels.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      if (ch === '.' || ch === 'O') return
      rects.push(<rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
    })
  })
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`${set.name} avatar`}
      className={`identity ${className ?? ''}`}
      style={identityVars(identity)}
    >
      {rects}
    </svg>
  )
}

/** CSS custom properties carrying an identity's dark/light color pair. */
export function identityVars(identity: number): React.CSSProperties {
  const set = identitySet(identity)
  return { '--id-dark': set.color, '--id-light': set.colorLight } as React.CSSProperties
}
