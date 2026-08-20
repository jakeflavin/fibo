import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DeckPicker } from './DeckPicker';
import { DECK_PRESETS, type DeckChoice } from '@fibo/shared';

const fib: DeckChoice = { preset: 'fib', cards: DECK_PRESETS.fib };

describe('DeckPicker', () => {
  it('is one tab stop, not three', async () => {
    const u = userEvent.setup();
    render(
      <>
        <button type="button">before</button>
        <DeckPicker value={fib} onChange={vi.fn()} />
        <button type="button">after</button>
      </>,
    );
    await u.click(screen.getByRole('button', { name: 'before' }));
    await u.tab();
    expect(screen.getByRole('radio', { name: 'Fibonacci' })).toHaveFocus();
    await u.tab();
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
  });

  it('moves between decks with the arrow keys', async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<DeckPicker value={fib} onChange={onChange} />);
    await u.click(screen.getByRole('radio', { name: 'Fibonacci' }));
    onChange.mockClear();

    await u.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset: 'tshirt' }));

    // Wrapping the other way lands on Custom, which has no cards yet and so
    // reports null — the same thing clicking it does.
    onChange.mockClear();
    await u.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('reports the chosen deck to its caller', async () => {
    const u = userEvent.setup();
    const onChange = vi.fn();
    render(<DeckPicker value={fib} onChange={onChange} />);
    await u.click(screen.getByRole('radio', { name: 'T-shirt' }));
    expect(onChange).toHaveBeenCalledWith({ preset: 'tshirt', cards: DECK_PRESETS.tshirt });
  });
});
