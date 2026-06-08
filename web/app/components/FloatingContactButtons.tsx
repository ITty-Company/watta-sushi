'use client'

import React, { useState, useEffect } from 'react'
import { Instagram } from 'lucide-react'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'
import { useLanguage } from '@/app/context/LanguageContext'
import { useMobileCartBarGate } from '@/hooks/useMobileCartBarGate'
import WattaFloatingCartFab from './WattaFloatingCartFab'
import WattaMobileCartBar from './WattaMobileCartBar'

/** Кошик + Instagram знизу екрана (телефон); месенджери прибрані, щоб не дублювати FAB. */
export default function FloatingContactButtons() {
  const { t } = useLanguage()
  useMobileCartBarGate()
  const [instagramUrl, setInstagramUrl] = useState(WATTA_INSTAGRAM_URL)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setInstagramUrl(String(d.instagramUrl || '').trim() || WATTA_INSTAGRAM_URL)
      })
      .catch(() => {})
  }, [])

  const bottomPos =
    'bottom-[calc(max(0.75rem,env(safe-area-inset-bottom,0px))+8px)] md:bottom-[calc(max(0.875rem,env(safe-area-inset-bottom,0px))+8px)]'

  return (
    <>
      <WattaMobileCartBar />
      <div
      className={`floating-contact-buttons-root pointer-events-none fixed right-4 z-[9980] flex flex-col items-end gap-2.5 md:right-6 ${bottomPos}`}
    >
      <div className="pointer-events-auto flex flex-col items-end gap-2.5">
        <WattaFloatingCartFab />
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
    </>
  )
}
