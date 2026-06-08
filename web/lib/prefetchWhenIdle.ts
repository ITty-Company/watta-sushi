/** Префетч пакетами у вільний час — не блокує відкриття drawer / перший клік. */
export function runWhenIdle(task: () => void, timeoutMs = 1800): () => void {
  if (typeof window === 'undefined') return () => {}
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (typeof w.requestIdleCallback === 'function') {
    const id = w.requestIdleCallback(() => task(), { timeout: timeoutMs })
    return () => w.cancelIdleCallback?.(id)
  }
  const t = window.setTimeout(task, 48)
  return () => window.clearTimeout(t)
}
