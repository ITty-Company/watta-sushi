'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { startTransition } from 'react'
import { normalizeInternalHref, prefetchHref } from '@/lib/instantNav'

type NavigateOptions = Parameters<AppRouterInstance['push']>[1]

/**
 * Drop-in для useRouter: push/replace через startTransition + prefetch.
 */
export function useInstantRouter(): AppRouterInstance {
  const router = useRouter()

  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: NavigateOptions) => {
        const target = normalizeInternalHref(href)
        if (!target) return
        prefetchHref(router, target)
        startTransition(() => router.push(target, options))
      },
      replace: (href: string, options?: NavigateOptions) => {
        const target = normalizeInternalHref(href)
        if (!target) return
        prefetchHref(router, target)
        startTransition(() => router.replace(target, options))
      },
      prefetch: (href: string, options?: Parameters<AppRouterInstance['prefetch']>[1]) => {
        const target = normalizeInternalHref(href)
        if (!target) return
        prefetchHref(router, target)
        return router.prefetch(target, options)
      },
    }),
    [router],
  )
}
