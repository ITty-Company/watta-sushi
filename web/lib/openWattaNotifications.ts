type RouterPush = { push: (href: string) => void }
type OpenNotificationsDrawer = () => void

/** Відкриває панель сповіщень поверх поточної сторінки (без повноекранного маршруту). */
export function openWattaNotifications(
  router: RouterPush,
  openDrawer?: OpenNotificationsDrawer | null,
): void {
  const onNotificationsPage =
    typeof window !== 'undefined' && window.location.pathname === '/notifications'
  if (onNotificationsPage) return
  if (openDrawer) {
    openDrawer()
    return
  }
  router.push('/notifications')
}
