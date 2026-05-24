'use client'

import type { ReactNode } from 'react'

export type ProfileLeadHeroProps = {
  sectionId?: string
  nameLines: string[]
  reserveTopSpace?: boolean
  children?: ReactNode
}

export default function ProfileLeadHero({
  sectionId = 'profile-lead-intro',
  nameLines,
  reserveTopSpace = false,
  children,
}: ProfileLeadHeroProps) {
  return (
    <section
      id={sectionId}
      className={`watta-profile-lead${reserveTopSpace ? ' watta-profile-lead--headroom' : ''}`}
      aria-labelledby={`${sectionId}-title`}
    >
      <div className="watta-profile-lead__inner">
        <div className="watta-profile-lead__card">
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
