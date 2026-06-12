'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Bell } from '@/lib/wattaInlineIcons'
import NotificationsEmptyCallScene from '@/app/components/notifications/NotificationsEmptyCallScene'
import NotificationsGuestPrompt from '@/app/components/notifications/NotificationsGuestPrompt'
import {
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
  WATTA_NOTIFICATIONS_CHANGED_EVENT,
} from '@/lib/userNotificationsApi'
import {
  getLiveNotificationsSnapshot,
  refreshLiveNotifications,
  subscribeLiveNotifications,
} from '@/lib/liveNotificationsStore'
import { useLanguage, type Language, type Translations } from '@/app/context/LanguageContext'
import { readIsLoggedInFromStorage } from '@/lib/isAdminRole'
import { cn } from '@/lib/utils'
import '@/app/watta-notifications-empty.css'

export function useUnreadNotificationCount() {
  const snapshot = useSyncExternalStore(
    subscribeLiveNotifications,
    getLiveNotificationsSnapshot,
    () => getLiveNotificationsSnapshot(),
  )

  return {
    unread: snapshot.unreadCount,
    refresh: refreshLiveNotifications,
  }
}

function orderStatusFromItem(item: UserNotificationItem): string | null {
  const meta = item.meta
  if (meta && typeof meta.status === 'string') return meta.status
  return null
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'notifications-page-status--pending',
  CONFIRMED: 'notifications-page-status--confirmed',
  COOKING: 'notifications-page-status--cooking',
  DELIVERING: 'notifications-page-status--delivering',
  DELIVERED: 'notifications-page-status--done',
  COMPLETED: 'notifications-page-status--done',
  CANCELLED: 'notifications-page-status--cancelled',
}

function orderStatusLabel(status: string, cp: Translations['clientProfile']): string {
  const key = status.toUpperCase()
  const map: Record<string, string> = {
    PENDING: cp.stepPending,
    CONFIRMED: cp.stepConfirmed,
    COOKING: cp.stepCooking,
    DELIVERING: cp.stepDelivering,
    DELIVERED: cp.stepReceived,
    COMPLETED: cp.stepReceived,
    CANCELLED: cp.orderCancelled,
  }
  return map[key] ?? status
}

function formatWhen(iso: string, lang: Language): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') {
    return d.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (lang === 'nl') {
    return d.toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return d.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isNotificationsSessionActive(): boolean {
  if (typeof window === 'undefined') return false
  return readIsLoggedInFromStorage()
}

export default function UserNotificationsPanel({
  compact,
  onItemNavigate,
}: {
  compact?: boolean
  onItemNavigate?: () => void
}) {
  const { t, language } = useLanguage()
  const n = t.notifications
  const cp = t.clientProfile
  const reduceMotion = useReducedMotion()
  const snapshot = useSyncExternalStore(
    subscribeLiveNotifications,
    getLiveNotificationsSnapshot,
    () => getLiveNotificationsSnapshot(),
  )
  const [guestMode, setGuestMode] = useState(() =>
    typeof window === 'undefined' ? false : !isNotificationsSessionActive(),
  )
  useEffect(() => {
    const syncGuest = () => setGuestMode(!isNotificationsSessionActive())
    syncGuest()
    window.addEventListener('userChanged', syncGuest)
    window.addEventListener('storage', syncGuest)
    return () => {
      window.removeEventListener('userChanged', syncGuest)
      window.removeEventListener('storage', syncGuest)
    }
  }, [])

  const onRead = async (item: UserNotificationItem) => {
    const token = localStorage.getItem('token')
    if (!token || item.isRead) return
    await markNotificationRead(token, item.id)
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
  }

  const onReadAll = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    await markAllNotificationsRead(token)
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
  }

  const items = snapshot.items
  const unreadCount = snapshot.unreadCount
  const loading = isNotificationsSessionActive() && snapshot.status === 'loading'

  if (!isNotificationsSessionActive() || guestMode) {
    return (
      <NotificationsGuestPrompt compact={compact} onAuthNavigate={onItemNavigate} />
    )
  }

  if (loading) {
    return (
      <div className={cn('notifications-page-loading-call', compact && 'notifications-page-state--compact')}>
        <div className="notifications-page-loading-call__bell" aria-hidden>
          <Bell size={22} strokeWidth={2} />
        </div>
        <p role="status">{t.clientProfile.loading}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <NotificationsEmptyCallScene subtitle={n.emptySubtext} compact={compact} />
    )
  }

  return (
    <div className={cn('notifications-page-list-wrap', compact && 'notifications-page-list-wrap--compact')}>
      {unreadCount > 0 ? (
        <div className="notifications-page-list-toolbar">
          <span className="notifications-page-list-count" aria-live="polite">
            {unreadCount}
          </span>
          <button type="button" onClick={() => void onReadAll()} className="notifications-page-list-mark-all">
            {n.markAllRead}
          </button>
        </div>
      ) : null}
      <ul className="notifications-page-list">
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const status = orderStatusFromItem(item)
            const statusClass = status ? STATUS_STYLES[status] : 'notifications-page-status--default'
            return (
              <m.li
                key={item.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: Math.min(i * 0.03, 0.2) }}
              >
                <Link
                  href={item.orderId ? `/profile?tab=history&order=${item.orderId}` : '/profile'}
                  draggable={false}
                  onMouseDown={(e) => {
                    if (e.button === 0) e.preventDefault()
                  }}
                  onClick={() => {
                    window.getSelection?.()?.removeAllRanges?.()
                    void onRead(item)
                    onItemNavigate?.()
                  }}
                  className={cn(
                    'notifications-page-card',
                    !item.isRead && 'notifications-page-card--unread',
                  )}
                >
                  <span className="notifications-page-card__icon-wrap" aria-hidden>
                    <span className="notifications-page-card__blob" />
                    <span className="notifications-page-card__ico">
                      <Package strokeWidth={1.35} aria-hidden />
                    </span>
                  </span>
                  <span className="notifications-page-card__body">
                    <span className="notifications-page-card__title">{item.title}</span>
                    {status ? (
                      <span className={cn('notifications-page-status', statusClass)}>
                        {orderStatusLabel(status, cp)}
                      </span>
                    ) : null}
                    <span className="notifications-page-card__text">{item.body}</span>
                    <span className="notifications-page-card__time">
                      {formatWhen(item.createdAt, language)}
                    </span>
                  </span>
                  {!item.isRead ? (
                    <span className="notifications-page-card__dot" aria-hidden />
                  ) : null}
                </Link>
              </m.li>
            )
          })}
        </AnimatePresence>
      </ul>
    </div>
  )
}
