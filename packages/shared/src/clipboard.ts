import { formatVote } from './deck';
import type { Session } from './types';

/**
 * The queue as a tab-separated table (title<TAB>points), one story per
 * row in queue order, ready to paste into Jira or a spreadsheet.
 * Unpointed stories get an empty points cell.
 */
export function resultsTable(session: Session): string {
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  return stories
    .map((s) => `${s.title}\t${s.result != null && s.status === 'done' ? formatVote(s.result) : ''}`)
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
