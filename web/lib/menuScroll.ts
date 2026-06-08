import { readFullMenuCategoryHeadingScrollOffset, shouldPreserveMenuCategoryScroll } from '@/lib/wattaChromeScroll'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'

/** Скрол основного меню (`.content-web` на десктопі / body на телефоні). */

export type VerticalScrollTarget = Window | HTMLElement

export function normCategorySlug(s: string): string {
  const t = s.trim().toLowerCase()
  return t.length > 0 ? t : 'misc'
}

function isElementVerticallyScrollable(el: HTMLElement): boolean {
  const oy = getComputedStyle(el).overflowY
  if (oy !== 'auto' && oy !== 'scroll' && oy !== 'overlay') return false
  return el.scrollHeight > el.clientHeight + 2
}

/** Куди йде вертикальний скрол: внутрішній `.content-web` або window/body. */
export function getVerticalScrollTarget(): VerticalScrollTarget {
  if (typeof window === 'undefined') return window as unknown as VerticalScrollTarget
  // Усі маршрути, крім головної: скрол document/body (див. globals.css body:not(.watta-route-home)).
  if (typeof document !== 'undefined' && !document.body.classList.contains('watta-route-home')) {
    return window
  }
  // Головна на телефоні: лише body (watta-mobile-touch-scroll), без вкладеного .content-web.
  if (isWattaPhoneViewport()) {
    return window
  }
  const content =
    (document.querySelector('.content-web--watta-craft') as HTMLElement | null) ??
    (document.querySelector('.content-web') as HTMLElement | null)
  if (content && isElementVerticallyScrollable(content)) return content
  return window
}

export function readScrollTop(target: VerticalScrollTarget): number {
  if (target instanceof Window) return readDocumentScrollTop()
  return target.scrollTop
}

/** Позиція вертикального скролу document/body (головна, /menu, /cart — body scroll). */
export function readDocumentScrollTop(): number {
  if (typeof window === 'undefined') return 0
  return Math.max(
    window.scrollY || 0,
    document.documentElement?.scrollTop || 0,
    document.body?.scrollTop || 0,
  )
}

/**
 * Позиція вертикального скролу для chrome compact / sticky offset.
 * Лише активний scroll target (window на /menu, /delivery тощо або `.content-web` на `/`).
 * Не max по всіх контейнерах — інакше після головної залишається «фантомний» scrollTop і шапка смикається.
 */
export function readAppScrollTop(): number {
  if (typeof window === 'undefined') return 0
  return readScrollTop(getVerticalScrollTarget())
}

/** Слухач вертикального скролу: один capture на document (scroll не bubble, але capture ловить усі контейнери). */
export function bindAppVerticalScroll(onScroll: () => void): () => void {
  if (typeof document === 'undefined') return () => {}
  const opts: AddEventListenerOptions = { passive: true, capture: true }
  document.addEventListener('scroll', onScroll, opts)
  return () => {
    document.removeEventListener('scroll', onScroll, opts)
  }
}

export function writeScrollTop(
  target: VerticalScrollTarget,
  top: number,
  behavior: ScrollBehavior = 'auto',
) {
  const y = Math.max(0, top)
  if (target instanceof Window) {
    target.scrollTo({ top: y, left: 0, behavior })
    document.documentElement.scrollTop = y
    document.body.scrollTop = y
  } else {
    target.scrollTo({ top: y, left: 0, behavior })
  }
}

const MENU_CAT_SCROLL_ACTIVE_CLASS = 'watta-menu-cat-scroll-active'

/** Під час програмного скролу — усі секції з реальною висотою (без content-visibility placeholder). */
export function setMenuCatalogScrollLock(active: boolean): void {
  if (typeof document === 'undefined') return
  document
    .querySelector('.watta-full-menu-page .home-menu-cat-list-web')
    ?.classList.toggle(MENU_CAT_SCROLL_ACTIVE_CLASS, active)
}

export function isMenuCatalogScrollLocked(): boolean {
  if (typeof document === 'undefined') return false
  return Boolean(
    document.querySelector(`.watta-full-menu-page .${MENU_CAT_SCROLL_ACTIVE_CLASS}`),
  )
}

let menuScrollAnimationFrame: number | null = null

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function cancelMenuScrollAnimation(): void {
  if (menuScrollAnimationFrame != null) {
    cancelAnimationFrame(menuScrollAnimationFrame)
    menuScrollAnimationFrame = null
  }
}

export function computeElementScrollTop(
  el: HTMLElement,
  headerOffset: number,
  target: VerticalScrollTarget = getVerticalScrollTarget(),
): number {
  if (target instanceof Window) {
    return Math.max(0, el.getBoundingClientRect().top + readDocumentScrollTop() - headerOffset)
  }
  const containerRect = target.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  const elTopInContainer = elRect.top - containerRect.top + target.scrollTop
  return Math.max(0, elTopInContainer - headerOffset)
}

