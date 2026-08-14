/**
 * Integration test: the real Express app + MCP transport against the
 * local Realtime Database emulator (skipped when it isn't running —
 * CI starts it before this suite).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Server } from 'node:http';

const EMULATOR = '127.0.0.1:9000';
const NS = 'demo-fibo-default-rtdb';

async function emulatorUp(): Promise<boolean> {
  try {
    await fetch(`http://${EMULATOR}/.json?ns=${NS}&shallow=true`);
    return true;
  } catch {
    return false;
  }
}

const up = await emulatorUp();

describe.skipIf(!up)('mcp endpoint (against the DB emulator)', () => {
  let server: Server;
  let base: string;
  let rpcId = 0;

  async function rpc(method: string, params?: unknown) {
    const res = await fetch(`${base}/mcp`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
    });
    const body = await res.text();
    // Streamable HTTP may answer as SSE; unwrap the data frame.
    const json = body.startsWith('event:')
      ? body.split('\n').find((l) => l.startsWith('data:'))!.slice(5)
      : body;
    return { status: res.status, body: JSON.parse(json) };
  }

  async function callTool(name: string, args: unknown) {
    const { body } = await rpc('tools/call', { name, arguments: args });
    const text = body.result?.content?.[0]?.text as string;
    return { raw: body, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() };
  }

  beforeAll(async () => {
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = EMULATOR;
    process.env.GCLOUD_PROJECT = 'demo-fibo';
    const { initializeApp } = await import('firebase-admin/app');
    initializeApp({ databaseURL: `http://${EMULATOR}?ns=${NS}` });
    const { app } = await import('../src/mcp');
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const address = server.address();
    base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`;
  });

  afterAll(() => {
    server?.close();
  });

  it('initializes and lists the four tools', async () => {
    const init = await rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });
    expect(init.status).toBe(200);
    expect(init.body.result.serverInfo.name).toBe('fibo');

    const list = await rpc('tools/list');
    const names = list.body.result.tools.map((t: { name: string }) => t.name).sort();
    expect(names).toEqual(['add_stories', 'create_session', 'get_results', 'get_session']);
  });

  it('creates, appends, and reads back a session end to end', async () => {
    const created = await callTool('create_session', {
      stories: ['MCP-1 first', { title: 'MCP-2 pre-pointed', points: 'M' }],
      deck: { preset: 'tshirt' },
    });
    expect(created.json.link).toMatch(/\/s\/[a-km-np-z2-9]{10}$/);
    const link = created.json.link as string;
    const id = link.split('/s/')[1];

    // The document is real, ownerless, and validated shape.
    const snap = await (await fetch(`http://${EMULATOR}/sessions/${id}.json?ns=${NS}`)).json();
    expect(snap.users).toBeUndefined();
    expect(snap.deck.preset).toBe('tshirt');
    expect(Object.keys(snap.stories)).toHaveLength(2);

    const added = await callTool('add_stories', { session: link, titles: ['MCP-3 appended'] });
    expect(added.json).toEqual({ added: 1, queue: 3 });

    const state = await callTool('get_session', { session: id });
    expect(state.json.deck).toBe('tshirt');
    expect(state.json.queue).toHaveLength(3);

    const results = await callTool('get_results', { session: link });
    expect(results.json.table).toContain('MCP-2 pre-pointed\tM');
    expect(results.json.stories).toHaveLength(3);

    await fetch(`http://${EMULATOR}/sessions/${id}.json?ns=${NS}`, { method: 'DELETE' });
  });

  it('rejects unknown sessions and garbage refs as tool errors', async () => {
    const missing = await callTool('get_results', { session: 'zzzzzzzzzz' });
    expect(missing.raw.result.isError).toBe(true);
    const garbage = await callTool('add_stories', { session: 'not-a-ref', titles: ['x'] });
    expect(garbage.raw.result.isError).toBe(true);
  });

  it('answers GET with 405 (stateless server)', async () => {
    const res = await fetch(`${base}/mcp`);
    expect(res.status).toBe(405);
  });
});
