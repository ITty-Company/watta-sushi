'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Instagram } from 'lucide-react'
import { WATTA_INSTAGRAM_URL } from '@/lib/wattaSiteDefaults'

const btnBase =
  'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none'

/** Лише Instagram (без Telegram / WhatsApp), щоб не дублювати кошик і месенджери внизу екрана */
export default function FloatingContactButtons() {
  const pathname = usePathname() || '/'
  const isHomeRoute = pathname === '/'
  const isAdminShellRoute = pathname === '/admin' || pathname.startsWith('/admin/')
  /** Як у AppClient: панель на всіх сторінках крім `/` та адмінки */
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
      <div className="pointer-events-auto rounded-2xl border border-white/80 bg-white/95 p-2 shadow-lg backdrop-blur-md">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} bg-[#E4405F] text-white`}
          aria-label="Instagram"
        >
          <Instagram className="h-6 w-6" />
        </a>
      </div>
    </div>
  )
}
