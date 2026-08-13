import type { Session, SessionExport, Story, VoteValue } from './types';
import { deckCards, isValidVote, sanitizeDeck } from './deck';

/** Serialize a session to the portable export document (stories + points). */
export function exportSession(session: Session): SessionExport {
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  return {
    app: 'fibo',
    version: 3,
    exportedAt: new Date().toISOString(),
    deck: sanitizeDeck(session.deck) ?? { preset: 'fib', cards: deckCards(session) },
    stories: stories.map((s) => {
      const points = s.status === 'done' && s.result != null ? s.result : null;
      return points != null ? { title: s.title, points } : { title: s.title };
    }),
  };
}

export class ImportError extends Error {}

/**
 * Parse and validate an export document. Accepts current (v2) exports and
 * legacy v1 files. Throws ImportError with a human-readable message when
 * the JSON isn't a valid Fibo export.
 */
export function parseSessionExport(json: string): SessionExport {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new ImportError('That file is not valid JSON.');
  }
  if (typeof data !== 'object' || data === null) {
    throw new ImportError('That file is not a Fibo session export.');
  }
  const doc = data as Record<string, unknown>;
  if (doc.app !== 'fibo' || (doc.version !== 1 && doc.version !== 2 && doc.version !== 3)) {
    throw new ImportError('That file is not a Fibo session export (missing app/version marker).');
  }
  if (!Array.isArray(doc.stories)) {
    throw new ImportError('Export is missing its stories list.');
  }
  // v1/v2 predate deck choices and were always Fibonacci.
  const deck = doc.version === 3 ? sanitizeDeck(doc.deck) : null;
  const cards = deck?.cards;
  const stories = doc.stories.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new ImportError(`Story #${i + 1} is malformed.`);
    }
    const s = raw as Record<string, unknown>;
    if (typeof s.title !== 'string' || s.title.trim() === '') {
      throw new ImportError(`Story #${i + 1} is missing a title.`);
    }
    // v2+ store points; v1 stored result (+ status, which points implies).
    const rawPoints =
      (doc.version as number) >= 2 ? s.points : s.status === 'done' ? s.result : null;
    const points = isValidVote(rawPoints, cards) ? (rawPoints as VoteValue) : null;
    return points != null ? { title: s.title, points } : { title: s.title };
  });
  return {
    app: 'fibo',
    version: 3,
    exportedAt:
      typeof doc.exportedAt === 'string'
        ? doc.exportedAt
        : new Date(typeof doc.exportedAt === 'number' ? doc.exportedAt : Date.now()).toISOString(),
    ...(deck ? { deck } : {}),
    stories,
  };
}

/**
 * Materialize imported stories as fresh Story records (new ids, no votes).
 * Stories with points come back done; the rest are queued.
 */
export function storiesFromExport(
  doc: SessionExport,
  makeId: () => string,
  now: number = Date.now(),
): Record<string, Story> {
  const out: Record<string, Story> = {};
  doc.stories.forEach((s, i) => {
    const id = makeId();
    out[id] = {
      id,
      title: s.title,
      status: s.points != null ? 'done' : 'queued',
      order: i,
      result: s.points ?? null,
      createdAt: now,
    };
  });
  return out;
}
