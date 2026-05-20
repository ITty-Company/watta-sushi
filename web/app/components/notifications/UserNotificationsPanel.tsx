'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Package } from 'lucide-react'
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotificationItem,
  WATTA_NOTIFICATIONS_CHANGED_EVENT,
} from '@/lib/userNotificationsApi'
import { useLanguage } from '@/app/context/LanguageContext'

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

export default function UserNotificationsPanel({ compact }: { compact?: boolean }) {
  const { t } = useLanguage()
  const n = t.notifications
  const [items, setItems] = useState<UserNotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await fetchMyNotifications(token)
      setItems(data.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const onChange = () => void load()
    window.addEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(WATTA_NOTIFICATIONS_CHANGED_EVENT, onChange)
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
      <p className={`text-center text-sm text-gray-500 ${compact ? 'py-10' : 'py-16'}`}>
        {t.clientProfile.loading}
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`flex flex-col items-center text-center ${compact ? 'px-4 py-10' : 'px-6 py-14 sm:py-16'}`}>
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Bell className="h-10 w-10 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="mb-2 text-lg font-black text-gray-900">{n.empty}</h3>
        <p className="max-w-[280px] text-sm text-gray-500">{n.emptySubtext}</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'px-2 py-2' : 'px-4 py-4 sm:px-5'}>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => void onReadAll()}
          className="text-xs font-bold text-[#145142] hover:underline"
        >
          {n.markAllRead}
        </button>
      </div>
      <ul className="max-h-[min(60vh,420px)] space-y-2 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.orderId ? `/profile?tab=history&order=${item.orderId}` : '/profile'}
              onClick={() => void onRead(item)}
              className={`flex gap-3 rounded-2xl border p-3.5 transition hover:shadow-sm ${
                item.isRead
                  ? 'border-gray-100 bg-gray-50/80'
                  : 'border-[#145142]/15 bg-emerald-50/40'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  item.isRead ? 'bg-gray-200 text-gray-600' : 'bg-[#145142] text-white'
                }`}
              >
                <Package className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-bold text-gray-900">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-600">{item.body}</span>
                <span className="mt-1 block text-[10px] font-medium text-gray-400">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </span>
              {!item.isRead ? (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ff6b35]" aria-hidden />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
