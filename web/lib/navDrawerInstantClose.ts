/** Вимикає анімацію закриття drawer при переході з меню — сторінка змінюється одразу. */
export function markNavDrawerInstantClose(): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-watta-nav-drawer-instant-close', '')
}

export function clearNavDrawerInstantClose(): void {
  if (typeof document === 'undefined') return
  document.documentElement.removeAttribute('data-watta-nav-drawer-instant-close')
}
