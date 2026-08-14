import { expect, test } from '@playwright/test';

test('keyboard shortcuts vote, flip, repoint, and open the cheat sheet', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill('Keys');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);

  const add = page.getByPlaceholder(/add a story/i);
  await add.fill('KEY-1 hands on home row');
  await add.press('Enter');
  // Typing digits into a field must never play a card.
  await add.fill('55555');
  await expect(page.locator('.seat-has-vote')).toHaveCount(0);
  await add.clear();
  await add.blur();

  // 4 plays the fourth card (3 in the Fibonacci deck); again takes it back.
  await page.keyboard.press('4');
  await expect(page.getByTitle('3 points', { exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.keyboard.press('4');
  await expect(page.getByTitle('3 points', { exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // S plays skip, F flips, R repoints.
  await page.keyboard.press('s');
  await expect(page.locator('.seat-has-vote')).toHaveCount(1);
  await page.keyboard.press('f');
  await expect(page.locator('.result-value')).toHaveText('?');
  await page.keyboard.press('r');
  await expect(page.locator('.seat-has-vote')).toHaveCount(0);

  // ? opens the cheat sheet; the gear menu has a button for it too.
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
  await expect(page.getByText('Play a card (deck order)')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toHaveCount(0);

  await page.getByRole('button', { name: 'menu' }).click();
  await page.getByRole('menuitem', { name: 'Keyboard shortcuts' }).click();
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});
