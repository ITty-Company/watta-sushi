'use client'

import { ArrowLeft, Bell } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useCanGoBack } from '@/hooks/useCanGoBack'
import '../watta-notifications-empty.css'

export default function NotificationsPageClient() {
  const { t } = useLanguage()
  const n = t.notifications
  const router = useInstantRouter()
  const canGoBack = useCanGoBack()

  return (
    <div className="notifications-page-web relative min-h-0 flex-1">
      <div className="notifications-page-shell relative z-[1] mx-auto w-full">
        <header className="notifications-page-mobile-head">
          {canGoBack ? (
            <button
              type="button"
              className="notifications-page-mobile-back"
              onClick={() => router.back()}
              aria-label={t.auth.back}
            >
              <ArrowLeft size={20} strokeWidth={2.25} aria-hidden />
            </button>
          ) : null}
          <div className="notifications-page-mobile-head__copy">
            <div className="notifications-page-intro" aria-labelledby="notifications-page-title">
              <p className="notifications-page-intro__kicker">
                <Bell size={13} className="notifications-page-intro__kicker-ico" aria-hidden />
                {n.liveHint}
              </p>
              <h1 id="notifications-page-title" className="notifications-page-intro__title">
                {n.title}
              </h1>
            </div>
          </div>
        </header>

        <WattaInViewFadeDiv className="notifications-page-panel" transition={{ delay: 0.04 }}>
          <UserNotificationsPanel />
        </WattaInViewFadeDiv>
      </div>
    </div>
  )
}
