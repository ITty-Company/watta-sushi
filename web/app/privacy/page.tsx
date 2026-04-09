'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import WattaGlobalSiteHeader from '../components/WattaGlobalSiteHeader'
import PrivacyPolicyView from '../components/PrivacyPolicyView'

export default function PrivacyPage() {
  const router = useRouter()

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <div className="flex min-h-[100dvh] w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden bg-[#020807]">
      <WattaGlobalSiteHeader
        logoHref="/"
        onCityChange={onCityChange}
        onPromotionsClick={() => router.push('/')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
      />
      <PrivacyPolicyView />
    </div>
  )
}
