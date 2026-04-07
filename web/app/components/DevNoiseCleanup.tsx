'use client'

import { useEffect } from 'react'

/** Знімає сторонні dev-мітки (часто з розширень), що дають hydration mismatch */
const DEV_TS = /^dev-\d{4}-\d{2}-\d{2}T[\d:.]+Z$/

export default function DevNoiseCleanup() {
  useEffect(() => {
    const strip = () => {
      document.querySelectorAll('body *').forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return
        const el = node as HTMLElement
        if (el.children.length > 0) return
        const text = el.textContent?.trim() ?? ''
        if (!DEV_TS.test(text)) return
        el.remove()
      })
    }
    strip()
    const mo = new MutationObserver(strip)
    mo.observe(document.body, { childList: true, subtree: true })
    const id = window.setInterval(strip, 1500)
    return () => {
      mo.disconnect()
      window.clearInterval(id)
    }
  }, [])
  return null
}
