'use client'

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'
import { kickWelcomeHeroVideoPlayBurst } from '@/lib/kickWelcomeHeroVideo'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Тривалість заповнення зеленої смуги (синхронно з CSS animation) */
export const BOOT_SPLASH_FILL_MS = 900
const BOOT_SPLASH_FAILSAFE_MS = 4_000

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
 * Сплеш: смуга 0→100%, потім одразу сайт. Закриття через setTimeout (Safari інколи
 * не дає animationend на width) + запасний failsafe.
 */
export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(() => {
    if (typeof window === 'undefined') return true
    return !shouldSkipBootSplash()
  })
  const dismissedRef = useRef(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  const dismissSplash = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    markBootSplashDone()
    setBootProgress(100)
    setShowBootSplash(false)
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

  /** Прогрес для a11y + гарантоване закриття після заповнення смуги */
  useLayoutEffect(() => {
    if (!showBootSplash) return

    dismissedRef.current = false
    setBootProgress(0)

    const started = Date.now()
    const progressId = window.setInterval(() => {
      const elapsed = Date.now() - started
      setBootProgress(Math.min(100, (elapsed / BOOT_SPLASH_FILL_MS) * 100))
    }, 40)

    const doneId = window.setTimeout(dismissSplash, BOOT_SPLASH_FILL_MS)

    return () => {
      clearInterval(progressId)
      clearTimeout(doneId)
    }
  }, [showBootSplash, dismissSplash])

  useEffect(() => {
    if (!showBootSplash) return
    const failId = window.setTimeout(dismissSplash, BOOT_SPLASH_FAILSAFE_MS)
    return () => clearTimeout(failId)
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

  const loadingLabel = t?.siteAria?.loading ?? 'Загрузка'

  return (
    <>
      {children}
      {showBootSplash ? (
        <div
          className="watta-boot-splash-overlay fixed inset-0 z-[10050] flex w-full flex-col bg-white"
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
                    {loadingLabel}
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
