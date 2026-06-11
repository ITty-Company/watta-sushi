'use client'

import type { ReactNode } from 'react'

type SectionProps = {
  children: ReactNode
  className?: string
}

type IntroProps = {
  icon: ReactNode
  title?: string
  subtitle: string
  status?: boolean
  tone?: 'green' | 'orange'
}

/** Відкрита секція профілю без панелей — стиль /about, без рамок. */
export function ProfileSectionPanel({ children, className }: SectionProps) {
  const extra = className?.trim()
  return <div className={extra ? `watta-profile-section ${extra}` : 'watta-profile-section'}>{children}</div>
}

export function ProfileSectionIntro({
  icon,
  title,
  subtitle,
  status,
  tone = 'green',
}: IntroProps) {
  const introClass = title
    ? 'watta-profile-section__intro'
    : 'watta-profile-section__intro watta-profile-section__intro--lead'

  return (
    <div className={introClass} role={status ? 'status' : undefined}>
      <div className={`watta-profile-section__intro-icon-wrap watta-profile-section__intro-icon-wrap--${tone}`}>
        <div className="watta-profile-section__intro-blob" aria-hidden />
        <div className="watta-profile-section__intro-icon">{icon}</div>
      </div>
      <div className="watta-profile-section__intro-copy">
        {title ? <p className="watta-profile-section__intro-title">{title}</p> : null}
        <p className="watta-profile-section__intro-subtitle">{subtitle}</p>
      </div>
    </div>
  )
}

export function ProfileSectionBody({ children, className }: SectionProps) {
  const parts = ['watta-profile-section__block', className?.trim()].filter(Boolean)
  return <div className={parts.join(' ')}>{children}</div>
}
