import { useRef, useState } from 'react'
import { Button, Field, FieldLabel, HomeCard, HomeCorner, HomeForm, HomeImport, HomeMain, HomeNotes, HomeShell, Logo, RoomFooter, SrOnly, Tagline, TextField } from '@/styles/shared.styled'
import { FileUp, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DeckChoice, Story } from '@fibo/shared'
import { DECK_PRESETS, ImportError, newStoryId, parseSessionExport, storiesFromExport } from '@fibo/shared'
import { createSession } from '@/lib/api'
import { getLastName, saveLastName } from '@/lib/storage'
import { SettingsMenu } from '@/components/ThemeToggle'
import { DeckPicker } from '@/components/DeckPicker'
import { useToast } from '@/components/Toast'

/** Landing page: name prompt that creates a session and enters it. */
export function Home() {
  const navigate = useNavigate()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(getLastName)
  const [deck, setDeck] = useState<DeckChoice | null>({ preset: 'fib', cards: DECK_PRESETS.fib })
  const [busy, setBusy] = useState(false)

  const create = async (stories?: Record<string, Story>, deckOverride?: DeckChoice) => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      saveLastName(name.trim())
      const sessionId = await createSession(name, deckOverride ?? deck, stories)
      navigate(`/s/${sessionId}`)
    } catch (err) {
      console.error(err)
      toast('Could not create the session. Are you online?', 'error')
      setBusy(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await create()
  }

  /** Start a session pre-loaded from an export file (stories + deck). */
  const importAndCreate = async (file: File) => {
    try {
      const doc = parseSessionExport(await file.text())
      await create(storiesFromExport(doc, newStoryId), doc.deck)
    } catch (err) {
      toast(err instanceof ImportError ? err.message : 'Import failed.', 'error')
    }
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
        <SrOnly>fibo</SrOnly>
        <Tagline>Story points, no strings attached</Tagline>

        <HomeCard>
          <HomeForm  onSubmit={submit}>
            <Field>
              <FieldLabel>Your name *</FieldLabel>
              <TextField>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada"
                  maxLength={40}
                  autoFocus
                  required
                />
              </TextField>
            </Field>
            <Field as="div">
              <FieldLabel>Deck</FieldLabel>
              <DeckPicker value={deck ?? { preset: 'custom', cards: [] }} onChange={setDeck} />
            </Field>
            <Button $primary $block  disabled={!name.trim() || !deck || busy}>
              {busy ? 'Creating…' : 'Create session'}
            </Button>
            <HomeImport $ghost $block
              type="button"
              disabled={!name.trim() || busy}
              onClick={() => fileInput.current?.click()}
              title="Start a session from a previously exported queue">
              <FileUp size={14} /> Start from an export…
            </HomeImport>
          </HomeForm>
        </HomeCard>

        <HomeNotes>No accounts, no signup — sessions are temporary</HomeNotes>
      </HomeMain>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void importAndCreate(f)
          e.target.value = ''
        }}
      />
      <RoomFooter>
        made with <Heart size={11} aria-label="love" /> by jake
      </RoomFooter>
    </HomeShell>
  )
}
