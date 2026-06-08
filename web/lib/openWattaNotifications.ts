type RouterPush = { push: (href: string) => void }
type OpenNotificationsDrawer = () => void

/** Відкриває панель сповіщень поверх поточної сторінки (без повноекранного маршруту). */
export function openWattaNotifications(
  router: RouterPush,
  openDrawer?: OpenNotificationsDrawer | null,
): void {
  if (openDrawer) {
    openDrawer()
    return
  }
  router.push('/notifications')
}
