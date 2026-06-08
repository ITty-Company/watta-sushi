'use client'

import { useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstantRouter } from '@/hooks/useInstantRouter'
import { useLiveNotificationCount } from '@/hooks/useLiveNotificationCount'
import { useIsLoggedIn } from '@/hooks/useIsLoggedIn'
import { useLanguage } from '@/app/context/LanguageContext'
import { useOptionalNotificationsDrawer } from '@/app/context/NotificationsDrawerContext'
import { openWattaNotifications } from '@/lib/openWattaNotifications'
import '@/app/watta-checkout-success.css'

/** Слідкує за новими сповіщеннями — показує тост знизу та оновлює лічильник. */
export default function WattaNotificationWatcher() {
  const loggedIn = useIsLoggedIn()
  const { unreadCount, latestUnread } = useLiveNotificationCount(25000)
  const { t } = useLanguage()
  const router = useInstantRouter()
  const notificationsDrawer = useOptionalNotificationsDrawer()
  const prevUnreadRef = useRef(0)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!loggedIn) {
      prevUnreadRef.current = 0
      bootstrappedRef.current = false
      return
    }

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true
      prevUnreadRef.current = unreadCount
      return
    }

    if (unreadCount <= prevUnreadRef.current) {
      prevUnreadRef.current = unreadCount
      return
    }

    const item = latestUnread
    const title = item?.title?.trim() || t.notifications.title
    const body = item?.body?.trim() || t.notifications.liveHint

    toast.custom(
      (toastInstance) => (
        <button
          type="button"
          className={`watta-notification-toast${toastInstance.visible ? '' : ''}`}
          onClick={() => {
            toast.dismiss(toastInstance.id)
            openWattaNotifications(router, notificationsDrawer?.open ?? null)
          }}
        >
          <span className="watta-notification-toast__ico" aria-hidden>
            <Bell size={18} strokeWidth={2.2} />
          </span>
          <span className="watta-notification-toast__body">
            <span className="watta-notification-toast__label">{t.notifications.newToastLabel}</span>
            <span className="watta-notification-toast__title">{title}</span>
            <span className="watta-notification-toast__text">{body}</span>
          </span>
        </button>
      ),
      {
        id: item ? `watta-notify-${item.id}` : 'watta-notify-new',
        duration: 5200,
        position: 'bottom-center',
      },
    )

    prevUnreadRef.current = unreadCount
  }, [loggedIn, latestUnread, notificationsDrawer?.open, router, t.notifications, unreadCount])

  return null
}
