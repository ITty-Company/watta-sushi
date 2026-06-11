'use client'

import { useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'

const REVEAL_WIDTH = 76
const REVEAL_THRESHOLD = 34
const DELETE_OVERSWIPE = 28
const HORIZONTAL_RATIO = 1.15

type SwipeSide = 'left' | 'right' | null

function restingOffset(side: SwipeSide): number {
  if (side === 'left') return REVEAL_WIDTH
  if (side === 'right') return -REVEAL_WIDTH
  return 0
}

export function useCartLineSwipeToDelete(options: {
  lineId: string
  onRemove: () => void
  openLineId: string | null
  onOpenChange: (id: string | null) => void
  enabled: boolean
}) {
  const { lineId, onRemove, openLineId, onOpenChange, enabled } = options

  const [offset, setOffset] = useState(0)
  const [revealedSide, setRevealedSide] = useState<SwipeSide>(null)
  const [dragging, setDragging] = useState(false)

  const startRef = useRef<{ x: number; y: number } | null>(null)
  const axisLockRef = useRef<'none' | 'x' | 'y'>('none')
  const revealedSideRef = useRef<SwipeSide>(null)
  const onRemoveRef = useRef(onRemove)
  const onOpenChangeRef = useRef(onOpenChange)

  revealedSideRef.current = revealedSide
  onRemoveRef.current = onRemove
  onOpenChangeRef.current = onOpenChange

  const resetGesture = useCallback(() => {
    startRef.current = null
    axisLockRef.current = 'none'
    setDragging(false)
  }, [])

  const closeLine = useCallback(() => {
    setRevealedSide(null)
    setOffset(0)
    resetGesture()
  }, [resetGesture])

  useEffect(() => {
    if (!enabled) return
    if (openLineId !== lineId && revealedSide) {
      closeLine()
    }
  }, [closeLine, enabled, lineId, openLineId, revealedSide])

  const commitOffset = useCallback(
    (nextOffset: number) => {
      const side = revealedSideRef.current

      if (side === 'left') {
        if (nextOffset > REVEAL_WIDTH + DELETE_OVERSWIPE) {
          onRemoveRef.current()
          closeLine()
          onOpenChangeRef.current(null)
          return
        }
        if (nextOffset < REVEAL_THRESHOLD) {
          setRevealedSide(null)
          setOffset(0)
          onOpenChangeRef.current(null)
          return
        }
        setOffset(REVEAL_WIDTH)
        return
      }

      if (side === 'right') {
        if (nextOffset < -REVEAL_WIDTH - DELETE_OVERSWIPE) {
          onRemoveRef.current()
          closeLine()
          onOpenChangeRef.current(null)
          return
        }
        if (nextOffset > -REVEAL_THRESHOLD) {
          setRevealedSide(null)
          setOffset(0)
          onOpenChangeRef.current(null)
          return
        }
        setOffset(-REVEAL_WIDTH)
        return
      }

      if (nextOffset > REVEAL_THRESHOLD) {
        setRevealedSide('left')
        setOffset(REVEAL_WIDTH)
        onOpenChangeRef.current(lineId)
        return
      }

      if (nextOffset < -REVEAL_THRESHOLD) {
        setRevealedSide('right')
        setOffset(-REVEAL_WIDTH)
        onOpenChangeRef.current(lineId)
        return
      }

      setOffset(0)
    },
    [closeLine, lineId],
  )

  const clampOffset = useCallback((value: number) => {
    const max = REVEAL_WIDTH + DELETE_OVERSWIPE + 12
    return Math.max(-max, Math.min(max, value))
  }, [])

  const onTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled) return
      const t = e.touches[0]
      if (!t) return
      startRef.current = { x: t.clientX, y: t.clientY }
      axisLockRef.current = 'none'
    },
    [enabled],
  )

  const onTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled) return
      const start = startRef.current
      const t = e.touches[0]
      if (!start || !t) return

      const dx = t.clientX - start.x
      const dy = t.clientY - start.y

      if (axisLockRef.current === 'none') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        if (Math.abs(dx) > Math.abs(dy) * HORIZONTAL_RATIO) {
          axisLockRef.current = 'x'
        } else {
          axisLockRef.current = 'y'
          return
        }
      }

      if (axisLockRef.current !== 'x') return

      e.preventDefault()
      setDragging(true)
      setOffset(clampOffset(restingOffset(revealedSideRef.current) + dx))
    },
    [clampOffset, enabled],
  )

  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      if (!enabled) return
      const start = startRef.current
      if (!start) return

      const t = e.changedTouches[0]
      if (t && axisLockRef.current === 'x') {
        const dx = t.clientX - start.x
        commitOffset(clampOffset(restingOffset(revealedSideRef.current) + dx))
      }

      resetGesture()
    },
    [clampOffset, commitOffset, enabled, resetGesture],
  )

  const onTouchCancel = useCallback(() => {
    if (!enabled) return
    commitOffset(offset)
    resetGesture()
  }, [commitOffset, enabled, offset, resetGesture])

  const handleDeleteTap = useCallback(() => {
    onRemoveRef.current()
    closeLine()
    onOpenChangeRef.current(null)
  }, [closeLine])

  const showLeftDelete = offset > 4
  const showRightDelete = offset < -4

  return {
    offset,
    dragging,
    revealedSide,
    showLeftDelete,
    showRightDelete,
    handleDeleteTap,
    closeLine,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  }
}
