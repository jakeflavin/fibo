import styled from 'styled-components'
import { Seg, SegCell, TextField, dim } from '@/styles/shared.styled'

export const DeckPickerCustom = styled(TextField)`
  && {

  }
`

export const DeckPickerPreview = styled.div`
  ${dim}

  font-size: var(--font-small);
  text-align: left;
`

export const DeckPickerSeg = styled(Seg)`
  && {

    ${SegCell} {
      flex: 1;
    }
  }
`

export const PickerGrid = styled.div`
  display: grid;
  gap: 8px;
`
