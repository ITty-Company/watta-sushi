'use client'

import { useRef, type TouchEvent as ReactTouchEvent } from 'react'

const CLOSE_SWIPE_PX = 56

function isDominantHorizontal(dx: number, dy: number): boolean {
  return Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) > 12
}

/** Свайп справа наліво — закрити drawer (панель з правого краю). */
export function useNavDrawerCloseSwipeHandlers(active: boolean, onClose: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const reset = () => {
    startRef.current = null
  }

  const tryClose = (dx: number, dy: number) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px)').matches) return
    if (!isDominantHorizontal(dx, dy) || dx > -CLOSE_SWIPE_PX) return
    onCloseRef.current()
    reset()
  }

  if (!active) {
    return {
      onTouchStart: undefined,
      onTouchMove: undefined,
      onTouchEnd: undefined,
      onTouchCancel: undefined,
    } as const
  }

  return {
    onTouchStart: (e: ReactTouchEvent) => {
      const t = e.touches[0]
      if (!t) {
        reset()
        return
      }
      startRef.current = { x: t.clientX, y: t.clientY }
    },
    onTouchMove: (e: ReactTouchEvent) => {
      const start = startRef.current
      const t = e.touches[0]
      if (!start || !t) return
      tryClose(t.clientX - start.x, t.clientY - start.y)
    },
    onTouchEnd: (e: ReactTouchEvent) => {
      const start = startRef.current
      if (!start) return
      const t = e.changedTouches[0]
      if (t) tryClose(t.clientX - start.x, t.clientY - start.y)
      reset()
    },
    onTouchCancel: () => reset(),
  } as const
}
