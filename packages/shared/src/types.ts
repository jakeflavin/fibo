/** Roles a user can hold within a session. The owner is the session
 *  admin; spectators watch without a seat, a hand, or a tally entry. */
export type Role = 'owner' | 'leader' | 'participant' | 'spectator';

/**
 * A card a user can play: a deck value (number for numeric decks,
 * string label for t-shirt/custom decks), the explicit skip ("?"), or a
 * coffee-break request. 'skip' and 'coffee' are reserved sentinels and
 * can never be deck values themselves.
 */
export type VoteValue = number | string;

/** Deck presets an admin can choose from. */
export type DeckPreset = 'fib' | 'tshirt' | 'custom';

/**
 * The session's deck: which preset was picked and the playable card
 * values in rank order (low → high; ties in a round break toward the
 * higher rank). Sessions without one use the Fibonacci default.
 */
export interface DeckChoice {
  preset: DeckPreset;
  cards: VoteValue[];
}

export interface SessionUser {
  name: string;
  role: Role;
  /** Index into IDENTITY_SETS (0-11): assigns color + pixel avatar. */
  identity: number;
  online: boolean;
  joinedAt: number;
}

export type StoryStatus = 'queued' | 'active' | 'done';

export interface Story {
  id: string;
  title: string;
  status: StoryStatus;
  /** Position in the queue; stories are sorted by this. */
  order: number;
  /** Final agreed points once the story is done ('skip' if the team skipped it). */
  result?: VoteValue | null;
  /** userId -> vote. Hidden by the UI until the round is revealed. */
  votes?: Record<string, VoteValue>;
  createdAt: number;
  pointedAt?: number;
}

export interface SessionTimer {
  /** Epoch ms when the countdown ends and cards auto-flip. */
  endsAt: number;
  /** Original duration in seconds (for display). */
  seconds: number;
}

export interface Session {
  id: string;
  /** Legacy label; the UI no longer names sessions. */
  name?: string;
  createdAt: number;
  /** The single story currently in discussion. */
  currentStoryId?: string | null;
  /** Whether the current round's cards are face-up. */
  revealed: boolean;
  /** The deck in play; absent means the Fibonacci default. */
  deck?: DeckChoice | null;
  /** Flip automatically once every online player has voted. */
  autoFlip?: boolean;
  /** Epoch ms of the last meaningful write (vote, flip, queue change…). */
  touchedAt?: number;
  /** Epoch ms when a client last disconnected (written server-side). */
  lastSeenAt?: number;
  timer?: SessionTimer | null;
  users?: Record<string, SessionUser>;
  stories?: Record<string, Story>;
}

/**
 * Portable JSON document produced by "export session". A story with
 * points is done; one without is still queued.
 */
export interface SessionExport {
  app: 'fibo';
  version: 3;
  /** ISO-8601 timestamp of the export. */
  exportedAt: string;
  /** The deck in play; absent means the Fibonacci default. */
  deck?: DeckChoice;
  stories: Array<{
    title: string;
    points?: VoteValue | null;
  }>;
}
