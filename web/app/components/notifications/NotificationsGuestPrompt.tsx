'use client'

import { LogIn, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/app/context/LanguageContext'
import { openWattaAuth } from '@/lib/openWattaAuth'
import { getCurrentReturnPath } from '@/lib/authGate'

type Props = {
  compact?: boolean
}

export default function NotificationsGuestPrompt({ compact }: Props) {
  const { t } = useLanguage()
  const n = t.notifications

  const openLogin = () => {
    openWattaAuth({ returnUrl: getCurrentReturnPath() })
  }

  const openRegister = () => {
    openWattaAuth({ returnUrl: getCurrentReturnPath(), register: true })
  }

  return (
    <div
      className={cn('notifications-page-state', compact && 'notifications-page-state--compact')}
      role="status"
    >
      <div className="notifications-page-state__icon-wrap" aria-hidden>
        <UserRound className="notifications-page-state__icon" strokeWidth={2} />
      </div>
      <h3 className="notifications-page-state__title">{n.guestTitle}</h3>
      <p className="notifications-page-state__sub">{n.guestSubtext}</p>
      <div className="notifications-page-state__actions">
        <button type="button" className="notifications-page-state__cta" onClick={openLogin}>
          <LogIn size={16} strokeWidth={2.25} aria-hidden />
          {n.guestLoginCta}
        </button>
        <button
          type="button"
          className="notifications-page-state__cta notifications-page-state__cta--ghost"
          onClick={openRegister}
        >
          {n.guestRegisterCta}
        </button>
      </div>
    </div>
  )
}
