/**
 * Pure helpers for the MCP endpoint. Deck rules, ids, and the results
 * table mirror packages/shared/src (the canonical, unit-tested
 * versions; Cloud Functions can't import the workspace package without
 * a bundler). Keep them in sync.
 */
import { randomBytes } from 'node:crypto';

export type VoteValue = number | string;
export type DeckPreset = 'fib' | 'tshirt' | 'custom';

export interface StoryRecord {
  id: string;
  title: string;
  status: 'queued' | 'active' | 'done';
  order: number;
  result: VoteValue | null;
  createdAt: number;
}

export interface SessionDoc {
  id: string;
  createdAt: number;
  touchedAt: number;
  currentStoryId: null;
  revealed: false;
  deck?: { preset: DeckPreset; cards: VoteValue[] };
  stories: Record<string, StoryRecord>;
}

export const DECK_PRESETS: Record<Exclude<DeckPreset, 'custom'>, VoteValue[]> = {
  fib: [0, 1, 2, 3, 5, 8, 13, 21],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
};

const MAX_CUSTOM_CARDS = 12;
const MAX_CARD_LABEL = 4;

/** Unambiguous lowercase alphabet (no 0/o, 1/l) — mirrors shared/ids. */
const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';

function randomString(length: number): string {
  const bytes = randomBytes(length);
  let out = '';
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export const newSessionId = () => randomString(10);
export const newStoryId = () => randomString(12);

/** A session id is 10 chars of the id alphabet. */
const SESSION_ID = /^[a-km-np-z2-9]{10}$/;

/**
 * Accept a session as a full link (…/s/<id>, with or without extras)
 * or a bare id; null when neither shape matches.
 */
export function parseSessionRef(ref: string): string | null {
  const trimmed = ref.trim();
  if (SESSION_ID.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/s\/([a-km-np-z2-9]{10})(?:[/?#]|$)/);
  return match ? match[1] : null;
}

/** Normalize a requested deck; null = default Fibonacci. Mirrors sanitizeDeck. */
export function resolveDeck(
  preset: DeckPreset | undefined,
  cards: VoteValue[] | undefined,
): SessionDoc['deck'] | null {
  if (!preset || preset === 'fib') return null;
  if (preset === 'tshirt') return { preset, cards: DECK_PRESETS.tshirt };
  const clean = (cards ?? [])
    .filter((c): c is VoteValue => typeof c === 'number' || typeof c === 'string')
    .map((c) => (typeof c === 'string' ? c.trim().slice(0, MAX_CARD_LABEL) : c))
    .filter((c) => c !== '' && c !== 'skip' && c !== 'coffee')
    .slice(0, MAX_CUSTOM_CARDS);
  return clean.length >= 2 ? { preset, cards: clean } : null;
}

export interface StoryInput {
  title: string;
  points?: VoteValue | null;
}

/**
 * Build a complete, ownerless session document. Stories with valid
 * points arrive done; the app's first-joiner rule seats the admin.
 */
export function buildSessionDoc(
  stories: StoryInput[],
  deck: SessionDoc['deck'] | null,
  now: number = Date.now(),
): SessionDoc {
  const doc: SessionDoc = {
    id: newSessionId(),
    createdAt: now,
    touchedAt: now,
    currentStoryId: null,
    revealed: false,
    ...(deck ? { deck } : {}),
    stories: {},
  };
  stories.forEach((s, i) => {
    const id = newStoryId();
    // Sanity, not deck membership — mirrors shared isStoredPoints
    // (sessions legitimately hold points from earlier decks).
    const p = s.points;
    const sane =
      (typeof p === 'number' && Number.isFinite(p)) ||
      p === 'skip' ||
      (typeof p === 'string' && p.length >= 1 && p.length <= MAX_CARD_LABEL);
    const points = p != null && sane ? p : null;
    doc.stories[id] = {
      id,
      title: s.title.trim().slice(0, 200),
      status: points != null ? 'done' : 'queued',
      order: i,
      result: points,
      createdAt: now,
    };
  });
  return doc;
}

/**
 * A story's committed points — mirrors shared committedPoints: done
 * stories keep theirs, and the active story counts once the cards are
 * flipped with a standing result (the app accepts that result when
 * switching away).
 */
export function committedPoints(
  story: Pick<StoryRecord, 'status' | 'result'>,
  revealed: boolean,
): VoteValue | null {
  if (story.result == null) return null;
  if (story.status === 'done') return story.result;
  if (story.status === 'active' && revealed) return story.result;
  return null;
}

/** The queue as title<TAB>points rows in order — mirrors shared resultsTable. */
export function resultsTable(
  stories: Record<string, StoryRecord | undefined> | undefined,
  revealed: boolean,
): string {
  return Object.values(stories ?? {})
    .filter((s): s is StoryRecord => !!s)
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      const points = committedPoints(s, revealed);
      return `${s.title}\t${points != null ? (points === 'skip' ? '?' : String(points)) : ''}`;
    })
    .join('\n');
}

/**
 * Best-effort per-IP token bucket (per Cloud Run instance; abuse
 * damping, not a security boundary — the endpoint holds no secrets).
 */
export class RateLimiter {
  private buckets = new Map<string, { tokens: number; last: number }>();

  constructor(
    private readonly capacity: number,
    private readonly refillPerMs: number,
  ) {}

  /** Take one token for the key; false when the bucket is empty. */
  allow(key: string, now: number = Date.now()): boolean {
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, last: now };
    bucket.tokens = Math.min(this.capacity, bucket.tokens + (now - bucket.last) * this.refillPerMs);
    bucket.last = now;
    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      return false;
    }
    bucket.tokens -= 1;
    this.buckets.set(key, bucket);
    // Cap the map so a scan of spoofed IPs can't grow it unbounded.
    if (this.buckets.size > 10_000) this.buckets.clear();
    return true;
  }
}
