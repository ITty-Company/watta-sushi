'use client'

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT, WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Мінімум часу сплешу — за цей час зелена смуга встигає заповнитись */
const MIN_BOOT_SPLASH_MS = 900
const MAX_BOOT_SPLASH_WAIT_MS = 3500
const BOOT_SPLASH_FAILSAFE_MS = 6_000

const WELCOME_HERO_VIDEO_SELECTOR =
  'section.welcome-hero-section-web.menu-snap-section-welcome-web:not(.delivery-page-hero-embed-web) video.watta-home-hero-native-video'

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

function isHeroVideoBuffered(): boolean {
  if (typeof document === 'undefined') return false
  const v = document.querySelector<HTMLVideoElement>(WELCOME_HERO_VIDEO_SELECTOR)
  return Boolean(v && v.readyState >= 2 && !v.error)
}

/**
 * Сплеш: логотип + зелена смуга (CSS-анімація заповнення). Знімається після MIN_BOOT_SPLASH_MS
 * і коли hero-відео має перший кадр (або за таймаутом).
 */
export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(() => {
    if (typeof window === 'undefined') return true
    return !shouldSkipBootSplash()
  })
  const bootStartedAtRef = useRef<number | null>(null)
  const dismissScheduledRef = useRef(false)
  const heroReadyRef = useRef(false)
  const progressCompleteRef = useRef(false)
  const showBootSplashRef = useRef(showBootSplash)
  const onEndedRef = useRef(onEnded)
  showBootSplashRef.current = showBootSplash
  onEndedRef.current = onEnded

  const tryDismissSplash = useCallback(() => {
    if (!showBootSplashRef.current || dismissScheduledRef.current) return
    if (!progressCompleteRef.current) return
    const started = bootStartedAtRef.current ?? Date.now()
    const elapsed = Date.now() - started
    if (elapsed < MIN_BOOT_SPLASH_MS) return
    if (!heroReadyRef.current && elapsed < MAX_BOOT_SPLASH_WAIT_MS) return

    dismissScheduledRef.current = true
    const wait = Math.max(0, started + MIN_BOOT_SPLASH_MS - Date.now())
    window.setTimeout(() => {
      markBootSplashDone()
      setShowBootSplash(false)
      setBootProgress(100)
    }, wait)
  }, [])

  useLayoutEffect(() => {
    if (!showBootSplash) return
    bootStartedAtRef.current = Date.now()
    if (isHeroVideoBuffered()) {
      heroReadyRef.current = true
    }
  }, [showBootSplash])

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

  /** Плавне заповнення 0→100% за MIN_BOOT_SPLASH_MS (rAF, без стрибків setInterval) */
  useEffect(() => {
    if (!showBootSplash) return

    progressCompleteRef.current = false
    setBootProgress(0)
    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const pct = Math.min(100, (elapsed / MIN_BOOT_SPLASH_MS) * 100)
      setBootProgress(pct)
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
        return
      }
      progressCompleteRef.current = true
      tryDismissSplash()
    }

    raf = requestAnimationFrame(tick)

    const onHeroReady = () => {
      heroReadyRef.current = true
      tryDismissSplash()
    }

    window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)

    const pollId = window.setInterval(() => {
      if (heroReadyRef.current) return
      if (isHeroVideoBuffered()) {
        heroReadyRef.current = true
        tryDismissSplash()
      }
    }, 100)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(pollId)
      window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onHeroReady)
    }
  }, [showBootSplash, tryDismissSplash])

  useEffect(() => {
    if (!showBootSplash) return
    const fail = window.setTimeout(() => {
      heroReadyRef.current = true
      progressCompleteRef.current = true
      setBootProgress(100)
      markBootSplashDone()
      setShowBootSplash(false)
    }, BOOT_SPLASH_FAILSAFE_MS)
    return () => clearTimeout(fail)
  }, [showBootSplash])

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
