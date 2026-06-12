import { useSyncExternalStore } from 'react'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'

function isHomePathname() {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname || '/'
  return p === '/' || p === ''
}

function isBootSplashVisible() {
  if (typeof document === 'undefined') return false
  if (!isHomePathname()) return false
  const root = document.documentElement
  if (root.getAttribute('data-watta-boot-splash-pending') === '1') return true
  if (root.getAttribute('data-watta-boot-splash') !== '1') return false
  return Boolean(document.querySelector('.watta-boot-splash-viewport--react'))
}

function subscribeBootSplashDone(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = () => onStoreChange()
  window.addEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, handler)
  const observer = new MutationObserver(handler)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-watta-boot-splash', 'data-watta-boot-splash-pending'],
  })
  return () => {
    window.removeEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, handler)
    observer.disconnect()
  }
}

function getBootSplashDone() {
  return !isBootSplashVisible()
}

/**
 * @param serverSplashDone SSR-значення. true — звичайний defer (wordmark тощо).
 * false — лише для hero-ролів: не рендерити на SSR, щоб React не емітив `<link rel="preload">`.
 */
export function useBootSplashDone(serverSplashDone = true) {
  return useSyncExternalStore(subscribeBootSplashDone, getBootSplashDone, () => serverSplashDone)
}
