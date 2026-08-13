import { useState } from 'react';
import type { Session } from '@fibo/shared';
import { splitPastedTitles } from '@fibo/shared';
import { activateStory, addStories, addStory } from '../lib/api';
import { VoteGlyph } from './VoteGlyph';

interface Props {
  session: Session;
  canLead: boolean;
}

/**
 * The session's story list: leads add stories (straight onto the table)
 * and click rows to switch or reopen; every row shows its points.
 */
export function StoryQueue({ session, canLead }: Props) {
  const [title, setTitle] = useState('');
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  const maxOrder = stories.reduce((m, s) => Math.max(m, s.order), -1);

  /** Pasting a multi-line list queues one story per line. */
  const onPaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const titles = splitPastedTitles(e.clipboardData.getData('text/plain'));
    if (titles.length < 2) return; // single-line pastes edit the field normally
    e.preventDefault();
    setTitle('');
    await addStories(session, titles, maxOrder + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle('');
    // A new story goes straight onto the table.
    const id = await addStory(session.id, t, maxOrder + 1);
    await activateStory(session, id);
  };

  return (
    <div className="rail-section rail-card">
      <div className="eyebrow">Queue · {stories.length}</div>
      {canLead && (
        <form className="story-add" onSubmit={submit}>
          <div className="text-field">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a story… (paste a list for many)"
              maxLength={200}
              onPaste={(e) => void onPaste(e)}
            />
          </div>
        </form>
      )}
      {stories.length === 0 && (
        <p className="panel-body dim">
          {canLead ? 'The queue is empty. Add the first story above.' : 'No stories yet.'}
        </p>
      )}
      <ul className="story-list">
        {stories.map((s) => {
          const clickable = canLead && s.status !== 'active';
          return (
            <li
              key={s.id}
              className={`story-row story-${s.status} ${clickable ? 'story-clickable' : ''}`}
              onClick={clickable ? () => void activateStory(session, s.id) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void activateStory(session, s.id);
                      }
                    }
                  : undefined
              }
              title={
                clickable
                  ? s.status === 'done'
                    ? 'Re-point this story'
                    : 'Put this story on the table'
                  : undefined
              }
            >
              <span className="story-badge">
                <VoteGlyph value={s.result ?? null} />
              </span>
              <span className="story-row-title" title={s.title}>
                {s.title}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
