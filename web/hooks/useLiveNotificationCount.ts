'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  fetchMyNotifications,
  WATTA_NOTIFICATIONS_CHANGED_EVENT,
  type UserNotificationItem,
} from '@/lib/userNotificationsApi'

export type LiveNotificationSnapshot = {
  unreadCount: number
  latestUnread: UserNotificationItem | null
}

const EMPTY: LiveNotificationSnapshot = { unreadCount: 0, latestUnread: null }

function pickLatestUnread(items: UserNotificationItem[]): UserNotificationItem | null {
  for (const item of items) {
    if (!item.isRead) return item
  }
  return null
}

/** Глобальний лічильник непрочитаних + останнє непрочитане (для тостів). */
export function useLiveNotificationCount(pollMs = 30000): LiveNotificationSnapshot {
  const [snapshot, setSnapshot] = useState<LiveNotificationSnapshot>(EMPTY)

  const refresh = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      setSnapshot(EMPTY)
      return
    }
    try {
      const data = await fetchMyNotifications(token)
      setSnapshot({
        unreadCount: data.unreadCount,
        latestUnread: pickLatestUnread(data.items),
      })
    } catch {
      setSnapshot(EMPTY)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
    window.addEventListener('storage', onChange)
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refresh()
    }, pollMs)
    return () => {
      window.removeEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
      window.removeEventListener('storage', onChange)
      window.clearInterval(id)
    }
  }, [pollMs, refresh])

  return snapshot
}
