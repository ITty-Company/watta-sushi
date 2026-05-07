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

type WattaStickyChromeLayoutProps = {
  children: ReactNode
  /** Класи на внутрішньому fixed-блоці: `watta-public-sticky-chrome` або `watta-full-menu-sticky-chrome` */
  chromeClassName: string
  /** Для виміру висоти (scroll-padding, /menu) */
  innerRef?: RefObject<HTMLDivElement>
  /**
   * Віднімається від висоти chrome (offsetHeight, floor), щоб наступний контент не лишав білу смугу під fixed.
   * На головній з героєм — більше, ніж дефолт 10 (напр. 32–40).
   */
  flowHeightFudgePx?: number
}

/**
 * Мінімальна поправка до грубого ceil(getBoundingClientRect) — тіні / WebKit
 * залишали в потоці на ~1–2 px зайвого місця, інколи виглядали як 10–32 px «повітря» до героя.
 */
const defaultFlowHeightFudgePx = 10
/** Захист від рідких стрибків виміру (ResizeObserver/WebKit), що створювали величезний порожній відступ. */
const MAX_FLOW_LAYOUT_HEIGHT = 220

/**
 * Липка верхня зона: fixed до viewport + резерв висоти в потоці, щоб контент не їхав під шапку.
 * Надійніше, ніж position: sticky, при nested overflow / WebKit.
 */
export default function WattaStickyChromeLayout({
  children,
  chromeClassName,
  innerRef,
  flowHeightFudgePx = defaultFlowHeightFudgePx,
}: WattaStickyChromeLayoutProps) {
  const [flowH, setFlowH] = useState(0)
  const localRef = useRef<HTMLDivElement | null>(null)

  const toFlowLayoutHeight = useCallback(
    (raw: number) => {
      if (raw < 8) return 0
      /* floor — менший резерв, ніж ceil; менше «зайвого повітря» до героя */
      return Math.min(MAX_FLOW_LAYOUT_HEIGHT, Math.max(8, Math.floor(raw) - flowHeightFudgePx))
    },
    [flowHeightFudgePx]
  )

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
      }
    },
    [innerRef, toFlowLayoutHeight]
  )

  useLayoutEffect(() => {
    const el = localRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const h = toFlowLayoutHeight(el.offsetHeight)
      if (h < 8) return
      setFlowH((prev) => (Math.abs(prev - h) > 1 ? h : prev))
    }
    measure()
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure)
    })
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [children, chromeClassName, toFlowLayoutHeight, flowHeightFudgePx])

  return (
    <div
      className="watta-sticky-chrome-flow-anchor shrink-0 w-full"
      style={{ minHeight: flowH || undefined }}
      aria-hidden={false}
    >
      <div
        ref={setInnerNode}
        className={clsx(
          'fixed top-0 left-0 right-0 z-[100] w-full max-w-[100vw] pointer-events-auto',
          chromeClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
