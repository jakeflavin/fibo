import type { Session, SessionExport, Story } from './types';
import { isValidVote } from './deck';

/** Serialize a session to the portable export document (stories + results). */
export function exportSession(session: Session): SessionExport {
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  return {
    app: 'fibo',
    version: 1,
    exportedAt: Date.now(),
    sessionName: session.name,
    stories: stories.map((s) => ({
      title: s.title,
      status: s.status,
      result: s.result ?? null,
    })),
  };
}

export class ImportError extends Error {}

/**
 * Parse and validate an export document. Throws ImportError with a
 * human-readable message when the JSON isn't a valid Fibo export.
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
  if (doc.app !== 'fibo' || doc.version !== 1) {
    throw new ImportError('That file is not a Fibo session export (missing app/version marker).');
  }
  if (typeof doc.sessionName !== 'string') {
    throw new ImportError('Export is missing a session name.');
  }
  if (!Array.isArray(doc.stories)) {
    throw new ImportError('Export is missing its stories list.');
  }
  const stories = doc.stories.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new ImportError(`Story #${i + 1} is malformed.`);
    }
    const s = raw as Record<string, unknown>;
    if (typeof s.title !== 'string' || s.title.trim() === '') {
      throw new ImportError(`Story #${i + 1} is missing a title.`);
    }
    const status = s.status === 'done' ? 'done' : 'queued';
    const result = status === 'done' && isValidVote(s.result) ? s.result : null;
    return { title: s.title, status, result } as SessionExport['stories'][number];
  });
  return {
    app: 'fibo',
    version: 1,
    exportedAt: typeof doc.exportedAt === 'number' ? doc.exportedAt : Date.now(),
    sessionName: doc.sessionName,
    stories,
  };
}

/**
 * Materialize imported stories as fresh Story records (new ids, no votes).
 * Previously-active stories come back as queued so the room stays consistent.
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
      status: s.status === 'done' ? 'done' : 'queued',
      order: i,
      result: s.result ?? null,
      createdAt: now,
    };
  });
  return out;
}
