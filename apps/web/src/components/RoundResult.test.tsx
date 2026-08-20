import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoundResult } from './RoundResult';
import { session, user, voted } from '@/test/fixtures';

describe('RoundResult', () => {
  it('shows a placeholder until the cards are up', () => {
    render(<RoundResult session={session()} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('tallies the votes once revealed, most common first', () => {
    const { container } = render(<RoundResult session={voted({ a: 5, b: 5, c: 8 })} />);
    expect(container.querySelector('[data-summary]')?.textContent).toMatch(/5×2.*8×1/);
  });

  it('counts a player who has not voted as a question mark', () => {
    const s = voted(
      { u1: 5 },
      { users: { u1: user(), u2: user({ name: 'Grace' }) } },
    );
    render(<RoundResult session={s} />);
    expect(screen.getByText(/\?×1/)).toBeInTheDocument();
  });

  it('does not count a spectator as a missing vote', () => {
    // The whole point of a spectator: no seat, no hand, no tally entry.
    const s = voted(
      { u1: 5 },
      { users: { u1: user(), u2: user({ name: 'Watcher', role: 'spectator' }) } },
    );
    render(<RoundResult session={s} />);
    expect(screen.queryByText(/\?×/)).not.toBeInTheDocument();
  });

  it('counts an explicit skip as a question mark rather than a value', () => {
    const s = voted({ u1: 5, u2: 'skip' }, { users: { u1: user(), u2: user({ name: 'Grace' }) } });
    render(<RoundResult session={s} />);
    expect(screen.getByText(/\?×1/)).toBeInTheDocument();
    expect(screen.queryByText(/skip×/)).not.toBeInTheDocument();
  });

  it('shows the timer instead of the readout while the round is still running', () => {
    const s = session({ timer: { endsAt: Date.now() + 60_000, seconds: 60 }, revealed: false });
    const { container } = render(<RoundResult session={s} />);
    expect(container.querySelector('[data-headline]')).toBeNull();
  });

  it('stays mounted before and after the reveal, so the rail never reshuffles', () => {
    const { container: before } = render(<RoundResult session={session()} />);
    const { container: after } = render(<RoundResult session={voted({ a: 3 })} />);
    expect(before.querySelector('[data-round-result]')).not.toBeNull();
    expect(after.querySelector('[data-round-result]')).not.toBeNull();
  });

  it('treats a story that is gone as not revealed', () => {
    render(<RoundResult session={session({ revealed: true, currentStoryId: null })} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });
});
