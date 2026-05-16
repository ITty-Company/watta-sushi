import DeliveryView from '../components/DeliveryView'
import {
  WATTA_DELIVERY_HERO_POSTER,
  WATTA_DELIVERY_HERO_PRIMARY_MP4,
} from '@/lib/wattaDeliveryHeroVideo'

export default function DeliveryPage() {
  return (
    <>
      <link rel="preload" as="image" href={WATTA_DELIVERY_HERO_POSTER} fetchPriority="high" />
      <link rel="preload" as="video" type="video/mp4" href={WATTA_DELIVERY_HERO_PRIMARY_MP4} fetchPriority="high" />
      <DeliveryView />
    </>
  )
}
