'use client'

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useWattaChromeScrollCompact } from '@/hooks/useWattaChromeScrollCompact'
import { WATTA_CHROME_LAYOUT_SYNC_EVENT } from '@/lib/wattaChromeGoHome'
import { isWattaChromeCompact } from '@/lib/wattaChromeScroll'
import { isWattaFullMenuPathname, isWattaHomeHeroPathname, isWattaProductPathname } from '@/lib/wattaHtmlRouteClass'
import { isWattaPhoneViewport } from '@/lib/wattaTouchViewport'


type WattaStickyChromeLayoutProps = {
  children: ReactNode
  /** Класи на внутрішньому fixed-блоці: `watta-public-sticky-chrome` або `watta-full-menu-sticky-chrome` */
  chromeClassName: string
  /** Для виміру висоти (scroll-padding, /menu) */
  innerRef?: RefObject<HTMLDivElement>
  /**
   * Віднімається від висоти chrome (offsetHeight, floor), щоб наступний контент не лишав білу смугу під fixed.
   * На головній з героєм — 0, щоб заголовок не ховався під категоріями.
   */
  flowHeightFudgePx?: number
  /** Верхня межа резерву висоти в потоці (шапка + категорії на головній можуть бути >220px). */
  flowHeightMaxPx?: number
  /**
   * Hero-сторінки: у потоці лишаємо лише білу шапку; категорії «висять» над контентом —
   * при скролі відео видно під прозорою зоною до шапки.
   */
  flowAnchorHeaderOnly?: boolean
  /** Додатковий резерв під fixed chrome (напр. /cart — тінь капсули категорій). */
  flowAnchorSafetyPx?: number
}

/**
 * Мінімальна поправка до грубого ceil(getBoundingClientRect) — тіні / WebKit
 * залишали в потоці на ~1–2 px зайвого місця, інколи виглядали як 10–32 px «повітря» до героя.
 */
const defaultFlowHeightFudgePx = 10
/** /product на телефоні: додатковий fudge, щоб контент був щільно під чіпами категорій. */
const PRODUCT_PHONE_FUDGE_PX = 18

/** /menu (телефон): стабільний резерв під повний chrome — шапка fixed, без стрибка товарів. */
function readPhoneStableFlowAnchorPx(): number {
  if (typeof document === 'undefined') return 0
  const cs = getComputedStyle(document.documentElement)
  const safe = Math.max(0, parseFloat(cs.getPropertyValue('env(safe-area-inset-top)')) || 0)
  const measured = parseFloat(cs.getPropertyValue('--watta-sticky-chrome-measured-h'))
  const chrome = Number.isFinite(measured) && measured >= 72 ? measured : 140
  return Math.round(chrome + safe)
}

function readMenuPhoneFlowAnchorPx(): number {
  return readPhoneStableFlowAnchorPx()
}

function readProductPhoneFlowAnchorPx(): number {
  return readPhoneStableFlowAnchorPx()
}

/** /product (телефон): compact одразу — header у CSS схований, зберігаємо повну висоту для flow-anchor. */
function seedProductPhoneExpandedChromeRefs(
  raw: number,
  headerRaw: number,
  expandedRawRef: MutableRefObject<number>,
  expandedHeaderRef: MutableRefObject<number>,
): void {
  if (typeof document === 'undefined') return
  const cs = getComputedStyle(document.documentElement)
  const headerFromVar = parseFloat(cs.getPropertyValue('--watta-chrome-header-measured-h'))
  const bandFromVar = parseFloat(cs.getPropertyValue('--watta-chrome-categories-band-h'))
  const headerGuess =
    headerRaw >= 8
      ? headerRaw
      : Number.isFinite(headerFromVar) && headerFromVar >= 36
        ? headerFromVar
        : 76
  const bandGuess =
    raw >= 8
      ? raw
      : Number.isFinite(bandFromVar) && bandFromVar >= 36
        ? bandFromVar
        : 54
  if (headerRaw < 8 && raw >= 8) {
    expandedRawRef.current = Math.max(expandedRawRef.current, Math.round(bandGuess + headerGuess))
  } else if (raw >= 8) {
    expandedRawRef.current = Math.max(expandedRawRef.current, raw)
  }
  if (headerGuess >= 8) {
    expandedHeaderRef.current = Math.max(expandedHeaderRef.current, Math.round(headerGuess))
  }
}
/** Захист від рідких стрибків виміру (ResizeObserver/WebKit), що створювали величезний порожній відступ. */
const DEFAULT_FLOW_LAYOUT_MAX_PX = 320
/** Планшет/ПК: квантуємо вимір chrome — інакше ±1px у ResizeObserver смикає flow-anchor і картки. */
const CHROME_MEASURE_QUANTUM_PX = 4
const CHROME_FLOW_HYSTERESIS_PX = 8

