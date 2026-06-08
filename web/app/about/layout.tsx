import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import '../styles/watta-site-hero-delivery.css'
import '../about-page-theme.css'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'about')
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
