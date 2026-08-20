import { useEffect, useState } from 'react'
import { Notfound, RoomEmpty, RoomGrid, RoomMain, RoomShell, RoomSide, RoomTable } from './Room.styled'
import { Button, Dim, Eyebrow, RoomFooter } from '@/styles/shared.styled'
import { Heart } from 'lucide-react'
import { useParams } from 'react-router-dom'
import type { Session } from '@fibo/shared'
import { everyoneVoted, isSessionExpired } from '@fibo/shared'
import { deleteSession, revealCards, trackPresence } from '@/lib/api'
import { getMyUserId } from '@/lib/storage'
import { useSession } from '@/lib/useSession'
import { RoomHeader } from '@/components/RoomHeader'
import { JoinGate } from '@/components/JoinGate'
import { CardTable } from '@/components/CardTable'
import { RoundResult } from '@/components/RoundResult'
import { LeaderControls } from '@/components/LeaderControls'
import { Deck } from '@/components/Deck'
import { Participants } from '@/components/Participants'
import { StoryQueue } from '@/components/StoryQueue'
import { ShareModal } from '@/components/ShareModal'
import { Shortcuts } from '@/components/Shortcuts'

/** The session route: resolves identity, then renders the room. */
export function Room() {
  // Remount per session id: navigating from one room straight to
  // another (e.g. "New session") must not carry over identity state or
  // a presence subscription from the previous room.
  const { sessionId = '' } = useParams()
  return <RoomInner key={sessionId} sessionId={sessionId} />
}

function RoomInner({ sessionId }: { sessionId: string }) {
  const { session, loading } = useSession(sessionId)
  // On-open expiry gate: an abandoned session past its TTL is treated as
  // gone (and deleted) even if the weekly sweep hasn't reached it yet.
  // Latched: the deletion empties the live subscription, and the page
  // must keep saying "expired", not flip to "not found".
  const [expired, setExpired] = useState(false)
  useEffect(() => {
    if (session && isSessionExpired(session)) {
      setExpired(true)
      void deleteSession(sessionId)
    }
  }, [session, sessionId])
  const [myUserId, setMyUserId] = useState<string | null>(() => getMyUserId(sessionId))
  const [shareOpen, setShareOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  // A partial record (e.g. a stray presence write after a kick) is not a
  // membership: without a name, this browser has not joined.
  const record = myUserId ? session?.users?.[myUserId] : undefined
  const me = record?.name ? record : undefined
  const canLead = me?.role === 'owner' || me?.role === 'leader'

  // Keep my online flag in sync with the realtime connection.
  useEffect(() => {
    if (expired || !me || !myUserId) return
    return trackPresence(sessionId, myUserId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, myUserId, me !== undefined])

  // Auto-flip: once everyone online has voted, any leading client flips.
  useEffect(() => {
    if (!session?.autoFlip || session.revealed || !canLead) return
    if (everyoneVoted(session)) void revealCards(session)
  }, [session, canLead])

  // When the countdown ends, any leading client flips the cards.
  useEffect(() => {
    if (!session?.timer || session.revealed || !canLead || !session.currentStoryId) return
    const remaining = session.timer.endsAt - Date.now()
    if (remaining <= 0) {
      void revealCards(session)
      return
    }
    const t = setTimeout(() => void revealCards(session), remaining)
    return () => clearTimeout(t)
  }, [session, canLead])

  if (loading) {
    return (
      <RoomEmpty>
        <Dim>Connecting…</Dim>
      </RoomEmpty>
    )
  }

  if (expired) {
    return (
      <RoomEmpty>
        <Notfound>
          <Eyebrow>Session expired</Eyebrow>
          <Dim>
            This session ended more than 48 hours ago and has been deleted. Sessions on fibo are
            temporary.
          </Dim>
          <Button as="a" $primary  href="/">
            Start a new session
          </Button>
        </Notfound>
      </RoomEmpty>
    )
  }

  if (!session) {
    return (
      <RoomEmpty>
        <Notfound>
          <Eyebrow>Session not found</Eyebrow>
          <Dim>
            This session doesn't exist (or has expired). Sessions on fibo are temporary.
          </Dim>
          <Button as="a" $primary  href="/">
            Start a new session
          </Button>
        </Notfound>
      </RoomEmpty>
    )
  }

  if (!me) {
    return <JoinGate session={session} onJoined={setMyUserId} />
  }

  return (
    <RoomShell>
      <RoomHeader
        session={session}
        myUserId={myUserId!}
        canLead={canLead}
        onShare={() => setShareOpen(true)}
        onShortcuts={() => setShortcutsOpen(true)}
      />
      <Shortcuts
        session={session}
        myUserId={myUserId!}
        canLead={canLead}
        canVote={me.role !== 'spectator'}
        open={shortcutsOpen}
        onOpen={() => setShortcutsOpen(true)}
        onClose={() => setShortcutsOpen(false)}
      />
      <RoomGrid>
        <RoomMain>
          {canLead && <LeaderControls session={session} />}
          <RoomTable>
            <CardTable session={session} myUserId={myUserId!} canLead={canLead} />
            {me.role !== 'spectator' && <Deck session={session} myUserId={myUserId!} />}
          </RoomTable>
        </RoomMain>
        <RoomSide>
          <RoundResult session={session} />
          <Participants session={session} myUserId={myUserId!} />
          <StoryQueue session={session} canLead={canLead} />
        </RoomSide>
      </RoomGrid>
      <RoomFooter>
        made with <Heart size={11} aria-label="love" /> by jake
      </RoomFooter>
      {shareOpen && <ShareModal session={session} onClose={() => setShareOpen(false)} />}
    </RoomShell>
  )
}

export type { Session }
