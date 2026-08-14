import { expect, test, type Browser, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SHOTS = path.join(__dirname, 'screenshots');

async function newVisitor(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  return ctx.newPage();
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

/** Open the gear menu and click one of its items. */
async function menuPick(page: Page, item: RegExp) {
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('menuitem', { name: item }).click();
}

test('full sprint planning session with three users', async ({ browser }) => {
  fs.mkdirSync(SHOTS, { recursive: true });

  // ── admin creates a session ────────────────────────────────
  const ada = await newVisitor(browser);
  await ada.goto('/');
  await expect(ada.locator('.logo')).toBeVisible();
  await shot(ada, '01-home');
  await ada.getByPlaceholder('Ada').fill('Ada');
  await ada.getByRole('button', { name: 'Create session' }).click();
  await ada.waitForURL(/\/s\/[a-z2-9]+/);
  const url = ada.url();

  // deck is visible but disabled before any story exists
  await expect(ada.locator('.deck .play-card').first()).toBeDisabled();
  await expect(ada.getByText('No story on the table.')).toBeVisible();

  // ── first story auto-activates ─────────────────────────────
  const addInput = ada.getByPlaceholder(/add a story/i);
  await addInput.fill('FIBO-1 login flow');
  await addInput.press('Enter');
  await expect(ada.locator('.story-title')).toContainText('FIBO-1 login flow');

  // ── share modal (via the gear menu) shows QR + link ────────
  await menuPick(ada, /share/i);
  await expect(ada.locator('.qr-box svg')).toBeVisible();
  await expect(ada.locator('.share-url')).toContainText('/s/');
  await shot(ada, '02-share-qr');
  await ada.keyboard.press('Escape');
  await expect(ada.locator('.qr-box')).toHaveCount(0);

  // ── two teammates join with just a name ────────────────────
  const bob = await newVisitor(browser);
  await bob.goto(url);
  await expect(bob.getByText(/people are here|person is here/)).toBeVisible();
  await bob.getByPlaceholder('Grace').fill('Bob');
  await bob.getByRole('button', { name: 'Join session' }).click();
  await expect(bob.locator('.story-title')).toContainText('FIBO-1 login flow');

  const cy = await newVisitor(browser);
  await cy.goto(url);
  await cy.getByPlaceholder('Grace').fill('Cy');
  await cy.getByRole('button', { name: 'Join session' }).click();
  await expect(cy.locator('.story-title')).toContainText('FIBO-1 login flow');

  // everyone appears in the team panel with distinct avatars
  await expect(ada.locator('.user-row')).toHaveCount(3);
  await expect(ada.locator('.user-row', { hasText: 'Ada' })).toContainText('Admin');

  // ── voting: locks are visible, values hidden until flip ────
  await bob.getByTitle('5 points', { exact: true }).click();
  await cy.getByTitle('8 points', { exact: true }).click();

  const bobSeatOnAda = ada.locator('.seat', { hasText: 'Bob' });
  await expect(bobSeatOnAda).toHaveClass(/seat-has-vote/);
  await expect(bobSeatOnAda.locator('.seat-card-front')).not.toContainText(/\d/);
  await expect(ada.locator('.seat-has-vote')).toHaveCount(2);

  await ada.getByTitle('5 points', { exact: true }).click();
  await expect(ada.locator('.seat-has-vote')).toHaveCount(3);
  await shot(ada, '03-all-voted-facedown');

  // participants have no controls toolbar
  await expect(bob.getByRole('button', { name: 'Flip' })).toHaveCount(0);

  // ── flip: consensus is the mode (5×2 beats 8×1) ────────────
  await ada.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(ada.locator('.result-value')).toHaveText('5');
  await expect(bob.locator('.result-value')).toHaveText('5');
  // the team rail shows everyone's revealed points
  await expect(bob.locator('.user-row', { hasText: 'Cy' }).locator('.user-vote')).toHaveText('8');
  await ada.waitForTimeout(700); // let the flip animation finish
  await shot(ada, '04-revealed');

  // ── lead overrides the winner on the point ruler ───────────
  await ada.locator('.result-edit').getByRole('button', { name: '8', exact: true }).click();
  await expect(bob.locator('.result-value')).toHaveText('8');

  // ── admin makes Bob a lead via the row actions menu ────────
  const bobRow = ada.locator('.user-row', { hasText: 'Bob' });
  await bobRow.hover();
  await bobRow.getByRole('button', { name: 'Actions for Bob' }).click();
  await ada.getByRole('menuitem', { name: 'Make lead' }).click();
  await expect(bob.locator('.user-row', { hasText: 'Bob' })).toContainText('Lead');
  await expect(bob.getByRole('button', { name: 'Flip', exact: true })).toBeVisible();

  // ── switching stories accepts the standing result ──────────
  const bobAdd = bob.getByPlaceholder(/add a story/i);
  await bobAdd.fill('FIBO-2 signup form');
  await bobAdd.press('Enter');
  await expect(cy.locator('.story-title')).toContainText('FIBO-2 signup form');
  await expect(
    bob.locator('.story-row', { hasText: 'FIBO-1' }).locator('.story-badge'),
  ).toHaveText('8');

  // ── timer auto-flips; skips flip as ? ──────────────────────
  await bob.getByRole('button', { name: '30s' }).click();
  await expect(cy.locator('.timer-clock')).toBeVisible();
  await expect(ada.locator('.timer-clock')).toBeVisible();

  await ada.getByTitle('Skip this story').click();
  await bob.getByTitle('Skip this story').click();
  await cy.getByTitle('Skip this story').click();
  await shot(ada, '05-timer-running');

  await expect(ada.locator('.result-value')).toHaveText('?', { timeout: 40_000 });
  await expect(cy.locator('.result-value')).toHaveText('?');

  // ── export (participants can too) ──────────────────────────
  const downloadPromise = cy.waitForEvent('download');
  await menuPick(cy, /export/i);
  const download = await downloadPromise;
  const exportPath = path.join(SHOTS, 'export.json');
  await download.saveAs(exportPath);
  const doc = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  expect(doc.app).toBe('fibo');
  expect(doc.version).toBe(3);
  expect(doc.stories.map((s: { title: string }) => s.title)).toEqual([
    'FIBO-1 login flow',
    'FIBO-2 signup form',
  ]);
  expect(doc.stories[0].points).toBe(8);

  // participants don't get the import option in the menu
  await cy.getByRole('button', { name: 'menu' }).click();
  await expect(cy.getByRole('menuitem', { name: /export/i })).toBeVisible();
  await expect(cy.getByRole('menuitem', { name: /import/i })).toHaveCount(0);
  await cy.keyboard.press('Escape');

  // ── import (lead): replaces the queue ──────────────────────
  doc.stories.push({ title: 'FIBO-3 imported story' });
  const importPath = path.join(SHOTS, 'import.json');
  fs.writeFileSync(importPath, JSON.stringify(doc));
  await bob.locator('input[type=file]').setInputFiles(importPath);
  await expect(bob.locator('.story-row')).toHaveCount(3);
  await expect(ada.locator('.story-row', { hasText: 'FIBO-3 imported story' })).toBeVisible();
  await expect(
    ada.locator('.story-row', { hasText: 'FIBO-1' }).locator('.story-badge'),
  ).toHaveText('8');

  // ── clicking a pointed queue row reopens it revealed ───────
  // (FIBO-2's skip round exported as points, so it imported done.)
  await ada.locator('.story-row', { hasText: 'FIBO-2' }).click();
  await expect(ada.locator('.story-title')).toContainText('FIBO-2 signup form');
  await expect(ada.locator('.result-value')).toHaveText('?');
  // Repoint clears the standing skip for a fresh round.
  await ada.getByRole('button', { name: 'Repoint this story' }).click();
  await ada.getByTitle('3 points', { exact: true }).click();
  await ada.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(ada.locator('.result-value')).toHaveText('3');
  await ada.getByRole('button', { name: 'Repoint this story' }).click();
  await expect(ada.locator('.result-value')).toHaveText('?');
  await expect(ada.locator('.seat-has-vote')).toHaveCount(0);

  // ── inline title edit: save, and click-away cancels ────────
  await ada.locator('.story-line').hover();
  await ada.getByRole('button', { name: 'Edit story title' }).click();
  const titleInput = ada.locator('.title-edit input');
  await titleInput.fill('FIBO-2 signup form v2');
  await ada.getByRole('button', { name: 'Save title' }).click();
  await expect(ada.locator('.story-title')).toContainText('FIBO-2 signup form v2');
  await expect(bob.locator('.story-title')).toContainText('FIBO-2 signup form v2');

  await ada.locator('.story-line').hover();
  await ada.getByRole('button', { name: 'Edit story title' }).click();
  await ada.locator('.title-edit input').fill('SHOULD NOT SAVE');
  await ada.locator('.seats').click(); // clicking off the editor cancels
  await expect(ada.locator('.story-title')).toContainText('FIBO-2 signup form v2');

  // ── deleting the active story clears the table ─────────────
  await ada.locator('.story-line').hover();
  await ada.getByRole('button', { name: 'Delete story' }).click();
  await ada.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(ada.getByText('No story on the table.')).toBeVisible();
  await expect(ada.locator('.story-row')).toHaveCount(2);

  // ── admin removes Cy from the session ──────────────────────
  const cyRow = ada.locator('.user-row', { hasText: 'Cy' });
  await cyRow.hover();
  await cyRow.getByRole('button', { name: 'Actions for Cy' }).click();
  await ada.getByRole('menuitem', { name: 'Remove from session' }).click();
  await expect(ada.locator('.user-row')).toHaveCount(2);
  // the kicked client lands back on the join gate
  await expect(cy.getByRole('button', { name: 'Join session' })).toBeVisible();
  await cy.context().close();

  // ── presence: a teammate disconnects ───────────────────────
  await bob.context().close();
  await expect(ada.locator('.user-row', { hasText: 'Bob' })).toHaveClass(/user-offline/, {
    timeout: 15_000,
  });
  await shot(ada, '06-final-room');

  // ── leave session returns home and drops the roster row ────
  await menuPick(ada, /leave session/i);
  await ada.getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(ada.locator('.logo')).toBeVisible();
});

test('new session from the gear menu opens a fresh room as admin', async ({ browser }) => {
  const page = await newVisitor(browser);
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill('Nia');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
  const first = page.url();

  await menuPick(page, /new session/i);
  await page.waitForURL((u) => /\/s\/[a-z2-9]+/.test(u.href) && u.href !== first);

  // the fresh room greets the same user as its admin, with lead controls
  const niaRow = page.locator('.user-row', { hasText: 'Nia' });
  await expect(niaRow).toContainText('You');
  await expect(niaRow).toContainText('Admin');
  await expect(page.getByPlaceholder(/add a story/i)).toBeVisible();
});
