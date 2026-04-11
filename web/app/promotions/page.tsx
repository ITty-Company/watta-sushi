'use client'

import { useRouter } from 'next/navigation'
import PromotionsView from '../components/PromotionsView'

export default function PromotionsRoutePage() {
  const router = useRouter()

  return (
    <PromotionsView
      embedded
      onBack={() => router.push('/')}
      onMenuClick={() => router.push('/menu')}
      onOpenPhone={() => {
        window.location.href = 'tel:+380930000000'
      }}
      onOpenNotifications={() => router.push('/notifications')}
      onOpenFavorites={() => router.push('/favorites')}
      onOpenProfile={() => router.push('/profile')}
      onOpenDetail={(id) => router.push(`/promotions/${id}`)}
    />
  )
}
