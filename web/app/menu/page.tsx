'use client'

import { Suspense } from 'react'
import WattaAppRouteLoading from '../components/WattaAppRouteLoading'
import FullMenuPageClient from '../components/FullMenuPageClient'

export default function MenuPage() {
  return (
    <Suspense fallback={<WattaAppRouteLoading />}>
      <FullMenuPageClient />
    </Suspense>
  )
}
