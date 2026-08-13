import { IDENTITY_SETS } from '@fibo/shared';

interface Props {
  identity: number;
  size?: number;
  className?: string;
  /** Single-tone silhouette color; overrides the identity's own tones. */
  ink?: string;
}

/**
 * Renders one of the 12 fat-pixel avatars as a crisp SVG.
 * The main tone is scheme-aware: --idc resolves to the identity's dark or
 * light variant depending on the active theme (see .identity in styles.css).
 */
export function PixelAvatar({ identity, size = 32, className, ink }: Props) {
  const set = IDENTITY_SETS[identity % IDENTITY_SETS.length];
  const rects: React.ReactElement[] = [];
  set.pixels.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      if (ch === '.') return;
      // Inked (stamped) rendering keeps the details: eye pixels ('O') punch
      // through to whatever the avatar sits on, light pixels ('W') print at
      // partial opacity.
      if (ink && ch === 'O') return;
      const fill =
        ink ??
        (ch === 'X' ? 'var(--idc)' : ch === 'O' ? set.shade : 'var(--avatar-light, #f2f2f2)');
      const opacity = ink && ch === 'W' ? 0.55 : undefined;
      rects.push(
        <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={fill} opacity={opacity} />,
      );
    });
  });
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
  );
}

/** CSS custom properties carrying an identity's dark/light color pair. */
export function identityVars(identity: number): React.CSSProperties {
  const set = IDENTITY_SETS[identity % IDENTITY_SETS.length];
  return { '--id-dark': set.color, '--id-light': set.colorLight } as React.CSSProperties;
}
