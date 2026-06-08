'use client'

import { Fragment } from 'react'

/** @deprecated import from @/lib/wattaStaggerMotion */
export const WATTA_STAGGER_CHAR_DELAY = 0.05
/** @deprecated body uses word delay */
export const WATTA_STAGGER_BODY_CHAR_DELAY = 0.032

type CharIndexRef = { value: number }

function splitWordUnits(token: string): string[] {
  if (!token.includes('-')) return [token]
  const parts = token.split('-')
  const units: string[] = []
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i]
    if (!part) continue
    if (i < parts.length - 1) units.push(`${part}-`)
    else units.push(part)
  }
  return units
}

export function renderWattaStaggerRevealChars(
  text: string,
  charClassName: string,
  charIndex: CharIndexRef,
  charDelay = WATTA_STAGGER_CHAR_DELAY,
) {
  return text.split('').map((char, index) => {
    const delay = charIndex.value * charDelay
    charIndex.value += 1
    return (
      <span
        key={`${charClassName}-${index}-${delay}`}
        className={charClassName}
        style={{ animationDelay: `${delay}s` }}
      >
        {char === ' ' ? '\u00a0' : char}
      </span>
    )
  })
}

/** Підпис / довгий текст — по словах (≈7× менше DOM-вузлів, плавніше). */
export function renderWattaStaggerRevealWords(
  text: string,
  charClassName: string,
  charIndex: CharIndexRef,
  wordDelay = WATTA_STAGGER_BODY_CHAR_DELAY,
) {
  const tokens = text.split(/(\s+)/)
  return tokens.map((token, tokenIndex) => {
    if (!token) return null
    if (/^\s+$/.test(token)) {
      return (
        <span key={`ws-${tokenIndex}`} className="watta-stagger-reveal-space">
          {token.replace(/ /g, '\u00a0')}
        </span>
      )
    }
    const delay = charIndex.value * wordDelay
    charIndex.value += 1
    return (
      <span
        key={`ww-${tokenIndex}-${token}`}
        className={`${charClassName} watta-stagger-reveal-word-block`}
        style={{ animationDelay: `${delay}s` }}
      >
        {token}
      </span>
    )
  })
}

export function renderWattaStaggerRevealWordsLine(
  line: string,
  charClassName: string,
  charIndex: CharIndexRef,
  charDelay = WATTA_STAGGER_BODY_CHAR_DELAY,
) {
  return line.split(/(\s+)/).flatMap((token, tokenIndex) => {
    if (!token) return []
    if (/^\s+$/.test(token)) {
      return [
        <span key={`space-${tokenIndex}`} className="watta-stagger-reveal-space">
          {renderWattaStaggerRevealChars(token, charClassName, charIndex, charDelay)}
        </span>,
      ]
    }

    return splitWordUnits(token).map((unit, unitIndex) => (
      <span key={`word-${tokenIndex}-${unitIndex}`} className="watta-stagger-reveal-word">
        {renderWattaStaggerRevealChars(unit, charClassName, charIndex, charDelay)}
      </span>
    ))
  })
}

export function renderWattaStaggerRevealMultiline(
  text: string,
  charClassName: string,
  charIndex: CharIndexRef,
  charDelay = WATTA_STAGGER_BODY_CHAR_DELAY,
) {
  return text.split('\n').map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br className="home-after-hero-intro-body-br" /> : null}
      {renderWattaStaggerRevealWordsLine(line, charClassName, charIndex, charDelay)}
    </Fragment>
  ))
}
