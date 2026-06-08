'use client'

import { useEffect, useRef } from 'react'
import { bindAppVerticalScroll } from '@/lib/menuScroll'
import {
  createRafScrollListener,
  publishMenuCategoryHighlight,
  resolveActiveMenuCategoryFromScroll,
  type MenuScrollSection,
} from '@/lib/scrollSync'
import { isWattaTouchScrollPerfViewport } from '@/lib/wattaTouchViewport'

type UseMenuCategoryScrollSpyOptions = {
  enabled: boolean
  getSections: () => MenuScrollSection[]
  isScrollLocked?: () => boolean
  beforeFirstSectionSlug?: string
  beforeCatalogSlug?: string
  getCatalogEl?: () => HTMLElement | null
}

/**
 * Підсвітка категорії в sticky strip під час вертикального скролу (/menu).
 * Однакова логіка на всіх пристроях.
 */
export function useMenuCategoryScrollSpy({
  enabled,
  getSections,
  isScrollLocked,
  beforeFirstSectionSlug,
  beforeCatalogSlug,
  getCatalogEl,
}: UseMenuCategoryScrollSpyOptions) {
  const lastHighlightSlugRef = useRef('')

  useEffect(() => {
    if (!enabled) return

    const touchPerf = isWattaTouchScrollPerfViewport()
    const scrollSyncMinMs = touchPerf ? 100 : 32
    const publish = (slug: string) => publishMenuCategoryHighlight(slug, lastHighlightSlugRef)

    const sync = () => {
      if (isScrollLocked?.()) return
      const sections = getSections()
      if (sections.length === 0) return
      const slug = resolveActiveMenuCategoryFromScroll(sections, {
        catalogEl: getCatalogEl?.() ?? null,
        beforeCatalogSlug,
        beforeFirstSectionSlug,
      })
      if (slug) publish(slug)
    }

    const { onScroll, cancel } = createRafScrollListener(sync, { minIntervalMs: scrollSyncMinMs })
    const unbindScroll = bindAppVerticalScroll(onScroll)
    const onResize = () => onScroll()
    window.addEventListener('resize', onResize, { passive: true })
    const id = window.requestAnimationFrame(sync)

    return () => {
      window.cancelAnimationFrame(id)
      cancel()
      unbindScroll()
      window.removeEventListener('resize', onResize)
    }
  }, [
    enabled,
    getSections,
    isScrollLocked,
    beforeFirstSectionSlug,
    beforeCatalogSlug,
    getCatalogEl,
  ])
}
