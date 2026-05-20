'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

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
}

/**
 * Мінімальна поправка до грубого ceil(getBoundingClientRect) — тіні / WebKit
 * залишали в потоці на ~1–2 px зайвого місця, інколи виглядали як 10–32 px «повітря» до героя.
 */
const defaultFlowHeightFudgePx = 10
/** Захист від рідких стрибків виміру (ResizeObserver/WebKit), що створювали величезний порожній відступ. */
const DEFAULT_FLOW_LAYOUT_MAX_PX = 320

/**
 * Липка верхня зона: fixed до viewport (portal на body) + резерв висоти в потоці.
 * Portal потрібен: .content-web на головній скролиться з overflow — інакше fixed «пливе» разом із контентом.
 */
export default function WattaStickyChromeLayout({
  children,
  chromeClassName,
  innerRef,
  flowHeightFudgePx = defaultFlowHeightFudgePx,
  flowHeightMaxPx = DEFAULT_FLOW_LAYOUT_MAX_PX,
}: WattaStickyChromeLayoutProps) {
  const [flowH, setFlowH] = useState(0)
  const [portalReady, setPortalReady] = useState(false)
  const localRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  const toFlowLayoutHeight = useCallback(
    (raw: number) => {
      if (raw < 8) return 0
      /* ceil — трохи більший резерв, щоб fixed chrome не накривав перший блок контенту / футер */
      return Math.min(flowHeightMaxPx, Math.max(8, Math.ceil(raw) - flowHeightFudgePx))
    },
    [flowHeightFudgePx, flowHeightMaxPx]
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
  }, [children, chromeClassName, toFlowLayoutHeight, flowHeightFudgePx, flowHeightMaxPx])

  useLayoutEffect(() => {
    const el = localRef.current
    const root = document.documentElement
    const sync = () => {
      const raw = el?.offsetHeight ?? 0
      if (raw >= 8) {
        root.style.setProperty('--watta-sticky-chrome-measured-h', `${raw}px`)
      }
      if (flowH >= 8) {
        root.style.setProperty('--watta-sticky-chrome-flow-h', `${flowH}px`)
      }
    }
    sync()
    return () => {
      requestAnimationFrame(() => {
        if (document.querySelector('.watta-sticky-chrome-flow-anchor')) return
        root.style.removeProperty('--watta-sticky-chrome-measured-h')
        root.style.removeProperty('--watta-sticky-chrome-flow-h')
      })
    }
  }, [flowH])

  const anchorStyle: CSSProperties | undefined = flowH
    ? {
        minHeight: flowH,
        ['--watta-sticky-chrome-flow-h' as string]: `${flowH}px`,
      }
    : undefined

  const chromeNode = (
    <div
      ref={setInnerNode}
      data-watta-sticky-chrome-portal=""
      className={clsx(
        'watta-sticky-chrome-portal fixed top-0 left-0 right-0 z-[200] w-full max-w-[100vw] pointer-events-auto',
        chromeClassName
      )}
    >
      {children}
    </div>
  )

  return (
    <div
      className="watta-sticky-chrome-flow-anchor shrink-0 w-full"
      style={anchorStyle}
      aria-hidden={false}
    >
      {portalReady && typeof document !== 'undefined'
        ? createPortal(chromeNode, document.body)
        : null}
    </div>
  )
}
