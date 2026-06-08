'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/app/context/LanguageContext'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'

type Props = {
  subtitle: string
  compact?: boolean
}

export default function NotificationsEmptyCallScene({ subtitle, compact }: Props) {
  const { t } = useLanguage()
  const sms = t.notifications.emptySms
  const title = t.notifications.empty

  return (
    <WattaInViewFadeDiv
      className={cn('watta-notif-empty', compact && 'watta-notif-empty--compact')}
    >
      <div className="watta-notif-empty__glow" aria-hidden />

      <div className="watta-notif-empty__stage" aria-hidden>
        <div className="watta-notif-empty__hub">
          <span className="watta-notif-empty__ring watta-notif-empty__ring--1" />
          <span className="watta-notif-empty__ring watta-notif-empty__ring--2" />
          <span className="watta-notif-empty__ring watta-notif-empty__ring--3" />
          <div className="watta-notif-empty__bell">
            <Bell
              className="watta-notif-empty__bell-ico"
              strokeWidth={2}
              aria-hidden
            />
          </div>
        </div>

        <div className="watta-notif-empty__sms-layer">
          {sms.map((text, i) => (
            <div
              key={text}
              className={cn('watta-notif-empty__sms', `watta-notif-empty__sms--${i + 1}`)}
            >
              <span className="watta-notif-empty__sms-tail" aria-hidden />
              <span className="watta-notif-empty__sms-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="watta-notif-empty__copy">
        <h2 className="watta-notif-empty__title">{title}</h2>
        <p className="watta-notif-empty__subtitle">{subtitle}</p>
      </div>
    </WattaInViewFadeDiv>
  )
}
