import HomeClient from './HomeClient'
import { WATTA_HERO_PRIMARY_MP4, WATTA_HOME_HERO_POSTER } from '@/lib/wattaHeroVideo'

/** Дефолтні банери головної — ті самі URL, що в MenuView DEFAULT_HOME_BANNERS. */
const HOME_DEFAULT_BANNER_IMAGES = [
  '/watta-sushi.jpg',
  '/sushi.png',
  '/profile-background.jpg',
] as const

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
      {/* Постер hero + mp4 — паралельно; на мобільному одразу видно кадр, поки йде decode. */}
      <link rel="preload" as="image" href={WATTA_HOME_HERO_POSTER} fetchPriority="high" />
      <link rel="preload" as="video" type="video/mp4" href={WATTA_HERO_PRIMARY_MP4} fetchPriority="high" />
      {HOME_DEFAULT_BANNER_IMAGES.map((href) => (
        <link key={href} rel="preload" as="image" href={href} />
      ))}
      <HomeClient />
    </>
  )
}
