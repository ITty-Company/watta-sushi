import { Suspense } from 'react'
import type { Metadata } from 'next'
import WattaAppRouteLoading from '../components/WattaAppRouteLoading'
import { AuthPageLoader } from '../components/auth/AuthPageLoader'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'login')
}

export default function LoginPage() {
  return (
    <Suspense fallback={<WattaAppRouteLoading />}>
      <AuthPageLoader mode="login" />
    </Suspense>
  )
}
