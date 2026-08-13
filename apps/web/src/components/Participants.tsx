import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Ellipsis, UserMinus, UserPen } from 'lucide-react';
import type { Session } from '@fibo/shared';
import { removeUser, setRole } from '../lib/api';
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
  // Guard against partial records (e.g. a kicked client's presence write).
  const rows = Object.entries(users)
    .filter(([, u]) => u && u.name)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt);

  // One open actions menu at a time. The team list scrolls inside its
  // card, so the menu is fixed-positioned from the trigger; it closes on
  // outside click, Escape, or any scroll.
  const [menu, setMenu] = useState<{ uid: string; top: number; left: number } | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element;
      // The menu is portaled to <body>; clicks inside it aren't "outside".
      if (target.closest('.user-menu')) return;
      if (listRef.current && !listRef.current.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const toggleMenu = (uid: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu((m) => (m?.uid === uid ? null : { uid, top: rect.bottom + 4, left: rect.right - 200 }));
  };

  return (
    <div className="rail-section rail-card team-card">
      <div className="eyebrow">Team · {rows.length}</div>
      <ul className="user-list" ref={listRef}>
        {rows.map(([uid, user]) => {
          const vote = story ? votes[uid] : undefined;
          const voted = vote !== undefined;
          const canManage = iAmOwner && user.role !== 'owner';
          const isLead = user.role === 'leader';
          return (
            <li key={uid} className={`user-row ${user.online ? '' : 'user-offline'}`}>
              <span className={`presence-dot ${user.online ? 'on' : 'off'}`} />
              <PixelAvatar identity={user.identity} size={22} />
              <span className="user-main">
                <span className="user-name identity" style={identityVars(user.identity)}>
                  {user.name}
                </span>
                {uid === myUserId && <span className="user-tag">You</span>}
                {ROLE_TAG[user.role] && <span className="user-tag">{ROLE_TAG[user.role]}</span>}
                {canManage && (
                  <span className="user-more-wrap">
                    <button
                      className="btn btn-ghost user-more"
                      aria-label={`Actions for ${user.name}`}
                      aria-expanded={menu?.uid === uid}
                      onClick={toggleMenu(uid)}
                    >
                      <Ellipsis size={14} />
                    </button>
                    {menu?.uid === uid &&
                      createPortal(
                        <div
                          className="menu user-menu"
                          role="menu"
                          style={{ position: 'fixed', top: menu.top, left: menu.left }}
                        >
                        <button
                          className="menu-item"
                          role="menuitem"
                          onClick={() => {
                            setMenu(null);
                            void setRole(session.id, uid, isLead ? 'participant' : 'leader');
                          }}
                        >
                          <UserPen size={14} /> {isLead ? 'Remove as lead' : 'Make lead'}
                        </button>
                        <button
                          className="menu-item menu-item-danger"
                          role="menuitem"
                          onClick={() => {
                            setMenu(null);
                            void removeUser(session, uid);
                          }}
                        >
                          <UserMinus size={14} /> Remove from session
                        </button>
                      </div>,
                      document.body,
                    )}
                  </span>
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
