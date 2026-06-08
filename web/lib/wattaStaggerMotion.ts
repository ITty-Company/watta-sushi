'use client'

import { useReducedMotion } from 'framer-motion'

export const WATTA_STAGGER_CHAR_DELAY = 0.05
export const WATTA_STAGGER_BODY_WORD_DELAY = 0.032
export const WATTA_STAGGER_CHAR_DELAY_MOBILE = 0.038
export const WATTA_STAGGER_BODY_WORD_DELAY_MOBILE = 0.022

/** Char-stagger вимкнено site-wide — текст одразу, менше repaint при скролі. */
export function useWattaStaggerMotion() {
  const reduceMotion = useReducedMotion() ?? false

  return {
    enabled: false,
    isPhone: false,
    allowReplay: false,
    allowSectionStagger: false,
    charDelay: WATTA_STAGGER_CHAR_DELAY,
    bodyWordDelay: WATTA_STAGGER_BODY_WORD_DELAY,
    reduceMotion,
  }
}
