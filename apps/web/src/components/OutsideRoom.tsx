import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'
import {
  HomeCorner,
  HomeMain,
  HomeNotes,
  HomeShell,
  Logo,
  RoomFooter,
  SrOnly,
  Tagline,
} from '@/styles/shared.styled'
import { SettingsMenu } from './ThemeToggle'

interface OutsideRoomProps {
  /** The page's accessible name — the only <h1> on it. */
  title: string
  tagline: string
  /** Small print under the card. */
  notes?: ReactNode
  children: ReactNode
}

/**
 * The shell every screen outside a session wears: the wordmark, a tagline, a
 * card, and the gear menu. Four screens use it — home, the join gate, and the
 * two dead-session notices, which used to render as three unbranded lines on a
 * blank field. Someone who followed a colleague's link to a session that has
 * expired should still be able to tell what just failed them.
 */
export function OutsideRoom({ title, tagline, notes, children }: OutsideRoomProps) {
  return (
    <HomeShell>
      <HomeCorner>
        <SettingsMenu />
      </HomeCorner>
      <HomeMain>
        <Logo aria-hidden="true">fibo</Logo>
        <SrOnly>{title}</SrOnly>
        <Tagline>{tagline}</Tagline>
        {children}
        {notes && <HomeNotes>{notes}</HomeNotes>}
      </HomeMain>
      <RoomFooter>
        made with <Heart size={11} aria-label="love" /> by jake
      </RoomFooter>
    </HomeShell>
  )
}
