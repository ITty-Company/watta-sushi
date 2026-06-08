'use client'

import { useEffect, useRef, useState } from 'react'
import { getVerticalScrollTarget } from '@/lib/menuScroll'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

type Options = {
  /** Preload zone above/below viewport (default 900px). */
  rootMargin?: string
  /** Always mount children (e.g. deep-link ?cat= target). */
  forceMount?: boolean
  /** When true, phone also uses IntersectionObserver (default: mount immediately on phone). */
  lazyOnPhone?: boolean
}

/**
 * Mount heavy children only when the anchor enters (or nears) the scroll viewport.
 * Keeps section headers in DOM for scroll-spy / hash navigation.
 */
export function useNearViewportMount({
  rootMargin = '900px 0px 900px 0px',
  forceMount = false,
  lazyOnPhone = false,
}: Options = {}) {
  const ref = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(forceMount)

  useEffect(() => {
    if (forceMount) {
      setMounted(true)
    }
  }, [forceMount])

  useEffect(() => {
    if (mounted) return
    const el = ref.current
    if (!el) return

    if (!lazyOnPhone && isWattaPhoneViewport()) {
      setMounted(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true)
      return
    }

    const scrollTarget = getVerticalScrollTarget()
    const root = scrollTarget instanceof HTMLElement ? scrollTarget : null

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true)
            io.disconnect()
            return
          }
        }
      },
      { root, rootMargin, threshold: 0 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [mounted, rootMargin, lazyOnPhone])

  return { ref, mounted }
}
