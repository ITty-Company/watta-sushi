export type UserNotificationItem = {
  id: number
  type: string
  title: string
  body: string
  orderId: number | null
  isRead: boolean
  createdAt: string
  meta?: Record<string, unknown>
}

export type UserNotificationsResponse = {
  items: UserNotificationItem[]
  unreadCount: number
}

export async function fetchMyNotifications(token: string): Promise<UserNotificationsResponse> {
  const res = await fetch('/api/notifications/my', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('notifications_fetch_failed')
  return res.json()
}

export async function markNotificationRead(token: string, id: number): Promise<void> {
  await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  await fetch('/api/notifications/read-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const WATTA_NOTIFICATIONS_CHANGED_EVENT = 'watta:notifications-changed'
