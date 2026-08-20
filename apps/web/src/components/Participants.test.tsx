import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  removeUser: vi.fn(),
  setRole: vi.fn(),
  transferAdmin: vi.fn(),
}));

import { Participants } from './Participants';
import { session, story, user } from '@/test/fixtures';

const seatOf = (name: string) => screen.getByText(name).closest('li');

describe('Participants', () => {
  it('marks a player who has voted without showing what they played', () => {
    const s = session({
      users: { u1: user({ name: 'Ada' }) },
      stories: { s1: story({ votes: { u1: 8 } }) },
    });
    render(<Participants session={s} myUserId="u1" />);
    expect(screen.getByLabelText('voted')).toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('shows the played card only after the reveal', () => {
    const s = session({
      revealed: true,
      users: { u1: user({ name: 'Ada' }) },
      stories: { s1: story({ votes: { u1: 8 } }) },
    });
    render(<Participants session={s} myUserId="u1" />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('leaves a spectator no vote status at all', () => {
    const s = session({
      users: { u1: user({ name: 'Ada' }), u2: user({ name: 'Watcher', role: 'spectator' }) },
      stories: { s1: story({ votes: { u1: 8 } }) },
    });
    render(<Participants session={s} myUserId="u1" />);
    // Ada's status is an icon, so compare rendered content rather than text.
    expect(seatOf('Watcher')?.querySelector('[data-vote]')?.innerHTML).toBe('');
    expect(seatOf('Ada')?.querySelector('[data-vote]')?.innerHTML).not.toBe('');
  });

  it('offers seat management only to the owner', () => {
    const players = { u1: user({ name: 'Ada' }), u2: user({ name: 'Grace' }) };
    const { unmount } = render(
      <Participants session={session({ users: players })} myUserId="u1" />,
    );
    expect(screen.queryByLabelText('Actions for Grace')).not.toBeInTheDocument();
    unmount();

    const owned = { u1: user({ name: 'Ada', role: 'owner' }), u2: user({ name: 'Grace' }) };
    render(<Participants session={session({ users: owned })} myUserId="u1" />);
    expect(screen.getByLabelText('Actions for Grace')).toBeInTheDocument();
  });

  it('gives the owner no actions against their own seat', () => {
    const owned = { u1: user({ name: 'Ada', role: 'owner' }) };
    render(<Participants session={session({ users: owned })} myUserId="u1" />);
    expect(screen.queryByLabelText('Actions for Ada')).not.toBeInTheDocument();
  });
});
