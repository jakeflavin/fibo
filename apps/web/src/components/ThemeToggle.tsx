import { useEffect, useRef, useState } from 'react'
import { Menu, MenuButton, MenuItem, MenuSep, MenuWrap } from '@/styles/shared.styled'
import { Bot, GitBranch, Moon, Settings, Sun } from 'lucide-react'
import { getTheme, saveTheme } from '@/lib/storage'
import { ConnectClaudeModal } from './ConnectClaudeModal'

function effectiveTheme(): 'light' | 'dark' {
  // Dark-first: dark unless the user explicitly chose light.
  return getTheme() === 'light' ? 'light' : 'dark'
}

/** Current theme plus a toggle; the choice persists in localStorage. */
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(effectiveTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    saveTheme(next)
    setTheme(next)
  }

  return { theme, toggle }
}

/** Gear menu for pages outside the room, matching the app bar's menu. */
export function SettingsMenu() {
  const { theme, toggle } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <MenuWrap  ref={menuRef}>
      <MenuButton $ghost
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}>
        <Settings size={18} />
      </MenuButton>
      {open && (
        <Menu  role="menu">
          <MenuItem
            
            role="menuitem"
            onClick={() => {
              setOpen(false)
              toggle()
            }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} Switch to{' '}
            {theme === 'dark' ? 'light' : 'dark'} mode
          </MenuItem>
          <MenuSep/>
          <MenuItem
            
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setConnectOpen(true)
            }}>
            <Bot size={14} /> Connect Claude
          </MenuItem>
          <MenuItem as="a"
            
            role="menuitem"
            href="https://github.com/jakeflavin/fibo"
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}>
            <GitBranch size={14} /> View on GitHub
          </MenuItem>
        </Menu>
      )}
      {connectOpen && <ConnectClaudeModal onClose={() => setConnectOpen(false)} />}
    </MenuWrap>
  )
}
