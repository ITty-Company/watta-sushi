'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PromotionsDetailView from '../../components/PromotionsDetailView'

export default function PromotionDetailRoutePage() {
  const router = useRouter()
  const params = useParams()
  const raw = params?.id
  const id = typeof raw === 'string' ? parseInt(raw, 10) : NaN
  const valid = Number.isFinite(id) && id >= 1

  useEffect(() => {
    if (!valid) router.replace('/promotions')
  }, [valid, router])

  if (!valid) return null

  return (
    <PromotionsDetailView
      embedded
      id={id}
      onBack={() => router.push('/promotions')}
      onMenuClick={() => router.push('/menu')}
      onOpenPhone={() => {
        window.location.href = 'tel:+31649326549'
      }}
      onOpenNotifications={() => router.push('/notifications')}
      onOpenFavorites={() => router.push('/favorites')}
      onOpenProfile={() => router.push('/profile')}
    />
  )
}
