'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { syncWattaHtmlRouteClass } from '@/lib/wattaHtmlRouteClass'

/** Тримає клас hero-маршруту на <html> при SPA-переходах (Reload — inline script у layout). */
export default function WattaHtmlRouteClass() {
  const pathname = usePathname() || '/'

  useLayoutEffect(() => {
    syncWattaHtmlRouteClass(pathname)
  }, [pathname])

  return null
}
