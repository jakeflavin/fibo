import { formatVote } from './deck';
import type { Session, Story } from './types';

/**
 * A story's committed points: done stories keep theirs, and the active
 * story counts once the cards are flipped with a standing result — the
 * same rule activateStory uses when accepting a round by switching away.
 */
export function committedPoints(
  story: Pick<Story, 'status' | 'result'>,
  session: Pick<Session, 'revealed'>,
): Story['result'] | null {
  if (story.result == null) return null;
  if (story.status === 'done') return story.result;
  if (story.status === 'active' && session.revealed) return story.result;
  return null;
}

/**
 * The queue as a tab-separated table (title<TAB>points), one story per
 * row in queue order, ready to paste into Jira or a spreadsheet.
 * Unpointed stories get an empty points cell.
 */
export function resultsTable(session: Session): string {
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  return stories
    .map((s) => {
      const points = committedPoints(s, session);
      return `${s.title}\t${points != null ? formatVote(points) : ''}`;
    })
    .join('\n');
}

/**
 * Split pasted text into story titles: one per line, trimmed, blanks
 * dropped. A leading "-" or "*" bullet is stripped so pasted markdown
 * lists work too.
 */
export function splitPastedTitles(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•]\s+/, '').trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(0, 200));
}
