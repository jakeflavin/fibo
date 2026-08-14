import { expect, test } from '@playwright/test';

const EMULATOR = 'http://127.0.0.1:9000';
const NS = 'ns=demo-fibo-default-rtdb';

/** Plant an ownerless session, as the MCP create_session tool writes it. */
async function plantHeadlessSession(id: string) {
  const now = Date.now();
  await fetch(`${EMULATOR}/sessions/${id}.json?${NS}`, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      createdAt: now,
      touchedAt: now,
      currentStoryId: null,
      revealed: false,
      stories: {
        s1: { id: 's1', title: 'JIRA-1 from Claude', status: 'queued', order: 0, result: null, createdAt: now },
        s2: { id: 's2', title: 'JIRA-2 from Claude', status: 'queued', order: 1, result: null, createdAt: now },
      },
    }),
  });
}

test('the first joiner to a headless session becomes its admin', async ({ browser }) => {
  const id = 'e2ehead9xa';
  await plantHeadlessSession(id);

  const firstCtx = await browser.newContext();
  const first = await firstCtx.newPage();
  await first.goto(`/s/${id}`);
  await first.getByPlaceholder('Grace').fill('Faye');
  await first.getByRole('button', { name: 'Join session' }).click();

  // Faye owns the room: Admin lozenge, controls, and the planted queue.
  await expect(first.locator('.user-row', { hasText: 'Faye' })).toContainText('Admin');
  await expect(first.getByRole('button', { name: 'Flip', exact: true })).toBeVisible();
  await expect(first.locator('.story-row')).toHaveCount(2);

  // The second joiner is a plain participant.
  const secondCtx = await browser.newContext();
  const second = await secondCtx.newPage();
  await second.goto(`/s/${id}`);
  await second.getByPlaceholder('Grace').fill('Gus');
  await second.getByRole('button', { name: 'Join session' }).click();
  await expect(second.locator('.user-row', { hasText: 'Gus' })).not.toContainText('Admin');

  await firstCtx.close();
  await secondCtx.close();
  await fetch(`${EMULATOR}/sessions/${id}.json?${NS}`, { method: 'DELETE' });
});

test('a spectator never inherits the admin seat', async ({ page }) => {
  const id = 'e2ehead9xb';
  await plantHeadlessSession(id);

  await page.goto(`/s/${id}`);
  await page.getByPlaceholder('Grace').fill('Watcher');
  await page.getByRole('button', { name: 'Join as spectator' }).click();
  const row = page.locator('.user-row', { hasText: 'Watcher' });
  await expect(row).toContainText('Spectator');
  await expect(row).not.toContainText('Admin');

  await fetch(`${EMULATOR}/sessions/${id}.json?${NS}`, { method: 'DELETE' });
});

test('Connect Claude instructions open from both settings menus', async ({ page }) => {
  // Home page settings menu.
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('menuitem', { name: 'Connect Claude' }).click();
  const dialog = page.getByRole('dialog', { name: 'Connect Claude' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/\/mcp$/).first()).toBeVisible();
  await page.keyboard.press('Escape');

  // Room gear menu.
  await page.getByPlaceholder('Ada').fill('Configurer');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('menuitem', { name: 'Connect Claude' }).click();
  await expect(page.getByRole('dialog', { name: 'Connect Claude' })).toBeVisible();
  await expect(page.getByText('claude mcp add --transport http')).toBeVisible();
});
