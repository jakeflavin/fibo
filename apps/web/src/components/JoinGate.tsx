import { useState } from 'react'
import { Button, Field, FieldLabel, HomeCard, HomeCorner, HomeForm, HomeImport, HomeMain, HomeNotes, HomeShell, Logo, RoomFooter, SrOnly, Tagline, TextField } from '@/styles/shared.styled'
import { Eye, Heart } from 'lucide-react'
import type { Session } from '@fibo/shared'
import { joinSession } from '@/lib/api'
import { getLastName, saveLastName } from '@/lib/storage'
import { useToast } from './Toast'
import { SettingsMenu } from './ThemeToggle'

interface JoinGateProps {
  session: Session
  onJoined: (userId: string) => void
}

/** Name prompt shown to visitors who open a session they haven't joined. */
export function JoinGate({ session, onJoined }: JoinGateProps) {
  const toast = useToast()
  const [name, setName] = useState(getLastName)
  const [busy, setBusy] = useState(false)
  const count = Object.keys(session.users ?? {}).length

  const join = async (role: 'participant' | 'spectator') => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      saveLastName(name.trim())
      const userId = await joinSession(session.id, name, role)
      onJoined(userId)
    } catch (err) {
      console.error(err)
      toast('Could not join the session. Are you online?', 'error')
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await join('participant')
  }

  return (
    <HomeShell>
      <HomeCorner>
        <SettingsMenu />
      </HomeCorner>
      <HomeMain>
        <Logo  aria-hidden="true">
          fibo
        </Logo>
        <SrOnly>Join this fibo session</SrOnly>
        <Tagline>You've been invited to point some stories</Tagline>

        <HomeCard>
          <HomeForm  onSubmit={submit}>
            <Field>
              <FieldLabel>Your name *</FieldLabel>
              <TextField>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Grace"
                  maxLength={40}
                  autoFocus
                  required
                />
              </TextField>
            </Field>
            <Button $primary $block  disabled={!name.trim() || busy}>
              {busy ? 'Joining…' : 'Join session'}
            </Button>
            <HomeImport $ghost $block
              type="button"
              disabled={!name.trim() || busy}
              onClick={() => void join('spectator')}
              title="Watch the session without a seat or a hand">
              <Eye size={14} /> Join as spectator
            </HomeImport>
          </HomeForm>
        </HomeCard>

        <HomeNotes>
          {count} {count === 1 ? 'person is' : 'people are'} here — no account needed
        </HomeNotes>
      </HomeMain>
      <RoomFooter>
        made with <Heart size={11} aria-label="love" /> by jake
      </RoomFooter>
    </HomeShell>
  )
}
