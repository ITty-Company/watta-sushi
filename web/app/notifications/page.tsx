'use client'

import { useLanguage } from '@/app/context/LanguageContext'
import UserNotificationsPanel from '@/app/components/notifications/UserNotificationsPanel'

export default function NotificationsPage() {
  const { t } = useLanguage()

  return (
    <div className="watta-public-page-shell watta-page-bg min-h-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-2xl font-black tracking-tight text-[#0f241e] sm:text-3xl">
          {t.notifications.title}
        </h1>
        <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
          <UserNotificationsPanel />
        </div>
      </div>
    </div>
  )
}
