'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

export const HERO_COPY_EASE = [0.22, 1, 0.36, 1] as const
export const HERO_COPY_TYPE_MS = 58

export function splitHeroWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

export function TypewriterBrand({
  text,
  reduceMotion,
  className,
}: {
  text: string
  reduceMotion: boolean
  className?: string
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
  }, [text, reduceMotion])

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
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  reduceMotion: boolean
}) {
  const words = useMemo(() => splitHeroWords(text), [text])

  if (reduceMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <motion.span
            className="delivery-hero-copy-home__word"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.42,
              ease: HERO_COPY_EASE,
              delay: delay + i * stagger,
            }}
          >
            {word}
          </motion.span>
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
}: {
  text: string
  className?: string
  delay?: number
  stagger?: number
  reduceMotion: boolean
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
                <Fragment key={`${pi}-${word}-${i}`}>
                  <motion.span
                    className="delivery-hero-copy-home__word"
                    initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{
                      duration: 0.4,
                      ease: HERO_COPY_EASE,
                      delay: delay + i * stagger,
                    }}
                  >
                    {word}
                  </motion.span>
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
