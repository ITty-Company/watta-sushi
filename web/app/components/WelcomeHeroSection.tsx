'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  WATTA_BOOT_SPLASH_ENDED_EVENT,
  WATTA_HERO_VIDEO_READY_EVENT,
  WATTA_HOME_HERO_POSTER,
  WATTA_HERO_OCEAN_GRADIENT,
  appendHeroVideoStartSec,
} from '@/lib/wattaHeroVideo'
import {
  installWebKitHeroAutoplayDocUnlock,
  kickWelcomeHeroVideoPlayBurst,
  primeHeroVideoElement,
} from '@/lib/kickWelcomeHeroVideo'

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
  const heroReadySentRef = useRef(false)
  const [heroFrameReady, setHeroFrameReady] = useState(false)
  const [isClientMounted, setIsClientMounted] = useState(false)
  const { t } = useLanguage()
  const label = ariaLabel ?? t.siteAria.heroVideo

  useLayoutEffect(() => {
    setIsClientMounted(true)
  }, [])

  useEffect(() => {
    installWebKitHeroAutoplayDocUnlock()
    kickWelcomeHeroVideoPlayBurst()
  }, [])

  const notifyHeroVideoReady = useCallback(() => {
    if (!isClientMounted || heroReadySentRef.current) return
    heroReadySentRef.current = true
    setHeroFrameReady(true)
    window.dispatchEvent(new CustomEvent(WATTA_HERO_VIDEO_READY_EVENT))
  }, [isClientMounted])

  useEffect(() => {
    heroReadySentRef.current = false
    setHeroFrameReady(false)
  }, [heroVideoSrc])

  const attachHeroVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      heroVideoRef.current = el
      if (el) primeHeroVideoElement(el)
    },
    [heroVideoRef],
  )

  useEffect(() => {
    if (!isClientMounted) return
    const video = heroVideoRef.current
    if (!video || heroVideoFailed) return
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      notifyHeroVideoReady()
    }
  }, [heroVideoSrc, heroVideoFailed, heroVideoRef, notifyHeroVideoReady, isClientMounted])

  useEffect(() => {
    const onBootSplashEnded = () => {
      const video = heroVideoRef.current
      if (video) primeHeroVideoElement(video)
      kickWelcomeHeroVideoPlayBurst()
    }
    window.addEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, onBootSplashEnded)
    return () => window.removeEventListener(WATTA_BOOT_SPLASH_ENDED_EVENT, onBootSplashEnded)
  }, [heroVideoRef])

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) return
    primeHeroVideoElement(video)
  }, [heroVideoSrc, heroVideoRef])

  const advanceHeroVideoSource = useCallback(() => {
    setHeroVideoSourceIndex((prev) => {
      if (prev < videoSources.length - 1) return prev + 1
      setHeroVideoFailed(true)
      return prev
    })
  }, [setHeroVideoSourceIndex, setHeroVideoFailed, videoSources.length])

  useEffect(() => {
    if (heroVideoFailed || !isClientMounted) return
    const readyFallbackId = window.setTimeout(() => {
      if (!heroReadySentRef.current) notifyHeroVideoReady()
    }, 1200)
    return () => window.clearTimeout(readyFallbackId)
  }, [heroVideoSrc, heroVideoFailed, notifyHeroVideoReady, isClientMounted])

  useEffect(() => {
    if (heroVideoFailed || heroFrameReady || !isClientMounted) return
    const timeoutId = window.setTimeout(() => {
      const v = heroVideoRef.current
      if (v && v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return
      advanceHeroVideoSource()
    }, 4500)
    return () => window.clearTimeout(timeoutId)
  }, [heroVideoSrc, heroVideoFailed, heroFrameReady, heroVideoRef, advanceHeroVideoSource, isClientMounted])

  const heroVideoSrcWithStart = appendHeroVideoStartSec(heroVideoSrc)

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
                style={{
                  backgroundImage: `url('${posterUrl}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center var(--watta-home-hero-media-pos-y, 46%)',
                  backgroundRepeat: 'no-repeat',
                }}
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
            className={`welcome-hero-video-stack-web${heroFrameReady ? ' watta-hero-video--ready' : ''}`}
            style={{ backgroundColor: WATTA_HERO_OCEAN_GRADIENT }}
          >
            <div
              className="welcome-hero-media-frame-web"
              style={{
                backgroundImage: `url('${posterUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center var(--watta-home-hero-media-pos-y, 46%)',
                backgroundRepeat: 'no-repeat',
              }}
            >
              {isClientMounted ? (
              <video
                key={heroVideoSrcWithStart}
                ref={attachHeroVideoRef}
                className="welcome-video-native-web watta-home-hero-native-video"
                width={1920}
                height={1080}
                src={heroVideoSrcWithStart}
                poster={posterUrl}
                suppressHydrationWarning
              autoPlay
              muted
              loop={heroVideoLoop}
              playsInline
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
              disablePictureInPicture
              disableRemotePlayback
              preload="auto"
              // @ts-expect-error fetchPriority для Chromium
              fetchPriority="high"
              tabIndex={-1}
              aria-hidden
              onContextMenu={(e) => e.preventDefault()}
              onProgress={() => {
                const v = heroVideoRef.current
                if (!v || v.buffered.length === 0) return
                if (!v.paused) {
                  notifyHeroVideoReady()
                  return
                }
                primeHeroVideoElement(v)
              }}
              onLoadedMetadata={() => {
                const v = heroVideoRef.current
                if (v) primeHeroVideoElement(v)
                notifyHeroVideoReady()
              }}
              onLoadedData={(e) => {
                e.currentTarget.setAttribute('data-watta-can-play', '1')
                notifyHeroVideoReady()
              }}
              onPlaying={(e) => {
                e.currentTarget.setAttribute('data-watta-playing', '1')
                notifyHeroVideoReady()
              }}
              onCanPlay={() => {
                const v = heroVideoRef.current
                v?.setAttribute('data-watta-can-play', '1')
                if (v) primeHeroVideoElement(v)
                notifyHeroVideoReady()
              }}
              onPause={() => {
                heroVideoRef.current?.removeAttribute('data-watta-playing')
                const v = heroVideoRef.current
                if (v && !v.ended) primeHeroVideoElement(v)
              }}
              onError={advanceHeroVideoSource}
              onStalled={advanceHeroVideoSource}
              onEmptied={() => {
                const v = heroVideoRef.current
                if (v?.error) advanceHeroVideoSource()
              }}
              onEnded={() => {
                if (playlistLength <= 1) return
                setHeroVideoSourceIndex((prev) => (prev + 1) % playlistLength)
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
