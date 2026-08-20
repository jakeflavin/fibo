import { useEffect, useRef, useState } from 'react'
import { PresenceDot, TeamCard, UserList, UserMain, UserMenu, UserMore, UserMoreWrap, UserName, UserRow, UserTag, UserVote } from './Participants.styled'
import { Eyebrow, MenuItem } from '@/styles/shared.styled'
import { createPortal } from 'react-dom'
import { Check, Crown, Ellipsis, Eye, UserMinus, UserPen } from 'lucide-react'
import type { Session } from '@fibo/shared'
import { removeUser, setRole, transferAdmin } from '@/lib/api'
import { ConfirmModal } from './ConfirmModal'
import { PixelAvatar, identityVars } from './PixelAvatar'
import { VoteGlyph } from './VoteGlyph'

interface ParticipantsProps {
  session: Session
  myUserId: string
}

const ROLE_TAG = {
  owner: 'Admin',
  leader: 'Lead',
  participant: '',
  spectator: 'Spectator',
} as const

/**
 * The team list: presence, identity, role lozenges, and vote status per
 * player, plus the admin-only row actions menu (make/remove lead,
 * remove from session).
 */
export function Participants({ session, myUserId }: ParticipantsProps) {
  const users = session.users ?? {}
  const iAmOwner = users[myUserId]?.role === 'owner'
  const story = session.currentStoryId ? session.stories?.[session.currentStoryId] : undefined
  const votes = story?.votes ?? {}
  // Guard against partial records (e.g. a kicked client's presence write).
  const rows = Object.entries(users)
    .filter(([, u]) => u && u.name)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)

  // One open actions menu at a time. The team list scrolls inside its
  // card, so the menu is fixed-positioned from the trigger; it closes on
  // outside click, Escape, or any scroll.
  const [menu, setMenu] = useState<{ uid: string; top: number; left: number } | null>(null)
  // Transfer is confirmed first: the admin gives up their own powers.
  const [pendingTransfer, setPendingTransfer] = useState<{ uid: string; name: string } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onDown = (e: MouseEvent) => {
      const target = e.target as Element
      /*
       * The menu is portaled to <body>, so the list ref never contains it and
       * every click inside it read as "outside" — mousedown tore the menu down
       * before mouseup, and no item in it ever fired. It was guarded by a class
       * that nothing rendered; the marker has to be one the menu actually
       * carries, which is why this is an attribute on the element itself.
       */
      if (target.closest('[data-user-menu]')) return
      if (listRef.current && !listRef.current.contains(target)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', close, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', close, true)
    }
  }, [menu])

  const toggleMenu = (uid: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // Anchor the menu's top-left at the trigger; shift left only when it
    // would run off the viewport.
    const estimatedWidth = 200
    const left =
      rect.left + estimatedWidth > window.innerWidth - 8
        ? Math.max(8, window.innerWidth - 8 - estimatedWidth)
        : rect.left
    setMenu((m) => (m?.uid === uid ? null : { uid, top: rect.bottom + 4, left }))
  }

  return (
    <TeamCard>
      <Eyebrow>Team · {rows.length}</Eyebrow>
      <UserList  ref={listRef}>
        {rows.map(([uid, user]) => {
          const vote = story ? votes[uid] : undefined
          const voted = vote !== undefined
          const canManage = iAmOwner && user.role !== 'owner'
          const isLead = user.role === 'leader'
          const isSpectator = user.role === 'spectator'
          return (
            <UserRow key={uid} $offline={!user.online}>
              <PresenceDot $on={user.online} $off={!user.online} />
              <PixelAvatar identity={user.identity} size={22} />
              <UserMain>
                <UserName style={identityVars(user.identity)}>
                  {user.name}
                </UserName>
                {uid === myUserId && <UserTag>You</UserTag>}
                {ROLE_TAG[user.role] && <UserTag>{ROLE_TAG[user.role]}</UserTag>}
                {canManage && (
                  <UserMoreWrap>
                    <UserMore $ghost
                      aria-label={`Actions for ${user.name}`}
                      aria-expanded={menu?.uid === uid}
                      onClick={toggleMenu(uid)}>
                      <Ellipsis size={14} />
                    </UserMore>
                    {menu?.uid === uid &&
                      createPortal(
                        <UserMenu
                          role="menu"
                          data-user-menu
                          style={{ position: 'fixed', top: menu.top, left: menu.left }}>
                          {!isSpectator && (
                            <MenuItem
                              
                              role="menuitem"
                              onClick={() => {
                                setMenu(null)
                                void setRole(session, uid, isLead ? 'participant' : 'leader')
                              }}>
                              <UserPen size={14} /> {isLead ? 'Remove as lead' : 'Make lead'}
                            </MenuItem>
                          )}
                          <MenuItem
                            
                            role="menuitem"
                            onClick={() => {
                              setMenu(null)
                              void setRole(session, uid, isSpectator ? 'participant' : 'spectator')
                            }}>
                            <Eye size={14} /> {isSpectator ? 'Make participant' : 'Make spectator'}
                          </MenuItem>
                          {!isSpectator && (
                            <MenuItem
                              
                              role="menuitem"
                              onClick={() => {
                                setMenu(null)
                                setPendingTransfer({ uid, name: user.name })
                              }}>
                              <Crown size={14} /> Transfer admin
                            </MenuItem>
                          )}
                          <MenuItem $danger
                            
                            role="menuitem"
                            onClick={() => {
                              setMenu(null)
                              void removeUser(session, uid)
                            }}>
                            <UserMinus size={14} /> Remove from session
                          </MenuItem>
                        </UserMenu>,
                        document.body,
                      )}
                  </UserMoreWrap>
                )}
              </UserMain>
              <UserVote $voted={voted} data-vote>
                {story && user.role !== 'spectator' ? (
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
              </UserVote>
            </UserRow>
          )
        })}
      </UserList>
      {pendingTransfer && (
        <ConfirmModal
          title="Transfer admin"
          message={
            <>
              Make <strong>{pendingTransfer.name}</strong> the admin? You'll step down to lead —
              only they will be able to manage the team.
            </>
          }
          confirmLabel="Transfer"
          onConfirm={() => {
            const { uid } = pendingTransfer
            setPendingTransfer(null)
            void transferAdmin(session.id, myUserId, uid)
          }}
          onClose={() => setPendingTransfer(null)}
        />
      )}
    </TeamCard>
  )
}
