'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'

export default function NotificationsPageClient() {
  const { t } = useLanguage()
  const n = t.notifications
  const reduce = useReducedMotion()

  const fadeUp = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
      } as const)

  return (
    <div className="notifications-page-web relative min-h-0 flex-1 bg-white pb-10">
      <div className="relative z-[1] mx-auto w-full max-w-lg px-4 py-8 sm:px-5 sm:py-10">
        <motion.header
          className="notifications-page-intro"
          aria-labelledby="notifications-page-title"
          {...fadeUp}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="notifications-page-intro__kicker">
            <Bell size={14} className="notifications-page-intro__kicker-ico" aria-hidden />
            {n.liveHint}
          </p>
          <h1 id="notifications-page-title" className="notifications-page-intro__title">
            {n.title}
          </h1>
          <p className="notifications-page-intro__sub">{n.emptySubtext}</p>
        </motion.header>

        <motion.div
          className="notifications-page-panel mt-6"
          {...fadeUp}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <UserNotificationsPanel />
        </motion.div>
      </div>
    </div>
  )
}
