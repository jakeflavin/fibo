import { useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Session, Story } from '@fibo/shared';
import { splitPastedTitles } from '@fibo/shared';
import { activateStory, addStories, addStory, reorderStories } from '../lib/api';
import { VoteGlyph } from './VoteGlyph';

interface Props {
  session: Session;
  canLead: boolean;
}

interface RowProps {
  session: Session;
  story: Story;
  canLead: boolean;
}

/**
 * One queue row: click puts it on the table, drag reorders (leads).
 * A small pointer-distance threshold keeps clicks and drags apart.
 */
function StoryRow({ session, story: s, canLead }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: s.id,
    disabled: !canLead,
  });
  const clickable = canLead && s.status !== 'active';
  // dnd-kit's keyboard listener owns Space (lift/drop); Enter activates.
  const dndKeyDown = listeners?.onKeyDown as ((e: React.KeyboardEvent) => void) | undefined;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`story-row story-${s.status} ${clickable ? 'story-clickable' : ''} ${
        isDragging ? 'story-dragging' : ''
      }`}
      {...(canLead ? attributes : {})}
      {...(canLead ? listeners : {})}
      onClick={clickable ? () => void activateStory(session, s.id) : undefined}
      onKeyDown={(e) => {
        if (clickable && e.key === 'Enter') {
          e.preventDefault();
          void activateStory(session, s.id);
          return;
        }
        dndKeyDown?.(e);
      }}
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
}

/**
 * The session's story list: leads add stories (straight onto the table),
 * click rows to switch or reopen, and drag rows to reorder; every row
 * shows its points.
 */
export function StoryQueue({ session, canLead }: Props) {
  const [title, setTitle] = useState('');
  const stories = Object.values(session.stories ?? {}).sort((a, b) => a.order - b.order);
  const maxOrder = stories.reduce((m, s) => Math.max(m, s.order), -1);

  // A drag begins only after 6px of travel, so plain clicks still
  // activate rows and keyboard users get the sortable shortcuts.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const over = e.over;
    if (!over || e.active.id === over.id) return;
    const ids = stories.map((s) => s.id);
    const reordered = arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(over.id)));
    void reorderStories(session.id, reordered);
  };

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
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="story-list">
            {stories.map((s) => (
              <StoryRow key={s.id} session={session} story={s} canLead={canLead} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
