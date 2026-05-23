import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import TeamGalleryPageClient from './TeamGalleryPageClient'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'teamGallery')
}

export default function TeamGalleryPage() {
  return (
    <div className="menu-page-web delivery-page-web contact-page-web watta-about-page watta-delivery-page watta-delivery-page-about relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden bg-white pb-24">
      <TeamGalleryPageClient />
    </div>
  )
}
