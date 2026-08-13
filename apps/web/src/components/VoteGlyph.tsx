import { Coffee } from 'lucide-react';
import type { VoteValue } from '@fibo/shared';
import { formatVote } from '@fibo/shared';

/**
 * Renders a vote value wherever one appears: numbers and skip as text,
 * the coffee break as a real icon. Sized in em so it tracks the local
 * font size, from seat cards down to queue badges.
 */
export function VoteGlyph({ value }: { value: VoteValue | null | undefined }) {
  if (value === 'coffee') {
    return <Coffee size="1em" strokeWidth={2.25} aria-label="coffee break" />;
  }
  return <>{formatVote(value)}</>;
}
