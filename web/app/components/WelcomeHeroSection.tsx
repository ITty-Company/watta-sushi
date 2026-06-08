'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  WATTA_BOOT_SPLASH_ENDED_EVENT,
  WATTA_HERO_VIDEO_READY_EVENT,
  WATTA_HOME_HERO_POSTER,
  WATTA_HERO_OCEAN_GRADIENT,
  isHeroVideoFrameReady,
  markHeroVideoAtStartSec,
  resolveHeroVideoPlaybackUrl,
  retireHomeHeroEntryShell,
  seekHeroVideoToStartSec,
} from '@/lib/wattaHeroVideo'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import {
  kickWelcomeHeroVideoPlayBurst,
  primeHeroVideoElement,
  resumeHeroVideoPlayback,
} from '@/lib/kickWelcomeHeroVideo'
import { resolveHeroVideoPreload } from '@/lib/heroVideoPreload'
import { bindHomeHeroVideoGuard } from '@/lib/bindHomeHeroVideoGuard'
import { isWattaHomeHeroVideoPathname } from '@/lib/wattaHtmlRouteClass'
import { usesHomeHeroSingleVideoLayer } from '@/lib/wattaTouchViewport'

function normalizeHeroVideoSrc(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  return trimmed.split('#')[0]?.split('?')[0] ?? trimmed
}

