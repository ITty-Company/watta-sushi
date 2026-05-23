'use client'

import { useInstantRouter } from '@/hooks/useInstantRouter'
import PromotionsView from '../components/PromotionsView'
export default function PromotionsRoutePage() {
  const router = useInstantRouter()

  return (
    <>
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />
      <PromotionsView
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
    </>
  )
}
