'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Gift, Zap } from 'lucide-react'
import { bindHeroVideoAutoplay } from '@/lib/bindHeroVideoAutoplay'
import { primeHeroVideoElement } from '@/lib/kickWelcomeHeroVideo'
import {
  AUTH_HERO_FALLBACK_VIDEO,
  getPrimaryAuthHeroVideoSrc,
  WATTA_AUTH_HERO_POSTER,
} from '@/lib/wattaAuthHeroVideo'
import { getAuthHeroVideoSources } from '@/lib/authHeroVideoSources'
import { resolveUploadMediaUrl } from '@/lib/resolveUploadMediaUrl'

type Benefit = { label: string }

export type AuthCinemaPhoneContent = {
  title: string
  subtitle: string
  benefits: [Benefit, Benefit, Benefit]
  videoUrls?: readonly string[]
}

type AuthCinemaPanelProps = {
  brandName: string
  /** Передній (більший) телефон */
  primary: AuthCinemaPhoneContent
  /** Задній телефон */
  secondary: AuthCinemaPhoneContent
  compact?: boolean
  /** Мобільний баннер всередині картки форми (без окремої «панелі») */
  embedded?: boolean
}

const BENEFIT_ICONS = [
  <Clock3 key="h" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Gift key="b" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Zap key="z" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
]

const PHONE_MIN_WIDTH_PX = 768

type PhoneSize = 'lg' | 'md'

function usePhonePlaylist(videoUrls?: readonly string[]) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)

  const playlist = useMemo(() => getAuthHeroVideoSources(videoUrls), [videoUrls])
  const playlistKey = useMemo(() => playlist.join('\0'), [playlist])
  const hasVideo = playlist.length > 0
  const safeIndex = playlist.length > 0 ? videoIndex % playlist.length : 0
  const rawVideoSrc =
    (hasVideo ? playlist[safeIndex] ?? playlist[0] : null) ??
    getPrimaryAuthHeroVideoSrc(videoUrls) ??
    AUTH_HERO_FALLBACK_VIDEO
  const videoSrc = useMemo(
    () => resolveUploadMediaUrl(rawVideoSrc) ?? rawVideoSrc,
    [rawVideoSrc],
  )
  const videoLoop = playlist.length <= 1
  const showVideo = hasVideo && Boolean(videoSrc) && !videoFailed

  /* Скидання лише при зміні плейлиста — не при кожному videoSrc (інакше другий ролик не грає). */
  useEffect(() => {
    setVideoIndex(0)
    setVideoFailed(false)
    setVideoReady(false)
  }, [playlistKey])

  const playVideo = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    primeHeroVideoElement(v)
  }, [])

  useEffect(() => {
    if (!showVideo) return
    const video = videoRef.current
    if (!video) return
    const off = bindHeroVideoAutoplay(video, { extendedRetries: true, loop: videoLoop })
    playVideo()
    const retry = window.setInterval(() => {
      const v = videoRef.current
      if (v?.paused) playVideo()
    }, 700)
    const stopRetry = window.setTimeout(() => window.clearInterval(retry), 10_000)
    return () => {
      off()
      window.clearInterval(retry)
      window.clearTimeout(stopRetry)
    }
  }, [showVideo, videoSrc, videoLoop, playlistKey, playVideo])

  const onVideoEnded = () => {
    if (playlist.length <= 1) return
    setVideoIndex((i) => (i + 1) % playlist.length)
    setVideoReady(false)
    queueMicrotask(() => playVideo())
  }

  const onVideoError = () => {
    setVideoIndex((i) => {
      if (playlist.length <= 1) {
        setVideoFailed(true)
        return i
      }
      const next = i + 1
      if (next >= playlist.length) {
        setVideoFailed(true)
        return i
      }
      setVideoReady(false)
      return next
    })
  }

  const onVideoReady = () => {
    setVideoReady(true)
    playVideo()
  }

  return {
    videoRef,
    videoSrc,
    showVideo,
    videoLoop,
    videoReady,
    onVideoEnded,
    onVideoError,
    onVideoReady,
  }
}

