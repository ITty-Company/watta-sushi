import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import { FAVORITES_EMPTY_IMAGE_URLS } from '@/lib/preloadFavoritesEmptyImages'
import '../watta-favorites-empty.css'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'favorites')
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {FAVORITES_EMPTY_IMAGE_URLS.map((href) => (
        <link key={href} rel="preload" as="image" href={href} type="image/webp" />
      ))}
      {children}
    </>
  )
}
