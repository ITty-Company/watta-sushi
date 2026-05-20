'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  WATTA_PROMOTIONS_UPDATED_EVENT,
  fetchPublicPromotionsAvailable,
  readPublicPromotionsNavCache,
  writePublicPromotionsNavCache,
} from '@/lib/wattaPublicPromotionsNav'

/**
 * Пункт «Акции» в боковом меню и шапке — только якщо в адмінці є хоча б одна новина/акція.
 * До завершення перевірки — ховаємо, щоб не миготіло зайвим.
 */
export function usePublicPromotionsNav() {
  const [showPromotionsNav, setShowPromotionsNav] = useState(false)

  const refresh = useCallback(async () => {
    const available = await fetchPublicPromotionsAvailable()
    writePublicPromotionsNavCache(available)
    setShowPromotionsNav(available)
  }, [])

  useEffect(() => {
    const cached = readPublicPromotionsNavCache()
    if (cached === true) setShowPromotionsNav(true)
    void refresh()
    window.addEventListener(WATTA_PROMOTIONS_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(WATTA_PROMOTIONS_UPDATED_EVENT, refresh)
  }, [refresh])

  return { showPromotionsNav, refreshPromotionsNav: refresh }
}