/** Скрол до заголовка секції /menu — заголовок одразу під повною шапкою (викликати після beginMenuCategoryScrollChromeLock). */
export function scrollFullMenuCategoryHeading(
  el: HTMLElement,
  behavior: ScrollBehavior = 'auto',
): void {
  scrollElementWithChromeOffset(el, readFullMenuCategoryHeadingScrollOffset(), behavior)
}

/** Плавний eased-скрол між секціями /menu (без native smooth — стабільніше, без стрибків). */
export function scrollFullMenuCategoryHeadingEased(
  el: HTMLElement,
  options?: { durationMs?: number },
): Promise<void> {
  return scrollElementWithChromeOffsetEased(el, readFullMenuCategoryHeadingScrollOffset(), options)
}

export function scrollElementWithChromeOffset(
  el: HTMLElement,
  headerOffset: number,
  behavior: ScrollBehavior = 'auto',
) {
  const target = getVerticalScrollTarget()
  writeScrollTop(target, computeElementScrollTop(el, headerOffset, target), behavior)
}

export function scrollElementWithChromeOffsetEased(
  el: HTMLElement,
  headerOffset: number,
  options?: { durationMs?: number },
): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    scrollElementWithChromeOffset(el, headerOffset, 'auto')
    return Promise.resolve()
  }

  cancelMenuScrollAnimation()

  const target = getVerticalScrollTarget()
  const startY = readScrollTop(target)
  const endY = computeElementScrollTop(el, headerOffset, target)
  const delta = endY - startY
  const durationMs = options?.durationMs ?? 420

  if (Math.abs(delta) < 4) return Promise.resolve()

  return new Promise((resolve) => {
    let cancelled = false
    const t0 = performance.now()

    const finish = () => {
      menuScrollAnimationFrame = null
      resolve()
    }

    const cancel = () => {
      if (cancelled) return
      cancelled = true
      cancelMenuScrollAnimation()
      finish()
    }

    const onUserScroll = () => cancel()
    window.addEventListener('wheel', onUserScroll, { passive: true, once: true })
    window.addEventListener('touchmove', onUserScroll, { passive: true, once: true })

    const tick = (now: number) => {
      if (cancelled) return
      const progress = Math.min(1, (now - t0) / durationMs)
      writeScrollTop(target, startY + delta * easeInOutCubic(progress), 'auto')
      if (progress < 1) {
        menuScrollAnimationFrame = requestAnimationFrame(tick)
        return
      }
      window.removeEventListener('wheel', onUserScroll)
      window.removeEventListener('touchmove', onUserScroll)
      finish()
    }

    menuScrollAnimationFrame = requestAnimationFrame(tick)
  })
}

/** Повторні спроби, поки секція ще не змонтована (завантаження каталогу). */
export function runUntilScrollSuccess(
  tryScroll: () => boolean,
  delaysMs: number[] = [0, 32, 64, 120, 200, 350, 550, 800],
) {
  if (typeof window === 'undefined') return
  if (tryScroll()) return
  let i = 0
  const step = () => {
    if (tryScroll()) return
    i += 1
    if (i < delaysMs.length) window.setTimeout(step, delaysMs[i]!)
  }
  requestAnimationFrame(step)
}

/** Головна `/`: скрол до блоку категорії (window або `.content-web`). */
export function scrollHomeCatalogToCategory(slug: string): boolean {
  if (typeof document === 'undefined') return false
  const norm = normCategorySlug(slug)
  const el =
    document.getElementById(`home-menu-cat-${norm}`) ??
    document.getElementById(`home-menu-cat-${slug.trim()}`)
  if (!el) return false
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  const headerOffset = w <= 768 ? 148 : w <= 1024 ? 118 : 168
  scrollElementWithChromeOffset(el, headerOffset, 'auto')
  return true
}

/** @deprecated Використовуйте getVerticalScrollTarget — null означає window. */
export function getMenuScrollParent(el: HTMLElement | null): HTMLElement | null {
  const target = getVerticalScrollTarget()
  if (target instanceof Window) return el?.closest('.content-web') as HTMLElement | null
  return target
}

export function scrollMenuToSelector(selector: string, offset = 20) {
  const target = document.querySelector(selector)
  if (!target || !(target instanceof HTMLElement)) return
  scrollElementWithChromeOffset(target, offset, 'smooth')
}

export function scrollMenuToTop(behavior: ScrollBehavior = 'smooth') {
  writeScrollTop(getVerticalScrollTarget(), 0, behavior)
}

