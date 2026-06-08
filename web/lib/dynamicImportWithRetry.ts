export const CHUNK_RELOAD_KEY = 'watta-chunk-reload-attempt'

export function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === 'ChunkLoadError') return true
    if (/Loading chunk [\w./-]+ failed/i.test(error.message)) return true
    if (/Failed to fetch dynamically imported module/i.test(error.message)) return true
  }
  if (typeof error === 'string') {
    return /ChunkLoadError|Loading chunk [\w./-]+ failed/i.test(error)
  }
  return false
}

/** Один reload після ChunkLoadError (HMR / очищений .next / повільна перша збірка layout.js). */
export function tryRecoverFromChunkLoadError(reason?: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
      return false
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
    if (reason) {
      console.warn(`[watta] ${reason} — автоматичне оновлення сторінки…`)
    }
    window.location.reload()
    return true
  } catch {
    return false
  }
}

/** Після HMR/очищення .next браузер інколи тримає старий hash чанка — один reload зазвичай вирішує. */
export async function dynamicImportWithRetry<T>(loader: () => Promise<T>): Promise<T> {
  try {
    const mod = await loader()
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    }
    return mod
  } catch (error) {
    if (typeof window === 'undefined' || !isChunkLoadError(error)) throw error
    if (tryRecoverFromChunkLoadError('Пошкоджений JS-чанк Next')) {
      return new Promise<T>(() => {})
    }
    throw error
  }
}
