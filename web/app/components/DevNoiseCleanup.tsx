'use client'

import { useEffect, useRef } from 'react'
import {
  CHUNK_RELOAD_KEY,
  isChunkLoadError,
  tryRecoverFromChunkLoadError,
} from '@/lib/dynamicImportWithRetry'

/** Знімає сторонні dev-мітки (часто з розширень), що дають hydration mismatch */
const DEV_TS = /^dev-\d{4}-\d{2}-\d{2}T[\d:.]+Z$/

function isCorruptNextChunkError(message: string, source?: string | null): boolean {
  if (!/Unexpected EOF/i.test(message)) return false
  const src = source ?? ''
  return src.includes('/_next/static/') || /layout\.js|page\.js/i.test(src)
}

function messageFromUnknown(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

export default function DevNoiseCleanup() {
  const loggedChunkRepairRef = useRef(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const handleChunkFailure = (error: unknown, source?: string | null) => {
      const message = messageFromUnknown(error)
      if (
        !isChunkLoadError(error) &&
        !isChunkLoadError(message) &&
        !isCorruptNextChunkError(message, source)
      ) {
        return
      }
      if (loggedChunkRepairRef.current) return
      loggedChunkRepairRef.current = true

      if (tryRecoverFromChunkLoadError('ChunkLoadError / пошкоджений чанк Next')) return

      console.warn(
        '[watta] ChunkLoadError (часто після hot reload або очищення .next). ' +
          'Зупиніть dev → `npm run fix:next` з кореня репо → знову `npm run local:all` → жорстке оновлення ⌘⇧R.',
      )
    }

    const onError = (event: ErrorEvent) => {
      handleChunkFailure(event.error ?? event.message, event.filename)
    }

    const onRejection = (event: PromiseRejectionEvent) => {
      handleChunkFailure(event.reason)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

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
