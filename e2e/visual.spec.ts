import { expect, test, type Browser } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SHOTS = path.join(__dirname, 'screenshots');

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
] as const;

const THEMES = ['light', 'dark'] as const;

async function setupRoom(browser: Browser, theme: string, viewport: { width: number; height: number }) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript((t) => localStorage.setItem('fibo:theme', t as string), theme);
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('ada').fill('Ada');
  await page.getByPlaceholder('sprint 42 planning').fill('sprint 42');
  await page.getByRole('button', { name: /create session/ }).click();
  await page.waitForURL(/\/s\//);
  const add = page.getByPlaceholder(/add a story/);
  await add.fill('FIBO-9 checkout redesign');
  await add.press('Enter');
  await add.fill('FIBO-10 audit logging');
  await add.press('Enter');
  await page.getByTitle('5 points', { exact: true }).click();
  await expect(page.getByText('1/1 votes in')).toBeVisible();
  return { ctx, page };
}

for (const theme of THEMES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${theme} ${vp.name}`, async ({ browser }) => {
      fs.mkdirSync(SHOTS, { recursive: true });

      const home = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      await home.addInitScript((t) => localStorage.setItem('fibo:theme', t as string), theme);
      const homePage = await home.newPage();
      await homePage.goto('/');
      await expect(homePage.locator('.logo')).toBeVisible();
      await homePage.waitForTimeout(400);
      await homePage.screenshot({ path: path.join(SHOTS, `home-${theme}-${vp.name}.png`), fullPage: true });
      await home.close();

      const { ctx, page } = await setupRoom(browser, theme, { width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOTS, `room-${theme}-${vp.name}.png`), fullPage: true });

      await page.getByRole('button', { name: 'share', exact: true }).click();
      await expect(page.locator('.qr-box svg')).toBeVisible();
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, `share-${theme}-${vp.name}.png`) });
      await ctx.close();
    });
  }
}
