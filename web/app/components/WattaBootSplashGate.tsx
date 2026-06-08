'use client'

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import WattaLoadScreen from './WattaLoadScreen'
import { WATTA_BOOT_SPLASH_ENDED_EVENT, WATTA_HERO_VIDEO_READY_EVENT } from '@/lib/wattaHeroVideo'
import { kickWelcomeHeroVideoPlayBurst } from '@/lib/kickWelcomeHeroVideo'
import { bootSplashLoadingLabel } from '@/lib/wattaBootSplashLabel'
import {
  clearBootSplashReloadFlag,
  shouldRunBootSplashOnHome,
} from '@/lib/menuBrowseRestore'
import { warmHeroVideoCache } from '@/lib/warmHeroVideoCache'

const BOOT_SPLASH_DONE_KEY = 'watta_boot_splash_done'
/** Один React-оверлей на навігацію (Strict Mode remount). */
let reactBootSplashCommitted = false
/** Тривалість заповнення смуги (CSS) + короткий холд перед fade-out. */
export const BOOT_SPLASH_FILL_MS = 850
const BOOT_SPLASH_MIN_MS = 250
const BOOT_SPLASH_HOLD_MS = 80
const BOOT_SPLASH_FADE_MS = 200
const BOOT_SPLASH_HARD_FAILSAFE_MS = 2400
const BOOT_LOGO_WAIT_CAP_MS = 400

type WattaBootSplashGateProps = {
  children: ReactNode
  onEnded?: () => void
}

type SplashPhase = 'hidden' | 'show' | 'leaving'

