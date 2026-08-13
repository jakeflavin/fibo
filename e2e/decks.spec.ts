import { expect, test, type Page } from '@playwright/test';

async function createSession(page: Page, name: string, deck?: 'T-shirt' | 'Custom', custom?: string) {
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill(name);
  if (deck) {
    await page.getByRole('radio', { name: deck }).click();
    if (custom) await page.getByLabel('Custom deck cards').fill(custom);
  }
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
}

test('a t-shirt session deals t-shirt cards and sizes stories with them', async ({ page }) => {
  await createSession(page, 'Stitch', 'T-shirt');

  const add = page.getByPlaceholder(/add a story/i);
  await add.fill('SIZE-1 relabel the buttons');
  await add.press('Enter');

  // The hand is the t-shirt deck plus skip and coffee.
  await expect(page.locator('.deck .play-card')).toHaveCount(8);
  await expect(page.locator('.deck .play-card').first()).toHaveText('XS');

  await page.getByTitle('M', { exact: true }).click();
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('M');
  // The override ruler speaks t-shirt too.
  await page.locator('.result-edit').getByRole('button', { name: 'XL', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('XL');
});

test('the admin can change the deck mid-session; standing results survive', async ({ page }) => {
  await createSession(page, 'Ada');
  const add = page.getByPlaceholder(/add a story/i);
  await add.fill('FIBO-1 already pointed');
  await add.press('Enter');
  await page.getByTitle('5 points', { exact: true }).click();
  await page.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(page.locator('.result-value')).toHaveText('5');

  // Change to a custom deck from the gear menu.
  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('menuitem', { name: 'Change deck' }).click();
  await page.getByRole('radio', { name: 'Custom' }).click();
  await page.getByLabel('Custom deck cards').fill('low, mid, high');
  await page.getByRole('button', { name: 'Save deck' }).click();

  // The hand restyles (3 cards + skip + coffee)…
  await expect(page.locator('.deck .play-card')).toHaveCount(5);
  await expect(page.locator('.deck .play-card').first()).toHaveText('low');
  // …but the standing result keeps its old value.
  await expect(page.locator('.result-value')).toHaveText('5');
});

test('a session can start from an export, deck included', async ({ page }) => {
  const doc = {
    app: 'fibo',
    version: 3,
    exportedAt: new Date().toISOString(),
    deck: { preset: 'tshirt' },
    stories: [{ title: 'IMP-1 sized already', points: 'L' }, { title: 'IMP-2 todo' }],
  };

  await page.goto('/');
  await page.getByPlaceholder('Ada').fill('Porter');
  await page.getByRole('button', { name: /start from an export/i }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'export.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(doc)),
  });
  await page.waitForURL(/\/s\/[a-z2-9]+/);

  // Stories and their points arrived, and the deck is t-shirt.
  await expect(page.locator('.story-row')).toHaveCount(2);
  await expect(page.locator('.story-row', { hasText: 'IMP-1' }).locator('.story-badge')).toHaveText(
    'L',
  );
  await expect(page.locator('.deck .play-card').first()).toHaveText('XS');
});
