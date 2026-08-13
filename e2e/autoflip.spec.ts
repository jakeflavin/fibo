import { expect, test } from '@playwright/test';

test('auto flip reveals the round once everyone online has voted', async ({ browser }) => {
  const adaCtx = await browser.newContext();
  const ada = await adaCtx.newPage();
  await ada.goto('/');
  await ada.getByPlaceholder('Ada').fill('Ada');
  await ada.getByRole('button', { name: 'Create session' }).click();
  await ada.waitForURL(/\/s\/[a-z2-9]+/);

  const bobCtx = await browser.newContext();
  const bob = await bobCtx.newPage();
  await bob.goto(ada.url());
  await bob.getByPlaceholder('Grace').fill('Bob');
  await bob.getByRole('button', { name: 'Join session' }).click();

  const add = ada.getByPlaceholder(/add a story/i);
  await add.fill('AUTO-1 hands-free flip');
  await add.press('Enter');

  // Arm auto flip from the timer segment.
  const auto = ada.getByRole('button', { name: 'Auto', exact: true });
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');

  // One of two votes: still face-down.
  await ada.getByTitle('5 points', { exact: true }).click();
  await ada.waitForTimeout(400);
  await expect(ada.locator('.result-value')).toHaveText('?');

  // The last vote flips the round for everyone, no button pressed.
  await bob.getByTitle('8 points', { exact: true }).click();
  await expect(ada.locator('.result-value')).toHaveText('8');
  await expect(bob.locator('.result-value')).toHaveText('8');

  // The toggle survives repoint and fires again next round.
  await ada.getByRole('button', { name: 'Repoint this story' }).click();
  await expect(ada.locator('.result-value')).toHaveText('?');
  await ada.getByTitle('3 points', { exact: true }).click();
  await bob.getByTitle('3 points', { exact: true }).click();
  await expect(ada.locator('.result-value')).toHaveText('3');

  // Auto and the timer are one segment: a timer disarms auto, and
  // re-arming auto cancels the timer.
  await ada.getByRole('button', { name: 'Repoint this story' }).click();
  await ada.getByRole('button', { name: '30s' }).click();
  await expect(ada.locator('.timer-clock')).toBeVisible();
  await expect(auto).toHaveAttribute('aria-pressed', 'false');
  await auto.click();
  await expect(auto).toHaveAttribute('aria-pressed', 'true');
  await expect(ada.locator('.timer-clock')).toHaveCount(0);

  await adaCtx.close();
  await bobCtx.close();
});
