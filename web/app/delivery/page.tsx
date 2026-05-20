import DeliveryView from '../components/DeliveryView'
import { WATTA_HOME_HERO_POSTER, WATTA_HERO_PRIMARY_MP4 } from '@/lib/wattaHeroVideo'

export default function DeliveryPage() {
  return (
    <>
      <link rel="preload" as="image" href={WATTA_HOME_HERO_POSTER} fetchPriority="high" />
      <link rel="preload" as="video" type="video/mp4" href={WATTA_HERO_PRIMARY_MP4} fetchPriority="high" />
      <DeliveryView />
    </>
  )
}
