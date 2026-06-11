'use client'

import type { ReactNode } from 'react'
import { User } from '@/lib/wattaInlineIcons'

export type ProfileLeadHeroProps = {
  sectionId?: string
  nameLines: string[]
  reserveTopSpace?: boolean
  variant?: 'default' | 'glass'
  children?: ReactNode
}

export default function ProfileLeadHero({
  sectionId = 'profile-lead-intro',
  nameLines,
  reserveTopSpace = false,
  variant = 'default',
  children,
}: ProfileLeadHeroProps) {
  const isGlass = variant === 'glass'

  return (
    <section
      id={sectionId}
      className={`watta-profile-lead${reserveTopSpace ? ' watta-profile-lead--headroom' : ''}${
        isGlass ? ' watta-profile-lead--glass' : ''
      }`}
      aria-labelledby={`${sectionId}-title`}
    >
      {isGlass ? (
        <>
          <div className="watta-profile-lead__ambient" aria-hidden />
          <div className="watta-profile-lead__glow watta-profile-lead__glow--orange" aria-hidden />
          <div className="watta-profile-lead__glow watta-profile-lead__glow--green" aria-hidden />
          <div className="watta-profile-lead__stripe" aria-hidden />
        </>
      ) : null}

      <div className="watta-profile-lead__inner">
        <div className={isGlass ? 'watta-profile-lead__glass-card' : 'watta-profile-lead__card'}>
          {isGlass ? (
            <div className="watta-profile-lead__avatar" aria-hidden>
              <span className="watta-profile-lead__avatar-ring" />
              <span className="watta-profile-lead__avatar-icon">
                <User size={28} strokeWidth={1.75} />
              </span>
            </div>
          ) : null}

          <h1 id={`${sectionId}-title`} className="watta-profile-lead__name">
            {nameLines.map((line) => (
              <span key={line} className="watta-profile-lead__name-line">
                {line}
              </span>
            ))}
          </h1>

          {children ? <div className="watta-profile-lead__meta">{children}</div> : null}
        </div>
      </div>
    </section>
  )
}
