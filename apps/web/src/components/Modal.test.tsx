import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

/*
 * showModal() and close() are shimmed in the test setup — jsdom has neither. jsdom also
 * does no layout, so getBoundingClientRect is all zeroes and the backdrop hit test is
 * exercised with an explicit rect rather than a real click position.
 */

const open = (props: Partial<Parameters<typeof Modal>[0]> = {}) =>
  render(
    <Modal title="Change deck" onClose={vi.fn()} {...props}>
      <button>Save deck</button>
    </Modal>,
  );

describe('Modal', () => {
  it('opens itself as a modal dialog on mount', () => {
    open();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeVisible();
    expect((dialog as HTMLDialogElement).open).toBe(true);
  });

  it('takes its accessible name from the visible title', () => {
    open();
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Change deck');
  });

  it('can be an alertdialog when it interrupts to ask something destructive', () => {
    open({ role: 'alertdialog' });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('tells its owner once when the close button is used', async () => {
    const onClose = vi.fn();
    open({ onClose });
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on Escape without a key listener of its own', () => {
    const onClose = vi.fn();
    open({ onClose });
    const dialog = screen.getByRole('dialog');
    // What the browser dispatches on Escape, before it would close the element itself.
    fireEvent(dialog, new Event('cancel', { cancelable: true, bubbles: false }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('leaves the element open on Escape, so the parent owns the unmount', () => {
    const onClose = vi.fn();
    open({ onClose });
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    fireEvent(dialog, new Event('cancel', { cancelable: true, bubbles: false }));
    // Prevented: were it allowed through, the element would close while the parent still
    // believed it was open, and it could never be reopened.
    expect(dialog.open).toBe(true);
  });

  it('closes on a click outside its box', async () => {
    const onClose = vi.fn();
    open({ onClose });
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      top: 100, right: 300, bottom: 300, left: 100,
    } as DOMRect);
    await userEvent.pointer({ target: dialog, coords: { clientX: 10, clientY: 10 }, keys: '[MouseLeft]' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stays open when the click lands on its own padding', async () => {
    const onClose = vi.fn();
    open({ onClose });
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      top: 100, right: 300, bottom: 300, left: 100,
    } as DOMRect);
    await userEvent.pointer({ target: dialog, coords: { clientX: 150, clientY: 150 }, keys: '[MouseLeft]' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores a click on its content, which is what stopPropagation used to do', async () => {
    const onClose = vi.fn();
    open({ onClose });
    await userEvent.click(screen.getByRole('button', { name: 'Save deck' }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('passes a caller’s class through to the dialog', () => {
    open({ className: 'connect-modal' });
    expect(screen.getByRole('dialog')).toHaveClass('connect-modal');
  });
});
