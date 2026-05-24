'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'
import {
  type NavDrawerCategory,
  buildNavDrawerCategoriesFromApi,
  fallbackNavDrawerCategories,
  fetchAndCacheNavDrawerCategories,
  readNavDrawerCategoriesFromSession,
} from '@/lib/navDrawerCategories'
import { WATTA_CATALOG_REFRESH_EVENT, type CatalogRefreshScope } from '@/lib/wattaCatalogSync'

type UseNavDrawerCategoriesOptions = {
  /** Категорії з MenuView (головна / вбудоване меню) — пріоритетні, якщо вже завантажені. */
  external?: NavDrawerCategory[]
  /** Відкритий drawer — підвантажити свіжий список з API. */
  drawerActive?: boolean
}

function shouldRefreshForScope(scope: CatalogRefreshScope | undefined): boolean {
  return scope === 'categories' || scope === 'all' || scope == null
}

export function useNavDrawerCategories(options: UseNavDrawerCategoriesOptions = {}): NavDrawerCategory[] {
  const { external, drawerActive = false } = options
  const { language, t } = useLanguage()
  const categoryLabels = t.categories as Record<string, string>

  const fallback = useMemo(
    () => fallbackNavDrawerCategories(categoryLabels),
    [categoryLabels],
  )

  const [internal, setInternal] = useState<NavDrawerCategory[]>(() => {
    return readNavDrawerCategoriesFromSession(language, categoryLabels) ?? []
  })

  const refresh = useCallback(async () => {
    const cached = readNavDrawerCategoriesFromSession(language, categoryLabels)
    if (cached?.length) setInternal(cached)
    const fresh = await fetchAndCacheNavDrawerCategories(language, categoryLabels)
    if (fresh?.length) setInternal(fresh)
  }, [language, categoryLabels])

  useEffect(() => {
    if (external && external.length > 0) return
    void refresh()
  }, [external, refresh])

  useEffect(() => {
    if (!drawerActive) return
    if (external && external.length > 0) return
    void refresh()
  }, [drawerActive, external, refresh])

  useEffect(() => {
    const onCategoriesUpdated = () => {
      void refresh()
    }
    const onCatalogRefresh = (ev: Event) => {
      const scope = (ev as CustomEvent<{ scope?: CatalogRefreshScope }>).detail?.scope
      if (!shouldRefreshForScope(scope)) return
      void refresh()
    }
    window.addEventListener('categoriesUpdated', onCategoriesUpdated)
    window.addEventListener(WATTA_CATALOG_REFRESH_EVENT, onCatalogRefresh)
    return () => {
      window.removeEventListener('categoriesUpdated', onCategoriesUpdated)
      window.removeEventListener(WATTA_CATALOG_REFRESH_EVENT, onCatalogRefresh)
    }
  }, [refresh])

  if (external && external.length > 0) return external
  if (internal.length > 0) return internal
  return fallback
}
