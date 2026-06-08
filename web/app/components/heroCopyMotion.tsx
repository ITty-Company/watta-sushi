'use client'

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { m, useReducedMotion } from 'framer-motion'

export const HERO_COPY_EASE = [0.22, 1, 0.36, 1] as const
export const HERO_COPY_TYPE_MS = 58
/** Пауза після появи hero-тексту перед повтором анімації. */
export const HERO_LOOP_HOLD_MS = 5000
export const HERO_LOOP_SHELL_ENTER_S = 0.62

export function splitHeroWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

/** Інтервал повтору: весь вхід + пауза. */
export function useHeroCopyLoopKey(totalEnterSec: number, reduceMotion: boolean): number {
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    if (reduceMotion) return
    const enterMs = Math.max(800, Math.round(totalEnterSec * 1000))
    const ms = enterMs + HERO_LOOP_HOLD_MS
    const id = window.setInterval(() => setLoopKey((k) => k + 1), ms)
    return () => window.clearInterval(id)
  }, [totalEnterSec, reduceMotion])

  return loopKey
}

/** Обгортка stellar hero — «випливає», стоїть, знову випливає. */
export function HeroCopyLoopShell({
  loopKey,
  reduceMotion,
  className,
  children,
}: {
  loopKey: number
  reduceMotion: boolean
  className?: string
  children: ReactNode
}) {
  if (reduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <m.div
      key={loopKey}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: HERO_LOOP_SHELL_ENTER_S, ease: HERO_COPY_EASE }}
    >
      {children}
    </m.div>
  )
}

export function TypewriterBrand({
  text,
  reduceMotion,
  className,
  loopKey = 0,
}: {
  text: string
  reduceMotion: boolean
  className?: string
  loopKey?: number
}) {
  const [len, setLen] = useState(reduceMotion ? text.length : 0)
  const [caret, setCaret] = useState(!reduceMotion)

  useEffect(() => {
    if (reduceMotion) {
      setLen(text.length)
      setCaret(false)
      return
    }
    setLen(0)
    setCaret(true)
    let i = 0
    const tick = window.setInterval(() => {
      i += 1
      setLen(i)
      if (i >= text.length) {
        window.clearInterval(tick)
        window.setTimeout(() => setCaret(false), 520)
      }
    }, HERO_COPY_TYPE_MS)
    return () => window.clearInterval(tick)
  }, [text, reduceMotion, loopKey])

  return (
    <span className={className} aria-label={text}>
      {text.slice(0, len)}
      {caret ? <span className="delivery-hero-copy-home__caret" aria-hidden /> : null}
    </span>
  )
}

export function AnimatedWords({
  text,
  className,
  delay = 0,
  stagger = 0.055,
  reduceMotion,
  loopKey = 0,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  reduceMotion: boolean
  loopKey?: number
}) {
  const words = useMemo(() => splitHeroWords(text), [text])

  if (reduceMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={`${loopKey}-${word}-${i}`}>
          <m.span
            className="delivery-hero-copy-home__word"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.42,
              ease: HERO_COPY_EASE,
              delay: delay + i * stagger,
            }}
          >
            {word}
          </m.span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  )
}

/** Текст з `\n` — анімація по словах з збереженням переносів */
export function AnimatedMultilineBody({
  text,
  className,
  delay = 0,
  stagger = 0.028,
  reduceMotion,
  loopKey = 0,
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  reduceMotion: boolean
  loopKey?: number
}) {
  const paragraphs = useMemo(
    () => text.split(/\n/).map((p) => p.trim()).filter((p) => p.length > 0),
    [text],
  )

  if (reduceMotion) {
    return (
      <span className={className} style={{ whiteSpace: 'pre-line' }}>
        {text}
      </span>
    )
  }

  let wordIndex = 0
  return (
    <span className={className}>
      {paragraphs.map((para, pi) => {
        const words = splitHeroWords(para)
        return (
          <Fragment key={pi}>
            {pi > 0 ? <br className="home-after-hero-intro-body-br" /> : null}
            {words.map((word, wi) => {
              const i = wordIndex
              wordIndex += 1
              return (
                <Fragment key={`${loopKey}-${pi}-${word}-${i}`}>
                  <m.span
                    className="delivery-hero-copy-home__word"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: HERO_COPY_EASE,
                      delay: delay + i * stagger,
                    }}
                  >
                    {word}
                  </m.span>
                  {wi < words.length - 1 ? ' ' : null}
                </Fragment>
              )
            })}
          </Fragment>
        )
      })}
    </span>
  )
}

export function countAnimatedWords(text: string): number {
  return text.split(/\n/).reduce((n, line) => n + splitHeroWords(line).length, 0)
}
