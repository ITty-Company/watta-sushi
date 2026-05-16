'use client'

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'
import { kickWelcomeHeroVideoPlayBurst, kickWelcomeHeroVideoPlayOnce } from '@/lib/kickWelcomeHeroVideo'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Тривалість заповнення зеленої смуги — після 100% одразу показуємо сайт */
export const BOOT_SPLASH_FILL_MS = 900
const BOOT_SPLASH_FAILSAFE_MS = 5_000

type WattaBootSplashGateProps = {
  children: ReactNode
  onEnded?: () => void
}

function markBootSplashDone(): void {
  try {
    sessionStorage.setItem(BOOT_SPLASH_DONE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function shouldSkipBootSplash(): boolean {
  try {
    return sessionStorage.getItem(BOOT_SPLASH_DONE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Сплеш: зелена смуга 0→100%, потім одразу сайт (відео вже крутиться під сплешем).
 * Повторний візит у вкладці — без сплешу (sessionStorage).
 */
export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(() => {
    if (typeof window === 'undefined') return true
    return !shouldSkipBootSplash()
  })
  const dismissScheduledRef = useRef(false)
  const showBootSplashRef = useRef(showBootSplash)
  const onEndedRef = useRef(onEnded)
  showBootSplashRef.current = showBootSplash
  onEndedRef.current = onEnded

  const dismissSplash = useCallback(() => {
    if (!showBootSplashRef.current || dismissScheduledRef.current) return
    dismissScheduledRef.current = true
    setBootProgress(100)
    markBootSplashDone()
    kickWelcomeHeroVideoPlayOnce()
    requestAnimationFrame(() => {
      kickWelcomeHeroVideoPlayOnce()
      setShowBootSplash(false)
    })
  }, [])

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (showBootSplash) {
      root.setAttribute('data-watta-boot-splash', '1')
    } else {
      root.removeAttribute('data-watta-boot-splash')
    }
    return () => {
      root.removeAttribute('data-watta-boot-splash')
    }
  }, [showBootSplash])

  /** Прогрес для a11y; вхід на сайт — коли смуга 100% (animationend або rAF) */
  useEffect(() => {
    if (!showBootSplash) return

    dismissScheduledRef.current = false
    setBootProgress(0)
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const pct = Math.min(100, (elapsed / BOOT_SPLASH_FILL_MS) * 100)
      setBootProgress(pct)
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
        return
      }
      dismissSplash()
    }

    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [showBootSplash, dismissSplash])

  useEffect(() => {
    if (!showBootSplash) return
    const fail = window.setTimeout(dismissSplash, BOOT_SPLASH_FAILSAFE_MS)
    return () => clearTimeout(fail)
  }, [showBootSplash, dismissSplash])

  useLayoutEffect(() => {
    if (!showBootSplash) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showBootSplash])

  useEffect(() => {
    if (showBootSplash) return
    kickWelcomeHeroVideoPlayBurst()
    window.dispatchEvent(new CustomEvent(WATTA_BOOT_SPLASH_ENDED_EVENT))
    onEndedRef.current?.()
  }, [showBootSplash])

  return (
    <>
      {children}
      {showBootSplash ? (
        <div
          className="fixed inset-0 z-[10050] flex w-full flex-col bg-white"
          suppressHydrationWarning
          aria-hidden
        >
          <div className="app-web flex min-h-[100dvh] flex-1 watta-page-bg">
            <div className="content-web content-web--watta-craft min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden">
              <WattaLoadScreen
                className="min-h-[100dvh]"
                progress={bootProgress}
                bootAnimate
                onBootFillComplete={dismissSplash}
                label={
                  <>
                    {t.siteAria.loading}
                    <span className="watta-dot">.</span>
                    <span className="watta-dot">.</span>
                    <span className="watta-dot">.</span>
                  </>
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