export default function AuthCinemaPanel({
  brandName,
  primary,
  secondary,
  compact = false,
  embedded = false,
}: AuthCinemaPanelProps) {
  const [allowPhoneMotion, setAllowPhoneMotion] = useState(false)
  const primaryMedia = usePhonePlaylist(primary.videoUrls)
  const secondaryMedia = usePhonePlaylist(secondary.videoUrls)

  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqPhone = window.matchMedia(`(max-width: ${PHONE_MIN_WIDTH_PX - 1}px)`)
    const update = () => {
      setAllowPhoneMotion(!mqMotion.matches && !mqPhone.matches && window.innerWidth >= PHONE_MIN_WIDTH_PX)
    }
    update()
    mqMotion.addEventListener('change', update)
    mqPhone.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mqMotion.removeEventListener('change', update)
      mqPhone.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (compact) {
    return (
      <aside
        className={`auth-watta-cinema auth-watta-cinema--compact relative shrink-0 overflow-hidden md:hidden${
          embedded
            ? ' auth-watta-cinema--embedded'
            : ' rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(6,42,34,0.35)]'
        }`}
      >
        <CompactStripMedia {...primaryMedia} />
        <div className="auth-watta-cinema__sheen" aria-hidden />
        <ScreenOverlay
          compact
          embedded={embedded}
          brandName={brandName}
          title={primary.title}
          subtitle={primary.subtitle}
          benefits={primary.benefits}
        />
      </aside>
    )
  }

  return (
    <aside className="auth-watta-cinema auth-watta-cinema--phone auth-watta-cinema--split relative hidden min-h-0 flex-col overflow-visible md:flex">
      <div className="auth-watta-phone-duo">
        <PhoneUnit
          size="md"
          sway={false}
          className="auth-watta-phone-duo__back"
          content={secondary}
          brandName={brandName}
          media={secondaryMedia}
        />
        <PhoneUnit
          size="lg"
          sway={allowPhoneMotion}
          className="auth-watta-phone-duo__front"
          content={primary}
          brandName={brandName}
          media={primaryMedia}
        />
      </div>
    </aside>
  )
}

type ScreenMediaProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  videoSrc: string | null
  showVideo: boolean
  videoLoop: boolean
  videoReady: boolean
  onVideoEnded: () => void
  onVideoError: () => void
  onVideoReady: () => void
}

function PhoneScreenMedia({
  videoRef,
  videoSrc,
  showVideo,
  videoLoop,
  videoReady,
  onVideoEnded,
  onVideoError,
  onVideoReady,
}: ScreenMediaProps) {
  return (
    <div className="auth-watta-phone-sim__media" aria-hidden>
      <div className="auth-watta-phone-sim__fallback" />
      {showVideo && videoSrc ? (
        <video
          key={videoSrc}
          ref={videoRef}
          className={`auth-watta-phone-sim__video${videoReady ? ' auth-watta-phone-sim__video--ready' : ''}`}
          src={videoSrc}
          muted
          loop={videoLoop}
          playsInline
          autoPlay
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={onVideoReady}
          onCanPlay={onVideoReady}
          onPlaying={onVideoReady}
          onEnded={onVideoEnded}
          onError={onVideoError}
        />
      ) : null}
    </div>
  )
}

function CompactStripMedia(props: ScreenMediaProps) {
  const { videoRef, videoSrc, showVideo, videoLoop, videoReady, onVideoEnded, onVideoError, onVideoReady } = props
  return (
    <div className="auth-watta-cinema__media" aria-hidden>
      <div className="auth-watta-cinema__fallback" />
      {showVideo && videoSrc ? (
        <video
          key={videoSrc}
          ref={videoRef}
          className={`auth-watta-cinema__video${videoReady ? ' auth-watta-cinema__video--ready' : ''}`}
          src={videoSrc}
          poster={WATTA_AUTH_HERO_POSTER}
          muted
          loop={videoLoop}
          playsInline
          autoPlay
          preload="auto"
          fetchPriority="high"
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={onVideoReady}
          onCanPlay={onVideoReady}
          onPlaying={onVideoReady}
          onEnded={onVideoEnded}
          onError={onVideoError}
        />
      ) : null}
    </div>
  )
}

