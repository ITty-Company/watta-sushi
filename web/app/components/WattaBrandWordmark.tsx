'use client'

import { useSyncExternalStore } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useBootSplashDone } from '@/hooks/useBootSplashDone'

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
  const splashDone = useBootSplashDone()

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
