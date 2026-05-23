'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import ProfileView from '../components/ProfileView'
function ProfilePageInner() {
  const router = useInstantRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab')
  const initialTab =
    tab === 'address' || tab === 'favorites' || tab === 'data' ? tab : 'history'
  const orderParam = searchParams.get('order')
  const highlightOrderId = orderParam ? parseInt(orderParam, 10) : undefined

  return (
    <ProfileView
      layout="page"
      initialTab={initialTab}
      highlightOrderId={Number.isFinite(highlightOrderId) ? highlightOrderId : undefined}
      onBack={() => router.push('/')}
      onMenuClick={() => router.push('/menu')}
      onOpenPhone={() => router.push('/contacts')}
      onOpenNotifications={() => router.push('/notifications')}
      onOpenFavorites={() => router.push('/favorites')}
      onOpenCart={() => router.push('/cart')}
      onOpenAdmin={() => router.push('/admin')}
      onSelectCategory={() => router.push('/menu')}
    />
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageInner />
    </Suspense>
  )
}
