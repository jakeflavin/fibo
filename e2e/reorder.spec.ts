import { expect, test } from '@playwright/test';

test('leads drag queue rows into a new order that sticks', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill('Sorter');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
  const url = page.url();

  // Three stories; the first is active, the rest queued.
  await page.getByPlaceholder(/add a story/i).evaluate((el, value) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', value);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, 'ONE first\nTWO second\nTHREE third');
  await expect(page.locator('.story-row')).toHaveCount(3);

  const titles = () =>
    page.locator('.story-row-title').evaluateAll((els) => els.map((e) => e.textContent));
  expect(await titles()).toEqual(['ONE first', 'TWO second', 'THREE third']);

  // Drag THREE above TWO (stepped moves so the pointer sensor engages).
  const from = await page.locator('.story-row', { hasText: 'THREE' }).boundingBox();
  const to = await page.locator('.story-row', { hasText: 'TWO' }).boundingBox();
  if (!from || !to) throw new Error('rows not laid out');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2 - 4, { steps: 12 });
  await page.mouse.up();

  await expect
    .poll(async () => titles())
    .toEqual(['ONE first', 'THREE third', 'TWO second']);

  // The order is data, not local state: a reload sees the same queue.
  await page.goto(url);
  await expect.poll(async () => titles()).toEqual(['ONE first', 'THREE third', 'TWO second']);

  // A plain click (no travel) still puts a story on the table.
  await page.locator('.story-row', { hasText: 'TWO second' }).click();
  await expect(page.locator('.story-title')).toContainText('TWO second');
});
