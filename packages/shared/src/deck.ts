import type { DeckChoice, DeckPreset, Session, VoteValue } from './types'

/** The classic Fibonacci deck — the default for new sessions. */
export const DECK_NUMBERS = [0, 1, 2, 3, 5, 8, 13, 21] as const

export const SKIP: VoteValue = 'skip'
export const COFFEE: VoteValue = 'coffee'

/** The two built-in decks, in rank order (low → high). */
export const DECK_PRESETS: Record<Exclude<DeckPreset, 'custom'>, VoteValue[]> = {
  fib: [...DECK_NUMBERS],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
}

/** Longest custom deck / longest card label the UI will lay out. */
export const MAX_CUSTOM_CARDS = 12
export const MAX_CARD_LABEL = 4

/** The playable value cards for a session (skip/coffee ride along in the UI). */
export function deckCards(session: Pick<Session, 'deck'>): VoteValue[] {
  const cards = session.deck?.cards
  return Array.isArray(cards) && cards.length > 0 ? cards : DECK_PRESETS.fib
}

/**
 * Parse a free-form custom deck ("XXS, XS, S, M …" or "1 2 4 8"): split
 * on commas/whitespace, trim, dedupe, cap length, convert pure numbers,
 * and drop the reserved sentinels. Returns null when nothing playable
 * survives.
 */
export function parseCustomDeck(input: string): VoteValue[] | null {
  const seen = new Set<string>()
  const cards: VoteValue[] = []
  for (const raw of input.split(/[\s,]+/)) {
    const trimmed = raw.trim()
    // Sentinels are checked before truncation ("coffee" must not
    // sneak in as "coff").
    if (!trimmed || trimmed === SKIP || trimmed === COFFEE) continue
    const label = trimmed.slice(0, MAX_CARD_LABEL)
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    cards.push(/^\d+$/.test(label) ? Number(label) : label)
    if (cards.length === MAX_CUSTOM_CARDS) break
  }
  return cards.length >= 2 ? cards : null
}

/**
 * Whether a value is acceptable as STORED story points. Deliberately
 * deck-agnostic: the app keeps results pointed under earlier decks
 * ("changing the deck doesn't affect pointed stories"), so exports can
 * legitimately mix eras. Numbers, skip, and short card labels pass.
 */
export function isStoredPoints(value: unknown): value is VoteValue {
  if (typeof value === 'number') return Number.isFinite(value)
  if (value === SKIP) return true
  return typeof value === 'string' && value.length >= 1 && value.length <= MAX_CARD_LABEL
}

/** Whether a value is playable in the given deck (or a skip/coffee card). */
export function isValidVote(value: unknown, cards: VoteValue[] = DECK_PRESETS.fib): boolean {
  if (value === SKIP || value === COFFEE) return true
  return cards.some((c) => c === value)
}

export function formatVote(value: VoteValue | null | undefined): string {
  if (value === null || value === undefined) return '?'
  if (value === SKIP) return '?'
  if (value === COFFEE) return '‖'
  return String(value)
}

/** Normalize a DeckChoice-ish record from the wire; null when unusable. */
export function sanitizeDeck(raw: unknown): DeckChoice | null {
  if (typeof raw !== 'object' || raw === null) return null
  const d = raw as Record<string, unknown>
  const preset: DeckPreset = d.preset === 'tshirt' || d.preset === 'custom' ? d.preset : 'fib'
  if (preset !== 'custom') return { preset, cards: DECK_PRESETS[preset] }
  if (!Array.isArray(d.cards)) return null
  const cards = d.cards.filter(
    (c): c is VoteValue =>
      (typeof c === 'number' || typeof c === 'string') && c !== SKIP && c !== COFFEE,
  )
  return cards.length >= 2 ? { preset, cards: cards.slice(0, MAX_CUSTOM_CARDS) } : null
}
