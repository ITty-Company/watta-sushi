'use client'

import { useSyncExternalStore } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'

function subscribeMdUp(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(min-width: 768px)')
  const handler = () => onStoreChange()
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

function getMdUp() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(min-width: 768px)').matches
}

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

type WattaBrandWordmarkProps = {
  className?: string
  /** Не монтувати (drawer закритий тощо). */
  active?: boolean
  /** На телефоні wordmark у шапці прихований CSS — не тягнемо /1.jpg. */
  mdUpOnly?: boolean
  /** На головній — після boot splash, коли шапка реально видима. */
  deferUntilSplashEnd?: boolean
}

/** Текстовий логотип `/1.jpg` — лише коли його видно; інакше Safari скаржиться на «preload not used». */
export default function WattaBrandWordmark({
  className = 'logo-text-image-web',
  active = true,
  mdUpOnly = true,
  deferUntilSplashEnd = true,
}: WattaBrandWordmarkProps) {
  const { t } = useLanguage()
  const mdUp = useSyncExternalStore(subscribeMdUp, getMdUp, () => false)
  const splashDone = useSyncExternalStore(subscribeBootSplashDone, getBootSplashDone, () => true)

  if (!active) return null
  if (mdUpOnly && !mdUp) return null
  if (deferUntilSplashEnd && !splashDone) return null

  return (
    <img
      src="/1.jpg"
      alt={t.common.brandName}
      className={className}
      decoding="async"
    />
  )
}
