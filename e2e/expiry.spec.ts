import { expect, test, type Browser } from '@playwright/test';

const EMULATOR = 'http://127.0.0.1:9000';
const NS = 'ns=demo-fibo-default-rtdb';

/** Read/write raw session state in the emulator, bypassing the app. */
async function emulator(path: string, init?: RequestInit) {
  const res = await fetch(`${EMULATOR}/sessions/${path}.json?${NS}`, init);
  return res.json();
}

async function createAbandonedSession(browser: Browser): Promise<{ id: string; url: string }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByPlaceholder('Ada').fill('Rip');
  await page.getByRole('button', { name: 'Create session' }).click();
  await page.waitForURL(/\/s\/[a-z2-9]+/);
  const url = page.url();
  const id = url.split('/s/')[1];
  // Leave, and wait for the server-side disconnect writes to land so the
  // aging patch below can't be overwritten by them.
  await ctx.close();
  await expect
    .poll(async () => {
      const users = (await emulator(`${id}/users`)) ?? {};
      return Object.values(users as Record<string, { online?: boolean }>).some((u) => u?.online);
    })
    .toBe(false);
  return { id, url };
}

test('an abandoned session past its TTL expires on open and is deleted', async ({ browser }) => {
  const { id, url } = await createAbandonedSession(browser);

  // Age everything three days, as the weekly sweep would find it.
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const session = await emulator(id);
  const patch: Record<string, unknown> = {
    createdAt: threeDaysAgo,
    touchedAt: threeDaysAgo,
    lastSeenAt: threeDaysAgo,
  };
  for (const uid of Object.keys(session.users ?? {})) {
    patch[`users/${uid}/joinedAt`] = threeDaysAgo;
  }
  await emulator(id, { method: 'PATCH', body: JSON.stringify(patch) });

  // A fresh visitor hits the expiry gate…
  const ctx = await browser.newContext();
  const visitor = await ctx.newPage();
  await visitor.goto(url);
  await expect(visitor.getByText('Session expired')).toBeVisible();
  await expect(visitor.getByRole('link', { name: 'Start a new session' })).toBeVisible();

  // …and the gate deletes the data.
  await expect.poll(() => emulator(id)).toBeNull();
  await ctx.close();
});

test('a quiet but recent session opens normally', async ({ browser }) => {
  const { url } = await createAbandonedSession(browser);

  const ctx = await browser.newContext();
  const visitor = await ctx.newPage();
  await visitor.goto(url);
  // Inside the TTL: the join gate shows, not the expiry page.
  await expect(visitor.getByRole('button', { name: 'Join session' })).toBeVisible();
  await ctx.close();
});
