import { expect, test } from '@playwright/test';

const EMULATOR = 'http://127.0.0.1:9000';
const NS = 'ns=demo-fibo-default-rtdb';

/** Read/write raw session state in the emulator, bypassing the app. */
async function emulator(path: string, init?: RequestInit) {
  const res = await fetch(`${EMULATOR}/sessions/${path}.json?${NS}`, init);
  return res.json();
}

/**
 * Plant a session directly over REST (no browser client, so no
 * disconnect timing to wait out) whose last activity is `age` ago.
 */
async function plantSession(id: string, age: number) {
  const then = Date.now() - age;
  await emulator(id, {
    method: 'PUT',
    body: JSON.stringify({
      id,
      createdAt: then,
      touchedAt: then,
      lastSeenAt: then,
      revealed: false,
      users: {
        u1: { name: 'Ghost', role: 'owner', identity: 0, online: false, joinedAt: then },
      },
    }),
  });
}

const DAY = 24 * 60 * 60 * 1000;

test('an abandoned session past its TTL expires on open and is deleted', async ({ page }) => {
  const id = 'e2estale9x';
  await plantSession(id, 3 * DAY);

  await page.goto(`/s/${id}`);
  await expect(page.getByText('Session expired')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start a new session' })).toBeVisible();

  // …and the gate deletes the data.
  await expect.poll(() => emulator(id)).toBeNull();
});

test('a quiet but recent session opens normally', async ({ page }) => {
  const id = 'e2efresh9x';
  await plantSession(id, 12 * 60 * 60 * 1000); // half a day: inside the TTL

  await page.goto(`/s/${id}`);
  // Inside the TTL: the join gate shows, not the expiry page.
  await expect(page.getByRole('button', { name: 'Join session' })).toBeVisible();

  await emulator(id, { method: 'DELETE' });
});
