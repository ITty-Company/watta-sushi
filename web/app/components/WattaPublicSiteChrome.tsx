'use client'

import WattaSiteStickyChrome from './WattaSiteStickyChrome'

/** Верхня панель для публічних маршрутів (окрім `/`, `/favorites` — там chrome у сторінці). */
export default function WattaPublicSiteChrome() {
  return <WattaSiteStickyChrome flowHeightFudgePx={4} />
}
