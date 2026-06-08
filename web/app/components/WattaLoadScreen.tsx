'use client'

import { ReactNode, useMemo } from 'react'

type WattaLoadScreenProps = {
  className?: string
  /** 0–100: ширина зеленої смуги */
  progress: number
  /** Анімація смуги в CSS (boot splash) — не throttle-иться як setInterval. */
  cssProgress?: boolean
  compact?: boolean
  label?: ReactNode
}

export default function WattaLoadScreen({
  className = '',
  progress,
  cssProgress = false,
  compact = false,
  label = (
    <>
      Loading<span className="watta-dot">.</span>
      <span className="watta-dot">.</span>
      <span className="watta-dot">.</span>
    </>
  ),
}: WattaLoadScreenProps) {
  const bootSplash = className.includes('watta-load-screen-root--boot-splash')
  const pct = useMemo(() => {
    if (cssProgress) return 100
    const n = Math.min(100, Math.max(0, progress))
    return bootSplash && n >= 99.5 ? 100 : n
  }, [progress, bootSplash, cssProgress])

  return (
    <div
      className={`watta-load-screen-root ${compact ? 'watta-load-screen-root--compact' : ''} ${bootSplash ? 'watta-load-screen-root--boot-splash' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy={cssProgress || pct < 100}
    >
      <div className="watta-load-screen-stack">
        <div className="watta-load-screen-logo-wrap">
          <img
            src="/logo-splash-1x.webp"
            srcSet="/logo-splash-1x.webp 1x, /logo-splash.webp 2x"
            alt=""
            width={240}
            height={220}
            className="watta-load-screen-logo"
            decoding="async"
            loading={bootSplash ? 'eager' : 'lazy'}
            fetchPriority="high"
            draggable={false}
          />
        </div>
        <div className="watta-uiverse-loader">
          <div className="watta-loading-text">{label}</div>
          <div
            className="watta-loading-bar-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={cssProgress ? undefined : Math.round(pct)}
            aria-valuetext={cssProgress ? undefined : `${Math.round(pct)}%`}
          >
            <div
              className={`watta-loading-bar watta-loading-bar--determinate${cssProgress ? ' watta-loading-bar--boot-splash-css' : ''}`}
              style={cssProgress ? undefined : { width: `${pct}%` }}
            >
              <div className="watta-white-bars-container" aria-hidden>
                {Array.from({ length: bootSplash ? 6 : 10 }).map((_, i) => (
                  <div key={i} className="watta-white-bar" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
