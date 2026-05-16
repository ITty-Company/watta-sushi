'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Gift, Zap } from 'lucide-react'
import {
  WATTA_AUTH_HERO_POSTER,
  getPrimaryAuthHeroVideoSrc,
} from '@/lib/wattaAuthHeroVideo'
import { getAuthHeroVideoSources } from '@/lib/authHeroVideoSources'

type Benefit = { label: string }

type AuthCinemaPanelProps = {
  title: string
  subtitle: string
  brandName: string
  benefits: [Benefit, Benefit, Benefit]
  /** URL з адмінки; якщо порожньо — запасні з public */
  videoUrls?: readonly string[]
  /** Компактна смуга над формою на телефоні */
  compact?: boolean
}

const BENEFIT_ICONS = [
  <Clock3 key="h" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Gift key="b" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Zap key="z" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
]

const PHONE_MIN_WIDTH_PX = 768

export default function AuthCinemaPanel({
  title,
  subtitle,
  brandName,
  benefits,
  videoUrls,
  compact = false,
}: AuthCinemaPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [allowPhoneMotion, setAllowPhoneMotion] = useState(false)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoFailed, setVideoFailed] = useState(false)

  const playlist = useMemo(() => getAuthHeroVideoSources(videoUrls), [videoUrls])
  const hasVideo = playlist.length > 0
  const videoSrc =
    (hasVideo ? playlist[videoIndex] ?? playlist[0] : null) ??
    getPrimaryAuthHeroVideoSrc(videoUrls)
  const videoLoop = playlist.length <= 1

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

  useEffect(() => {
    setVideoIndex(0)
    setVideoFailed(false)
    setVideoReady(false)
  }, [videoSrc, videoUrls])

  const playVideo = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    el.play().catch(() => {})
  }, [])

  useEffect(() => {
    if (!hasVideo || !allowPhoneMotion || compact || videoFailed) return
    playVideo()
  }, [hasVideo, allowPhoneMotion, compact, videoFailed, videoSrc, playVideo])

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

  const rootClass = compact
    ? 'auth-watta-cinema auth-watta-cinema--compact relative shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(6,42,34,0.35)] md:hidden'
    : 'auth-watta-cinema auth-watta-cinema--phone relative m-1 hidden min-h-0 flex-col overflow-hidden rounded-[1.65rem] border border-white/12 shadow-[0_28px_90px_rgba(6,42,34,0.45)] md:flex'

  return (
    <aside className={rootClass} aria-hidden={compact ? undefined : false}>
      <CinemaBackdrop compact={compact} />

      {!compact && allowPhoneMotion ? (
        <PhoneSimulator
          videoRef={videoRef}
          videoSrc={videoSrc}
          hasVideo={hasVideo && Boolean(videoSrc)}
          videoLoop={videoLoop}
          videoReady={videoReady}
          videoFailed={videoFailed}
          onVideoEnded={onVideoEnded}
          onVideoError={onVideoError}
          onVideoReady={() => {
            setVideoReady(true)
            playVideo()
          }}
          sway={allowPhoneMotion}
        />
      ) : !compact ? (
        <div className="auth-watta-phone-stage auth-watta-phone-stage--static" aria-hidden>
          <img
            src={WATTA_AUTH_HERO_POSTER}
            alt=""
            className="auth-watta-phone-stage__poster"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {compact ? <CompactStripMedia /> : null}

      <div className="auth-watta-cinema__orbit" aria-hidden={compact}>
        {benefits.map((b, i) => (
          <span
            key={b.label}
            className={`auth-watta-cinema__orbit-chip auth-watta-cinema__orbit-chip--${i + 1}`}
          >
            {BENEFIT_ICONS[i]}
            <span>{b.label}</span>
          </span>
        ))}
      </div>

      <CinemaCopy compact={compact} brandName={brandName} title={title} subtitle={subtitle} />

      {!compact ? (
        <p className="auth-watta-cinema__footer">
          © {new Date().getFullYear()} {brandName}
        </p>
      ) : null}
    </aside>
  )
}

function CinemaBackdrop({ compact }: { compact: boolean }) {
  return (
    <>
      <div className="auth-watta-cinema__backdrop" aria-hidden />
      {!compact ? <div className="auth-watta-cinema__glow auth-watta-cinema__glow--warm" aria-hidden /> : null}
    </>
  )
}

function CompactStripMedia() {
  return (
    <div className="auth-watta-cinema__media" aria-hidden>
      <img
        src={WATTA_AUTH_HERO_POSTER}
        alt=""
        className="auth-watta-cinema__poster"
        loading="eager"
        decoding="async"
      />
      <div className="auth-watta-cinema__vignette" />
      <div className="auth-watta-cinema__grain" aria-hidden />
    </div>
  )
}

type PhoneSimulatorProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  videoSrc: string | null
  hasVideo: boolean
  videoLoop: boolean
  videoReady: boolean
  videoFailed: boolean
  onVideoEnded: () => void
  onVideoError: () => void
  onVideoReady: () => void
  sway: boolean
}

function PhoneSimulator({
  videoRef,
  videoSrc,
  hasVideo,
  videoLoop,
  videoReady,
  videoFailed,
  onVideoEnded,
  onVideoError,
  onVideoReady,
  sway,
}: PhoneSimulatorProps) {
  return (
    <div className="auth-watta-phone-stage">
      <div className={`auth-watta-phone-sim${sway ? ' auth-watta-phone-sim--sway' : ''}`} aria-hidden>
        <div className="auth-watta-phone-sim__tilt">
          <div className="auth-watta-phone-sim__device">
            <div className="auth-watta-phone-sim__bezel">
              <span className="auth-watta-phone-sim__island" aria-hidden />
              <div className="auth-watta-phone-sim__screen">
                <img
                  src={WATTA_AUTH_HERO_POSTER}
                  alt=""
                  className={`auth-watta-phone-sim__poster${hasVideo && videoReady && !videoFailed ? ' auth-watta-phone-sim__poster--hidden' : ''}`}
                  loading="lazy"
                  decoding="async"
                />
                {hasVideo && videoSrc && !videoFailed ? (
                  <video
                    key={videoSrc}
                    ref={videoRef}
                    className={`auth-watta-phone-sim__video${videoReady ? ' auth-watta-phone-sim__video--ready' : ''}`}
                    src={videoSrc}
                    poster={WATTA_AUTH_HERO_POSTER}
                    muted
                    loop={videoLoop}
                    playsInline
                    autoPlay
                    preload="metadata"
                    onLoadedData={onVideoReady}
                    onCanPlay={onVideoReady}
                    onEnded={onVideoEnded}
                    onError={onVideoError}
                  />
                ) : null}
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
  compact: boolean
  brandName: string
  title: string
  subtitle: string
}) {
  return (
    <div className={`auth-watta-cinema__copy${compact ? ' auth-watta-cinema__copy--compact' : ' auth-watta-cinema__copy--phone'}`}>
      {!compact ? (
        <p className="auth-watta-cinema__brand">
          <span className="auth-watta-cinema__live" aria-hidden />
          {brandName}
        </p>
      ) : null}
      {!compact ? <h2 className="auth-watta-cinema__title">{title}</h2> : null}
      {!compact ? <p className="auth-watta-cinema__sub">{subtitle}</p> : null}
    </div>
  )
}
