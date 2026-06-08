/**
 * Память скролла для back/forward навигации.
 *
 * Проблема: `history.scrollRestoration = 'manual'` + `scrollEntireAppToTop({force})`
 * на кожній зміні маршруту означали, що «Назад» у браузері завжди стрибав на самий верх —
 * браузер не відновлював позицію, як на звичайних сайтах.
 *
 * Рішення без боротьби з native restoration:
 *  - безперервно (throttled через rAF) зберігаємо scrollTop поточного URL у Map;
 *  - на `popstate` (тільки back/forward) піднімаємо прапорець;
 *  - AppClient на зміні pathname питає `consumePopNavigation()` і, якщо це був back/forward,
 *    відновлює збережену позицію (`restoreScrollForCurrentLocation`) замість скролу наверх.
 *
 * Зберігаємо лише в пам'яті вкладки (Map) — після reload браузер і так має власну логіку,
 * а ми не хочемо «оживляти» позицію після F5 (там працює окремий home-reset).
 */

import {
  getVerticalScrollTarget,
  readAppScrollTop,
  readScrollTop,
  runUntilScrollSuccess,
  writeScrollTop,
  type VerticalScrollTarget,
} from '@/lib/menuScroll'

/** Менше цього — вважаємо «верх», не відновлюємо (інакше дрібний шум перебиває scroll-to-top). */
const MIN_RESTORE_PX = 24

const scrollMemory = new Map<string, number>()

let bound = false
let popPending = false
let saveScheduled = false

function locationKey(): string {
  if (typeof window === 'undefined') return ''
  return window.location.pathname + window.location.search
}

function saveCurrentScroll(): void {
  saveScheduled = false
  if (typeof window === 'undefined') return
  const y = readAppScrollTop()
  const key = locationKey()
  if (y > 0) scrollMemory.set(key, y)
  else scrollMemory.delete(key)
}

function scheduleSave(): void {
  if (saveScheduled) return
  saveScheduled = true
  requestAnimationFrame(saveCurrentScroll)
}

function maxScrollTop(target: VerticalScrollTarget): number {
  if (target instanceof Window) {
    const doc = document.documentElement
    return Math.max(0, doc.scrollHeight - doc.clientHeight)
  }
  return Math.max(0, target.scrollHeight - target.clientHeight)
}

/** Підключити один раз: збереження позиції + детект back/forward. */
export function bindWattaScrollMemory(): () => void {
  if (typeof window === 'undefined' || bound) return () => {}
  bound = true

  const onScroll = () => scheduleSave()
  const onPopState = () => {
    popPending = true
  }
  // Останній знімок перед піходом зі сторінки / bfcache.
  const onPageHide = () => saveCurrentScroll()

  document.addEventListener('scroll', onScroll, { passive: true, capture: true })
  window.addEventListener('popstate', onPopState)
  window.addEventListener('pagehide', onPageHide)

  return () => {
    bound = false
    document.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('popstate', onPopState)
    window.removeEventListener('pagehide', onPageHide)
  }
}

/**
 * Чи була остання навігація back/forward. Прапорець завжди скидається при виклику —
 * викликати рівно один раз на кожну зміну pathname (на початку ефекту в AppClient).
 */
export function consumePopNavigation(): boolean {
  const wasPop = popPending
  popPending = false
  return wasPop
}

/**
 * Відновити збережений scrollTop поточного URL (для back/forward).
 * Повертає true, якщо позиція була збережена і відновлення запущено; інакше false
 * (тоді викликаючий код робить звичайний scroll-to-top).
 */
export function restoreScrollForCurrentLocation(): boolean {
  if (typeof window === 'undefined') return false
  const target = getVerticalScrollTarget()
  const saved = scrollMemory.get(locationKey())
  if (typeof saved !== 'number' || saved < MIN_RESTORE_PX) return false

  // Якщо користувач почав скролити вручну під час відновлення — припиняємо.
  let cancelled = false
  const onUserScroll = (ev: Event) => {
    // Власні програмні scrollTo не мають isTrusted=false тут, тому орієнтуємось на wheel/touch/keydown.
    if (ev.type === 'scroll') return
    cancelled = true
    detach()
  }
  const detach = () => {
    window.removeEventListener('wheel', onUserScroll)
    window.removeEventListener('touchmove', onUserScroll)
    window.removeEventListener('keydown', onUserScroll)
  }
  window.addEventListener('wheel', onUserScroll, { passive: true })
  window.addEventListener('touchmove', onUserScroll, { passive: true })
  window.addEventListener('keydown', onUserScroll)

  runUntilScrollSuccess(() => {
    if (cancelled) return true
    const max = maxScrollTop(target)
    const clamped = Math.min(saved, max)
    writeScrollTop(target, clamped, 'auto')
    // Успіх: контент уже достатньо високий і ми на потрібній позиції.
    const reached = Math.abs(readScrollTop(target) - clamped) <= 2
    const tallEnough = max >= saved - 2
    if (reached && tallEnough) {
      detach()
      return true
    }
    return false
  })

  return true
}
