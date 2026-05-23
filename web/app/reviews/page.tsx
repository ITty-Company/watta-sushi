import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import ReviewsPageClient from './ReviewsPageClient'
export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'reviews')
}

export default function ReviewsPage() {
  return <ReviewsPageClient />
}
