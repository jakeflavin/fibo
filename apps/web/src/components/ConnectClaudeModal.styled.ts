import styled from 'styled-components'
import { ShareUrl } from '@/styles/shared.styled'
import { Modal } from './Modal'

/**
 * Wider than the app's other dialogs. The 320px cap is right for a confirm and
 * wrong here: the two values on this screen *are* the content, and at 320 both
 * were clipped mid-string — the URL at the host, the command halfway — with no
 * scrollbar, fade or wrap to say there was more. Nobody pastes a connector URL
 * without reading it first.
 */
export const ConnectDialog = styled(Modal)`
  && {
    max-width: 480px;
  }
`

export const ConnectCopy = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;

  ${ShareUrl} {
    flex: 1;
    min-width: 0;
    /* Wrap rather than scroll: the whole value has to be readable at once. */
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    margin-bottom: 0;
  }
`

export const ConnectRow = styled.div`
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  min-width: 0;
  text-align: left;
`
