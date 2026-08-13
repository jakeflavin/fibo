import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Session } from '@fibo/shared';
import { revealCards, trackPresence } from '../lib/api';
import { getMyUserId } from '../lib/storage';
import { useSession } from '../lib/useSession';
import { ThemeToggle } from '../components/ThemeToggle';
import { RoomHeader } from '../components/RoomHeader';
import { JoinGate } from '../components/JoinGate';
import { CardTable } from '../components/CardTable';
import { Deck } from '../components/Deck';
import { Participants } from '../components/Participants';
import { StoryQueue } from '../components/StoryQueue';
import { ShareModal } from '../components/ShareModal';

export function Room() {
  const { sessionId = '' } = useParams();
  const { session, loading } = useSession(sessionId);
  const [myUserId, setMyUserId] = useState<string | null>(() => getMyUserId(sessionId));
  const [shareOpen, setShareOpen] = useState(false);

  const me = myUserId ? session?.users?.[myUserId] : undefined;
  const canLead = me?.role === 'owner' || me?.role === 'leader';

  // Keep my online flag in sync with the realtime connection.
  useEffect(() => {
    if (!me || !myUserId) return;
    return trackPresence(sessionId, myUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, myUserId, me !== undefined]);

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

  const title = session?.name ? `${session.name} · fibo` : 'fibo';
  useEffect(() => {
    document.title = title;
  }, [title]);

  if (loading) {
    return (
      <div className="room-empty">
        <p className="dim">
          connecting<span className="cursor">▊</span>
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="room-empty">
        <div className="panel">
          <div className="panel-title">! session not found</div>
          <p className="panel-body">
            This session doesn't exist (or has expired). Sessions on fibo are temporary.
          </p>
          <a className="btn btn-primary" href="/">
            [ start a new session ]
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
        me={me}
        canLead={canLead}
        onShare={() => setShareOpen(true)}
        themeToggle={<ThemeToggle />}
      />
      <main className="room-grid">
        <section className="room-table">
          <CardTable session={session} myUserId={myUserId!} canLead={canLead} />
          <Deck session={session} myUserId={myUserId!} />
        </section>
        <aside className="room-side">
          <Participants session={session} myUserId={myUserId!} />
          <StoryQueue session={session} canLead={canLead} />
        </aside>
      </main>
      {shareOpen && <ShareModal session={session} onClose={() => setShareOpen(false)} />}
    </div>
  );
}

export type { Session };
