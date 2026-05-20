'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import { useLanguage } from '../context/LanguageContext'
import {
  WATTA_BOOT_SPLASH_ENDED_EVENT,
  WATTA_HERO_VIDEO_READY_EVENT,
  WATTA_HOME_HERO_POSTER,
  WATTA_HERO_OCEAN_GRADIENT,
} from '@/lib/wattaHeroVideo'
import { kickWelcomeHeroVideoPlayBurst, primeHeroVideoElement } from '@/lib/kickWelcomeHeroVideo'

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
}: WelcomeHeroSectionProps) {
  const heroVideoLoop = playlistLength <= 1
  const heroReadySentRef = useRef(false)
  const [heroFrameReady, setHeroFrameReady] = useState(false)
  const { t } = useLanguage()
  const label = ariaLabel ?? t.siteAria.heroVideo

  const notifyHeroVideoReady = useCallback(() => {
    if (heroReadySentRef.current) return
    heroReadySentRef.current = true
    setHeroFrameReady(true)
    window.dispatchEvent(new CustomEvent(WATTA_HERO_VIDEO_READY_EVENT))
  }, [])

  useEffect(() => {
    heroReadySentRef.current = false
    setHeroFrameReady(false)
  }, [heroVideoSrc])

  const attachHeroVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      heroVideoRef.current = el
      if (!el) return
      primeHeroVideoElement(el)
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        queueMicrotask(notifyHeroVideoReady)
      }
    },
    [heroVideoRef, notifyHeroVideoReady],
  )

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
    if (heroVideoFailed || heroFrameReady) return
    const timeoutId = window.setTimeout(() => {
      const v = heroVideoRef.current
      if (v && v.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return
      advanceHeroVideoSource()
    }, 4500)
    return () => window.clearTimeout(timeoutId)
  }, [heroVideoSrc, heroVideoFailed, heroFrameReady, heroVideoRef, advanceHeroVideoSource])

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
              className="welcome-video-native-web welcome-hero-fallback-image-web"
              role="img"
              aria-hidden
              style={{ backgroundImage: `url('${WATTA_HOME_HERO_POSTER}')` }}
            />
            {children}
          </div>
        ) : (
          <div
            className={`welcome-hero-video-stack-web${heroFrameReady ? ' watta-hero-video--ready' : ''}`}
            style={{
              backgroundColor: WATTA_HERO_OCEAN_GRADIENT,
              ...(heroFrameReady
                ? {}
                : {
                    backgroundImage: `url('${WATTA_HOME_HERO_POSTER}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                  }),
            }}
          >
            <video
              key={heroVideoSrc}
              ref={attachHeroVideoRef}
              className="welcome-video-native-web watta-home-hero-native-video"
              width={1920}
              height={1080}
              src={heroVideoSrc}
              poster={heroFrameReady ? undefined : WATTA_HOME_HERO_POSTER}
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
              onLoadedData={notifyHeroVideoReady}
              onPlaying={(e) => {
                e.currentTarget.setAttribute('data-watta-playing', '1')
                notifyHeroVideoReady()
              }}
              onCanPlay={() => {
                const v = heroVideoRef.current
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
