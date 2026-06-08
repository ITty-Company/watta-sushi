'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'

/** once: false — ефект знову при кожному вході в viewport (вгору і знову вниз). */
export const WATTA_IN_VIEW_FADE_VIEWPORT = {
  once: false,
  amount: 0.08,
  margin: '0px 0px -6% 0px',
} as const

/** Телефон: один раз + без повторних whileInView — менше IO і repaint при скролі вгору/вниз. */
export const WATTA_IN_VIEW_FADE_VIEWPORT_MOBILE = {
  once: true,
  amount: 0.08,
  margin: '0px 0px -6% 0px',
} as const

export const WATTA_IN_VIEW_FADE_TRANSITION = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
}

export const WATTA_IN_VIEW_FADE_TRANSITION_MOBILE = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
}

/** Viewport для m.* з кастомним margin (наприклад '-40px'). */
export function wattaInViewFadeViewport(
  margin?: string,
  amount?: number,
) {
  /** Без window під час render — інакше SSR/клієнт розходяться; mobile-варіант лише в хуках. */
  const defaults = WATTA_IN_VIEW_FADE_VIEWPORT
  return {
    once: defaults.once,
    amount: amount ?? defaults.amount,
    margin: margin ?? defaults.margin,
  }
}

function readMatchMedia(mq: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.matchMedia(mq).matches
  } catch {
    return false
  }
}

function useWattaPhoneViewport(): boolean {
  const [phone, setPhone] = useState(() => readMatchMedia(WATTA_PHONE_VIEWPORT_MQ))

  useEffect(() => {
    const mq = window.matchMedia(WATTA_PHONE_VIEWPORT_MQ)
    const apply = () => setPhone(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return phone
}

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() =>
    readMatchMedia('(prefers-reduced-motion: reduce)'),
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return reduce
}

/**
 * true → не анімувати появу при скролі (site-wide для швидкого тексту).
 */
export function useWattaDisableScrollReveal(): boolean {
  return true
}

/** fade для m.* — на телефоні/touch без opacity:0 (LazyMotion + whileInView можуть «залипати»). */
export function useWattaMotionFade(offsetY = 26) {
  const reduce = useWattaDisableScrollReveal()
  const visible = useWattaInViewFadeProps()
  if (reduce) return visible
  return {
    initial: { opacity: 0, y: offsetY },
    whileInView: { opacity: 1, y: 0 },
  } as const
}

/** @deprecated Scroll-reveal вимкнено — лишається для сумісності з m.* на окремих сторінках. */
export function useWattaInViewFadeProps() {
  return {
    initial: false as const,
    animate: { opacity: 1, y: 0 },
  }
}

/** fade + viewport + transition для spread на m.div / article тощо */
export function useWattaInViewFadeMotion() {
  return {
    fade: useWattaInViewFadeProps(),
    viewport: WATTA_IN_VIEW_FADE_VIEWPORT,
    transition: WATTA_IN_VIEW_FADE_TRANSITION,
  }
}

type FadeMotionProps = {
  transition?: unknown
  viewport?: unknown
  initial?: unknown
  animate?: unknown
  whileInView?: unknown
}

function stripMotionProps<T extends FadeMotionProps & Record<string, unknown>>(props: T) {
  const {
    transition: _transition,
    viewport: _viewport,
    initial: _initial,
    animate: _animate,
    whileInView: _whileInView,
    ...rest
  } = props
  return rest
}

function wattaFadeAttrs() {
  return { 'data-watta-in-view-fade': '' as const }
}

export function WattaInViewFadeSection(
  props: FadeMotionProps & ComponentPropsWithoutRef<'section'>,
) {
  return <section {...wattaFadeAttrs()} {...stripMotionProps(props)} />
}

export function WattaInViewFadeDiv(
  props: FadeMotionProps & ComponentPropsWithoutRef<'div'>,
) {
  return <div {...wattaFadeAttrs()} {...stripMotionProps(props)} />
}

export function WattaInViewFadeHeader(
  props: FadeMotionProps & ComponentPropsWithoutRef<'header'>,
) {
  return <header {...wattaFadeAttrs()} {...stripMotionProps(props)} />
}

export function WattaInViewFadeArticle(
  props: FadeMotionProps & ComponentPropsWithoutRef<'article'>,
) {
  return <article {...wattaFadeAttrs()} {...stripMotionProps(props)} />
}

/** Секція в стилі /delivery, /contacts, /offer. */
export function WattaFlowSection({
  children,
  className,
  ariaLabel,
  ariaLabelledBy,
  ...rest
}: FadeMotionProps &
  Omit<ComponentPropsWithoutRef<'section'>, 'children'> & {
    children: ReactNode
    ariaLabel?: string
    ariaLabelledBy?: string
  }) {
  return (
    <WattaInViewFadeSection
      className={cn('delivery-flow-section bg-white py-14 sm:py-18', className)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      {...rest}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </WattaInViewFadeSection>
  )
}
