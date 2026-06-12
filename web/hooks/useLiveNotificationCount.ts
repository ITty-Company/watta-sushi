'use client'

import { useSyncExternalStore } from 'react'
import {
  getLiveNotificationsSnapshot,
  subscribeLiveNotifications,
  type LiveNotificationsSnapshot,
} from '@/lib/liveNotificationsStore'
import { readIsLoggedInFromStorage } from '@/lib/isAdminRole'

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

  const loggedIn = readIsLoggedInFromStorage()

  return {
    unreadCount: loggedIn ? snapshot.unreadCount : 0,
    latestUnread: loggedIn ? snapshot.latestUnread : null,
  }
}
