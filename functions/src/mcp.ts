import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  buildSessionDoc,
  committedPoints,
  newStoryId,
  parseSessionRef,
  RateLimiter,
  resolveDeck,
  resultsTable,
  type StoryRecord,
} from './mcp-helpers';

const APP_ORIGIN = 'https://fibo-49d58.web.app';

const sessionArg = z
  .string()
  .describe('The fibo session link (…/s/<id>) or its bare 10-character id');

const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
});

const fail = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});

interface SessionSnap {
  users?: Record<string, { name?: string; role?: string; online?: boolean } | undefined>;
  stories?: Record<string, StoryRecord | undefined>;
  currentStoryId?: string | null;
  revealed?: boolean;
  autoFlip?: boolean;
  deck?: { preset: string; cards: Array<number | string> } | null;
}

async function loadSession(ref: string): Promise<{ id: string; data: SessionSnap } | null> {
  const id = parseSessionRef(ref);
  if (!id) return null;
  const snap = await getDatabase().ref(`sessions/${id}`).get();
  if (!snap.exists()) return null;
  return { id, data: snap.val() as SessionSnap };
}

/** One fresh, stateless server per request. */
function buildServer(): McpServer {
  const server = new McpServer({ name: 'fibo', version: '1.0.0' });
  const db = () => getDatabase();

  server.tool(
    'create_session',
    'Create a new fibo planning session pre-loaded with stories. Returns the join link to share with the team; the first person to open it becomes the session admin. Sessions are temporary (they expire 48h after everyone leaves).',
    {
      stories: z
        .array(
          z.union([
            z.string(),
            z.object({
              title: z.string(),
              points: z.union([z.number(), z.string()]).nullish()
                .describe('Pre-existing points; the story arrives already pointed'),
            }),
          ]),
        )
        .max(200)
        .describe('Story titles (e.g. Jira keys + summaries), in queue order'),
      deck: z
        .object({
          preset: z.enum(['fib', 'tshirt', 'custom']),
          cards: z.array(z.union([z.number(), z.string()])).optional()
            .describe('Custom decks only: 2-12 card labels, lowest first'),
        })
        .optional()
        .describe('Deck to size with; defaults to Fibonacci'),
    },
    async ({ stories, deck }) => {
      const resolved = resolveDeck(deck?.preset, deck?.cards);
      if (deck?.preset === 'custom' && !resolved) {
        return fail('A custom deck needs 2-12 card labels (lowest first); "skip" and "coffee" are reserved.');
      }
      const normalized = stories.map((s) => (typeof s === 'string' ? { title: s } : s));
      const doc = buildSessionDoc(normalized, resolved);
      await db().ref(`sessions/${doc.id}`).set(doc);
      return text({
        link: `${APP_ORIGIN}/s/${doc.id}`,
        stories: Object.keys(doc.stories).length,
        deck: resolved?.preset ?? 'fib',
        note: 'Share the link; the first person to open it becomes the admin.',
      });
    },
  );

  server.tool(
    'add_stories',
    'Append stories to the end of an existing session queue (never disturbs the story on the table).',
    {
      session: sessionArg,
      titles: z.array(z.string()).min(1).max(200).describe('Story titles, in order'),
    },
    async ({ session, titles }) => {
      const found = await loadSession(session);
      if (!found) return fail('No session found for that link or id (it may have expired).');
      const existing = Object.values(found.data.stories ?? {}).filter((s): s is StoryRecord => !!s);
      const maxOrder = existing.reduce((m, s) => Math.max(m, s.order), -1);
      const now = Date.now();
      const updates: Record<string, unknown> = { touchedAt: now };
      titles.forEach((title, i) => {
        const id = newStoryId();
        updates[`stories/${id}`] = {
          id,
          title: title.trim().slice(0, 200),
          status: 'queued',
          order: maxOrder + 1 + i,
          result: null,
          createdAt: now,
        };
      });
      await db().ref(`sessions/${found.id}`).update(updates);
      return text({ added: titles.length, queue: existing.length + titles.length });
    },
  );

  server.tool(
    'get_session',
    'Read a session\'s live state: who is in the room, the deck, the story on the table, and the queue with statuses and points.',
    { session: sessionArg },
    async ({ session }) => {
      const found = await loadSession(session);
      if (!found) return fail('No session found for that link or id (it may have expired).');
      const d = found.data;
      const users = Object.values(d.users ?? {})
        .filter((u) => u?.name)
        .map((u) => ({ name: u!.name, role: u!.role ?? 'participant', online: !!u!.online }));
      const stories = Object.values(d.stories ?? {})
        .filter((s): s is StoryRecord => !!s)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ title: s.title, status: s.status, points: s.result ?? null }));
      const active = d.currentStoryId ? d.stories?.[d.currentStoryId] : undefined;
      return text({
        link: `${APP_ORIGIN}/s/${found.id}`,
        team: users,
        deck: d.deck?.preset ?? 'fib',
        activeStory: active ? { title: active.title, revealed: !!d.revealed } : null,
        autoFlip: !!d.autoFlip,
        queue: stories,
      });
    },
  );

  server.tool(
    'get_results',
    'Read a session\'s outcomes: every story with its points, as JSON and as a tab-separated title/points table ready for Jira or a spreadsheet.',
    { session: sessionArg },
    async ({ session }) => {
      const found = await loadSession(session);
      if (!found) return fail('No session found for that link or id (it may have expired).');
      const revealed = !!found.data.revealed;
      const stories = Object.values(found.data.stories ?? {})
        .filter((s): s is StoryRecord => !!s)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ title: s.title, points: committedPoints(s, revealed) }));
      return text({ stories, table: resultsTable(found.data.stories, revealed) });
    },
  );

  return server;
}

// Best-effort abuse damping (per instance): the endpoint can only do
// what the public REST API already allows, so this is politeness, not
// a security boundary.
const requestLimiter = new RateLimiter(60, 60 / 60_000); // 60/min
const createLimiter = new RateLimiter(10, 10 / 3_600_000); // 10/hour

const app = express();
app.use(express.json({ limit: '256kb' }));

app.post('/mcp', async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  if (!requestLimiter.allow(ip)) {
    res.status(429).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Rate limit exceeded — try again in a minute.' },
      id: null,
    });
    return;
  }
  if (req.body?.method === 'tools/call' && req.body?.params?.name === 'create_session' && !createLimiter.allow(ip)) {
    res.status(429).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Session-creation rate limit exceeded — try again later.' },
      id: null,
    });
    return;
  }

  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => void transport.close());
    await buildServer().connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('mcp request failed', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// Stateless server: no SSE stream to resume, no session to delete.
app.get('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed: this server is stateless (POST only).' },
    id: null,
  });
});
app.delete('/mcp', (_req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed: this server is stateless (POST only).' },
    id: null,
  });
});

/** Exported for the integration tests (they mount it on a local port). */
export { app };

/** The remote MCP endpoint, reached via the Hosting rewrite at /mcp. */
export const mcp = onRequest({ invoker: 'public' }, app);
