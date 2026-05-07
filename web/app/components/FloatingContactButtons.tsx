'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Instagram } from 'lucide-react'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'
import { useLanguage } from '@/app/context/LanguageContext'

/** Лише Instagram (без Telegram / WhatsApp), щоб не дублювати кошик і месенджери внизу екрана */
export default function FloatingContactButtons() {
  const { t } = useLanguage()
  const pathname = usePathname() || '/'
  const isHomeRoute = pathname === '/'
  const isAdminShellRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  const liftForBottomBar = !isAdminShellRoute && !isHomeRoute
  const [instagramUrl, setInstagramUrl] = useState(WATTA_INSTAGRAM_URL)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setInstagramUrl(String(d.instagramUrl || '').trim() || WATTA_INSTAGRAM_URL)
      })
      .catch(() => {})
  }, [])

  const bottomPos = liftForBottomBar
    ? 'bottom-[calc(max(1rem,env(safe-area-inset-bottom,0px))+54px+14px)] md:bottom-[calc(max(1.25rem,env(safe-area-inset-bottom,0px))+54px+14px)] lg:bottom-[calc(max(1.25rem,env(safe-area-inset-bottom,0px))+14px)]'
    : 'bottom-[calc(1.25rem+14px)] md:bottom-[calc(1.5rem+14px)]'

  return (
    <div
      className={`floating-contact-buttons-root pointer-events-none fixed right-4 z-[9980] flex flex-col items-end gap-2.5 md:right-6 ${bottomPos}`}
    >
      <div className="pointer-events-auto">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="floating-contact-ig-fab"
          aria-label={t.contactPage.ariaInstagram}
        >
          <Instagram className="floating-contact-ig-fab__icon" strokeWidth={2.1} aria-hidden />
        </a>
      </div>
    </div>
  )
}
