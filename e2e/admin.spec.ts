import { expect, test } from '@playwright/test';

test('admin hands the seat to a teammate and steps down to lead', async ({ browser }) => {
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
  await expect(bob.locator('.user-row')).toHaveCount(2);

  // Transfer via Bob's row menu, confirmed first.
  const bobRow = ada.locator('.user-row', { hasText: 'Bob' });
  await bobRow.hover();
  await bobRow.getByRole('button', { name: 'Actions for Bob' }).click();
  await ada.getByRole('menuitem', { name: 'Transfer admin' }).click();
  await expect(ada.getByText("You'll step down to lead")).toBeVisible();
  await ada.getByRole('button', { name: 'Transfer', exact: true }).click();

  // Roles swapped everywhere, exactly one admin.
  await expect(bob.locator('.user-row', { hasText: 'Bob' })).toContainText('Admin');
  await expect(bob.locator('.user-row', { hasText: 'Ada' })).toContainText('Lead');
  await expect(ada.locator('.user-row', { hasText: 'Ada' })).not.toContainText('Admin');

  // Team management followed the seat: Bob has row actions now, Ada doesn't.
  const adaRowOnBob = bob.locator('.user-row', { hasText: 'Ada' });
  await adaRowOnBob.hover();
  await expect(adaRowOnBob.getByRole('button', { name: 'Actions for Ada' })).toBeVisible();
  await bobRow.hover();
  await expect(bobRow.getByRole('button', { name: 'Actions for Bob' })).toHaveCount(0);

  await adaCtx.close();
  await bobCtx.close();
});
