'use client'

import { useEffect, useRef, type TouchEvent as ReactTouchEvent } from 'react'

const EDGE_PX = 48
const OPEN_SWIPE_PX = 56
const CLOSE_SWIPE_PX = 56
/** Доля ширини екрана справа, звідки можна почати свайп «відкрити». */
const RIGHT_START_ZONE_RATIO = 0.22

function isDominantHorizontal(dx: number, dy: number): boolean {
  return Math.abs(dx) > Math.abs(dy) * 1.15 && Math.abs(dx) > 12
}

function touchInRightOpenZone(clientX: number): boolean {
  if (typeof window === 'undefined') return false
  const w = window.innerWidth
  return clientX >= w - EDGE_PX || clientX >= w * (1 - RIGHT_START_ZONE_RATIO)
}

/** Свайп справа наліво — відкрити drawer (мобільні). Не блокує кліки. */
export function useNavDrawerOpenSwipe(active: boolean, onOpen: () => void): void {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen

  useEffect(() => {
    if (!active) return
    if (typeof window === 'undefined') return

    const mobileMq = window.matchMedia('(max-width: 767px)')
    if (!mobileMq.matches) return

    const reset = () => {
      startRef.current = null
    }

    const tryOpen = (dx: number, dy: number) => {
      if (!mobileMq.matches) return
      if (!isDominantHorizontal(-dx, dy)) return
      if (-dx >= OPEN_SWIPE_PX) {
        onOpenRef.current()
        reset()
      }
    }

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t || !touchInRightOpenZone(t.clientX)) {
        reset()
        return
      }
      startRef.current = { x: t.clientX, y: t.clientY }
    }

    const onTouchMove = (e: TouchEvent) => {
      const start = startRef.current
      const t = e.touches[0]
      if (!start || !t) return
      tryOpen(t.clientX - start.x, t.clientY - start.y)
    }

    const onTouchEnd = (e: TouchEvent) => {
      const start = startRef.current
      if (!start) return
      const t = e.changedTouches[0]
      if (t) tryOpen(t.clientX - start.x, t.clientY - start.y)
      reset()
    }

    const onTouchCancel = () => reset()

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchCancel)
      reset()
    }
  }, [active])
}

/** Свайп зліва направо — закрити drawer (на aside, події з дочірніх елементів). */
export function useNavDrawerCloseSwipeHandlers(active: boolean, onClose: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const reset = () => {
    startRef.current = null
  }

  const tryClose = (dx: number, dy: number) => {
    if (typeof window !== 'undefined' && !window.matchMedia('(max-width: 767px)').matches) return
    if (!isDominantHorizontal(dx, dy) || dx < CLOSE_SWIPE_PX) return
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
