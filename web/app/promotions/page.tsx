'use client'

import { useRouter } from 'next/navigation'
import PromotionsView from '../components/PromotionsView'
import WattaSiteStickyChrome from '../components/WattaSiteStickyChrome'

export default function PromotionsRoutePage() {
  const router = useRouter()

  return (
    <div className="menu-page-web watta-promotions-route relative flex w-full max-w-[100vw] min-w-0 shrink-0 flex-col overflow-x-hidden watta-page-bg">
      <WattaSiteStickyChrome flowHeightFudgePx={4} />
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />
      <PromotionsView
        embedded
        onBack={() => router.push('/')}
        onMenuClick={() => router.push('/menu')}
        onOpenPhone={() => {
          window.location.href = 'tel:+31649326549'
        }}
        onOpenNotifications={() => router.push('/notifications')}
        onOpenFavorites={() => router.push('/favorites')}
        onOpenProfile={() => router.push('/profile')}
        onOpenDetail={(id) => router.push(`/promotions/${id}`)}
      />
    </div>
  )
}
