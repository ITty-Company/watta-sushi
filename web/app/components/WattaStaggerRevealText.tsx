'use client'

import {
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'
import { useWattaStaggerRevealCycle } from '@/lib/useWattaStaggerRevealCycle'
import { useWattaStaggerMotion } from '@/lib/wattaStaggerMotion'
import {
  renderWattaStaggerRevealChars,
  renderWattaStaggerRevealMultiline,
  renderWattaStaggerRevealWords,
} from './WattaStaggerRevealChars'

export type WattaStaggerStyle = 'catalog' | 'hero'

export type WattaStaggerVariant = 'title' | 'body' | 'kicker' | 'script'

export type CharIndexRef = { value: number }

function titleCharClass(style: WattaStaggerStyle): string {
  return style === 'catalog'
    ? 'home-full-menu-catalog-reveal-char home-full-menu-catalog-reveal-char--title'
    : 'home-after-hero-intro-reveal-char'
}

function bodyCharClass(style: WattaStaggerStyle): string {
  return style === 'catalog'
    ? 'home-full-menu-catalog-reveal-char home-full-menu-catalog-reveal-char--intro'
    : 'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--body'
}

function heroVariantClass(variant: WattaStaggerVariant): string {
  switch (variant) {
    case 'body':
      return 'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--body'
    case 'kicker':
      return 'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--kicker'
    case 'script':
      return 'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--script'
    default:
      return 'home-after-hero-intro-reveal-char'
  }
}

function charDelayForVariant(
  variant: WattaStaggerVariant,
  charDelay: number,
  bodyWordDelay: number,
): number {
  return variant === 'body' || variant === 'script' ? bodyWordDelay : charDelay
}

export function estimateWattaStaggerEnterSec(
  texts: string[],
  variants: WattaStaggerVariant[] = [],
  charDelay = 0.05,
  bodyWordDelay = 0.032,
) {
  let sec = 0
  texts.forEach((text, i) => {
    const variant = variants[i] ?? 'title'
    if (variant === 'body' || variant === 'script') {
      const words = text.trim().split(/\s+/).filter(Boolean).length
      sec += words * bodyWordDelay
    } else {
      sec += text.replace(/\n/g, '').length * charDelay
    }
    sec += variant === 'body' ? 0.1 : 0.06
  })
  return sec + 0.35
}

function estimateCopyEnterSec(
  title: string,
  body: string | undefined,
  charDelay: number,
  bodyWordDelay: number,
) {
  let sec = title.length * charDelay + 0.1
  if (body) {
    const words = body.trim().split(/\s+/).filter(Boolean).length
    sec += words * bodyWordDelay + 0.35
  }
  return sec
}

function useWattaStaggerInViewOnce(
  enabled: boolean,
  margin = '0px 0px -10% 0px',
  amount = 0.12,
) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(!enabled)

  useEffect(() => {
    if (!enabled) return
    const node = ref.current
    if (!node) {
      setVisible(true)
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: margin, threshold: amount },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [enabled, margin, amount])

  return { ref, visible }
}

type AnimatedCopyProps = {
  title: string
  body?: string
  titleId?: string
  titleAs?: ElementType
  titleClassName?: string
  bodyClassName?: string
  style?: WattaStaggerStyle
  bodyMultiline?: boolean
  charDelay: number
  bodyWordDelay: number
}

function AnimatedStaggerCopy({
  title,
  body,
  titleId,
  titleAs = 'h2',
  titleClassName,
  bodyClassName,
  style = 'catalog',
  bodyMultiline = false,
  charDelay,
  bodyWordDelay,
}: AnimatedCopyProps) {
  const charIndex: CharIndexRef = { value: 0 }
  const titleClass = titleCharClass(style)
  const introClass = bodyCharClass(style)

  return (
    <>
      {createElement(
        titleAs,
        { id: titleId, className: titleClassName },
        renderWattaStaggerRevealChars(title, titleClass, charIndex, charDelay),
      )}
      {body ? (
        <p className={bodyClassName}>
          {bodyMultiline
            ? renderWattaStaggerRevealMultiline(body, introClass, charIndex, bodyWordDelay)
            : renderWattaStaggerRevealWords(body, introClass, charIndex, bodyWordDelay)}
        </p>
      ) : null}
    </>
  )
}

export type WattaStaggerCopyBlockProps = {
  title: string
  body?: string
  titleId?: string
  titleAs?: ElementType
  titleClassName?: string
  bodyClassName?: string
  wrapperClassName?: string
  style?: WattaStaggerStyle
  replay?: boolean
  inView?: boolean
  inViewMargin?: string
  bodyMultiline?: boolean
  children?: ReactNode
}

export function WattaStaggerCopyBlock({
  title,
  body,
  titleId,
  titleAs = 'h2',
  titleClassName,
  bodyClassName,
  wrapperClassName,
  style = 'catalog',
  replay = false,
  inView = false,
  inViewMargin,
  bodyMultiline = false,
  children,
}: WattaStaggerCopyBlockProps) {
  const motion = useWattaStaggerMotion()
  const { ref: inViewRef, visible: inViewVisible } = useWattaStaggerInViewOnce(
    inView && motion.allowSectionStagger,
    inViewMargin,
  )

  const enterSec = useMemo(() => {
    if (!motion.enabled) return 0
    return estimateCopyEnterSec(title, body, motion.charDelay, motion.bodyWordDelay)
  }, [body, motion.bodyWordDelay, motion.charDelay, motion.enabled, title])

  const useReplay = Boolean(replay && motion.allowReplay)
  const canAnimate = inView
    ? motion.enabled && motion.allowSectionStagger && inViewVisible
    : motion.enabled

  const cycle = useWattaStaggerRevealCycle(
    canAnimate && useReplay ? enterSec : 0,
    canAnimate && useReplay,
  )

  const staticCopy = (
    <>
      {createElement(titleAs, { id: titleId, className: titleClassName }, title)}
      {body ? (
        <p className={bodyClassName} style={bodyMultiline ? { whiteSpace: 'pre-line' } : undefined}>
          {body}
        </p>
      ) : null}
    </>
  )

  const mountKey = useReplay ? cycle : inView && motion.allowSectionStagger ? 'in-view' : 'once'

  return (
    <div ref={inView && motion.allowSectionStagger ? inViewRef : undefined} className={wrapperClassName}>
      {canAnimate ? (
        <div key={mountKey}>
          <AnimatedStaggerCopy
            title={title}
            body={body}
            titleId={titleId}
            titleAs={titleAs}
            titleClassName={titleClassName}
            bodyClassName={bodyClassName}
            style={style}
            bodyMultiline={bodyMultiline}
            charDelay={motion.charDelay}
            bodyWordDelay={motion.bodyWordDelay}
          />
        </div>
      ) : (
        staticCopy
      )}
      {children}
    </div>
  )
}

export type WattaStaggerRevealTextProps = {
  text: string
  as?: ElementType
  variant?: WattaStaggerVariant
  className?: string
  style?: React.CSSProperties
  id?: string
  multiline?: boolean
  replay?: boolean
  replayEnterSec?: number
  inView?: boolean
  inViewMargin?: string
  charIndexRef?: CharIndexRef
  staggerStyle?: WattaStaggerStyle
}

export function WattaStaggerRevealText({
  text,
  as: Tag = 'span',
  variant = 'title',
  className,
  style: inlineStyle,
  id,
  multiline = false,
  replay = false,
  replayEnterSec = 0,
  inView = false,
  inViewMargin,
  charIndexRef,
  staggerStyle = 'hero',
}: WattaStaggerRevealTextProps) {
  const motion = useWattaStaggerMotion()
  const localIndex = useMemo<CharIndexRef>(() => ({ value: 0 }), [])
  const { ref: inViewRef, visible: inViewVisible } = useWattaStaggerInViewOnce(
    inView && motion.allowSectionStagger,
    inViewMargin,
  )

  const useReplay = Boolean(replay && motion.allowReplay)
  const canAnimate = inView
    ? motion.enabled && motion.allowSectionStagger && inViewVisible
    : motion.enabled

  const cycle = useWattaStaggerRevealCycle(
    canAnimate && useReplay ? replayEnterSec : 0,
    canAnimate && useReplay,
  )

  const charClass =
    staggerStyle === 'catalog'
      ? variant === 'body'
        ? bodyCharClass('catalog')
        : titleCharClass('catalog')
      : heroVariantClass(variant)

  const delay = charDelayForVariant(variant, motion.charDelay, motion.bodyWordDelay)
  const staticStyle = multiline ? { ...inlineStyle, whiteSpace: 'pre-line' as const } : inlineStyle

  if (!canAnimate) {
    return createElement(Tag, { id, className, style: staticStyle }, text)
  }

  const idx = charIndexRef ?? localIndex
  const isBody = variant === 'body' || variant === 'script'
  const animated = isBody && !multiline
    ? renderWattaStaggerRevealWords(text, charClass, idx, delay)
    : multiline
      ? renderWattaStaggerRevealMultiline(text, charClass, idx, delay)
      : renderWattaStaggerRevealChars(text, charClass, idx, delay)

  const mountKey = charIndexRef
    ? undefined
    : useReplay
      ? cycle
      : inView && motion.allowSectionStagger
        ? 'in-view'
        : undefined

  const content = createElement(
    Tag,
    {
      id,
      className,
      style: inlineStyle,
      ...(mountKey != null ? { key: mountKey } : {}),
    },
    animated,
  )

  if (inView && motion.allowSectionStagger) {
    return <span ref={inViewRef}>{content}</span>
  }

  return content
}

export function WattaStaggerRevealGroup({
  children,
  enterSec = 0,
  className,
  as: Tag = 'div',
  replay = false,
}: {
  children: ReactNode
  enterSec?: number
  className?: string
  as?: ElementType
  replay?: boolean
}) {
  const motion = useWattaStaggerMotion()
  const useReplay = Boolean(replay && motion.allowReplay && enterSec > 0)
  const cycle = useWattaStaggerRevealCycle(useReplay ? enterSec : 0, useReplay && motion.enabled)

  if (!motion.enabled || enterSec <= 0) {
    return createElement(Tag, { className }, children)
  }

  if (!useReplay) {
    return createElement(Tag, { className, key: 'once' }, children)
  }

  return createElement(Tag, { className, key: cycle }, children)
}

export function renderStaggerTitleChars(
  text: string,
  charIndex: CharIndexRef,
  style: WattaStaggerStyle = 'catalog',
  charDelay?: number,
) {
  return renderWattaStaggerRevealChars(
    text,
    titleCharClass(style),
    charIndex,
    charDelay,
  )
}

export function renderStaggerBodyChars(
  text: string,
  charIndex: CharIndexRef,
  style: WattaStaggerStyle = 'catalog',
  multiline = false,
  bodyWordDelay?: number,
) {
  const cls = bodyCharClass(style)
  if (multiline) {
    return renderWattaStaggerRevealMultiline(text, cls, charIndex, bodyWordDelay)
  }
  return renderWattaStaggerRevealWords(text, cls, charIndex, bodyWordDelay)
}
