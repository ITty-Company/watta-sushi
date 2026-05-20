import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import WattaSiteStickyChrome from '../components/WattaSiteStickyChrome'
import ReviewsPageClient from './ReviewsPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'reviews')
}

export default function ReviewsPage() {
  return (
    <div className="menu-page-web watta-reviews-route relative flex w-full max-w-[100vw] min-w-0 shrink-0 flex-col overflow-x-hidden watta-page-bg">
      <WattaSiteStickyChrome flowHeightFudgePx={4} />
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />
      <ReviewsPageClient />
    </div>
  )
}
