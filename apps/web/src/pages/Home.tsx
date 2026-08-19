import { useRef, useState } from 'react'
import { FileUp, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DeckChoice, Story } from '@fibo/shared'
import {
  DECK_PRESETS,
  ImportError,
  newStoryId,
  parseSessionExport,
  storiesFromExport,
} from '@fibo/shared'
import { createSession } from '../lib/api'
import { getLastName, saveLastName } from '../lib/storage'
import { SettingsMenu } from '../components/ThemeToggle'
import { DeckPicker } from '../components/DeckPicker'
import { useToast } from '../components/Toast'

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
    <div className="home">
      <div className="home-corner">
        <SettingsMenu />
      </div>
      <main className="home-main">
        <div className="logo" aria-hidden="true">
          fibo
        </div>
        <h1 className="sr-only">fibo</h1>
        <p className="tagline">Story points, no strings attached</p>

        <div className="rail-card home-card">
          <form className="home-form" onSubmit={submit}>
            <label className="field">
              <span className="field-label">Your name *</span>
              <div className="text-field">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada"
                  maxLength={40}
                  autoFocus
                  required
                />
              </div>
            </label>
            <div className="field">
              <span className="field-label">Deck</span>
              <DeckPicker value={deck ?? { preset: 'custom', cards: [] }} onChange={setDeck} />
            </div>
            <button className="btn btn-primary btn-block" disabled={!name.trim() || !deck || busy}>
              {busy ? 'Creating…' : 'Create session'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-block home-import"
              disabled={!name.trim() || busy}
              onClick={() => fileInput.current?.click()}
              title="Start a session from a previously exported queue"
            >
              <FileUp size={14} /> Start from an export…
            </button>
          </form>
        </div>

        <p className="home-notes">No accounts, no signup — sessions are temporary</p>
      </main>
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
      <footer className="room-footer dim">
        made with <Heart size={11} aria-label="love" /> by jake
      </footer>
    </div>
  )
}
