import styled from 'styled-components'

export const Brand = styled.a`
  display: flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1;

  /* A 63x14 link is not a tap target; the bar grows to hold a 44px one. */
  @media (hover: none) {
    align-items: center;
    min-height: 44px;
  }
`

export const BrandName = styled.span`
  font-weight: 700;
  font-size: var(--font-body);
  color: var(--dim);
`

export const BrandVersion = styled.span`
  font-size: var(--font-lozenge);
  color: var(--dim);
  opacity: 0.6;
`

export const HeaderBar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 40px;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;

  @media (hover: none) {
    height: 48px;
  }
`
