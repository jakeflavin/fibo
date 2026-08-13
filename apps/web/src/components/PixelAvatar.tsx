import { IDENTITY_SETS } from '@fibo/shared';

interface Props {
  identity: number;
  size?: number;
  className?: string;
}

/**
 * Renders one of the 12 fat-pixel avatars as a crisp SVG.
 * The main tone is scheme-aware: --idc resolves to the identity's dark or
 * light variant depending on the active theme (see .identity in styles.css).
 */
export function PixelAvatar({ identity, size = 32, className }: Props) {
  const set = IDENTITY_SETS[identity % IDENTITY_SETS.length];
  const rects: React.ReactElement[] = [];
  set.pixels.forEach((row, y) => {
    Array.from(row).forEach((ch, x) => {
      if (ch === '.') return;
      const fill =
        ch === 'X' ? 'var(--idc)' : ch === 'O' ? set.shade : 'var(--avatar-light, #f2f2f2)';
      rects.push(<rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill={fill} />);
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
