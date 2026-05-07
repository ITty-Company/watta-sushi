import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AuthPageLoader } from '../components/auth/AuthPageLoader'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'login')
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] watta-page-bg" aria-hidden />}>
      <AuthPageLoader mode="login" />
    </Suspense>
  )
}
