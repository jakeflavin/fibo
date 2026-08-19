import '@testing-library/jest-dom';

/*
 * jsdom 29 understands <dialog> markup and the `open` property, but implements neither
 * showModal() nor close(). Without these, a component that opens itself natively stays
 * closed in tests and every assertion about it passes for the wrong reason — which is
 * exactly what happened before this was added.
 *
 * Deliberately the smallest thing that makes the contract observable: open/closed state
 * and the close event. The parts jsdom cannot do at all — the top layer, focus trapping,
 * ::backdrop, inertness — are the browser's job, and are verified in a real one.
 */
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, value?: string) {
    if (!this.open) return;
    this.open = false;
    if (value !== undefined) this.returnValue = value;
    this.dispatchEvent(new Event('close'));
  };
}
