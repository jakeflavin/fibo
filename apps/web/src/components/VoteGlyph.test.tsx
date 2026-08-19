import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VoteGlyph } from './VoteGlyph';

describe('VoteGlyph', () => {
  it('renders a number as its own text', () => {
    render(<VoteGlyph value={8} />);
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('gives the coffee break an accessible name, since it is drawn as an icon', () => {
    render(<VoteGlyph value="coffee" />);
    expect(screen.getByLabelText('coffee break')).toBeInTheDocument();
  });

  it('renders a skip and an absent vote the same way', () => {
    const { container: skip } = render(<VoteGlyph value="skip" />);
    const { container: none } = render(<VoteGlyph value={null} />);
    expect(skip.textContent).toBe(none.textContent);
  });
});
