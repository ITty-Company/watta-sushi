'use client'

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Короткий сплеш: зелена смуга + смужки видно, але без довгого очікування */
const MIN_BOOT_SPLASH_MS = 720
const PROGRESS_TICK_MS = 20
const PROGRESS_STEP = 6
const BOOT_SPLASH_FAILSAFE_MS = 6_000

type WattaBootSplashGateProps = {
  children: ReactNode
  /** Після зняття сплешу (hero autoplay тощо) */
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
 * Початковий сплеш при повному завантаженні / reload: логотип + зелена смуга прогресу.
 */
export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(true)
  const bootStartedAtRef = useRef<number | null>(null)
  const dismissScheduledRef = useRef(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  useLayoutEffect(() => {
    bootStartedAtRef.current = Date.now()
    if (shouldSkipBootSplash()) {
      setShowBootSplash(false)
    }
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

  useEffect(() => {
    if (!showBootSplash) return

    const scheduleDismiss = () => {
      if (dismissScheduledRef.current) return
      dismissScheduledRef.current = true
      const started = bootStartedAtRef.current ?? Date.now()
      const wait = Math.max(0, started + MIN_BOOT_SPLASH_MS - Date.now())
      window.setTimeout(() => {
        markBootSplashDone()
        setShowBootSplash(false)
      }, wait)
    }

    const id = window.setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) return 100
        const next = Math.min(100, prev + PROGRESS_STEP)
        if (next >= 100) {
          clearInterval(id)
          scheduleDismiss()
        }
        return next
      })
    }, PROGRESS_TICK_MS)

    return () => clearInterval(id)
  }, [showBootSplash])

  useEffect(() => {
    if (!showBootSplash) return
    const fail = window.setTimeout(() => {
      markBootSplashDone()
      setShowBootSplash(false)
      setBootProgress(100)
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
