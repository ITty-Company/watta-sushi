'use client'

import type { Ref } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { primeHeroVideoElement } from '@/lib/kickWelcomeHeroVideo'
import {
  WATTA_DELIVERY_HERO_POSTER,
  WATTA_HERO_OCEAN_GRADIENT,
} from '@/lib/wattaDeliveryHeroVideo'

type DeliveryWelcomeHeroSectionProps = {
  sectionRef?: Ref<HTMLElement>
  embedInMenu?: boolean
  /** У двоколонковому hero /delivery (планшет): contain-відео в split-панелі */
  splitPanel?: boolean
  heroVideoFailed: boolean
  setHeroVideoSourceIndex: React.Dispatch<React.SetStateAction<number>>
  setHeroVideoFailed: React.Dispatch<React.SetStateAction<boolean>>
  heroVideoRef: React.MutableRefObject<HTMLVideoElement | null>
  heroVideoSrc: string
  videoSources: readonly string[]
  playlistLength: number
  children?: React.ReactNode
}

export default function DeliveryWelcomeHeroSection({
  sectionRef,
  embedInMenu = false,
  splitPanel = false,
  heroVideoFailed,
  setHeroVideoSourceIndex,
  setHeroVideoFailed,
  heroVideoRef,
  heroVideoSrc,
  videoSources,
  playlistLength,
  children,
}: DeliveryWelcomeHeroSectionProps) {
  const { t } = useLanguage()
  const heroVideoLoop = playlistLength <= 1
  const [heroFrameReady, setHeroFrameReady] = useState(false)

  useEffect(() => {
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
    const video = heroVideoRef.current
    if (!video || heroVideoFailed) return
    const offAutoplay = bindHeroVideoAutoplay(video, {
      extendedRetries: true,
    })
    return offAutoplay
  }, [heroVideoSrc, heroVideoFailed, heroVideoRef])

  useEffect(() => {
    const video = heroVideoRef.current
    if (video) primeHeroVideoElement(video)
  }, [heroVideoSrc, heroVideoRef])

  return (
    <section
      ref={sectionRef}
      className={`watta-home-hero-as-card-web welcome-hero-section-web menu-snap-section-welcome-web menu-welcome-hero-tight-web shrink-0${
        embedInMenu ? ' delivery-page-hero-embed-web' : ' delivery-page-hero-standalone-web'
      }${splitPanel ? ' delivery-page-hero-split-panel-web' : ''}`}
      aria-label={t.siteAria.heroVideo}
    >
      <div className="welcome-hero-video-fill-web">
        {heroVideoFailed ? (
          <div className="welcome-hero-video-fail-wrap-web relative w-full shrink-0">
            <div
              className="welcome-video-native-web welcome-hero-fallback-image-web"
              role="img"
              aria-hidden
              style={{ backgroundImage: `url('${WATTA_DELIVERY_HERO_POSTER}')` }}
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
                    backgroundImage: `url('${WATTA_DELIVERY_HERO_POSTER}')`,
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
              poster={heroFrameReady ? undefined : WATTA_DELIVERY_HERO_POSTER}
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
              onLoadedData={() => setHeroFrameReady(true)}
              onPlaying={() => setHeroFrameReady(true)}
              onCanPlay={() => {
                const v = heroVideoRef.current
                if (v) primeHeroVideoElement(v)
                setHeroFrameReady(true)
              }}
              onError={() => {
                setHeroVideoSourceIndex((prev) => {
                  if (prev < videoSources.length - 1) return prev + 1
                  setHeroVideoFailed(true)
                  return prev
                })
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