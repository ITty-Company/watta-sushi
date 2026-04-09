'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ContactsView from '../components/ContactsView'
import WattaGlobalSiteHeader from '../components/WattaGlobalSiteHeader'

export default function ContactsPage() {
  const router = useRouter()

  const onCityChange = useCallback((cityId: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cityChanged', { detail: { cityId } }))
    }
  }, [])

  return (
    <div className="flex w-full max-w-[100vw] flex-1 flex-col overflow-x-hidden bg-white">
      <WattaGlobalSiteHeader
        logoHref="/"
        onCityChange={onCityChange}
        onPromotionsClick={() => router.push('/')}
        onCartClick={() => router.push('/cart')}
        onMenuClick={() => router.push('/')}
        onProfileClick={() => router.push('/profile')}
      />
      <ContactsView />
    </div>
  )
}
