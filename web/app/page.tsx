import HomeClient from './HomeClient'
import { WATTA_HERO_PRIMARY_MP4 } from '@/lib/wattaHeroVideo'

export default function Home() {
  return (
    <>
      {/* Лого сплеша — перший вiзуальний сигнал до того, як прийде HTML контенту.
          srcset тут не потрібен: 1x варіант (11 КБ) піде під ретіну теж — це WebP, decode миттєвий. */}
      <link
        rel="preload"
        as="image"
        href="/logo-splash-1x.webp"
        fetchPriority="high"
      />
      {/* Hero mp4 — паралельно з постером; декодер стартує одразу після hydration. */}
      <link rel="preload" as="video" type="video/mp4" href={WATTA_HERO_PRIMARY_MP4} fetchPriority="high" />
      <HomeClient />
    </>
  )
}
