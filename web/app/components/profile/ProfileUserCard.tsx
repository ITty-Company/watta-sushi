'use client'

import Link from 'next/link'
import { m, useReducedMotion } from 'framer-motion'
import { LogOut, Mail, Shield, Sparkles } from 'lucide-react'
import { Star } from '@/lib/wattaInlineIcons'
import { Bell, Phone, User } from '@/lib/wattaInlineIcons'
import { HERO_COPY_EASE } from '../heroCopyMotion'
import type { Translations } from '@/app/context/LanguageContext'

function preventClickSelection(e: React.MouseEvent) {
  if (e.button === 0) e.preventDefault()
}

function clearTextSelection() {
  if (typeof window === 'undefined') return
  window.getSelection?.()?.removeAllRanges?.()
}

export type ProfileUserCardProps = {
  t: Translations
  displayName: string
  email?: string
  phone?: string
  bonusBalance: number
  isAdmin: boolean
  showBlogNav: boolean
  onLogout: () => void
  onOpenAdmin: () => void
  onOpenData: () => void
  onOpenNotifications: () => void
}

export default function ProfileUserCard({
  t,
  displayName,
  email,
  phone,
  bonusBalance,
  isAdmin,
  showBlogNav,
  onLogout,
  onOpenAdmin,
  onOpenData,
  onOpenNotifications,
}: ProfileUserCardProps) {
  const cp = t.clientProfile
  const reduceMotion = useReducedMotion() ?? false

  const fields = [
    { label: cp.labelName, value: displayName, icon: User },
    { label: cp.labelEmail, value: email || '—', icon: Mail },
    { label: cp.labelPhone, value: phone || '—', icon: Phone },
  ] as const

  return (
    <m.section
      className="watta-profile-user-card"
      aria-label={t.profilePage.title}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: HERO_COPY_EASE }}
    >
      <div className="watta-profile-user-card__top">
        <div className="watta-profile-user-card__fields">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="watta-profile-user-card__field">
              <span className="watta-profile-user-card__field-label">{label}</span>
              <span className="watta-profile-user-card__field-value">
                <Icon size={14} strokeWidth={2.1} className="shrink-0 opacity-70" aria-hidden />
                <span className="min-w-0 truncate">{value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="watta-profile-user-card__bonus">
        <Sparkles size={15} strokeWidth={2.1} aria-hidden />
        <span>
          {cp.bonuses}: <strong className="tabular-nums">{bonusBalance.toFixed(2)} €</strong>
        </span>
      </div>

      <div className="watta-profile-user-card__links">
        <button
          type="button"
          className="watta-profile-user-card__link-btn"
          onMouseDown={preventClickSelection}
          onClick={() => {
            clearTextSelection()
            onOpenData()
          }}
        >
          {cp.tabData}
        </button>
        <button
          type="button"
          className="watta-profile-user-card__link-btn"
          onMouseDown={preventClickSelection}
          onClick={() => {
            clearTextSelection()
            onOpenNotifications()
          }}
        >
          <Bell size={15} strokeWidth={2.1} aria-hidden />
          {t.notifications.title}
        </button>
        <Link
          href="/reviews"
          className="watta-profile-user-card__link-btn"
          draggable={false}
          onMouseDown={preventClickSelection}
          onClick={clearTextSelection}
        >
          <Star size={15} strokeWidth={2.1} aria-hidden />
          {t.reviewsPublic.title}
        </Link>
        {showBlogNav ? (
          <Link
            href="/blog"
            className="watta-profile-user-card__link-btn"
            draggable={false}
            onMouseDown={preventClickSelection}
            onClick={clearTextSelection}
          >
            {t.blogPublic.title}
          </Link>
        ) : null}
        {isAdmin ? (
          <button
            type="button"
            className="watta-profile-user-card__link-btn"
            onMouseDown={preventClickSelection}
            onClick={() => {
              clearTextSelection()
              onOpenAdmin()
            }}
          >
            <Shield size={15} strokeWidth={2.1} aria-hidden />
            {cp.tabAdmin}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="watta-profile-user-card__logout"
        onMouseDown={preventClickSelection}
        onClick={() => {
          clearTextSelection()
          onLogout()
        }}
      >
        <LogOut size={18} strokeWidth={2.15} aria-hidden />
        {cp.logout}
      </button>
    </m.section>
  )
}
