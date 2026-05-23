'use client'

import { useInstantNavBoot } from '@/hooks/useInstantNavBoot'

/** @deprecated Використовуйте useInstantNavBoot — той самий ефект + prefetch на intent. */
export function usePrefetchPublicRoutes(): void {
  useInstantNavBoot()
}
