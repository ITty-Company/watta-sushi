'use client'

import { Suspense } from 'react'
import FullMenuPageClient from '../components/FullMenuPageClient'

export default function MenuPage() {
  return (
    <Suspense fallback={null}>
      <FullMenuPageClient />
    </Suspense>
  )
}
