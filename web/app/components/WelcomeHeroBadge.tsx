'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ROTATING_WELCOME } from '@/lib/welcomeRotatingPhrases'

type Props = {
  ariaLabel: string
}

export function WelcomeHeroBadge({ ariaLabel }: Props) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (reduceMotion) return
    const t = window.setInterval(
      () => setIndex((n) => (n + 1) % ROTATING_WELCOME.length),
      3200
    )
    return () => window.clearInterval(t)
  }, [reduceMotion])

  const current = ROTATING_WELCOME[reduceMotion ? 0 : index]

  return (
    <div className="welcome-hero-badge-wrap-web" role="region" aria-label={ariaLabel}>
      <div className="welcome-hero-badge-web welcome-hero-badge-web--greeting-only">
        <div className="welcome-hero-badge-greeting-web" aria-live="polite">
          <div className="welcome-hero-badge-greeting-perspective-web">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={current.lang + (reduceMotion ? '-still' : String(index))}
                lang={current.lang}
                className="welcome-hero-badge-greeting-text-web"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, rotateX: -78, y: 14, z: -36, filter: 'blur(6px)' }
                }
                animate={
                  reduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        rotateX: 0,
                        y: 0,
                        z: 0,
                        filter: 'blur(0px)',
                      }
                }
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        rotateX: 72,
                        y: -12,
                        z: -28,
                        filter: 'blur(5px)',
                      }
                }
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformStyle: 'preserve-3d', display: 'block', transformOrigin: '50% 50% 0' }}
              >
                {current.text}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
