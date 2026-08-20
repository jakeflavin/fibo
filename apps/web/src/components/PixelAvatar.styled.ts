import styled from 'styled-components'
import { identity } from '@/styles/primitives.styled'

/**
 * The avatar resolves `--idc` itself, because the pixels are filled with it and the svg is
 * dropped into lists, seats and menus that do not otherwise carry the identity.
 */
export const AvatarSvg = styled.svg`
  ${identity}
`