const heroPosterLayerStyle = (posterUrl: string) =>
  ({
    backgroundImage: `url('${posterUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center var(--watta-home-hero-media-pos-y, 52%)',
    backgroundRepeat: 'no-repeat',
    ['--watta-home-hero-poster-img' as string]: `url('${posterUrl}')`,
  }) as const

const heroHomeStackStyle = {
  backgroundColor: 'transparent',
  backgroundImage: 'none',
} as const

export type WelcomeHeroSectionProps = {
  sectionRef?: Ref<HTMLElement>
  heroVideoFailed: boolean
  setHeroVideoSourceIndex: React.Dispatch<React.SetStateAction<number>>
  setHeroVideoFailed: React.Dispatch<React.SetStateAction<boolean>>
  heroVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  heroVideoSrc: string
  videoSources: readonly string[]
  playlistLength: number
  children?: ReactNode
  ariaLabel?: string
  sectionClassName?: string
  /** Постер до першого кадру (на /delivery — окремий від головної). */
  posterUrl?: string
}

/** Картка з ocean hero — та сама на головній та на /menu */
export default function WelcomeHeroSection({
  sectionRef,
  heroVideoFailed,
  setHeroVideoSourceIndex,
  setHeroVideoFailed,
  heroVideoRef,
  heroVideoSrc,
  videoSources,
  playlistLength,
  children,
  ariaLabel,
  sectionClassName = '',
  posterUrl = WATTA_HOME_HERO_POSTER,
}: WelcomeHeroSectionProps) {
  const heroVideoLoop = playlistLength <= 1
  const isHomeHeroCard =
    sectionClassName.includes('watta-home-hero-as-card-web') &&
    !sectionClassName.includes('delivery-page-hero-embed-web')
  const heroReadySentRef = useRef(false)
  const hasPlayedOnceRef = useRef(false)
  const prevHeroVideoSrcRef = useRef(heroVideoSrc)
  const stalledKickRef = useRef(0)
  const advanceHeroVideoSourceRef = useRef<(() => void) | null>(null)
  const [heroFrameReady, setHeroFrameReady] = useState(false)
  /** Завжди false на SSR і першому клієнтському кадрі — клас додаємо після mount (без hydration mismatch). */
  const [heroVideoPlaying, setHeroVideoPlaying] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)
  const [allowHeroVideo, setAllowHeroVideo] = useState(true)
  const entryShellDismissedRef = useRef(false)
  const prerollRetiredRef = useRef(false)
  const { t } = useLanguage()
  const label = ariaLabel ?? t.siteAria.heroVideo

  const retirePrerollVideo = useCallback(() => {
    if (prerollRetiredRef.current) return
    prerollRetiredRef.current = true
    try {
      document.documentElement.setAttribute('data-watta-preroll-retired', '1')
      retireHomeHeroEntryShell(
        document.querySelector('.watta-home-hero-entry-shell') as HTMLElement | null,
      )
      const preroll = document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null
      if (preroll) {
        preroll.pause()
        try {
          preroll.removeAttribute('src')
          preroll.load()
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  /** Показати in-flow hero (клієнтський плеер) — preroll лишається зверху, поки не грає client video. */
  const enableClientHero = useCallback(() => {
    const p = typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
    if (!isWattaHomeHeroVideoPathname(p)) return
    try {
      document.documentElement.setAttribute('data-watta-client-hero', '1')
    } catch {
      /* ignore */
    }
  }, [])

  const dismissEntryShell = useCallback(() => {
    if (entryShellDismissedRef.current) return
    const p = typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
    if (!isWattaHomeHeroVideoPathname(p)) return

    entryShellDismissedRef.current = true
    retirePrerollVideo()
    enableClientHero()
  }, [enableClientHero, retirePrerollVideo])

  const syncClientHeroFromPreroll = useCallback(
    (video: HTMLVideoElement) => {
      const preroll = document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null
      if (preroll && preroll.currentTime > 0.04 && Number.isFinite(preroll.currentTime)) {
        try {
          video.currentTime = preroll.currentTime
        } catch {
          /* ignore */
        }
      }
      primeHeroVideoElement(video, { loop: heroVideoLoop, urgent: true })
      resumeHeroVideoPlayback(video, { loop: heroVideoLoop, urgent: true })
    },
    [heroVideoLoop],
  )

  const finalizeClientHeroHandoff = useCallback(() => {
    if (entryShellDismissedRef.current) return
    dismissEntryShell()
    setHeroVideoPlaying(true)
    setHeroFrameReady(true)
  }, [dismissEntryShell])

  /**
   * Preroll грає в тому ж слоті; показуємо in-flow hero, запускаємо клієнтський плеер,
   * знімаємо SSR-шар лише після playing (без кліку Play і без стрибка розміру).
   */
  const commitClientHeroHandoff = useCallback(() => {
    if (!isHomeHeroCard || entryShellDismissedRef.current) return
    const video = heroVideoRef.current
    if (!video || video.error) return

    if (usesHomeHeroSingleVideoLayer()) {
      seekHeroVideoToStartSec(video)
      primeHeroVideoElement(video, { loop: heroVideoLoop, urgent: true })
      resumeHeroVideoPlayback(video, { loop: heroVideoLoop, urgent: true })
      finalizeClientHeroHandoff()
      return
    }

    syncClientHeroFromPreroll(video)

    const finish = () => {
      if (video.paused || video.ended) return
      requestAnimationFrame(() => {
        requestAnimationFrame(finalizeClientHeroHandoff)
      })
    }

    if (!video.paused && !video.ended) {
      finish()
      return
    }

    video.addEventListener('playing', finish, { once: true })
  }, [finalizeClientHeroHandoff, heroVideoRef, isHomeHeroCard, syncClientHeroFromPreroll])

  const tryCommitClientHeroHandoff = useCallback(() => {
    commitClientHeroHandoff()
  }, [commitClientHeroHandoff])

  useLayoutEffect(() => {
    setIsClientMounted(true)
    if (typeof document === 'undefined') return

    if (isHomeHeroCard) {
      enableClientHero()
      if (usesHomeHeroSingleVideoLayer()) {
        try {
          document.documentElement.setAttribute('data-watta-preroll-retired', '1')
        } catch {
          /* ignore */
        }
        prerollRetiredRef.current = true
        entryShellDismissedRef.current = true
        retireHomeHeroEntryShell(
          document.querySelector('.watta-home-hero-entry-shell') as HTMLElement | null,
        )
      }
    }

    if (document.documentElement.hasAttribute('data-watta-preroll-retired')) {
      prerollRetiredRef.current = true
      entryShellDismissedRef.current = true
    } else {
      prerollRetiredRef.current = false
      entryShellDismissedRef.current = false
    }

    const preroll = document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null
    if (preroll && !preroll.paused && !preroll.ended) {
      setHeroVideoPlaying(true)
    }
    const video = heroVideoRef.current
    if (video) syncClientHeroFromPreroll(video)
  }, [enableClientHero, isHomeHeroCard, syncClientHeroFromPreroll])

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const p = window.location.pathname || '/'
    if (p !== '/' && p !== '') {
      setAllowHeroVideo(true)
      return
    }
    setAllowHeroVideo(true)
  }, [])

  useEffect(() => {
    if (heroVideoFailed) {
      document.body.classList.add('watta-home-hero-client-live')
    }
  }, [heroVideoFailed])

  useEffect(() => {
    const kickHeroAfterSplash = () => {
      setAllowHeroVideo(true)
      const run = () => {
        const video = heroVideoRef.current
        if (video) primeHeroVideoElement(video, { loop: heroVideoLoop })
        kickWelcomeHeroVideoPlayBurst()
      }
      queueMicrotask(run)
      requestAnimationFrame(run)
      window.setTimeout(run, 80)
      window.setTimeout(run, 250)
    }
    window.addEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, kickHeroAfterSplash)
    return () => window.removeEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, kickHeroAfterSplash)
  }, [heroVideoRef, heroVideoLoop])

  const notifyHeroVideoReady = useCallback(() => {
    if (!isClientMounted || heroReadySentRef.current) return
    heroReadySentRef.current = true
    setHeroFrameReady(true)
    if (typeof document !== 'undefined') {
      document.body.classList.add('watta-home-hero-client-live')
    }
    window.dispatchEvent(new CustomEvent(WATTA_HERO_VIDEO_READY_EVENT))
  }, [isClientMounted])

  /** Постер знімаємо на `playing`; preroll знімаємо після handoff на клієнтський плеер. */
  const markHeroPlayingStable = useCallback(() => {
    setHeroVideoPlaying(true)
    setHeroFrameReady(true)
    commitClientHeroHandoff()
  }, [commitClientHeroHandoff])

  const kickHeroPlay = useCallback(
    (video: HTMLVideoElement) => {
      primeHeroVideoElement(video, { loop: heroVideoLoop, urgent: true })
      resumeHeroVideoPlayback(video, { loop: heroVideoLoop, urgent: true })
    },
    [heroVideoLoop],
  )

  const syncHeroPlayingState = useCallback(
    (video: HTMLVideoElement) => {
      if (!video.paused && video.currentTime >= 0.05 && isHeroVideoFrameReady(video)) {
        setHeroVideoPlaying(true)
        commitClientHeroHandoff()
      }
    },
    [commitClientHeroHandoff],
  )

  const revealHeroFrameIfAtStart = useCallback(
    (video: HTMLVideoElement) => {
      if (isHomeHeroCard) seekHeroVideoToStartSec(video)
      const atContent = markHeroVideoAtStartSec(video)
      if (atContent) {
        try {
          document.documentElement.setAttribute('data-watta-hero-content-ready', '1')
        } catch {
          /* ignore */
        }
      }
      syncHeroPlayingState(video)
      if (isHeroVideoFrameReady(video)) {
        notifyHeroVideoReady()
        return
      }
      if (atContent && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        notifyHeroVideoReady()
      }
    },
    [isHomeHeroCard, notifyHeroVideoReady, syncHeroPlayingState],
  )

  useEffect(() => {
    return () => {
      document.body.classList.remove('watta-home-hero-client-live')
      window.clearTimeout(stalledKickRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isHomeHeroCard || !isClientMounted || usesHomeHeroSingleVideoLayer()) return
    const preroll = document.getElementById('watta-hero-preroll-video') as HTMLVideoElement | null
    if (!preroll) return
    return bindHomeHeroVideoGuard(preroll, { loop: true })
  }, [isHomeHeroCard, isClientMounted])

  useEffect(() => {
    if (!isClientMounted || !allowHeroVideo || heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return
    return bindHeroVideoAutoplay(video, {
      extendedRetries: true,
      loop: heroVideoLoop,
      keepPlayingOffscreen: true,
    })
  }, [
    isClientMounted,
    allowHeroVideo,
    heroVideoFailed,
    heroVideoSrc,
    heroVideoLoop,
    heroVideoRef,
  ])

  useLayoutEffect(() => {
    const prev = prevHeroVideoSrcRef.current
    if (normalizeHeroVideoSrc(prev) === normalizeHeroVideoSrc(heroVideoSrc)) return
    prevHeroVideoSrcRef.current = heroVideoSrc
    heroReadySentRef.current = false
    hasPlayedOnceRef.current = false
    setHeroFrameReady(false)
    setHeroVideoPlaying(false)
    document.body.classList.remove('watta-home-hero-client-live')
  }, [heroVideoSrc])

  const attachHeroVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      heroVideoRef.current = el
      if (!el) return
      if (isHomeHeroCard) {
        bindHomeHeroVideoGuard(el, { loop: heroVideoLoop })
        primeHeroVideoElement(el, { loop: heroVideoLoop, urgent: true })
        resumeHeroVideoPlayback(el, { loop: heroVideoLoop, urgent: true })
      }
      syncClientHeroFromPreroll(el)
      tryCommitClientHeroHandoff()
    },
    [heroVideoRef, heroVideoLoop, isHomeHeroCard, syncClientHeroFromPreroll, tryCommitClientHeroHandoff],
  )

  useLayoutEffect(() => {
    if (!allowHeroVideo || heroVideoFailed) return
    const video = heroVideoRef.current
    if (!video) return

    primeHeroVideoElement(video, { loop: heroVideoLoop, urgent: true })
    const raf = requestAnimationFrame(() => {
      if (video.paused && !video.error) {
        resumeHeroVideoPlayback(video, { loop: heroVideoLoop, urgent: true })
      }
    })
    return () => cancelAnimationFrame(raf)
  }, [allowHeroVideo, heroVideoFailed, heroVideoSrc, heroVideoLoop, heroVideoRef])

  useEffect(() => {
    if (!isHomeHeroCard || !isClientMounted) return
    tryCommitClientHeroHandoff()
    const delays = usesHomeHeroSingleVideoLayer() ? [0, 48, 160] : [80, 220, 520, 1400]
    const ids = delays.map((ms) => window.setTimeout(tryCommitClientHeroHandoff, ms))
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [isHomeHeroCard, isClientMounted, tryCommitClientHeroHandoff, heroVideoSrc])

  useEffect(() => {
    if (prerollRetiredRef.current || usesHomeHeroSingleVideoLayer()) return
    const fallbackId = window.setTimeout(() => {
      if (!prerollRetiredRef.current) {
        enableClientHero()
        dismissEntryShell()
      }
    }, 4500)
    return () => window.clearTimeout(fallbackId)
  }, [dismissEntryShell, enableClientHero])

  useEffect(() => {
    if (!isClientMounted || !allowHeroVideo) return
    const video = heroVideoRef.current
    if (!video || heroVideoFailed) return
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      revealHeroFrameIfAtStart(video)
    }
  }, [heroVideoSrc, heroVideoFailed, heroVideoRef, revealHeroFrameIfAtStart, isClientMounted, allowHeroVideo])

  const advanceHeroVideoSource = useCallback(() => {
    if (playlistLength <= 0) return
    setHeroVideoSourceIndex((prev) => (prev + 1) % playlistLength)
  }, [setHeroVideoSourceIndex, playlistLength])

  advanceHeroVideoSourceRef.current = advanceHeroVideoSource

  useEffect(() => {
    if (heroVideoFailed || !isClientMounted || !allowHeroVideo) return
    const readyFallbackId = window.setTimeout(() => {
      if (heroReadySentRef.current) return
      const v = heroVideoRef.current
      if (!v || v.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
      markHeroVideoAtStartSec(v)
      notifyHeroVideoReady()
    }, 50)
    return () => window.clearTimeout(readyFallbackId)
  }, [heroVideoSrc, heroVideoFailed, notifyHeroVideoReady, isClientMounted, allowHeroVideo, heroVideoRef])

  useEffect(() => {
    if (heroVideoFailed || heroFrameReady || !isClientMounted || !allowHeroVideo) return
    const timeoutId = window.setTimeout(() => {
      const v = heroVideoRef.current
      if (!v || v.error) {
        if (v?.error) advanceHeroVideoSourceRef.current?.()
        return
      }
      if (v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return
      if (v.networkState === HTMLMediaElement.NETWORK_LOADING) return
      advanceHeroVideoSourceRef.current?.()
    }, 8000)
    return () => window.clearTimeout(timeoutId)
  }, [heroVideoSrc, heroVideoFailed, heroFrameReady, heroVideoRef, isClientMounted, allowHeroVideo])

  const handleHeroVideoStalled = useCallback(() => {
    const v = heroVideoRef.current
    if (v) resumeHeroVideoPlayback(v, { loop: heroVideoLoop })
    window.clearTimeout(stalledKickRef.current)
    stalledKickRef.current = window.setTimeout(() => {
      const el = heroVideoRef.current
      if (!el || el.error) {
        if (el?.error) advanceHeroVideoSourceRef.current?.()
        return
      }
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return
      resumeHeroVideoPlayback(el, { loop: heroVideoLoop })
    }, 400)
  }, [heroVideoRef, heroVideoLoop])

  return (
    <section
      ref={sectionRef}
      className={`watta-home-hero-as-card-web welcome-hero-section-web menu-snap-section-welcome-web menu-welcome-hero-tight-web shrink-0${sectionClassName ? ` ${sectionClassName}` : ''}`}
      aria-label={label}
    >
      <div className="welcome-hero-video-fill-web">
        {heroVideoFailed ? (
          <div className="welcome-hero-video-fail-wrap-web relative w-full shrink-0">
            <div
              className="welcome-hero-video-stack-web watta-hero-video--ready"
              style={{ backgroundColor: WATTA_HERO_OCEAN_GRADIENT }}
            >
              <div
                className="welcome-hero-media-frame-web"
                style={heroPosterLayerStyle(posterUrl)}
              >
                <div
                  className="welcome-video-native-web welcome-hero-fallback-image-web"
                  role="img"
                  aria-hidden
                  style={{ backgroundImage: `url('${posterUrl}')` }}
                />
              </div>
              {children}
            </div>
          </div>
        ) : (
          <div
            className={`welcome-hero-video-stack-web watta-home-hero-client-stack-web${heroFrameReady ? ' watta-hero-video--ready' : ''}${heroVideoPlaying ? ' watta-hero-video--playing' : ''}`}
            suppressHydrationWarning
            style={isHomeHeroCard ? heroHomeStackStyle : { backgroundColor: WATTA_HERO_OCEAN_GRADIENT, ...heroPosterLayerStyle(posterUrl) }}
          >
            <div
              className="welcome-hero-media-frame-web"
              style={isHomeHeroCard ? heroPosterLayerStyle(posterUrl) : heroPosterLayerStyle(posterUrl)}
            >
              {!isHomeHeroCard ? (
                <img
                  src={posterUrl}
                  alt=""
                  aria-hidden
                  className="welcome-hero-poster-img-web"
                  width={1920}
                  height={1080}
                  decoding="async"
                  fetchPriority="high"
                  draggable={false}
                />
              ) : null}
              {allowHeroVideo ? (
              <video
                ref={attachHeroVideoRef}
                className="welcome-video-native-web watta-home-hero-native-video"
                width={1920}
                height={1080}
                src={resolveHeroVideoPlaybackUrl(heroVideoSrc)}
                poster={isHomeHeroCard ? posterUrl : undefined}
                suppressHydrationWarning
              autoPlay
              muted
              loop={heroVideoLoop}
              playsInline
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
              disablePictureInPicture
              disableRemotePlayback
              preload={resolveHeroVideoPreload()}
              tabIndex={-1}
              aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onPointerDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onCanPlay={(e) => {
                const v = e.currentTarget
                kickHeroPlay(v)
                markHeroPlayingStable()
                revealHeroFrameIfAtStart(v)
              }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget
                if (isHomeHeroCard) seekHeroVideoToStartSec(v)
                kickHeroPlay(v)
                revealHeroFrameIfAtStart(v)
              }}
              onLoadedData={(e) => {
                const v = e.currentTarget
                kickHeroPlay(v)
                markHeroPlayingStable()
                revealHeroFrameIfAtStart(v)
              }}
              onSeeked={(e) => {
                revealHeroFrameIfAtStart(e.currentTarget)
              }}
              onPlaying={(e) => {
                markHeroPlayingStable()
                revealHeroFrameIfAtStart(e.currentTarget)
              }}
              onPlay={() => {
                hasPlayedOnceRef.current = true
                markHeroPlayingStable()
              }}
              onTimeUpdate={(e) => {
                const v = e.currentTarget
                if (!v.paused && v.currentTime > 0.05) markHeroPlayingStable()
              }}
              onError={() => {
                setHeroVideoPlaying(false)
                advanceHeroVideoSource()
              }}
              onStalled={handleHeroVideoStalled}
              onEmptied={() => {
                const v = heroVideoRef.current
                if (v?.error) advanceHeroVideoSource()
              }}
              onEnded={(e) => {
                if (playlistLength > 1) {
                  setHeroVideoSourceIndex((prev) => (prev + 1) % playlistLength)
                  return
                }
                const v = e.currentTarget
                seekHeroVideoToStartSec(v)
                resumeHeroVideoPlayback(v, { loop: heroVideoLoop })
              }}
              />
              ) : null}
            </div>
            <div
              className="welcome-hero-video-input-shield-web"
              aria-hidden
              role="presentation"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onAuxClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
            {children}
          </div>
        )}
      </div>
    </section>
  )
}
