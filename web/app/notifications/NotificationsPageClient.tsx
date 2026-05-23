'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Bell, Radio } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'

export default function NotificationsPageClient() {
  const { t } = useLanguage()
  const n = t.notifications
  const reduce = useReducedMotion()

  const fadeUp = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      } as const)

  return (
    <div className="notifications-page-web relative min-h-0 flex-1 bg-white pb-10">
      <section className="notifications-page-hero" aria-labelledby="notifications-page-title">
        <div className="notifications-page-hero__ambient" aria-hidden />
        <motion.div
          className="relative z-[1] mx-auto max-w-lg px-4 py-10 sm:px-5 sm:py-12"
          {...fadeUp}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="notifications-page-hero__kicker">
            <Bell size={14} className="notifications-page-hero__kicker-ico" aria-hidden />
            {n.liveHint}
          </p>
          <h1 id="notifications-page-title" className="notifications-page-hero__title">
            {n.title}
          </h1>
          <p className="notifications-page-hero__sub">{n.emptySubtext}</p>
          <p className="notifications-page-hero__live" role="status">
            <Radio size={12} className="notifications-page-hero__live-ico" aria-hidden />
            <span>{n.liveActive}</span>
          </p>
        </motion.div>
      </section>

      <motion.div
        className="relative z-[1] mx-auto max-w-lg px-3 sm:px-5"
        {...fadeUp}
        transition={{ duration: 0.45, delay: 0.06 }}
      >
        <div className="notifications-page-panel">
          <UserNotificationsPanel />
        </div>
      </motion.div>
    </div>
  )
}
