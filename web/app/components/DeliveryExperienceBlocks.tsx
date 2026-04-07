'use client'

import { useRef, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion'
import { cn } from '@/lib/utils'

export type DeliveryExperienceLabels = {
  conditionsTitle: string
  minOrder: string
  remoteHint: string
  hoursTitle: string
  hoursRange: string
  howTitle: string
  stepWeb: string
  stepApp: string
  stepPhone: string
}

const splitContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.16, delayChildren: 0.06 },
  },
}

const splitItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.94, rotateX: 12 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26, mass: 0.85 },
  },
}

const howTitleV: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
}

const howGrid: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const howCardV: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 320, damping: 24 },
  },
}

function TiltShell({
  children,
  innerClassName,
  reduceMotion,
}: {
  children: ReactNode
  innerClassName: string
  reduceMotion: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const spring = { damping: 34, stiffness: 340, mass: 0.6 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), spring)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), spring)

  const onMove = (e: React.MouseEvent) => {
    if (reduceMotion || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <div
      ref={ref}
      className="delivery-tilt-shell"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <motion.div
        className={cn(innerClassName, 'delivery-tilt-face')}
        style={
          reduceMotion
            ? undefined
            : {
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d' as const,
              }
        }
        whileHover={
          reduceMotion
            ? undefined
            : {
                scale: 1.02,
                transition: { type: 'spring', stiffness: 400, damping: 22 },
              }
        }
      >
        {children}
      </motion.div>
    </div>
  )
}

const steps = [
  {
    labelKey: 'stepWeb' as const,
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
  {
    labelKey: 'stepApp' as const,
    svg: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </>
    ),
  },
  {
    labelKey: 'stepPhone' as const,
    svg: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
]

export function DeliveryExperienceBlocks({ d }: { d: DeliveryExperienceLabels }) {
  const reduceMotion = useReducedMotion() ?? false

  return (
    <>
      <motion.section
        className="delivery-watta-split delivery-watta-split--experience"
        variants={splitContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.22, margin: '0px 0px -8% 0px' }}
      >
        <motion.div variants={splitItem} style={{ transformStyle: 'preserve-3d' }}>
          <TiltShell
            reduceMotion={reduceMotion}
            innerClassName="delivery-watta-conditions delivery-watta-conditions--experience"
          >
            <h2 className="delivery-watta-block-title">{d.conditionsTitle}</h2>
            <p className="delivery-watta-block-text">{d.minOrder}</p>
            <p className="delivery-watta-block-text delivery-watta-block-text--muted">{d.remoteHint}</p>
          </TiltShell>
        </motion.div>
        <motion.div variants={splitItem} style={{ transformStyle: 'preserve-3d' }}>
          <TiltShell
            reduceMotion={reduceMotion}
            innerClassName="delivery-watta-hours delivery-watta-hours--experience"
          >
            <h2 className="delivery-watta-block-title">{d.hoursTitle}</h2>
            <motion.p
              className="delivery-watta-hours-time delivery-watta-hours-time--glow"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      textShadow: [
                        '0 0 0px rgba(20,81,66,0)',
                        '0 0 24px rgba(20,81,66,0.25)',
                        '0 0 0px rgba(20,81,66,0)',
                      ],
                    }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {d.hoursRange}
            </motion.p>
            {!reduceMotion && (
              <span className="delivery-watta-hours-sparkle" aria-hidden>
                <span className="delivery-watta-hours-sparkle-dot" />
                <span className="delivery-watta-hours-sparkle-dot" />
                <span className="delivery-watta-hours-sparkle-dot" />
              </span>
            )}
          </TiltShell>
        </motion.div>
      </motion.section>

      <section className="delivery-watta-how delivery-watta-how--experience" aria-labelledby="how-heading">
        <motion.h2
          id="how-heading"
          className="delivery-watta-how-title"
          variants={howTitleV}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {d.howTitle}
        </motion.h2>
        <motion.div
          className="delivery-watta-how-grid"
          variants={howGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {steps.map((step, i) => (
            <motion.div key={step.labelKey} variants={howCardV}>
              <TiltShell
                reduceMotion={reduceMotion}
                innerClassName="delivery-watta-how-card delivery-watta-how-card--experience"
              >
                <motion.div
                  className="delivery-watta-how-ico delivery-watta-how-ico--experience"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, -6, 0],
                          rotateZ: [0, -2, 2, 0],
                        }
                  }
                  transition={{
                    duration: 2.8 + i * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.25,
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {step.svg}
                  </svg>
                </motion.div>
                <p className="delivery-watta-how-label">{d[step.labelKey]}</p>
              </TiltShell>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  )
}
