'use client'

import { useEffect, useState } from 'react'

export const WATTA_STAGGER_REPLAY_MS = 5000

export function useWattaStaggerRevealCycle(enterSec = 0, enabled = true) {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const intervalMs =
      enterSec > 0
        ? Math.max(800, Math.round(enterSec * 1000)) + WATTA_STAGGER_REPLAY_MS
        : WATTA_STAGGER_REPLAY_MS

    const timer = window.setInterval(() => {
      setCycle((value) => value + 1)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [enterSec, enabled])

  return cycle
}
