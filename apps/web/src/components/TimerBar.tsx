import { Timer } from 'lucide-react'
import type { Session } from '@fibo/shared'
import { useNow } from '@/lib/useSession'

/**
 * Countdown readout in the consensus card; starting a timer lives in
 * LeaderControls. Renders nothing unless a countdown is running.
 */
export function TimerBar({ session }: { session: Session }) {
  const timer = session.timer ?? null
  const active = !!timer && !session.revealed
  const now = useNow(active)

  if (!active || !timer) return null

  const remainingMs = Math.max(0, timer.endsAt - now)
  const remaining = Math.ceil(remainingMs / 1000)
  const fraction = Math.min(1, remainingMs / (timer.seconds * 1000))
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className={`timer-row ${remaining <= 5 ? 'timer-critical' : ''}`}>
      <span className="timer-clock">
        <Timer size={13} /> {mm}:{ss}
      </span>
      <div className="timer-track" role="progressbar" aria-valuenow={remaining}>
        <div className="timer-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  )
}
