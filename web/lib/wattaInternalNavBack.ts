/** Показ compact «Назад» лише після SPA-переходу між сторінками (не при першому заході / F5). */

const INTERNAL_BACK_EVENT = 'wattaInternalNavBackChange'

let internalBackAvailable = false

function notifyInternalNavBackChange(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(INTERNAL_BACK_EVENT))
}

export function resetInternalNavBack(): void {
  internalBackAvailable = false
  notifyInternalNavBackChange()
}

export function markInternalNavBackAvailable(): void {
  if (internalBackAvailable) return
  internalBackAvailable = true
  notifyInternalNavBackChange()
}

export function readInternalNavBackAvailable(): boolean {
  return internalBackAvailable
}

export function subscribeInternalNavBack(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(INTERNAL_BACK_EVENT, onStoreChange)
  return () => window.removeEventListener(INTERNAL_BACK_EVENT, onStoreChange)
}
