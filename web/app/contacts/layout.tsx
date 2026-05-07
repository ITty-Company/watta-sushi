import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'contacts')
}

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children
}
