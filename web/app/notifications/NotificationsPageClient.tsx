'use client'

import { Bell } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'
import { WattaInViewFadeDiv, WattaInViewFadeHeader } from '@/app/components/WattaInViewFade'
import '../watta-notifications-empty.css'

export default function NotificationsPageClient() {
  const { t } = useLanguage()
  const n = t.notifications

  return (
    <div className="notifications-page-web relative min-h-0 flex-1 pb-6">
      <div className="notifications-page-shell relative z-[1] mx-auto w-full max-w-lg px-4 py-5 sm:px-5 sm:py-6">
        <WattaInViewFadeHeader
          className="notifications-page-intro"
          aria-labelledby="notifications-page-title"
        >
          <p className="notifications-page-intro__kicker">
            <Bell size={13} className="notifications-page-intro__kicker-ico" aria-hidden />
            {n.liveHint}
          </p>
          <h1 id="notifications-page-title" className="notifications-page-intro__title">
            {n.title}
          </h1>
        </WattaInViewFadeHeader>

        <WattaInViewFadeDiv className="notifications-page-panel" transition={{ delay: 0.04 }}>
          <UserNotificationsPanel />
        </WattaInViewFadeDiv>
      </div>
    </div>
  )
}
