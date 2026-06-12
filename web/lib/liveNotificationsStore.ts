'use client'

import { readIsLoggedInFromStorage } from '@/lib/isAdminRole'
import {
  fetchMyNotifications,
  WATTA_NOTIFICATIONS_CHANGED_EVENT,
  type UserNotificationItem,
} from '@/lib/userNotificationsApi'

export type LiveNotificationsSnapshot = {
  items: UserNotificationItem[]
  unreadCount: number
  latestUnread: UserNotificationItem | null
  status: 'idle' | 'loading' | 'ready' | 'error'
}

const EMPTY: LiveNotificationsSnapshot = {
  items: [],
  unreadCount: 0,
  latestUnread: null,
  status: 'idle',
}

type Listener = () => void

let snapshot: LiveNotificationsSnapshot = EMPTY
const listeners = new Set<Listener>()
let pollTimer: ReturnType<typeof setInterval> | null = null
let inflight: Promise<void> | null = null
let subscriberCount = 0
let failureStreak = 0
let globalsBound = false

const BASE_POLL_MS = 30_000
const MAX_POLL_MS = 120_000

function pickLatestUnread(items: UserNotificationItem[]): UserNotificationItem | null {
  for (const item of items) {
    if (!item.isRead) return item
  }
  return null
}

function emit() {
  listeners.forEach((listener) => listener())
}

function pollIntervalMs(): number {
  if (failureStreak <= 0) return BASE_POLL_MS
  return Math.min(MAX_POLL_MS, BASE_POLL_MS * 2 ** Math.min(failureStreak, 3))
}

function schedulePoll() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = null
  if (subscriberCount <= 0) return
  pollTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    void refreshInternal()
  }, pollIntervalMs())
}

async function refreshInternal(): Promise<void> {
  if (inflight) return inflight

  if (typeof window === 'undefined' || !readIsLoggedInFromStorage()) {
    snapshot = EMPTY
    emit()
    return
  }

  const token = localStorage.getItem('token')?.trim()
  if (!token) {
    snapshot = EMPTY
    emit()
    return
  }

  const firstLoad = snapshot.status === 'idle'
  if (firstLoad) {
    snapshot = { ...snapshot, status: 'loading' }
    emit()
  }

  inflight = (async () => {
    try {
      const data = await fetchMyNotifications(token)
      snapshot = {
        items: data.items,
        unreadCount: data.unreadCount,
        latestUnread: pickLatestUnread(data.items),
        status: 'ready',
      }
      failureStreak = 0
    } catch {
      if (firstLoad) {
        snapshot = { ...EMPTY, status: 'error' }
      }
      failureStreak += 1
    } finally {
      inflight = null
      emit()
      schedulePoll()
    }
  })()

  return inflight
}

function onExternalChange() {
  failureStreak = 0
  void refreshInternal()
}

function bindGlobalListeners() {
  if (typeof window === 'undefined' || globalsBound) return
  globalsBound = true
  window.addEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onExternalChange)
  window.addEventListener('storage', onExternalChange)
  window.addEventListener('userChanged', onExternalChange)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshInternal()
  })
}

export function getLiveNotificationsSnapshot(): LiveNotificationsSnapshot {
  return snapshot
}

export function subscribeLiveNotifications(listener: Listener): () => void {
  if (typeof window === 'undefined') return () => {}

  listeners.add(listener)
  subscriberCount += 1
  bindGlobalListeners()

  if (subscriberCount === 1) {
    void refreshInternal()
    schedulePoll()
  }

  return () => {
    listeners.delete(listener)
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0 && pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }
}

export function refreshLiveNotifications(): Promise<void> {
  failureStreak = 0
  return refreshInternal()
}