/**
 * Документ + усі `.content-web` (головна з height:100vh — скрол усередині контейнера, не window).
 * Викликати після зміни маршруту або вкладки, щоб зверху була початкова секція.
 */
/** Після F5: не показувати вступ/хіти, поки скрол не на hero (див. critical CSS у layout). */
export function markHomeScrollReady(): void {
  if (typeof document === 'undefined') return
  try {
    document.documentElement.setAttribute('data-watta-scroll-ready', '1')
  } catch {
    /* ignore */
  }
}

export function clearHomeScrollReady(): void {
  if (typeof document === 'undefined') return
  try {
    document.documentElement.removeAttribute('data-watta-scroll-ready')
  } catch {
    /* ignore */
  }
}

function isHomeRouteDocument(): boolean {
  if (typeof document === 'undefined') return false
  return document.body.classList.contains('watta-route-home')
}

/** Якщо користувач уже скролив — не скидати позицію повторними retry (F5/splash). */
const USER_SCROLL_GUARD_PX = 20

let persistentScrollTopGeneration = 0
let persistentScrollCancelBound = false

function cancelPersistentScrollRetries(): void {
  persistentScrollTopGeneration += 1
}

function bindPersistentScrollCancelOnUserScroll(): void {
  if (persistentScrollCancelBound || typeof document === 'undefined') return
  persistentScrollCancelBound = true
  let armed = false
  let baseline = 0
  const arm = () => {
    armed = true
    baseline = readAppScrollTop()
  }
  arm()
  requestAnimationFrame(arm)
  const onScroll = () => {
    if (!armed) return
    const y = readAppScrollTop()
    if (Math.abs(y - baseline) >= USER_SCROLL_GUARD_PX) {
      cancelPersistentScrollRetries()
      if (isHomeRouteDocument()) markHomeScrollReady()
    }
  }
  document.addEventListener('scroll', onScroll, { passive: true, capture: true })
}

export type ScrollEntireAppToTopOptions = {
  /** F5, logo, зміна маршруту — завжди на hero. Retry після mount — ні, якщо користувач уже скролив. */
  force?: boolean
}

export function scrollEntireAppToTop(options?: ScrollEntireAppToTopOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (shouldPreserveMenuCategoryScroll() || isMenuCatalogScrollLocked()) return
  const force = options?.force === true
  const reset = () => {
    if (shouldPreserveMenuCategoryScroll() || isMenuCatalogScrollLocked()) return
    if (!force && readAppScrollTop() > USER_SCROLL_GUARD_PX) {
      if (isHomeRouteDocument()) markHomeScrollReady()
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    document.querySelectorAll<HTMLElement>('.content-web').forEach((el) => {
      el.scrollTop = 0
    })
    if (isHomeRouteDocument() && readAppScrollTop() <= USER_SCROLL_GUARD_PX) {
      markHomeScrollReady()
    }
  }
  reset()
  requestAnimationFrame(() => {
    reset()
    requestAnimationFrame(reset)
  })
  setTimeout(reset, 0)
}

/** Вимкнути автовідновлення скролу браузером після Reload / bfcache. */
export function disableBrowserScrollRestoration(): void {
  if (typeof window === 'undefined') return
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  } catch {
    /* ignore */
  }
}

const HOME_SCROLL_TOP_RETRY_MS = [0, 48, 120, 280] as const
const HOME_SCROLL_READY_FAILSAFE_MS = 480

/**
 * Після F5 на головній: браузер інколи відновлює scrollTop у `.content-web` пізніше за один rAF.
 * Повертає cleanup — скасувати відкладені retry при unmount (напр. SPA → /menu?cat=).
 */
export function scrollEntireAppToTopPersistent(options?: ScrollEntireAppToTopOptions): () => void {
  disableBrowserScrollRestoration()
  bindPersistentScrollCancelOnUserScroll()
  const generation = ++persistentScrollTopGeneration
  const active = () => generation === persistentScrollTopGeneration
  const force = options?.force === true

  if (force && isHomeRouteDocument()) {
    clearHomeScrollReady()
  }
  scrollEntireAppToTop({ force })
  if (typeof window === 'undefined') return () => {}

  const timers: number[] = []
  for (const ms of HOME_SCROLL_TOP_RETRY_MS) {
    timers.push(
      window.setTimeout(() => {
        if (!active()) return
        scrollEntireAppToTop({ force })
      }, ms),
    )
  }
  if (isHomeRouteDocument()) {
    timers.push(
      window.setTimeout(() => {
        if (!active()) return
        markHomeScrollReady()
      }, HOME_SCROLL_READY_FAILSAFE_MS),
    )
  }

  return () => {
    if (generation === persistentScrollTopGeneration) {
      persistentScrollTopGeneration += 1
    }
    for (const id of timers) window.clearTimeout(id)
  }
}
