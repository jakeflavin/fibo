import { useState } from 'react';
import type { Session } from '@fibo/shared';
import { formatVote } from '@fibo/shared';
import { activateStory, addStory, deleteStory } from '../lib/api';

interface Props {
  session: Session;
  canLead: boolean;
}

export function StoryQueue({ session, canLead }: Props) {
  const [title, setTitle] = useState('');
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  const maxOrder = stories.reduce((m, s) => Math.max(m, s.order), -1);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTitle('');
    const id = await addStory(session.id, t, maxOrder + 1);
    // First story in an idle room goes straight onto the table.
    if (!session.currentStoryId) {
      await activateStory(session, id);
    }
  };

  return (
    <div className="rail-section">
      <div className="eyebrow">queue · {stories.length}</div>
      {canLead && (
        <form className="story-add" onSubmit={submit}>
          <div className="prompt-input">
            <span className="prompt">+</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="add a story…"
              maxLength={200}
            />
          </div>
        </form>
      )}
      {stories.length === 0 && (
        <p className="panel-body dim">
          {canLead ? 'queue is empty. add the first story ↑' : 'no stories yet.'}
        </p>
      )}
      <ul className="story-list">
        {stories.map((s) => (
          <li key={s.id} className={`story-row story-${s.status}`}>
            <span className="story-badge">
              {s.status === 'done' ? formatVote(s.result ?? null) : s.status === 'active' ? '▶' : '·'}
            </span>
            <span className="story-row-title" title={s.title}>
              {s.title}
            </span>
            {canLead && s.status !== 'active' && (
              <span className="story-actions">
                <button
                  className="chip chip-small"
                  onClick={() => void activateStory(session, s.id)}
                  title={s.status === 'done' ? 'Re-point this story' : 'Put this story on the table'}
                >
                  point
                </button>
                <button
                  className="chip chip-small chip-danger"
                  onClick={() => void deleteStory(session, s.id)}
                  title="Remove story"
                >
                  ×
                </button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