function ScreenOverlay({
  compact,
  embedded = false,
  brandName,
  title,
  subtitle,
  benefits,
}: {
  compact?: boolean
  embedded?: boolean
  brandName: string
  title: string
  subtitle: string
  benefits: [Benefit, Benefit, Benefit]
}) {
  const showEmbeddedChrome = compact && embedded

  return (
    <div
      className={`auth-watta-phone-sim__overlay${compact ? ' auth-watta-phone-sim__overlay--compact' : ''}${embedded ? ' auth-watta-phone-sim__overlay--embedded' : ''}`}
    >
      <div className="auth-watta-phone-sim__scrim" aria-hidden />
      {showEmbeddedChrome ? (
        <>
          <span className="auth-watta-hero-badge" aria-hidden>
            <span className="auth-watta-cinema__live" />
            <span className="auth-watta-hero-badge__text">{brandName}</span>
          </span>
          {benefits[0] ? (
            <span className="auth-watta-hero-chip" aria-hidden>
              {BENEFIT_ICONS[0]}
              <span>{benefits[0].label}</span>
            </span>
          ) : null}
        </>
      ) : null}
      <div className="auth-watta-phone-sim__ui">
        {!compact ? (
          <div className="auth-watta-phone-sim__chips" aria-hidden>
            {benefits.map((b, i) => (
              <span key={`${b.label}-${i}`} className="auth-watta-phone-sim__chip">
                {BENEFIT_ICONS[i]}
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        ) : null}
        <div className="auth-watta-phone-sim__spacer" aria-hidden />
        <CinemaCopy compact={compact} brandName={brandName} title={title} subtitle={subtitle} />
        {!compact ? (
          <p className="auth-watta-phone-sim__footer">
            © {new Date().getFullYear()} {brandName}
          </p>
        ) : null}
      </div>
    </div>
  )
}

function PhoneUnit({
  size,
  sway,
  className,
  content,
  brandName,
  media,
}: {
  size: PhoneSize
  sway: boolean
  className?: string
  content: AuthCinemaPhoneContent
  brandName: string
  media: ScreenMediaProps
}) {
  return (
    <div className={`auth-watta-phone-duo__item ${className ?? ''}`.trim()}>
      <div
        className={`auth-watta-phone-sim auth-watta-phone-sim--${size} auth-watta-phone-sim--premium${sway ? ' auth-watta-phone-sim--sway' : ''}`}
      >
        <div className="auth-watta-phone-sim__tilt">
          <div className="auth-watta-phone-sim__device">
            <div className="auth-watta-phone-sim__bezel">
              <span className="auth-watta-phone-sim__island" aria-hidden />
              <div className="auth-watta-phone-sim__screen">
                <div className="auth-watta-phone-sim__screen-inner">
                  <PhoneScreenMedia {...media} />
                  <ScreenOverlay
                    brandName={brandName}
                    title={content.title}
                    subtitle={content.subtitle}
                    benefits={content.benefits}
                  />
                </div>
                <div className="auth-watta-phone-sim__screen-glare" aria-hidden />
              </div>
              <span className="auth-watta-phone-sim__home-bar" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CinemaCopy({
  compact,
  brandName,
  title,
  subtitle,
}: {
  compact?: boolean
  brandName: string
  title: string
  subtitle: string
}) {
  return (
    <div className={`auth-watta-phone-sim__copy${compact ? ' auth-watta-phone-sim__copy--compact' : ''}`}>
      {!compact ? (
        <p className="auth-watta-phone-sim__brand">
          <span className="auth-watta-cinema__live" aria-hidden />
          {brandName}
        </p>
      ) : null}
      <h2 className="auth-watta-phone-sim__title">{title}</h2>
      {!compact ? <p className="auth-watta-phone-sim__sub">{subtitle}</p> : null}
    </div>
  )
}
