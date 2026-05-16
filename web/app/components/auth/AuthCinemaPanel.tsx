'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Clock3, Gift, Zap } from 'lucide-react'
import { WATTA_HOME_HERO_POSTER, WATTA_HOME_HERO_VIDEO_PATH } from '@/lib/wattaHeroVideo'

type Benefit = { label: string }

type AuthCinemaPanelProps = {
  title: string
  subtitle: string
  brandName: string
  benefits: [Benefit, Benefit, Benefit]
  /** Компактна смуга над формою на мобільному */
  compact?: boolean
}

const BENEFIT_ICONS = [
  <Clock3 key="h" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Gift key="b" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
  <Zap key="z" className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />,
]

export default function AuthCinemaPanel({
  title,
  subtitle,
  brandName,
  benefits,
  compact = false,
}: AuthCinemaPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [allowMotion, setAllowMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAllowMotion(!mq.matches && window.innerWidth >= 1024)
    update()
    mq.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      mq.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (!allowMotion || compact) return
    const el = videoRef.current
    if (!el) return
    el.play().catch(() => {})
  }, [allowMotion, compact])

  const rootClass = compact
    ? 'auth-watta-cinema auth-watta-cinema--compact relative shrink-0 overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(6,42,34,0.35)]'
    : 'auth-watta-cinema relative m-1 hidden min-h-0 flex-col overflow-hidden rounded-[1.65rem] border border-white/12 shadow-[0_28px_90px_rgba(6,42,34,0.45)] lg:flex'

  return (
    <aside className={rootClass} aria-hidden={compact ? undefined : false}>
      <div className="auth-watta-cinema__media" aria-hidden>
        <img
          src={WATTA_HOME_HERO_POSTER}
          alt=""
          className={`auth-watta-cinema__poster ${videoReady && allowMotion ? 'auth-watta-cinema__poster--hidden' : ''}`}
          loading={compact ? 'eager' : 'lazy'}
          decoding="async"
        />
        {!compact && allowMotion ? (
          <video
            ref={videoRef}
            className={`auth-watta-cinema__video ${videoReady ? 'auth-watta-cinema__video--ready' : ''}`}
            src={WATTA_HOME_HERO_VIDEO_PATH}
            poster={WATTA_HOME_HERO_POSTER}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            onLoadedData={() => setVideoReady(true)}
            onCanPlay={() => setVideoReady(true)}
          />
        ) : null}
        <div className="auth-watta-cinema__vignette" />
        <div className="auth-watta-cinema__grain" aria-hidden />
      </div>

      {!compact && <div className="auth-watta-cinema__glow auth-watta-cinema__glow--warm" aria-hidden />}

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

      <div className={`auth-watta-cinema__plate ${compact ? 'auth-watta-cinema__plate--compact' : ''}`}>
        <img src="/sushi.webp" alt="" width={280} height={280} loading="lazy" decoding="async" />
      </div>

      <div className={`auth-watta-cinema__copy ${compact ? 'auth-watta-cinema__copy--compact' : ''}`}>
        {!compact && (
          <p className="auth-watta-cinema__brand">
            <span className="auth-watta-cinema__live" aria-hidden />
            {brandName}
          </p>
        )}
        <h2 className="auth-watta-cinema__title">{title}</h2>
        {!compact && <p className="auth-watta-cinema__sub">{subtitle}</p>}
      </div>

      {!compact && (
        <p className="auth-watta-cinema__footer">
          © {new Date().getFullYear()} {brandName}
        </p>
      )}
    </aside>
  )
}
