'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Bell } from 'lucide-react'
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
import { useLanguage } from '@/app/context/LanguageContext'
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

function formatWhen(iso: string, lang: string): string {
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

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem('token')?.trim())
}

export default function UserNotificationsPanel({ compact }: { compact?: boolean }) {
  const { t, language } = useLanguage()
  const n = t.notifications
  const reduceMotion = useReducedMotion()
  const snapshot = useSyncExternalStore(
    subscribeLiveNotifications,
    getLiveNotificationsSnapshot,
    () => getLiveNotificationsSnapshot(),
  )
  const [guestMode, setGuestMode] = useState(() =>
    typeof window === 'undefined' ? false : !hasAuthToken(),
  )
  useEffect(() => {
    const syncGuest = () => setGuestMode(!hasAuthToken())
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
  const loading = hasAuthToken() && snapshot.status === 'loading'

  if (!hasAuthToken() || guestMode) {
    return <NotificationsGuestPrompt compact={compact} />
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
      <div className="notifications-page-list-toolbar">
        {unreadCount > 0 ? (
          <span className="notifications-page-list-count" aria-live="polite">
            {unreadCount}
          </span>
        ) : (
          <span className="notifications-page-list-count notifications-page-list-count--muted" aria-live="polite">
            —
          </span>
        )}
        <button type="button" onClick={() => void onReadAll()} className="notifications-page-list-mark-all">
          {n.markAllRead}
        </button>
      </div>
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
                  onClick={() => void onRead(item)}
                  className={cn(
                    'notifications-page-card',
                    !item.isRead && 'notifications-page-card--unread',
                  )}
                >
                  <span
                    className={cn(
                      'notifications-page-card__ico',
                      !item.isRead && 'notifications-page-card__ico--unread',
                    )}
                  >
                    <Package className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="notifications-page-card__body">
                    <span className="notifications-page-card__row">
                      <span className="notifications-page-card__title">{item.title}</span>
                      {status ? (
                        <span className={cn('notifications-page-status', statusClass)}>{status}</span>
                      ) : null}
                    </span>
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
