'use client'

import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT } from '@/lib/wattaHeroVideo'

const MIN_BOOT_SPLASH_MS = 1650
/** Якщо прогрес застряг — не залишаємо користувача на білому екрані */
const BOOT_SPLASH_FAILSAFE_MS = 12_000

type WattaBootSplashGateProps = {
  children: ReactNode
  /** Після зняття сплешу (hero autoplay тощо) */
  onEnded?: () => void
}

/**
 * Початковий сплеш при повному завантаженні / reload: логотип + зелена смуга прогресу.
 */
export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const { t } = useLanguage()
  const clientReadyRef = useRef(false)
  const [bootProgress, setBootProgress] = useState(0)
  const [showBootSplash, setShowBootSplash] = useState(true)
  const bootStartedAtRef = useRef<number | null>(null)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  useLayoutEffect(() => {
    bootStartedAtRef.current = Date.now()
    clientReadyRef.current = true
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
    const id = window.setInterval(() => {
      setBootProgress((prev) => {
        if (prev >= 100) return 100

        const ready = clientReadyRef.current
        const cap = ready ? 100 : 78
        const step = ready ? 5.5 : 0.55
        let next = prev + step
        if (!ready) next = Math.min(cap, next)
        else next = Math.min(100, next)

        if (next >= 100) {
          clearInterval(id)
          const started = bootStartedAtRef.current ?? Date.now()
          const minUntil = started + MIN_BOOT_SPLASH_MS
          const extra = Math.max(520, minUntil - Date.now() + 480)
          window.setTimeout(() => setShowBootSplash(false), extra)
          return 100
        }
        return next
      })
    }, 36)
    return () => clearInterval(id)
  }, [showBootSplash])

  useEffect(() => {
    if (!showBootSplash) return
    const fail = window.setTimeout(() => {
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
