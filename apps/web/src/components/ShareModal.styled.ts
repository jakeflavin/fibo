import styled from 'styled-components'

export const QrBox = styled.div`
  /* Centred explicitly: the dialog around it is left-aligned now. */
  display: block;
  width: fit-content;
  margin: 0 auto 14px;
  /* A machine format, not a theme colour. A QR code needs a white quiet zone
     and black modules to scan; tinting either one breaks the scan. */
  background: #ffffff;
  padding: 10px;
  border-radius: 12px;
  line-height: 0;
`