function quantizeChromeMeasurePx(px: number): number {
  if (px < 8) return 0
  return Math.round(px / CHROME_MEASURE_QUANTUM_PX) * CHROME_MEASURE_QUANTUM_PX
}

function shouldPublishFlowHeight(prev: number, next: number): boolean {
  if (next < 8) return false
  if (prev < 8) return true
  return Math.abs(prev - next) >= CHROME_FLOW_HYSTERESIS_PX
}

/**
 * Липка верхня зона: fixed у потоці (без portal — однаковий SSR/клієнт, без hydration error).
 * Chrome у <main>, не всередині .content-web — fixed привʼязаний до viewport.
 */
export default function WattaStickyChromeLayout({
  children,
  chromeClassName,
  innerRef,
  flowHeightFudgePx = defaultFlowHeightFudgePx,
  flowHeightMaxPx = DEFAULT_FLOW_LAYOUT_MAX_PX,
  flowAnchorHeaderOnly = false,
  flowAnchorSafetyPx = 0,
}: WattaStickyChromeLayoutProps) {
  /** Усі публічні сторінки: скрол вниз — ховає шапку, вгору — показує (усі viewport). */
  useWattaChromeScrollCompact(true)

  const pathname = usePathname() || '/'
  const isProductPage = isWattaProductPathname(pathname)
  const isFullMenuPage = isWattaFullMenuPathname(pathname)

  const [flowH, setFlowH] = useState(0)
  const [rawChromeH, setRawChromeH] = useState(0)
  const [headerFlowH, setHeaderFlowH] = useState(0)
  const localRef = useRef<HTMLDivElement | null>(null)
  const lastChromeWidthRef = useRef<number | null>(null)
  /** Повна висота chrome до compact — flow-anchor не стискається, інакше scroll «зависає». */
  const expandedRawRef = useRef(0)

  /** Головна + /menu + /product (телефон): flow-anchor не стискається при hide шапки. */
  const preserveExpandedChromeHeightInCompact = () => {
    if (!isWattaPhoneViewport()) return false
    return isFullMenuPage || isWattaHomeHeroPathname(pathname) || isProductPage
  }
  const expandedHeaderRef = useRef(0)
  /** Кеш опублікованих значень — setProperty на <html> інакше перераховує стилі всього документа. */
  const publishedCssVarsRef = useRef({
    measuredH: '',
    headerH: '',
    bandH: '',
    flowH: '',
    anchorH: '',
  })

  const setRootCssVar = useCallback((name: string, px: number, cacheKey: keyof typeof publishedCssVarsRef.current) => {
    if (px < 8) return
    const next = `${px}px`
    const cache = publishedCssVarsRef.current
    if (cache[cacheKey] === next) return
    cache[cacheKey] = next
    document.documentElement.style.setProperty(name, next)
  }, [])

  const toFlowLayoutHeight = useCallback(
    (raw: number) => {
      if (raw < 8) return 0
      return Math.min(flowHeightMaxPx, Math.max(8, Math.ceil(raw) - flowHeightFudgePx))
    },
    [flowHeightFudgePx, flowHeightMaxPx],
  )

  const syncMeasuredCssVars = useCallback(
    (el: HTMLDivElement) => {
      const isCompact = isWattaChromeCompact()
      const raw = el.offsetHeight
      const headerEl = el.querySelector<HTMLElement>('.watta-chrome-top-band-web')
      const headerRaw = headerEl?.offsetHeight ?? 0
      const keepExpanded = preserveExpandedChromeHeightInCompact()
      const effectiveRaw =
        isCompact && keepExpanded && expandedRawRef.current >= 8 ? expandedRawRef.current : raw
      const effectiveHeader =
        isCompact && keepExpanded && expandedHeaderRef.current >= 8
          ? expandedHeaderRef.current
          : headerRaw
      const measuredH = quantizeChromeMeasurePx(effectiveRaw)
      const headerH = quantizeChromeMeasurePx(effectiveHeader)
      setRootCssVar('--watta-sticky-chrome-measured-h', measuredH, 'measuredH')
      setRootCssVar('--watta-chrome-header-measured-h', headerH, 'headerH')
      if (measuredH >= 8 && headerH >= 8) {
        setRootCssVar(
          '--watta-chrome-categories-band-h',
          Math.max(0, measuredH - headerH),
          'bandH',
        )
      }
    },
    [setRootCssVar],
  )

  const setInnerNode = useCallback(
    (el: HTMLDivElement | null) => {
      localRef.current = el
      if (innerRef) {
        (innerRef as MutableRefObject<HTMLDivElement | null>).current = el
      }
      if (el) {
        const isCompact = isWattaChromeCompact()
        const raw = el.offsetHeight
        const headerEl = el.querySelector<HTMLElement>('.watta-chrome-top-band-web')
        const headerRaw = headerEl?.offsetHeight ?? 0
        if (isProductPage && isWattaPhoneViewport()) {
          seedProductPhoneExpandedChromeRefs(raw, headerRaw, expandedRawRef, expandedHeaderRef)
        }
        /**
         * На /product: useLayoutEffect ще не додав watta-route-product class,
         * тому CSS html.watta-route-product .watta-chrome-top-band-web { max-height:0 }
         * не ховає header. Віднімаємо висоту header, щоб flow-anchor одразу отримав
         * компактну висоту (тільки категорії) без 140px-стрибка.
         */
        /** Тільки телефон: на /product CSS ховає header до useLayoutEffect. */
        const productPhoneCompact = isProductPage && !isCompact && headerRaw >= 8 && isWattaPhoneViewport()
        const productRaw = productPhoneCompact
          ? Math.max(8, raw - headerRaw)
          : raw
        if (!isCompact && raw >= 8) expandedRawRef.current = raw
        const keepExpanded = preserveExpandedChromeHeightInCompact()
        const effectiveRaw =
          isCompact && keepExpanded && expandedRawRef.current >= 8 ? expandedRawRef.current : productRaw
        const layoutRaw =
          isCompact &&
          preserveExpandedChromeHeightInCompact() &&
          expandedRawRef.current >= 8
            ? expandedRawRef.current
            : effectiveRaw
        const quantizedLayoutRaw = quantizeChromeMeasurePx(layoutRaw)
        const isProductPhone = isProductPage && isWattaPhoneViewport()
        const productExtraFudge = isProductPhone ? PRODUCT_PHONE_FUDGE_PX : 0
        const h = toFlowLayoutHeight(Math.max(8, quantizedLayoutRaw - productExtraFudge))
        if (quantizedLayoutRaw >= 8) {
          setRawChromeH((prev) => (shouldPublishFlowHeight(prev, quantizedLayoutRaw) ? quantizedLayoutRaw : prev))
        }
        if (h >= 8) {
          setFlowH((prev) => (shouldPublishFlowHeight(prev, h) ? h : prev))
        }
        syncMeasuredCssVars(el)
      }
    },
    [innerRef, isProductPage, toFlowLayoutHeight, syncMeasuredCssVars],
  )

  useLayoutEffect(() => {
    const el = localRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const isCompact = isWattaChromeCompact()
      const raw = el.offsetHeight
      const headerEl = el.querySelector<HTMLElement>('.watta-chrome-top-band-web')
      const headerRaw = headerEl?.offsetHeight ?? 0

      if (isProductPage && isWattaPhoneViewport()) {
        seedProductPhoneExpandedChromeRefs(raw, headerRaw, expandedRawRef, expandedHeaderRef)
      }

      if (!isCompact) {
        if (raw >= 8) expandedRawRef.current = raw
        if (headerRaw >= 8) expandedHeaderRef.current = headerRaw
      }

      const keepExpanded = preserveExpandedChromeHeightInCompact()
      const effectiveRaw =
        isCompact && keepExpanded && expandedRawRef.current >= 8 ? expandedRawRef.current : raw
      const effectiveHeader =
        isCompact && keepExpanded && expandedHeaderRef.current >= 8
          ? expandedHeaderRef.current
          : headerRaw

      const layoutRaw =
        isCompact &&
        preserveExpandedChromeHeightInCompact() &&
        expandedRawRef.current >= 8
          ? expandedRawRef.current
          : effectiveRaw
      const quantizedLayoutRaw = quantizeChromeMeasurePx(layoutRaw)
      const productExtraFudge =
        isProductPage && isWattaPhoneViewport() && isCompact ? PRODUCT_PHONE_FUDGE_PX : 0
      const h = toFlowLayoutHeight(Math.max(8, quantizedLayoutRaw - productExtraFudge))
      if (quantizedLayoutRaw >= 8) {
        setRawChromeH((prev) => (shouldPublishFlowHeight(prev, quantizedLayoutRaw) ? quantizedLayoutRaw : prev))
      }
      if (h < 8) return
      setFlowH((prev) => (shouldPublishFlowHeight(prev, h) ? h : prev))
      if (effectiveHeader >= 8) {
        const headerFlow = toFlowLayoutHeight(quantizeChromeMeasurePx(effectiveHeader))
        setHeaderFlowH((prev) => (shouldPublishFlowHeight(prev, headerFlow) ? headerFlow : prev))
      }
      syncMeasuredCssVars(el)
    }
    measure()
    let scrollMeasureTimer = 0
    const scheduleMeasure = () => {
      if (typeof document !== 'undefined' && document.documentElement.dataset.wattaScrolling === 'true') {
        window.clearTimeout(scrollMeasureTimer)
        scrollMeasureTimer = window.setTimeout(scheduleMeasure, 180)
        return
      }
      requestAnimationFrame(measure)
    }
    const ro = new ResizeObserver(() => {
      scheduleMeasure()
    })
    ro.observe(el)
    const onResize = () => {
      if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
        const w = window.innerWidth
        if (lastChromeWidthRef.current !== null && lastChromeWidthRef.current === w) return
        lastChromeWidthRef.current = w
      }
      measure()
    }
    lastChromeWidthRef.current = typeof window !== 'undefined' ? window.innerWidth : null
    const onLayoutSync = () => measure()
    const onCompactChange = () => {
      // Compact без стискання flow-anchor — висота в потоці не змінюється, вимір зайвий.
      if (preserveExpandedChromeHeightInCompact()) return
      measure()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener(WATTA_CHROME_LAYOUT_SYNC_EVENT, onLayoutSync)
    window.addEventListener('wattaChromeCompactChange', onCompactChange)
    return () => {
      window.clearTimeout(scrollMeasureTimer)
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener(WATTA_CHROME_LAYOUT_SYNC_EVENT, onLayoutSync)
      window.removeEventListener('wattaChromeCompactChange', onCompactChange)
    }
  }, [chromeClassName, toFlowLayoutHeight, syncMeasuredCssVars])

  useLayoutEffect(() => {
    if (!localRef.current) return
    const anchorFlowH =
      flowAnchorHeaderOnly && headerFlowH >= 8 ? headerFlowH : flowH
    setRootCssVar('--watta-sticky-chrome-flow-h', flowH, 'flowH')
    setRootCssVar('--watta-sticky-chrome-anchor-h', anchorFlowH, 'anchorH')
  }, [flowH, headerFlowH, flowAnchorHeaderOnly, setRootCssVar])

  const anchorFlowH = (() => {
    if (flowAnchorHeaderOnly && headerFlowH >= 8) return headerFlowH
    /** /menu + головна + /product (телефон): фіксований резерв — hide/show шапки не зсуває контент. */
    if (isWattaPhoneViewport() && (isFullMenuPage || isWattaHomeHeroPathname(pathname) || isProductPage)) {
      const stable = readPhoneStableFlowAnchorPx()
      if (stable >= 8) return stable + Math.max(0, flowAnchorSafetyPx)
    }
    /** /product (телефон): резерв під стрічку категорій; fallback якщо stable недоступний. */
    if (isProductPage && isWattaPhoneViewport()) return readProductPhoneFlowAnchorPx()
    const expanded =
      preserveExpandedChromeHeightInCompact() && expandedRawRef.current >= 8
        ? Math.ceil(expandedRawRef.current)
        : rawChromeH >= 8
          ? Math.ceil(rawChromeH)
          : flowH
    /**
     * iOS/WebKit інколи дає стрибок offsetHeight/ResizeObserver і ми отримуємо
     * величезний flow-anchor (білий «екран» під fixed chrome). Обмежуємо зверху.
     */
    const capped = expanded >= 8 ? Math.min(flowHeightMaxPx, expanded) : 0
    return capped >= 8 ? capped + Math.max(0, flowAnchorSafetyPx) : flowH
  })()

  return (
    <div
      className={clsx(
        'watta-sticky-chrome-flow-anchor shrink-0 w-full',
        flowAnchorHeaderOnly && 'watta-sticky-chrome-flow-anchor--header-only',
      )}
      style={
        anchorFlowH >= 8
          ? { minHeight: anchorFlowH, height: anchorFlowH }
          : undefined
      }
    >
      <div
        ref={setInnerNode}
        data-watta-sticky-chrome-portal=""
        className={clsx(
          'watta-sticky-chrome-portal fixed top-0 left-0 right-0 z-[200] w-full max-w-[100vw] pointer-events-none',
          chromeClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
