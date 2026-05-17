'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Gift, Zap } from 'lucide-react'
import { getPrimaryAuthHeroVideoSrc } from '@/lib/wattaAuthHeroVideo'
import { getAuthHeroVideoSources } from '@/lib/authHeroVideoSources'

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
  const hasVideo = playlist.length > 0
  const videoSrc =
    (hasVideo ? playlist[videoIndex] ?? playlist[0] : null) ??
    getPrimaryAuthHeroVideoSrc(videoUrls)
  const videoLoop = playlist.length <= 1
  const showVideo = hasVideo && Boolean(videoSrc) && !videoFailed

  useEffect(() => {
    setVideoIndex(0)
    setVideoFailed(false)
    setVideoReady(false)
  }, [videoSrc, videoUrls])

  const playVideo = useCallback(() => {
    videoRef.current?.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!showVideo) return
    playVideo()
  }, [showVideo, videoSrc, playVideo])

  const onVideoEnded = () => {
    if (playlist.length <= 1) return
    setVideoIndex((i) => (i + 1) % playlist.length)
    setVideoReady(false)
  }

  const onVideoError = () => {
    if (videoIndex < playlist.length - 1) {
      setVideoIndex((i) => i + 1)
      setVideoReady(false)
      return
    }
    setVideoFailed(true)
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
      <aside className="auth-watta-cinema auth-watta-cinema--compact relative shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(6,42,34,0.35)] md:hidden">
        <CompactStripMedia {...primaryMedia} />
        <ScreenOverlay
          compact
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
          onLoadedData={onVideoReady}
          onCanPlay={onVideoReady}
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
          muted
          loop={videoLoop}
          playsInline
          autoPlay
          preload="auto"
          onLoadedData={onVideoReady}
          onCanPlay={onVideoReady}
          onEnded={onVideoEnded}
          onError={onVideoError}
        />
      ) : null}
    </div>
  )
}

function ScreenOverlay({
  compact,
  brandName,
  title,
  subtitle,
  benefits,
}: {
  compact?: boolean
  brandName: string
  title: string
  subtitle: string
  benefits: [Benefit, Benefit, Benefit]
}) {
  return (
    <div className={`auth-watta-phone-sim__overlay${compact ? ' auth-watta-phone-sim__overlay--compact' : ''}`}>
      <div className="auth-watta-phone-sim__scrim" aria-hidden />
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
