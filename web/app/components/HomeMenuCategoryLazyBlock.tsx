'use client'

import type { ReactNode, Ref } from 'react'
import { useNearViewportMount } from '@/hooks/useNearViewportMount'

type Props = {
  id: string
  className?: string
  children: ReactNode
  /** Перші N блоків каталогу — одразу в DOM (LCP / перший скрол). */
  mountIndex: number
  eagerCount?: number
}

const HOME_CAT_PLACEHOLDER_MIN_H = 'min(420px, 72vw)'

/**
 * Головна: важкі стрічки товарів монтуються лише біля viewport — менше DOM і decode зображень при завантаженні.
 */
export function HomeMenuCategoryLazyBlock({
  id,
  className,
  children,
  mountIndex,
  eagerCount = 1,
}: Props) {
  const { ref, mounted } = useNearViewportMount({
    rootMargin: '380px 0px 280px 0px',
    forceMount: mountIndex < eagerCount,
    lazyOnPhone: true,
  })

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      id={id}
      className={className}
      data-watta-in-view-fade=""
      style={mounted ? undefined : { minHeight: HOME_CAT_PLACEHOLDER_MIN_H }}
    >
      {mounted ? children : null}
    </div>
  )
}
