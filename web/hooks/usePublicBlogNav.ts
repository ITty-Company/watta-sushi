'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  WATTA_BLOG_UPDATED_EVENT,
  fetchPublicBlogAvailable,
  readPublicBlogNavCache,
  writePublicBlogNavCache,
} from '@/lib/wattaPublicBlogNav'

/**
 * Пункт «Блог» у меню та футері — лише якщо в адмінці є хоча б одна опублікована стаття.
 */
export function usePublicBlogNav() {
  const [showBlogNav, setShowBlogNav] = useState(false)

  const refresh = useCallback(async () => {
    const available = await fetchPublicBlogAvailable()
    writePublicBlogNavCache(available)
    setShowBlogNav(available)
  }, [])

  useEffect(() => {
    const cached = readPublicBlogNavCache()
    if (cached === true) setShowBlogNav(true)
    void refresh()
    window.addEventListener(WATTA_BLOG_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(WATTA_BLOG_UPDATED_EVENT, refresh)
  }, [refresh])

  return { showBlogNav, refreshBlogNav: refresh }
}
