import styled, { css } from 'styled-components'
import { identity, pop, rise } from '@/styles/primitives.styled'
import { Button, Menu, RailCard } from '@/styles/shared.styled'

export const IdentityMark = styled.span`
  --idc: var(--id-dark);

  :root[data-theme='light'] &  {
    --idc: var(--id-light);
  }
`

export const UserList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
`

export const TeamCard = styled(RailCard)`
  && {

    ${UserList} {
      overflow-y: auto;
      min-height: 0;
    }

    @media (max-width: 860px) {
      display: block;
      overflow: visible;
      height: auto;
    }

    @media (max-width: 860px) {
      ${UserList} {
        max-height: 40vh;
      }
    }
  }
`

export const UserMain = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`

export const UserMenu = styled(Menu)`
  && {

    min-width: 0;
    width: max-content;
  }
`

export const UserMore = styled(Button)`
  && {

    height: 24px;
    width: 24px;
    padding: 0;
    opacity: 0;
    transition: opacity 0.1s ease;

    &[aria-expanded='true'] {
      opacity: 1;
    }
  }
`

export const UserMoreWrap = styled.span`
  position: relative;
  display: flex;
  justify-content: center;
`

export const UserName = styled.span`
  ${identity}
  color: var(--idc);

  &${IdentityMark} {
    color: var(--idc);
  }

  font-size: var(--font-body);
  font-weight: 500;
  line-height: 24px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const UserTag = styled.span`
  display: inline-block;
  font-size: var(--font-lozenge);
  font-weight: 600;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 2px;
  background: var(--surface-hi);
  color: var(--dim);
  vertical-align: middle;
`

export const PresenceDot = styled.span<{ $off?: boolean; $on?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;

  ${(props) => props.$off && css`
  && {
    background: var(--line-strong);
  }
  `}

  ${(props) => props.$on && css`
  && {
    background: var(--success);
  }
  `}
`

export const UserRow = styled.li<{ $offline?: boolean }>`
  /* Pixel avatars sit in Jira-style round containers in lists. */
  > svg {
    box-sizing: content-box;
    width: 20px;
    height: 20px;
    padding: 4px;
    border-radius: 50%;
    background: var(--surface-hi);
  }

  min-height: 32px;
  display: grid;
  grid-template-columns: 6px 28px minmax(0, 1fr) 4ch;
  align-items: center;
  gap: 8px;
  animation: ${rise} 0.25s ease-out both;

  &:hover ${UserMore} {
    opacity: 1;
  }

  &:focus-within ${UserMore} {
    opacity: 1;
  }

  > svg${IdentityMark} {
    box-sizing: content-box;
    width: 20px;
    height: 20px;
    padding: 4px;
    border-radius: 50%;
    background: var(--surface-hi);
  }

  ${(props) => props.$offline && css`
  && {
    opacity: 0.4;
  }
  `}
`

export const UserVote = styled.span<{ $voted?: boolean }>`
  text-align: center;
  color: var(--dim);
  font-size: var(--font-body);
  white-space: nowrap;

  ${(props) => props.$voted && css`
  && {
    color: var(--text);
    font-weight: 700;
    animation: ${pop} 0.3s ease-out both;
  }
  `}
`
