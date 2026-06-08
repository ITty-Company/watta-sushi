'use client'

import { useMemo, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { useWattaStaggerRevealCycle } from '@/lib/useWattaStaggerRevealCycle'
import {
  renderWattaStaggerRevealChars,
  renderWattaStaggerRevealMultiline,
  WATTA_STAGGER_BODY_CHAR_DELAY,
  WATTA_STAGGER_CHAR_DELAY,
} from './WattaStaggerRevealChars'

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

function estimateIntroEnterSec(kicker: string | undefined, titleLines: string[], body: string) {
  let sec = 0
  if (kicker) {
    sec += kicker.length * WATTA_STAGGER_CHAR_DELAY + 0.1
  }
  for (const line of titleLines) {
    sec += line.length * WATTA_STAGGER_CHAR_DELAY
  }
  sec += 0.12
  sec += body.replace(/\n/g, '').length * WATTA_STAGGER_BODY_CHAR_DELAY + 0.42
  return sec
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

  const enterSec = useMemo(() => {
    if (reduceMotion) return 0
    return estimateIntroEnterSec(kicker, titleLines, body)
  }, [body, kicker, reduceMotion, titleLines])

  const cycle = useWattaStaggerRevealCycle(enterSec)

  const innerClass = [
    innerClassName ??
      'home-after-hero-intro-inner-web home-after-hero-intro-inner-web--home-menu relative z-[1] mx-auto max-w-7xl px-6 pb-4 sm:px-9 sm:pb-5 md:px-12 md:pb-6',
    !kicker && reserveTopSpace ? 'home-after-hero-intro-inner-web--headroom' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const renderAnimatedCopy = () => {
    if (reduceMotion) {
      return (
        <>
          {kicker ? (
            <p className="home-after-hero-intro-kicker-web mx-auto mb-3 max-w-3xl text-center sm:mb-3.5">{kicker}</p>
          ) : null}
          <Heading
            id={titleId}
            className="home-after-hero-intro-title-web mx-auto max-w-3xl text-center text-[clamp(1.35rem,3.8vw,2.35rem)] font-semibold leading-[1.18] tracking-[-0.02em] text-[#0f2a22] md:text-[clamp(1.9rem,3.5vw,2.7rem)] md:leading-[1.1] md:tracking-[-0.03em]"
          >
            {titleLines.map((line, i) => {
              const isAccent = i === accentLineIndex
              const isScript = scriptLineIndex != null && i === scriptLineIndex
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
                  {line}
                </span>
              )
            })}
          </Heading>
          <p
            className="home-after-hero-intro-body-web mx-auto mt-4 max-w-2xl text-center text-[13px] leading-snug text-[#145142]/88 sm:mt-5 sm:text-[14px] md:mt-5 md:max-w-[min(46rem,92vw)] md:text-[15px] md:leading-[1.72] lg:text-base lg:leading-[1.78] max-xl:max-w-[min(52rem,96vw)] xl:max-w-2xl xl:whitespace-normal text-balance"
            style={{ whiteSpace: 'pre-line' }}
          >
            {body}
          </p>
          {children}
        </>
      )
    }

    const charIndex = { value: 0 }

    return (
      <>
        {kicker ? (
          <p className="home-after-hero-intro-kicker-web mx-auto mb-3 max-w-3xl text-center sm:mb-3.5">
            {renderWattaStaggerRevealChars(
              kicker,
              'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--kicker',
              charIndex,
            )}
          </p>
        ) : null}

        <Heading
          id={titleId}
          className="home-after-hero-intro-title-web mx-auto max-w-3xl text-center text-[clamp(1.35rem,3.8vw,2.35rem)] font-semibold leading-[1.18] tracking-[-0.02em] text-[#0f2a22] md:text-[clamp(1.9rem,3.5vw,2.7rem)] md:leading-[1.1] md:tracking-[-0.03em]"
        >
          {titleLines.map((line, i) => {
            const isAccent = i === accentLineIndex
            const isScript = scriptLineIndex != null && i === scriptLineIndex

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
                {renderWattaStaggerRevealChars(
                  line,
                  `home-after-hero-intro-reveal-char${isScript ? ' home-after-hero-intro-reveal-char--script' : ''}`,
                  charIndex,
                )}
              </span>
            )
          })}
        </Heading>

        <p
          className={`home-after-hero-intro-body-web mx-auto mt-4 max-w-2xl text-center text-[13px] leading-snug text-[#145142]/88 sm:mt-5 sm:text-[14px] md:mt-5 md:max-w-[min(46rem,92vw)] md:text-[15px] md:leading-[1.72] lg:text-base lg:leading-[1.78] max-xl:max-w-[min(52rem,96vw)] xl:max-w-2xl xl:whitespace-normal${reduceMotion ? ' text-balance' : ''}`}
        >
          {renderWattaStaggerRevealMultiline(
            body,
            'home-after-hero-intro-reveal-char home-after-hero-intro-reveal-char--body',
            charIndex,
          )}
        </p>
        {children}
      </>
    )
  }

  return (
    <section
      id={sectionId}
      className="home-after-hero-intro-web menu-after-welcome-web relative z-[2] w-full max-w-[100vw] shrink-0"
      aria-label={ariaLabel}
    >
      {reduceMotion ? (
        <div className={innerClass}>{renderAnimatedCopy()}</div>
      ) : (
        <div className={innerClass} key={cycle}>
          {renderAnimatedCopy()}
        </div>
      )}
    </section>
  )
}
