import { Check } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { setRole } from '../lib/api';
import { identityVars, PixelAvatar } from './PixelAvatar';
import { VoteGlyph } from './VoteGlyph';

interface Props {
  session: Session;
  myUserId: string;
}

const ROLE_TAG = { owner: 'Admin', leader: 'Lead', participant: '' } as const;

export function Participants({ session, myUserId }: Props) {
  const users = session.users ?? {};
  const iAmOwner = users[myUserId]?.role === 'owner';
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined;
  const votes = story?.votes ?? {};
  const rows = Object.entries(users).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  return (
    <div className="rail-section rail-card team-card">
      <div className="eyebrow">Team · {rows.length}</div>
      <ul className="user-list">
        {rows.map(([uid, user]) => {
          const vote = story ? votes[uid] : undefined;
          const voted = vote !== undefined;
          // Admins manage leads with a button that stands in for the
          // [lead] tag; everyone else sees the tag itself.
          const canManage = iAmOwner && user.role !== 'owner';
          return (
            <li key={uid} className={`user-row ${user.online ? '' : 'user-offline'}`}>
              <span className={`presence-dot ${user.online ? 'on' : 'off'}`} />
              <PixelAvatar identity={user.identity} size={22} />
              <span className="user-main">
                <span className="user-name identity" style={identityVars(user.identity)}>
                  {user.name}
                </span>
                {uid === myUserId && <span className="user-tag">You</span>}
                {!canManage && ROLE_TAG[user.role] && (
                  <span className="user-tag">{ROLE_TAG[user.role]}</span>
                )}
                {canManage && (
                  <button
                    className="chip chip-small"
                    onClick={() =>
                      void setRole(
                        session.id,
                        uid,
                        user.role === 'leader' ? 'participant' : 'leader',
                      )
                    }
                    title={
                      user.role === 'leader' ? 'Demote to participant' : 'Promote to leader'
                    }
                  >
                    {user.role === 'leader' ? 'Remove lead' : 'Add lead'}
                  </button>
                )}
              </span>
              <span className={`user-vote ${voted ? 'user-voted' : ''}`}>
                {story ? (
                  session.revealed ? (
                    <VoteGlyph value={vote ?? null} />
                  ) : voted ? (
                    <Check size={13} aria-label="voted" />
                  ) : (
                    '?'
                  )
                ) : (
                  ''
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
