import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthPageLoader } from '../components/auth/AuthPageLoader'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'register')
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageLoader mode="register" />
    </Suspense>
  )
}
