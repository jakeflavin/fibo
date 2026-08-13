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

test('full sprint planning session with three users', async ({ browser }) => {
  fs.mkdirSync(SHOTS, { recursive: true });

  // ── owner creates a session ────────────────────────────────
  const ada = await newVisitor(browser);
  await ada.goto('/');
  await expect(ada.locator('.logo')).toBeVisible();
  await shot(ada, '01-home');
  await ada.getByPlaceholder('ada').fill('Ada');
  await ada.getByRole('button', { name: /create session/ }).click();
  await ada.waitForURL(/\/s\/[a-z2-9]+/);
  const url = ada.url();

  // deck is visible but disabled before any story exists
  await expect(ada.locator('.deck .play-card').first()).toBeDisabled();

  // ── first story auto-activates ─────────────────────────────
  const addInput = ada.getByPlaceholder(/add a story/);
  await addInput.fill('FIBO-1 login flow');
  await addInput.press('Enter');
  await expect(ada.locator('.story-title')).toHaveText('FIBO-1 login flow');

  // ── share modal (via the header menu) shows QR + link ──────
  await ada.getByRole('button', { name: 'menu' }).click();
  await ada.getByRole('menuitem', { name: /share/ }).click();
  await expect(ada.locator('.qr-box svg')).toBeVisible();
  await expect(ada.locator('.share-url')).toContainText('/s/');
  await shot(ada, '02-share-qr');
  await ada.keyboard.press('Escape');
  await expect(ada.locator('.qr-box')).toHaveCount(0);

  // ── two teammates join with just a name ────────────────────
  const bob = await newVisitor(browser);
  await bob.goto(url);
  await expect(bob.getByText(/people are here|person is here/)).toBeVisible();
  await bob.getByPlaceholder('grace').fill('Bob');
  await bob.getByRole('button', { name: /join session/ }).click();
  await expect(bob.locator('.story-title')).toHaveText('FIBO-1 login flow');

  const cy = await newVisitor(browser);
  await cy.goto(url);
  await cy.getByPlaceholder('grace').fill('Cy');
  await cy.getByRole('button', { name: /join session/ }).click();
  await expect(cy.locator('.story-title')).toHaveText('FIBO-1 login flow');

  // everyone appears in the team panel, avatars distinct
  await expect(ada.locator('.user-row')).toHaveCount(3);
  expect(await ada.locator('.user-list svg').count()).toBe(3);

  // ── voting: selections visible, values hidden until flip ───
  await bob.getByTitle('5 points', { exact: true }).click();
  await cy.getByTitle('8 points', { exact: true }).click();

  const bobSeatOnAda = ada.locator('.seat', { hasText: 'Bob' });
  await expect(bobSeatOnAda).toHaveClass(/seat-voted/);
  await expect(bobSeatOnAda.locator('.seat-card-front')).toHaveText('');
  await expect(ada.getByText('2/3 votes in')).toBeVisible();

  await ada.getByTitle('5 points', { exact: true }).click();
  await expect(ada.getByText(/3\/3 votes in — all set!/)).toBeVisible();
  await shot(ada, '03-all-voted-facedown');

  // participants have no flip button
  await expect(bob.getByRole('button', { name: /flip cards/ })).toHaveCount(0);

  // ── flip: consensus is the mode (5×2 beats 8×1) ────────────
  await ada.getByRole('button', { name: /flip cards/ }).click();
  await expect(ada.locator('.result-value')).toHaveText('5');
  await expect(bob.locator('.result-value')).toHaveText('5');
  await expect(bob.getByText(/waiting for a leader to accept/)).toBeVisible();
  await ada.waitForTimeout(700); // let the flip animation finish
  await shot(ada, '04-revealed');

  // ── leader overrides the winner ────────────────────────────
  await ada.locator('.result-edit').getByRole('button', { name: '8', exact: true }).click();
  await expect(bob.locator('.result-value')).toHaveText('8');

  // ── owner promotes Bob to leader ───────────────────────────
  await ada.locator('.user-row', { hasText: 'Bob' }).getByTitle('Promote to leader').click();
  await expect(bob.locator('.user-row', { hasText: '(you)' })).toContainText('[lead]');
  await expect(bob.getByRole('button', { name: /accept & next/ })).toBeVisible();

  // ── leader accepts; story archived with its points ─────────
  await bob.getByRole('button', { name: /accept & next/ }).click();
  await expect(bob.locator('.story-row', { hasText: 'FIBO-1' }).locator('.story-badge')).toHaveText('8');
  await expect(bob.getByText('no story on the table.')).toBeVisible();

  // ── leader queues the next story, timer auto-flips ─────────
  const bobAdd = bob.getByPlaceholder(/add a story/);
  await bobAdd.fill('FIBO-2 signup form');
  await bobAdd.press('Enter');
  await expect(cy.locator('.story-title')).toHaveText('FIBO-2 signup form');

  await bob.getByRole('button', { name: '30s' }).click();
  await expect(cy.locator('.timer-clock')).toBeVisible();
  await expect(ada.locator('.timer-clock')).toBeVisible();

  // everyone plays the skip card this round
  await ada.getByTitle('Skip this story').click();
  await bob.getByTitle('Skip this story').click();
  await cy.getByTitle('Skip this story').click();
  await shot(ada, '05-timer-running');

  // cards flip on their own when the countdown hits zero
  await expect(ada.locator('.result-value')).toHaveText('»', { timeout: 40_000 });
  await expect(cy.locator('.result-value')).toHaveText('»');

  // ── export (participants can too) ──────────────────────────
  const downloadPromise = cy.waitForEvent('download');
  await cy.getByRole('button', { name: 'menu' }).click();
  await cy.getByRole('menuitem', { name: /export/ }).click();
  const download = await downloadPromise;
  const exportPath = path.join(SHOTS, 'export.json');
  await download.saveAs(exportPath);
  const doc = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  expect(doc.app).toBe('fibo');
  expect(doc.stories.map((s: { title: string }) => s.title)).toEqual([
    'FIBO-1 login flow',
    'FIBO-2 signup form',
  ]);
  expect(doc.stories[0].result).toBe(8);

  // participants don't get the import option in the menu
  await cy.getByRole('button', { name: 'menu' }).click();
  await expect(cy.getByRole('menuitem', { name: /export/ })).toBeVisible();
  await expect(cy.getByRole('menuitem', { name: /import/ })).toHaveCount(0);
  await cy.keyboard.press('Escape');

  // ── import (leader): replaces the queue ────────────────────
  doc.stories.push({ title: 'FIBO-3 imported story', status: 'queued', result: null });
  const importPath = path.join(SHOTS, 'import.json');
  fs.writeFileSync(importPath, JSON.stringify(doc));
  await bob.locator('input[type=file]').setInputFiles(importPath);
  await expect(bob.locator('.story-row')).toHaveCount(3);
  await expect(ada.locator('.story-row', { hasText: 'FIBO-3 imported story' })).toBeVisible();
  await expect(ada.locator('.story-row', { hasText: 'FIBO-1' }).locator('.story-badge')).toHaveText('8');

  // ── revote flow ────────────────────────────────────────────
  const row = ada.locator('.story-row', { hasText: 'FIBO-2' });
  await row.hover();
  await row.getByTitle('Put this story on the table').click();
  await expect(ada.locator('.story-title')).toHaveText('FIBO-2 signup form');
  await ada.getByTitle('3 points', { exact: true }).click();
  await ada.getByRole('button', { name: /flip cards/ }).click();
  await expect(ada.locator('.result-value')).toHaveText('3');
  await ada.getByRole('button', { name: /revote/ }).click();
  await expect(ada.locator('.result-value')).toHaveCount(0);
  await expect(ada.getByText('0/3 votes in')).toBeVisible();

  // ── presence: a teammate disconnects ───────────────────────
  await cy.context().close();
  await expect(ada.locator('.user-row', { hasText: 'Cy' })).toHaveClass(/user-offline/, {
    timeout: 15_000,
  });
  await shot(ada, '06-final-room');
});
