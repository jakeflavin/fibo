import styled from 'styled-components'
import { ShareUrl } from '@/styles/shared.styled'

export const ConnectCopy = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  ${ShareUrl} {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    display: block;
  }
`

export const ConnectRow = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
  min-width: 0;
  text-align: left;
`
