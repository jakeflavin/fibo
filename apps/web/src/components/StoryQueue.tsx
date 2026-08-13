import { useState } from 'react';
import { Play, Plus, X } from 'lucide-react';
import type { Session, Story } from '@fibo/shared';
import { activateStory, addStory, deleteStory } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';
import { VoteGlyph } from './VoteGlyph';

interface Props {
  session: Session;
  canLead: boolean;
}

export function StoryQueue({ session, canLead }: Props) {
  const [title, setTitle] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Story | null>(null);
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  const maxOrder = stories.reduce((m, s) => Math.max(m, s.order), -1);

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
      <div className="eyebrow">queue · {stories.length}</div>
      {canLead && (
        <form className="story-add" onSubmit={submit}>
          <div className="prompt-input">
            <span className="prompt">
              <Plus size={13} />
            </span>
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
                {s.status === 'done' ? (
                  <VoteGlyph value={s.result ?? null} />
                ) : s.status === 'active' ? (
                  <Play size={10} fill="currentColor" aria-label="on the table" />
                ) : (
                  '?'
                )}
              </span>
              <span className="story-row-title" title={s.title}>
                {s.title}
              </span>
              {canLead && (
                <span className="story-actions">
                  <button
                    className="chip chip-small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete(s);
                    }}
                    title="Remove story"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {pendingDelete && (
        <ConfirmModal
          title="delete story"
          message={
            <>
              remove <strong>{pendingDelete.title}</strong> from the queue?
            </>
          }
          confirmLabel="delete"
          onConfirm={() => {
            void deleteStory(session, pendingDelete.id);
            setPendingDelete(null);
          }}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
