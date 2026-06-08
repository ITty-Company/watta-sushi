const DISMISS_KEY = 'watta_kitchen_closed_modal_dismissed'

export function isKitchenClosedModalDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(DISMISS_KEY) === '1'
}

export function dismissKitchenClosedModal(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(DISMISS_KEY, '1')
}

export function clearKitchenClosedModalDismissed(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(DISMISS_KEY)
}
