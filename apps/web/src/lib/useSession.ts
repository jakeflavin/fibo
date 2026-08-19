import { useEffect, useState } from 'react'
import type { Session } from '@fibo/shared'
import { subscribeSession } from './api'

export interface SessionState {
  session: Session | null
  loading: boolean
}

/** Subscribe to a session for the component's lifetime. */
export function useSession(sessionId: string): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, loading: true })

  useEffect(() => {
    setState({ session: null, loading: true })
    const unsubscribe = subscribeSession(sessionId, (session) => {
      setState({ session, loading: false })
    })
    return unsubscribe
  }, [sessionId])

  return state
}

/** Re-render every `intervalMs` while `active` — drives the countdown display. */
export function useNow(active: boolean, intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [active, intervalMs])
  return now
}
