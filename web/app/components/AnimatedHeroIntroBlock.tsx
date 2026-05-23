'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'
import {
  AnimatedMultilineBody,
  AnimatedWords,
  HERO_COPY_EASE,
  splitHeroWords,
} from './heroCopyMotion'

export type AnimatedHeroIntroBlockProps = {
  sectionId?: string
  ariaLabel: string
  titleId?: string
  /** Невеликий рядок над заголовком (напр. «Amsterdam · доставка к столу») */
  kicker?: string
  /** Відступ зверху без kicker (зазор від панелі категорій) */
  reserveTopSpace?: boolean
  titleLines: string[]
  body: string
  /** Індекс рядка заголовка з акцентним кольором (за замовч. 1 — другий рядок) */
  accentLineIndex?: number
  /** Другий рядок курсивом Marck (напр. «от Watta Sushi») */
  scriptLineIndex?: number
  headingLevel?: 'h1' | 'h2'
  innerClassName?: string
  children?: ReactNode
}

export default function AnimatedHeroIntroBlock({
  sectionId,
  ariaLabel,
  titleId,
  kicker,
  reserveTopSpace = false,
  titleLines,
  body,
  accentLineIndex = 1,
  scriptLineIndex,
  headingLevel = 'h2',
  innerClassName,
  children,
}: AnimatedHeroIntroBlockProps) {
  const reduceMotion = useReducedMotion() ?? false
  const Heading = headingLevel

  const kickerDelay = 0
  const { lineDelays, bodyDelay } = useMemo(() => {
    if (reduceMotion) {
      return { lineDelays: titleLines.map(() => 0), bodyDelay: 0 }
    }
    let t = kicker ? 0.35 : 0.08
    const delays = titleLines.map((line) => {
      const d = t
      t += splitHeroWords(line).length * 0.065 + 0.1
      return d
    })
    return { lineDelays: delays, bodyDelay: t + 0.12 }
  }, [titleLines, kicker, reduceMotion])

  return (
    <section
      id={sectionId}
      className="home-after-hero-intro-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0"
      aria-label={ariaLabel}
    >
      <motion.div
        className={[
          innerClassName ??
            'home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu relative z-[1] mx-auto max-w-7xl px-6 pb-4 sm:px-9 sm:pb-5 md:px-12 md:pb-6',
          !kicker && reserveTopSpace ? 'home-after-hero-intro-inner-web--headroom' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={reduceMotion ? undefined : { opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {kicker ? (
          <motion.p
            className="home-after-hero-intro-kicker-web mx-auto mb-3 max-w-3xl text-center sm:mb-3.5"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: HERO_COPY_EASE, delay: kickerDelay }}
          >
            {kicker}
          </motion.p>
        ) : null}

        <Heading
          id={titleId}
          className="home-after-hero-intro-title-web mx-auto max-w-3xl text-center text-[clamp(1.35rem,3.8vw,2.35rem)] font-semibold leading-[1.18] tracking-[-0.02em] text-[#0f2a22] md:text-[clamp(1.9rem,3.5vw,2.7rem)] md:leading-[1.1] md:tracking-[-0.03em]"
        >
          {titleLines.map((line, i) => {
            const isAccent = i === accentLineIndex
            const isScript = scriptLineIndex != null && i === scriptLineIndex
            const delay = lineDelays[i] ?? 0

            return (
              <span
                key={`${line}-${i}`}
                className={`block ${isAccent ? 'text-[#145142]' : ''} ${isScript ? 'home-after-hero-intro-script-line' : ''}`}
                style={
                  isScript
                    ? { fontFamily: 'var(--font-brand-marck), cursive', fontWeight: 400 }
                    : undefined
                }
              >
                <AnimatedWords
                  text={line}
                  reduceMotion={reduceMotion}
                  delay={delay}
                  stagger={0.065}
                />
              </span>
            )
          })}
        </Heading>

        <p
          className={`home-after-hero-intro-body-web mx-auto mt-4 max-w-2xl text-center text-[13px] leading-snug text-[#145142]/88 sm:mt-5 sm:text-[14px] md:mt-5 md:max-w-[min(46rem,92vw)] md:text-[15px] md:leading-[1.72] lg:text-base lg:leading-[1.78] max-xl:max-w-[min(52rem,96vw)] xl:max-w-2xl xl:whitespace-normal${reduceMotion ? ' text-balance' : ''}`}
        >
          <AnimatedMultilineBody
            text={body}
            reduceMotion={reduceMotion}
            delay={bodyDelay}
            stagger={0.03}
          />
        </p>
        {children}
      </motion.div>
    </section>
  )
}
