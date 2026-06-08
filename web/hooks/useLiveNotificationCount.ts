'use client'

import { useSyncExternalStore } from 'react'
import {
  getLiveNotificationsSnapshot,
  subscribeLiveNotifications,
  type LiveNotificationsSnapshot,
} from '@/lib/liveNotificationsStore'

export type LiveNotificationSnapshot = {
  unreadCount: number
  latestUnread: LiveNotificationsSnapshot['latestUnread']
}

/** Глобальний лічильник непрочитаних + останнє непрочитане (для тостів). */
export function useLiveNotificationCount(_pollMs?: number): LiveNotificationSnapshot {
  const snapshot = useSyncExternalStore(
    subscribeLiveNotifications,
    getLiveNotificationsSnapshot,
    () => getLiveNotificationsSnapshot(),
  )

  return {
    unreadCount: snapshot.unreadCount,
    latestUnread: snapshot.latestUnread,
  }
}