function markBootSplashDone(): void {
  try {
    sessionStorage.setItem(BOOT_SPLASH_DONE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function isHomePathname(): boolean {
  const p = typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  return p === '/' || p === ''
}

function isStaticBootSplashActive(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.getAttribute('data-watta-boot-splash-pending') === '1'
}

function shouldShowBootSplashNow(): boolean {
  try {
    if (typeof window === 'undefined') return false
    // Вмикаємо сплеш лише явно (щоб не перекривав контент/кнопки у звичайному режимі).
    if (process.env.NEXT_PUBLIC_WATTA_BOOT_SPLASH !== '1') return false
    if (!isHomePathname()) return false
    if (document.documentElement.getAttribute('data-watta-skip-splash') === '1') return false
    // Лише reload (F5) на головній — не SPA-перехід і не перший navigate.
    if (shouldRunBootSplashOnHome()) return true
    // До hydration React: static splash від boot script.
    if (isStaticBootSplashActive()) return true
    return false
  } catch {
    return false
  }
}

function clearBootSplashPendingAttr(): void {
  try {
    document.documentElement.removeAttribute('data-watta-boot-splash-pending')
  } catch {
    /* ignore */
  }
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function waitBootLogo(img: HTMLImageElement | null): Promise<void> {
  if (!img || img.complete) return Promise.resolve()
  return new Promise((resolve) => {
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
    window.setTimeout(done, BOOT_LOGO_WAIT_CAP_MS)
  })
}

export default function WattaBootSplashGate({ children, onEnded }: WattaBootSplashGateProps) {
  const [phase, setPhase] = useState<SplashPhase>('hidden')
  const dismissedRef = useRef(false)
  const splashDecisionRef = useRef<'pending' | 'show' | 'skip'>('pending')
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  const [loadingLabel] = useState(() => {
    if (typeof document === 'undefined') return 'Loading'
    return bootSplashLoadingLabel(document.documentElement.lang || 'en')
  })

  const showBootSplash = phase === 'show' || phase === 'leaving'

  const signalSplashEnded = useCallback(() => {
    warmHeroVideoCache()
    kickWelcomeHeroVideoPlayBurst()
    window.dispatchEvent(new CustomEvent(WATTA_BOOT_SPLASH_ENDED_EVENT))
    onEndedRef.current?.()
  }, [])

  const finishDismiss = useCallback(() => {
    markBootSplashDone()
    clearBootSplashReloadFlag()
    setPhase('hidden')
    clearBootSplashPendingAttr()
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-watta-boot-splash')
      document.body.style.overflow = ''
    }
    signalSplashEnded()
  }, [signalSplashEnded])

  const dismissSplash = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    setPhase('leaving')
    window.setTimeout(finishDismiss, BOOT_SPLASH_FADE_MS)
  }, [finishDismiss])

  useLayoutEffect(() => {
    if (!shouldShowBootSplashNow()) {
      splashDecisionRef.current = 'skip'
      dismissedRef.current = true
      setPhase('hidden')
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-watta-skip-splash', '1')
        document.documentElement.removeAttribute('data-watta-boot-splash')
        document.documentElement.removeAttribute('data-watta-boot-splash-pending')
        document.body.style.overflow = ''
        warmHeroVideoCache()
        signalSplashEnded()
      }
      return
    }
    if (reactBootSplashCommitted) {
      splashDecisionRef.current = 'skip'
      dismissedRef.current = true
      setPhase('hidden')
      return
    }
    reactBootSplashCommitted = true
    splashDecisionRef.current = 'show'
    dismissedRef.current = false
    clearBootSplashReloadFlag()
    setPhase('show')
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-watta-skip-splash')
      document.documentElement.setAttribute('data-watta-boot-splash', '1')
      document.documentElement.style.setProperty(
        '--watta-boot-splash-fill-ms',
        `${BOOT_SPLASH_FILL_MS}ms`,
      )
      warmHeroVideoCache()
    }
  }, [])

  /** React-оверлей накриває static — знімаємо pending лише після paint (без стрибка). */
  useLayoutEffect(() => {
    if (phase !== 'show') return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => clearBootSplashPendingAttr())
    })
    return () => cancelAnimationFrame(id)
  }, [phase])

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (showBootSplash) {
      root.setAttribute('data-watta-boot-splash', '1')
    } else {
      root.removeAttribute('data-watta-boot-splash')
    }
    return () => {
      if (!dismissedRef.current) root.removeAttribute('data-watta-boot-splash')
    }
  }, [showBootSplash])

  /** Під сплешем <video> уже в DOM — прогріваємо autoplay до зняття оверлею. */
  useLayoutEffect(() => {
    if (phase !== 'show') return
    kickWelcomeHeroVideoPlayBurst()
  }, [phase])

  useEffect(() => {
    if (phase !== 'show') return

    let cancelled = false
    const startedAt = performance.now()
    let heroReady = false

    const tryDismissEarly = () => {
      if (cancelled || dismissedRef.current) return
      heroReady = true
      if (performance.now() - startedAt >= BOOT_SPLASH_MIN_MS) dismissSplash()
    }

    const hardId = window.setTimeout(() => {
      if (!cancelled) dismissSplash()
    }, BOOT_SPLASH_HARD_FAILSAFE_MS)

    window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, tryDismissEarly)

    const run = async () => {
      const img = document.querySelector(
        '.watta-boot-splash-viewport--react .watta-load-screen-logo',
      ) as HTMLImageElement | null
      await Promise.all([waitMs(BOOT_SPLASH_FILL_MS), waitBootLogo(img)])
      if (cancelled || dismissedRef.current) return

      if (!heroReady) {
        await Promise.race([
          new Promise<void>((resolve) => {
            const onReady = () => {
              window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, onReady)
              resolve()
            }
            window.addEventListener(WATTA_HERO_VIDEO_READY_EVENT, onReady)
          }),
          waitMs(900),
        ])
      }

      if (cancelled || dismissedRef.current) return
      await waitMs(BOOT_SPLASH_HOLD_MS)
      if (!cancelled && !dismissedRef.current) dismissSplash()
    }

    void run()

    return () => {
      cancelled = true
      window.removeEventListener(WATTA_HERO_VIDEO_READY_EVENT, tryDismissEarly)
      window.clearTimeout(hardId)
    }
  }, [phase, dismissSplash])

  useLayoutEffect(() => {
    if (!showBootSplash) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showBootSplash])

  /** SPA / navigate на головну — без сплешу, одразу hero. */
  useEffect(() => {
    if (showBootSplash || splashDecisionRef.current === 'pending') return
    if (splashDecisionRef.current !== 'skip') return

    const id = requestAnimationFrame(() => {
      signalSplashEnded()
    })
    return () => cancelAnimationFrame(id)
  }, [showBootSplash, signalSplashEnded])

  return (
    <>
      <div
        className={showBootSplash ? 'watta-boot-splash-page-hidden' : undefined}
        aria-hidden={showBootSplash || undefined}
      >
        {children}
      </div>
      {showBootSplash ? (
        <div
          className={`watta-boot-splash-viewport watta-boot-splash-viewport--react watta-boot-splash-overlay${
            phase === 'leaving' ? ' watta-boot-splash-viewport--leaving' : ''
          }`}
          suppressHydrationWarning
          role="presentation"
          aria-hidden
        >
          <WattaLoadScreen
            className="watta-load-screen-root--boot-splash"
            cssProgress
            progress={100}
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
      ) : null}
    </>
  )
}
