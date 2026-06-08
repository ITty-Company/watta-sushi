'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Bell } from 'lucide-react'
import NotificationsEmptyCallScene from '@/app/components/notifications/NotificationsEmptyCallScene'
import NotificationsGuestPrompt from '@/app/components/notifications/NotificationsGuestPrompt'
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
  WATTA_NOTIFICATIONS_CHANGED_EVENT,
} from '@/lib/userNotificationsApi'
import { useLanguage } from '@/app/context/LanguageContext'
import { cn } from '@/lib/utils'
import '@/app/watta-notifications-empty.css'

const POLL_MS = 20000

export function useUnreadNotificationCount(pollMs = 45000) {
  const [unread, setUnread] = useState(0)

  const refresh = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setUnread(0)
      return
    }
    try {
      const data = await fetchMyNotifications(token)
      setUnread(data.unreadCount)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
    const id = window.setInterval(() => void refresh(), pollMs)
    return () => {
      window.removeEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
      window.clearInterval(id)
    }
  }, [refresh, pollMs])

  return { unread, refresh }
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
  const [guestMode, setGuestMode] = useState(() =>
    typeof window === 'undefined' ? false : !hasAuthToken(),
  )
  const [items, setItems] = useState<UserNotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(() =>
    typeof window === 'undefined' ? true : hasAuthToken(),
  )
  const [syncing, setSyncing] = useState(false)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!hasAuthToken()) {
      setGuestMode(true)
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    setGuestMode(false)
    const token = localStorage.getItem('token')
    if (!token) {
      setGuestMode(true)
      setItems([])
      setUnreadCount(0)
      setLoading(false)
      return
    }
    if (!opts?.silent) setLoading(true)
    else setSyncing(true)
    try {
      const data = await fetchMyNotifications(token)
      setItems(data.items)
      setUnreadCount(data.unreadCount)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const onChange = () => void load({ silent: true })
    const onAuthChange = () => void load()
    window.addEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
    window.addEventListener('userChanged', onAuthChange)
    window.addEventListener('storage', onAuthChange)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisible)
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void load({ silent: true })
    }, POLL_MS)
    return () => {
      window.removeEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
      window.removeEventListener('userChanged', onAuthChange)
      window.removeEventListener('storage', onAuthChange)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(id)
    }
  }, [load])

  const onRead = async (item: UserNotificationItem) => {
    const token = localStorage.getItem('token')
    if (!token || item.isRead) return
    await markNotificationRead(token, item.id)
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, isRead: true } : x)))
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
  }

  const onReadAll = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    await markAllNotificationsRead(token)
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_CHANGED_EVENT))
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

  if (guestMode) {
    return <NotificationsGuestPrompt compact={compact} />
  }

  if (items.length === 0) {
    return (
      <NotificationsEmptyCallScene subtitle={n.emptySubtext} compact={compact} />
    )
  }

  return (
    <div className={cn('notifications-page-list-wrap', compact && 'notifications-page-list-wrap--compact')}>
      <div className="notifications-page-list-toolbar">
        {syncing ? (
          <span className="notifications-page-list-sync" role="status">
            <span className="notifications-page-list-sync__dot" aria-hidden />
            {n.liveActive}
          </span>
        ) : unreadCount > 0 ? (
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
