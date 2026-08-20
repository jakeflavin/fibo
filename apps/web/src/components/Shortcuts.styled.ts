import styled from 'styled-components'

export const Kbd = styled.kbd`
  font-family: inherit;
  font-size: var(--font-small);
  font-weight: 600;
  background: var(--surface-hi);
  border: 1px solid var(--line);
  border-radius: 4px;
  padding: 1px 6px;
  min-width: 40px;
  text-align: center;
  white-space: nowrap;
`

export const ShortcutList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
  text-align: left;
`

export const ShortcutRow = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
`
