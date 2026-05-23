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
import { WATTA_CHROME_LAYOUT_SYNC_EVENT } from '@/lib/wattaChromeGoHome'

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
}

/**
 * Мінімальна поправка до грубого ceil(getBoundingClientRect) — тіні / WebKit
 * залишали в потоці на ~1–2 px зайвого місця, інколи виглядали як 10–32 px «повітря» до героя.
 */
const defaultFlowHeightFudgePx = 10
/** Захист від рідких стрибків виміру (ResizeObserver/WebKit), що створювали величезний порожній відступ. */
const DEFAULT_FLOW_LAYOUT_MAX_PX = 320

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
}: WattaStickyChromeLayoutProps) {
  const [flowH, setFlowH] = useState(0)
  const [headerFlowH, setHeaderFlowH] = useState(0)
  const localRef = useRef<HTMLDivElement | null>(null)

  const toFlowLayoutHeight = useCallback(
    (raw: number) => {
      if (raw < 8) return 0
      return Math.min(flowHeightMaxPx, Math.max(8, Math.ceil(raw) - flowHeightFudgePx))
    },
    [flowHeightFudgePx, flowHeightMaxPx],
  )

  const syncMeasuredCssVars = useCallback((el: HTMLDivElement) => {
    const root = document.documentElement
    const raw = el.offsetHeight
    const headerEl = el.querySelector<HTMLElement>('.watta-chrome-top-band-web')
    const headerRaw = headerEl?.offsetHeight ?? 0
    if (raw >= 8) {
      root.style.setProperty('--watta-sticky-chrome-measured-h', `${raw}px`)
    }
    if (headerRaw >= 8) {
      root.style.setProperty('--watta-chrome-header-measured-h', `${headerRaw}px`)
    }
    if (raw >= 8 && headerRaw >= 8) {
      root.style.setProperty(
        '--watta-chrome-categories-band-h',
        `${Math.max(0, raw - headerRaw)}px`,
      )
    }
  }, [])

  const setInnerNode = useCallback(
    (el: HTMLDivElement | null) => {
      localRef.current = el
      if (innerRef) {
        (innerRef as MutableRefObject<HTMLDivElement | null>).current = el
      }
      if (el) {
        const h = toFlowLayoutHeight(el.offsetHeight)
        if (h >= 8) {
          setFlowH((prev) => (Math.abs(prev - h) > 1 ? h : prev))
        }
        syncMeasuredCssVars(el)
      }
    },
    [innerRef, toFlowLayoutHeight, syncMeasuredCssVars],
  )

  useLayoutEffect(() => {
    const el = localRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const h = toFlowLayoutHeight(el.offsetHeight)
      if (h < 8) return
      setFlowH((prev) => (Math.abs(prev - h) > 1 ? h : prev))
      const headerEl = el.querySelector<HTMLElement>('.watta-chrome-top-band-web')
      const headerRaw = headerEl?.offsetHeight ?? 0
      if (headerRaw >= 8) {
        const headerFlow = toFlowLayoutHeight(headerRaw)
        setHeaderFlowH((prev) => (Math.abs(prev - headerFlow) > 1 ? headerFlow : prev))
      }
      syncMeasuredCssVars(el)
    }
    measure()
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(el)
    const onResize = () => measure()
    const onLayoutSync = () => measure()
    window.addEventListener('resize', onResize)
    window.addEventListener(WATTA_CHROME_LAYOUT_SYNC_EVENT, onLayoutSync)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener(WATTA_CHROME_LAYOUT_SYNC_EVENT, onLayoutSync)
    }
  }, [children, chromeClassName, toFlowLayoutHeight, flowHeightFudgePx, flowHeightMaxPx, syncMeasuredCssVars])

  useLayoutEffect(() => {
    const el = localRef.current
    const root = document.documentElement
    if (!el) return
    const anchorFlowH =
      flowAnchorHeaderOnly && headerFlowH >= 8 ? headerFlowH : flowH
    if (flowH >= 8) {
      root.style.setProperty('--watta-sticky-chrome-flow-h', `${flowH}px`)
    }
    if (anchorFlowH >= 8) {
      root.style.setProperty('--watta-sticky-chrome-anchor-h', `${anchorFlowH}px`)
    }
  }, [flowH, headerFlowH, flowAnchorHeaderOnly])

  return (
    <div
      className={clsx(
        'watta-sticky-chrome-flow-anchor shrink-0 w-full',
        flowAnchorHeaderOnly && 'watta-sticky-chrome-flow-anchor--header-only',
      )}
    >
      <div
        ref={setInnerNode}
        data-watta-sticky-chrome-portal=""
        className={clsx(
          'watta-sticky-chrome-portal fixed top-0 left-0 right-0 z-[200] w-full max-w-[100vw] pointer-events-auto',
          chromeClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
