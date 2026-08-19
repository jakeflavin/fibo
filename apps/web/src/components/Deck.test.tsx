import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// The component's only outside reach. Stubbed rather than mocked deeply: the
// assertion is what the hand sends, not how Firebase stores it.
const castVote = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ castVote }));

import { Deck } from './Deck';
import { session, story } from '@/test/fixtures';

beforeEach(() => castVote.mockClear());

describe('Deck', () => {
  it('deals one card per deck value, plus skip and coffee', () => {
    render(<Deck session={session()} myUserId="u1" />);
    expect(screen.getByTitle('8 points')).toBeEnabled();
    expect(screen.getByTitle('Skip this story')).toBeInTheDocument();
    expect(screen.getByTitle('Coffee break')).toBeInTheDocument();
  });

  it('plays a card face-down', async () => {
    render(<Deck session={session()} myUserId="u1" />);
    await userEvent.click(screen.getByTitle('8 points'));
    expect(castVote).toHaveBeenCalledWith('sess', 's1', 'u1', 8);
  });

  it('takes the card back when the same one is played twice', async () => {
    const s = session({ stories: { s1: story({ votes: { u1: 8 } }) } });
    render(<Deck session={s} myUserId="u1" />);
    expect(screen.getByTitle('8 points')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByTitle('8 points'));
    expect(castVote).toHaveBeenCalledWith('sess', 's1', 'u1', null);
  });

  it('locks with no story on the table', () => {
    render(<Deck session={session({ currentStoryId: null })} myUserId="u1" />);
    expect(screen.getByTitle('8 points')).toBeDisabled();
  });

  it('locks once the cards are up', () => {
    render(<Deck session={session({ revealed: true })} myUserId="u1" />);
    expect(screen.getByTitle('8 points')).toBeDisabled();
  });

  it('shows no card as played while locked, even when a vote is stored', () => {
    // Otherwise the hand would leak the player's vote back to them after a
    // reveal that reset the round.
    const s = session({ revealed: true, stories: { s1: story({ votes: { u1: 8 } }) } });
    render(<Deck session={s} myUserId="u1" />);
    expect(screen.getByTitle('8 points')).toHaveAttribute('aria-pressed', 'false');
  });

  it('deals the session deck when one is set, not the default', () => {
    const s = session({ deck: { preset: 'tshirt', cards: ['S', 'M', 'L'] as never } });
    render(<Deck session={s} myUserId="u1" />);
    expect(screen.getByTitle('M')).toBeInTheDocument();
    expect(screen.queryByTitle('8 points')).not.toBeInTheDocument();
  });
});
