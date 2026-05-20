'use client'

import { useEffect } from 'react'

let openCount = 0

function syncNavDrawerOpenAttribute() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (openCount > 0) {
    root.setAttribute('data-watta-nav-drawer-open', '')
  } else {
    root.removeAttribute('data-watta-nav-drawer-open')
  }
}

/** Синхронізує `data-watta-nav-drawer-open` на `<html>` (ref-count для кількох drawer-ів). */
export function useWattaNavDrawerOpenSync(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return
    openCount += 1
    syncNavDrawerOpenAttribute()
    return () => {
      openCount = Math.max(0, openCount - 1)
      syncNavDrawerOpenAttribute()
    }
  }, [isOpen])
}
