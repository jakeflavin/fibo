import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/api', () => ({
  removeUser: vi.fn(),
  setRole: vi.fn(),
  transferAdmin: vi.fn(),
}));

import * as api from '@/lib/api';
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

  /*
   * The menu portals to <body>, so the outside-click guard is the only thing
   * standing between a click and the menu being unmounted under it. It used to
   * test for a class nothing rendered: mousedown closed the menu, mouseup
   * landed on nothing, and all four actions silently did nothing on every
   * platform. userEvent sends the real sequence; fireEvent.click would not,
   * and would pass against the broken build.
   */
  describe('the row actions menu', () => {
    const owned = {
      u1: user({ name: 'Ada', role: 'owner' }),
      u2: user({ name: 'Grace' }),
    };

    /*
     * pointerEventsCheck off: the trigger is a hover-reveal action, so it sits
     * at pointer-events: none until the row is hovered — and jsdom has no
     * hover. The reveal is a browser behaviour and is checked in one; what
     * these prove is that a click that reaches the menu actually fires.
     */
    const openMenuForGrace = async () => {
      vi.clearAllMocks();
      const u = userEvent.setup({ pointerEventsCheck: 0 });
      render(<Participants session={session({ users: owned })} myUserId="u1" />);
      await u.click(screen.getByLabelText('Actions for Grace'));
      return u;
    };

    it('stays open when a click starts inside it', async () => {
      await openMenuForGrace();
      expect(screen.getByRole('menuitem', { name: /make lead/i })).toBeInTheDocument();
    });

    it('promotes a player to lead', async () => {
      const u = await openMenuForGrace();
      await u.click(screen.getByRole('menuitem', { name: /make lead/i }));
      expect(api.setRole).toHaveBeenCalledWith(expect.anything(), 'u2', 'leader');
    });

    it('makes a player a spectator', async () => {
      const u = await openMenuForGrace();
      await u.click(screen.getByRole('menuitem', { name: /make spectator/i }));
      expect(api.setRole).toHaveBeenCalledWith(expect.anything(), 'u2', 'spectator');
    });

    it('removes a player from the session', async () => {
      const u = await openMenuForGrace();
      await u.click(screen.getByRole('menuitem', { name: /remove from session/i }));
      expect(api.removeUser).toHaveBeenCalledWith(expect.anything(), 'u2');
    });

    it('asks before handing over the admin seat', async () => {
      const u = await openMenuForGrace();
      await u.click(screen.getByRole('menuitem', { name: /transfer admin/i }));
      expect(api.transferAdmin).not.toHaveBeenCalled();
      expect(screen.getByRole('alertdialog', { name: /transfer admin/i })).toBeInTheDocument();
    });

    it('closes on a click outside it', async () => {
      const u = await openMenuForGrace();
      await u.click(document.body);
      expect(screen.queryByRole('menuitem', { name: /make lead/i })).not.toBeInTheDocument();
    });
  });
});