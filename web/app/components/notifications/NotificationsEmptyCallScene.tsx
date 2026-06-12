'use client'

import { Bell } from '@/lib/wattaInlineIcons'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/app/context/LanguageContext'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'

type Props = {
  subtitle: string
  compact?: boolean
}

export default function NotificationsEmptyCallScene({ subtitle, compact }: Props) {
  const { t } = useLanguage()
  const n = t.notifications
  const sms = n.emptySms

  return (
    <div
      className={cn('watta-notif-empty-stage', compact && 'watta-notif-empty-stage--compact')}
      role="status"
    >
      <WattaInViewFadeDiv className={cn('watta-notif-empty', compact && 'watta-notif-empty--compact')}>
        <div className="watta-notif-empty-shell">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#ff6b35]/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-watta-action/10 blur-2xl"
            aria-hidden
          />

          <div className="watta-notif-empty__glow" aria-hidden />

          <div className="watta-notif-empty__stage" aria-hidden>
            <div className="watta-notif-empty__hub">
              <span className="watta-notif-empty__ring watta-notif-empty__ring--1" />
              <span className="watta-notif-empty__ring watta-notif-empty__ring--2" />
              <span className="watta-notif-empty__ring watta-notif-empty__ring--3" />
              <div className="watta-notif-empty__bell">
                <Bell className="watta-notif-empty__bell-ico" strokeWidth={2} aria-hidden />
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
            <p className="watta-notif-empty__kicker">{n.emptyKicker}</p>
            <h2 className="watta-notif-empty__title">{n.empty}</h2>
            <p className="watta-notif-empty__subtitle">{subtitle}</p>
          </div>

          <ul className="watta-notif-empty__ghost-list" aria-hidden>
            {sms.map((text, i) => (
              <li
                key={text}
                className={cn('watta-notif-empty__ghost', `watta-notif-empty__ghost--${i + 1}`)}
              >
                <span className="watta-notif-empty__ghost-dot" />
                <span className="watta-notif-empty__ghost-text">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </WattaInViewFadeDiv>
    </div>
  )
}
