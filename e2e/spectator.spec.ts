import { expect, test } from '@playwright/test';

test('spectators watch without a seat, a hand, or a tally entry', async ({ browser }) => {
  const adaCtx = await browser.newContext();
  const ada = await adaCtx.newPage();
  await ada.goto('/');
  await ada.getByPlaceholder('Ada').fill('Ada');
  await ada.getByRole('button', { name: 'Create session' }).click();
  await ada.waitForURL(/\/s\/[a-z2-9]+/);

  // Sam joins as a spectator from the join screen.
  const samCtx = await browser.newContext();
  const sam = await samCtx.newPage();
  await sam.goto(ada.url());
  await sam.getByPlaceholder('Grace').fill('Sam');
  await sam.getByRole('button', { name: 'Join as spectator' }).click();

  const samRow = ada.locator('.user-row', { hasText: 'Sam' });
  await expect(samRow).toContainText('Spectator');

  const add = ada.getByPlaceholder(/add a story/i);
  await add.fill('SPEC-1 watched story');
  await add.press('Enter');

  // No seat on the table, no hand at the foot.
  await expect(ada.locator('.seat')).toHaveCount(1);
  await expect(sam.locator('.deck')).toHaveCount(0);

  // The flip tallies only players: no ? for Sam.
  await ada.getByTitle('5 points', { exact: true }).click();
  await ada.getByRole('button', { name: 'Flip', exact: true }).click();
  await expect(ada.locator('.result-value')).toHaveText('5');
  await expect(ada.locator('.result-summary')).toHaveText(/^5×1$/);
  // Spectators still see the outcome live.
  await expect(sam.locator('.result-value')).toHaveText('5');

  // The admin promotes Sam to player: seat and hand appear.
  await samRow.hover();
  await samRow.getByRole('button', { name: 'Actions for Sam' }).click();
  await ada.getByRole('menuitem', { name: 'Make participant' }).click();
  await expect(ada.locator('.seat')).toHaveCount(2);
  await expect(sam.locator('.deck')).toBeVisible();

  // Back to spectator mid-round: their standing vote leaves the table.
  await ada.getByRole('button', { name: 'Repoint this story' }).click();
  await sam.getByTitle('8 points', { exact: true }).click();
  await expect(ada.locator('.seat-has-vote')).toHaveCount(1);
  await samRow.hover();
  await samRow.getByRole('button', { name: 'Actions for Sam' }).click();
  await ada.getByRole('menuitem', { name: 'Make spectator' }).click();
  await expect(ada.locator('.seat')).toHaveCount(1);
  await expect(ada.locator('.seat-has-vote')).toHaveCount(0);

  await adaCtx.close();
  await samCtx.close();
});
