import HomeClient from './HomeClient'
import HomeHeroSsrShell from './components/HomeHeroSsrShell'
import { WATTA_HOME_HERO_POSTER } from '@/lib/wattaHeroVideo'

export default function Home() {
  return (
    <>
      {/* Лого сплеша — перший вiзуальний сигнал до того, як прийде HTML контенту. */}
      <link
        rel="preload"
        as="image"
        href="/logo-splash-1x.webp"
        fetchPriority="high"
      />
      {/* LCP: постер hero. Mp4 — без high priority, щоб не з’їдати смугу під картинку. */}
      <link rel="preload" as="image" href={WATTA_HOME_HERO_POSTER} fetchPriority="high" />
      <HomeHeroSsrShell />
      <HomeClient />
    </>
  )
}
