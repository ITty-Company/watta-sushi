'use client'

import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Bell } from '@/lib/wattaInlineIcons'
import { X } from '@/lib/wattaInlineIcons'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'
import WattaNavDrawerShell from './WattaNavDrawerShell'
import '@/app/watta-notifications-drawer.css'
import '@/app/watta-notifications-page.css'

export const NotificationsView = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useLanguage()
  const n = t.notifications
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <WattaNavDrawerShell
      isOpen={isOpen}
      onClose={onClose}
      id="watta-notifications-drawer"
      ariaLabel={t.locationPicker.ariaClose}
    >
      <div className="watta-notifications-drawer-panel" role="dialog" aria-labelledby="watta-notifications-title">
        <header className="watta-notifications-drawer-head">
          <div className="watta-notifications-drawer-head__copy">
            <p className="notifications-page-intro__kicker">
              <Bell size={13} className="notifications-page-intro__kicker-ico" aria-hidden />
              {n.liveHint}
            </p>
            <h2 id="watta-notifications-title" className="notifications-page-intro__title">
              {n.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="watta-notifications-drawer-close"
            aria-label={t.locationPicker.ariaClose}
          >
            <X size={22} strokeWidth={2.25} aria-hidden />
          </button>
        </header>
        <div className="watta-notifications-drawer-scroll">
          <UserNotificationsPanel compact onItemNavigate={onClose} />
        </div>
      </div>
    </WattaNavDrawerShell>
  )
}
