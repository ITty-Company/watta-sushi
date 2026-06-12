'use client'

import { LogIn, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/app/context/LanguageContext'
import { openWattaAuth } from '@/lib/openWattaAuth'
import { getCurrentReturnPath } from '@/lib/authGate'
import { WATTA_NOTIFICATIONS_OPEN_EVENT } from '@/lib/openWattaNotifications'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import '@/app/watta-notifications-empty.css'

type Props = {
  compact?: boolean
  onAuthNavigate?: () => void
}

export default function NotificationsGuestPrompt({ compact, onAuthNavigate }: Props) {
  const { t } = useLanguage()
  const n = t.notifications

  const openAuth = (register: boolean) => {
    onAuthNavigate?.()
    requestAnimationFrame(() => {
      openWattaAuth({
        returnUrl: getCurrentReturnPath(),
        register,
        onSuccess: () => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_OPEN_EVENT))
          }
        },
      })
    })
  }

  return (
    <div className={cn('watta-notif-guest-stage', compact && 'watta-notif-guest-stage--compact')}>
      <WattaInViewFadeDiv
        className={cn('watta-notif-guest', compact && 'watta-notif-guest--compact')}
        role="status"
      >
      <div className="watta-notif-guest__shell">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#ff6b35]/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-watta-action/10 blur-2xl"
          aria-hidden
        />

        <div className="watta-notif-guest__icon-wrap" aria-hidden>
          <UserRound className="watta-notif-guest__icon" strokeWidth={2} />
        </div>

        <div className="watta-notif-guest__copy">
          <p className="watta-notif-guest__kicker">{n.liveHint}</p>
          <h3 className="watta-notif-guest__title">{n.guestTitle}</h3>
          <p className="watta-notif-guest__sub">{n.guestSubtext}</p>
        </div>

        <div className="watta-notif-guest__actions">
          <button type="button" className="watta-notif-guest__cta" onClick={() => openAuth(false)}>
            <LogIn size={16} strokeWidth={2.25} aria-hidden />
            {n.guestLoginCta}
          </button>
          <button
            type="button"
            className="watta-notif-guest__cta watta-notif-guest__cta--ghost"
            onClick={() => openAuth(true)}
          >
            {n.guestRegisterCta}
          </button>
        </div>
      </div>
      </WattaInViewFadeDiv>
    </div>
  )
}
