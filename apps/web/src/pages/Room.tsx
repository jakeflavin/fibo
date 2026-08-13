import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useParams } from 'react-router-dom';
import type { Session } from '@fibo/shared';
import { everyoneVoted, isSessionExpired } from '@fibo/shared';
import { deleteSession, revealCards, trackPresence } from '../lib/api';
import { getMyUserId } from '../lib/storage';
import { useSession } from '../lib/useSession';
import { RoomHeader } from '../components/RoomHeader';
import { JoinGate } from '../components/JoinGate';
import { CardTable } from '../components/CardTable';
import { RoundResult } from '../components/RoundResult';
import { LeaderControls } from '../components/LeaderControls';
import { Deck } from '../components/Deck';
import { Participants } from '../components/Participants';
import { StoryQueue } from '../components/StoryQueue';
import { ShareModal } from '../components/ShareModal';

/** The session route: resolves identity, then renders the room. */
export function Room() {
  // Remount per session id: navigating from one room straight to
  // another (e.g. "New session") must not carry over identity state or
  // a presence subscription from the previous room.
  const { sessionId = '' } = useParams();
  return <RoomInner key={sessionId} sessionId={sessionId} />;
}

function RoomInner({ sessionId }: { sessionId: string }) {
  const { session, loading } = useSession(sessionId);
  // On-open expiry gate: an abandoned session past its TTL is treated as
  // gone (and deleted) even if the weekly sweep hasn't reached it yet.
  // Latched: the deletion empties the live subscription, and the page
  // must keep saying "expired", not flip to "not found".
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (session && isSessionExpired(session)) {
      setExpired(true);
      void deleteSession(sessionId);
    }
  }, [session, sessionId]);
  const [myUserId, setMyUserId] = useState<string | null>(() => getMyUserId(sessionId));
  const [shareOpen, setShareOpen] = useState(false);

  // A partial record (e.g. a stray presence write after a kick) is not a
  // membership: without a name, this browser has not joined.
  const record = myUserId ? session?.users?.[myUserId] : undefined;
  const me = record?.name ? record : undefined;
  const canLead = me?.role === 'owner' || me?.role === 'leader';

  // Keep my online flag in sync with the realtime connection.
  useEffect(() => {
    if (expired || !me || !myUserId) return;
    return trackPresence(sessionId, myUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, myUserId, me !== undefined]);

  // Auto-flip: once everyone online has voted, any leading client flips.
  useEffect(() => {
    if (!session?.autoFlip || session.revealed || !canLead) return;
    if (everyoneVoted(session)) void revealCards(session);
  }, [session, canLead]);

  // When the countdown ends, any leading client flips the cards.
  useEffect(() => {
    if (!session?.timer || session.revealed || !canLead || !session.currentStoryId) return;
    const remaining = session.timer.endsAt - Date.now();
    if (remaining <= 0) {
      void revealCards(session);
      return;
    }
    const t = setTimeout(() => void revealCards(session), remaining);
    return () => clearTimeout(t);
  }, [session, canLead]);

  if (loading) {
    return (
      <div className="room-empty">
        <p className="dim">
          Connecting…
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="room-empty">
        <div className="notfound">
          <div className="eyebrow">Session expired</div>
          <p className="dim">
            This session ended more than 48 hours ago and has been deleted. Sessions on fibo are
            temporary.
          </p>
          <a className="btn btn-primary" href="/">
            Start a new session
          </a>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="room-empty">
        <div className="notfound">
          <div className="eyebrow">Session not found</div>
          <p className="dim">
            This session doesn't exist (or has expired). Sessions on fibo are temporary.
          </p>
          <a className="btn btn-primary" href="/">
            Start a new session
          </a>
        </div>
      </div>
    );
  }

  if (!me) {
    return <JoinGate session={session} onJoined={setMyUserId} />;
  }

  return (
    <div className="room">
      <RoomHeader
        session={session}
        myUserId={myUserId!}
        canLead={canLead}
        onShare={() => setShareOpen(true)}
      />
      <main className="room-grid">
        <section className="room-main">
          {canLead && <LeaderControls session={session} />}
          <section className="room-table">
            <CardTable session={session} myUserId={myUserId!} canLead={canLead} />
            <Deck session={session} myUserId={myUserId!} />
          </section>
        </section>
        <aside className="room-side">
          <RoundResult session={session} />
          <Participants session={session} myUserId={myUserId!} />
          <StoryQueue session={session} canLead={canLead} />
        </aside>
      </main>
      <footer className="room-footer dim">
        made with <Heart size={11} aria-label="love" /> by jake
      </footer>
      {shareOpen && <ShareModal session={session} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

export type { Session };
