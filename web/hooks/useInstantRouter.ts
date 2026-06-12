'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { startTransition } from 'react'
import {
  isInstantNavPath,
  normalizeInternalHref,
  prefetchHref,
} from '@/lib/instantNav'
import { tryOpenAuthModalFromHref } from '@/lib/openWattaAuth'
type NavigateOptions = Parameters<AppRouterInstance['push']>[1]

function markSkipBootSplashForHome(href: string): void {
  if (typeof document === 'undefined') return
  const pathOnly = href.split('?')[0] || href
  if (pathOnly !== '/' && pathOnly !== '') return
  try {
    document.documentElement.setAttribute('data-watta-skip-splash', '1')
    document.documentElement.removeAttribute('data-watta-boot-splash-pending')
  } catch {
    /* ignore */
  }
}
export function useInstantRouter(): AppRouterInstance {
  const router = useRouter()

  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: NavigateOptions) => {
        const target = normalizeInternalHref(href)
        if (!target) return
        if (tryOpenAuthModalFromHref(target)) return
        markSkipBootSplashForHome(target)
        prefetchHref(router, target)
        const navOptions = { ...options, scroll: false as const }
        const push = () => {
          router.push(target, navOptions)
        }
        if (isInstantNavPath(target)) push()
        else startTransition(push)
      },
      replace: (href: string, options?: NavigateOptions) => {
        const target = normalizeInternalHref(href)
        if (!target) return
        if (tryOpenAuthModalFromHref(target)) return
        markSkipBootSplashForHome(target)
        prefetchHref(router, target)
        const navOptions = { ...options, scroll: false as const }
        const replace = () => {
          router.replace(target, navOptions)
        }
        if (isInstantNavPath(target)) replace()
        else startTransition(replace)
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
