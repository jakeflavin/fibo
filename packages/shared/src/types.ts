/** Roles a user can hold within a session. The owner is the session admin. */
export type Role = 'owner' | 'leader' | 'participant';

/** A card a user can play: a Fibonacci number, an explicit skip ("?"),
 *  or a coffee-break request. */
export type VoteValue = number | 'skip' | 'coffee';

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
  /** Whether revealed cards are grouped by value into the distribution view. */
  grouped?: boolean;
  timer?: SessionTimer | null;
  users?: Record<string, SessionUser>;
  stories?: Record<string, Story>;
}

/** Portable JSON document produced by "export session". */
export interface SessionExport {
  app: 'fibo';
  version: 1;
  exportedAt: number;
  sessionName: string;
  stories: Array<{
    title: string;
    status: StoryStatus;
    result?: VoteValue | null;
  }>;
}
