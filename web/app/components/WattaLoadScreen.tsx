'use client'

import { ReactNode, useMemo } from 'react'

type WattaLoadScreenProps = {
  className?: string
  /** 0–100: real fill; bar opens only after parent sets 100 and dismisses */
  progress: number
  /** Smaller logo + bar for hero overlay */
  compact?: boolean
  label?: ReactNode
}

/**
 * White splash: logo with loader directly underneath (Uiverse-style bar, brand green).
 */
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
  const pct = useMemo(() => Math.min(100, Math.max(0, progress)), [progress])

  return (
    <div
      className={`watta-load-screen-root ${compact ? 'watta-load-screen-root--compact' : ''} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy={pct < 100}
    >
      <div className="watta-load-screen-stack">
        <div className="watta-load-screen-logo-wrap">
          <img
            src="/logo.png"
            alt=""
            width={compact ? 140 : 240}
            height={compact ? 140 : 240}
            className="watta-load-screen-logo"
            decoding="async"
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
