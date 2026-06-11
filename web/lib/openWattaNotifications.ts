type RouterPush = { push: (href: string) => void }
type OpenNotificationsDrawer = () => void

export const WATTA_NOTIFICATIONS_OPEN_EVENT = 'wattaNotificationsOpen'

/** Відкриває бічну панель сповіщень поверх поточної сторінки. */
export function openWattaNotifications(
  _router: RouterPush,
  openDrawer?: OpenNotificationsDrawer | null,
): void {
  if (openDrawer) {
    openDrawer()
    return
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(WATTA_NOTIFICATIONS_OPEN_EVENT))
  }
}
