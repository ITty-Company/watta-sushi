'use client'

import { ReactNode, useMemo } from 'react'

type WattaLoadScreenProps = {
  className?: string
  /** 0–100: ширина зеленої смуги */
  progress: number
  compact?: boolean
  label?: ReactNode
}

export default function WattaLoadScreen({
  className = '',
  progress,
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
    const n = Math.min(100, Math.max(0, progress))
    return bootSplash && n >= 99.5 ? 100 : n
  }, [progress, bootSplash])

  return (
    <div
      className={`watta-load-screen-root ${compact ? 'watta-load-screen-root--compact' : ''} ${bootSplash ? 'watta-load-screen-root--boot-splash' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy={pct < 100}
    >
      <div className="watta-load-screen-stack">
        <div className="watta-load-screen-logo-wrap">
          <img
            src="/logo-splash-1x.webp"
            srcSet="/logo-splash-1x.webp 1x, /logo-splash.webp 2x"
            alt=""
            width={compact ? 140 : 240}
            height={compact ? 140 : 240}
            className="watta-load-screen-logo"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="watta-uiverse-loader">
          <div className="watta-loading-text">{label}</div>
          <div
            className="watta-loading-bar-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            aria-valuetext={`${Math.round(pct)}%`}
          >
            <div
              className="watta-loading-bar watta-loading-bar--determinate"
              style={{ width: `${pct}%` }}
            >
              <div className="watta-white-bars-container" aria-hidden>
                {Array.from({ length: 10 }).map((_, i) => (
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
