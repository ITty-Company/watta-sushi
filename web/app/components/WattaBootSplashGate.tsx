'use client'

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT, WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'
import {
  kickWelcomeHeroVideoPlayBurst,
  kickWelcomeHeroVideoPlayOnce,
} from '@/lib/kickWelcomeHeroVideo'
import { isBrowserReloadOnHome } from '@/lib/menuBrowseRestore'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Швидке заповнення зеленої смуги — не затримуємо hero довше за decode */
export const BOOT_SPLASH_FILL_MS = 220
const BOOT_SPLASH_HOLD_FULL_MS = 40
const BOOT_SPLASH_FAILSAFE_MS = 480
const BOOT_SPLASH_MIN_MS = 0

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
    /** За замовчуванням — миттєва головна; сплеш лише якщо явно увімкнено в .env */
    if (process.env.NEXT_PUBLIC_WATTA_BOOT_SPLASH !== '1') {
      return true
    }
    if (typeof document !== 'undefined') {
      if (document.documentElement.getAttribute('data-watta-skip-splash') === '1') {
        return true
      }
    }
    if (isBrowserReloadOnHome()) return true
    return sessionStorage.getItem(BOOT_SPLASH_DONE_KEY) === '1'
  } catch {
    return true
  }
}

function shouldShowBootSplashNow(): boolean {
  return !shouldSkipBootSplash()
}

export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const [bootProgress, setBootProgress] = useState(0)
  /** SSR без білого оверлею; на клієнті вмикаємо сплеш лише для першого візиту. */
  const [showBootSplash, setShowBootSplash] = useState(false)
  const dismissedRef = useRef(false)
  const splashRunRef = useRef(0)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  useLayoutEffect(() => {
    if (!shouldShowBootSplashNow()) {
      dismissedRef.current = true
      setBootProgress(100)
      setShowBootSplash(false)
      return
    }
    dismissedRef.current = false
    setShowBootSplash(true)
  }, [])

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
    return () => root.removeAttribute('data-watta-boot-splash')
  }, [showBootSplash])

  /** Смуга 0→100%; як тільки hero ready — одразу головна (не чекаємо повної смуги). */
  useEffect(() => {
    if (!showBootSplash) return

    const gen = ++splashRunRef.current
    setBootProgress(0)

    const t0 = performance.now()
    let holdId = 0
    let failId = 0
    let videoKickId = 0
    let tickId = 0
    let finished = false

    const kickHero = () => kickWelcomeHeroVideoPlayOnce()

    const finishAfterFullBar = () => {
      if (gen !== splashRunRef.current || finished) return
      finished = true
      setBootProgress(100)
      const elapsed = performance.now() - t0
      const wait = Math.max(0, BOOT_SPLASH_MIN_MS - elapsed)
      holdId = window.setTimeout(() => {
        if (gen !== splashRunRef.current) return
        dismissSplash()
      }, wait + BOOT_SPLASH_HOLD_FULL_MS)
    }

    tickId = window.setInterval(() => {
      if (gen !== splashRunRef.current) return
      const elapsed = performance.now() - t0
      const pct = Math.min(100, (elapsed / BOOT_SPLASH_FILL_MS) * 100)
      setBootProgress(pct)

      if (pct >= 100) {
        window.clearInterval(tickId)
        finishAfterFullBar()
      }
    }, 16)

    kickHero()
    queueMicrotask(kickHero)
    videoKickId = window.setInterval(kickHero, 400)

    const onHeroReady = () => {
      kickHero()
      kickWelcomeHeroVideoPlayBurst()
      window.clearInterval(tickId)
      finishAfterFullBar()
    }
    window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)

    failId = window.setTimeout(() => {
      if (gen !== splashRunRef.current) return
      window.clearInterval(tickId)
      finishAfterFullBar()
    }, BOOT_SPLASH_FAILSAFE_MS)

    return () => {
      window.clearInterval(tickId)
      window.clearInterval(videoKickId)
      window.clearTimeout(holdId)
      window.clearTimeout(failId)
      window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    }
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
                className="min-h-[100dvh] watta-load-screen-root--boot-splash"
                progress={bootProgress}
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
