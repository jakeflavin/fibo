import type { Session } from '@fibo/shared';
import { IDENTITY_SETS } from '@fibo/shared';
import { setRole } from '../lib/api';
import { PixelAvatar } from './PixelAvatar';

interface Props {
  session: Session;
  myUserId: string;
}

const ROLE_TAG = { owner: '[admin]', leader: '[lead]', participant: '' } as const;

export function Participants({ session, myUserId }: Props) {
  const users = session.users ?? {};
  const iAmOwner = users[myUserId]?.role === 'owner';
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const rows = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  return (
    <div className="rail-section">
      <div className="eyebrow">team · {rows.length}</div>
      <ul className="user-list">
        {rows.map(([uid, user]) => {
          const set = IDENTITY_SETS[user.identity % IDENTITY_SETS.length];
          const voted = story ? votes[uid] !== undefined : false;
          return (
            <li key={uid} className={`user-row ${user.online ? '' : 'user-offline'}`}>
              <span className={`presence-dot ${user.online ? 'on' : 'off'}`} />
              <PixelAvatar identity={user.identity} size={22} />
              <span className="user-name" style={{ color: set.color }}>
                {user.name}
                {uid === myUserId && <span className="dim"> (you)</span>}
              </span>
              <span className="user-role dim">{ROLE_TAG[user.role]}</span>
              <span className={`user-vote ${voted ? 'user-voted' : ''}`}>
                {story ? (voted ? '✓' : '·') : ''}
              </span>
              {iAmOwner && user.role !== 'owner' && (
                <button
                  className="chip chip-small"
                  onClick={() =>
                    void setRole(session.id, uid, user.role === 'leader' ? 'participant' : 'leader')
                  }
                  title={user.role === 'leader' ? 'Demote to participant' : 'Promote to leader'}
                >
                  {user.role === 'leader' ? '−lead' : '+lead'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
