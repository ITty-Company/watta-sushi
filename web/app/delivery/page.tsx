'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import DeliveryView from '../components/DeliveryView'
import WattaGlobalSiteHeader from '../components/WattaGlobalSiteHeader'

export default function DeliveryPage() {
  const router = useRouter()

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <div className="delivery-page-root-web flex w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden bg-[#F3F4F6]">
      <WattaGlobalSiteHeader
        logoHref="/"
        onCityChange={onCityChange}
        onPromotionsClick={() => router.push('/')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
      />
      <DeliveryView />
    </div>
  )
}
