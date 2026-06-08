import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import '../styles/watta-site-hero-delivery.css'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'delivery')
}

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
