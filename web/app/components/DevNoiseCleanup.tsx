'use client'

import { useEffect } from 'react'

/** Знімає сторонні dev-мітки (часто з розширень), що дають hydration mismatch */
const DEV_TS = /^dev-\d{4}-\d{2}-\d{2}T[\d:.]+Z$/

export default function DevNoiseCleanup() {
  useEffect(() => {
    /** Перевіряти лише вузли в одному MutationRecord, а не обходити все DOM-дерево — десятки мс на heavy сторінках. */
    const checkNode = (el: Element) => {
      if (el.children.length > 0) return
      const text = el.textContent?.trim() ?? ''
      if (!DEV_TS.test(text)) return
      el.remove()
    }

    document.querySelectorAll('body *').forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) checkNode(node as Element)
    })

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) checkNode(n as Element)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  return null
}
