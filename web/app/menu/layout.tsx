import type { Metadata } from 'next'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import {
  WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES,
  WATTA_HOME_HERO_POSTER,
} from '@/lib/wattaHeroVideo'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'menu')
}

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  const heroMp4 = WATTA_FULL_MENU_PAGE_HERO_VIDEO_SOURCES[0]
  return (
    <>
      <link rel="preload" as="image" href={WATTA_HOME_HERO_POSTER} fetchPriority="high" />
      <link rel="preload" as="video" type="video/mp4" href={heroMp4} fetchPriority="high" />
      {children}
    </>
  )
}
