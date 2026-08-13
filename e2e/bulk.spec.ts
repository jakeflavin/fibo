import { expect, test, type Page } from '@playwright/test';

async function createSession(page: Page, name: string) {
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill(name);
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
}

/** Dispatch a real paste event with multi-line text at the add-story input. */
async function pasteList(page: Page, text: string) {
  await page.getByPlaceholder(/add a story/i).evaluate((el, value) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', value);
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, text);
}

test('pasting a list queues one story per line and deals the first', async ({ page }) => {
  await createSession(page, 'Paster');

  await pasteList(page, '- JIRA-1 login\n- JIRA-2 signup\n\n- JIRA-3 checkout\n');
  await expect(page.locator('.story-row')).toHaveCount(3);
  // Nothing was on the table, so the first pasted story starts the round.
  await expect(page.locator('.story-title')).toContainText('JIRA-1 login');

  // Pasting more while a story is active only appends.
  await pasteList(page, 'JIRA-4 extra\nJIRA-5 more');
  await expect(page.locator('.story-row')).toHaveCount(5);
  await expect(page.locator('.story-title')).toContainText('JIRA-1 login');
});

test('copy results puts a title/points table on the clipboard', async ({ browser }) => {
  const ctx = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await ctx.newPage();
  await createSession(page, 'Copier');

  const add = page.getByPlaceholder(/add a story/i);
  await add.fill('DONE-1 pointed story');
  await add.press('Enter');
  await page.getByTitle('5 points', { exact: true }).click();
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('5');
  // Accept by switching to a fresh story.
  await add.fill('OPEN-2 unpointed story');
  await add.press('Enter');

  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('menuitem', { name: 'Copy results' }).click();
  await expect(page.getByText(/results copied/i)).toBeVisible();

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toBe('DONE-1 pointed story\t5\nOPEN-2 unpointed story\t');

  await ctx.close();
});
