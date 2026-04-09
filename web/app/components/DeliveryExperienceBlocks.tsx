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
import { ShoppingBag, MapPin, Navigation2, Clock, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type DeliveryExperienceLabels = {
  conditionsTitle: string
  minOrder: string
  minOrderAfterCheck: string
  remoteHint: string
  hoursTitle: string
  hoursRange: string
  howTitle: string
  stepWeb: string
  stepApp: string
  stepPhone: string
  stepWebDesc: string
  stepAppDesc: string
  stepPhoneDesc: string
  conditionsKicker: string
  conditionsFeature1: string
  conditionsFeature2: string
  conditionsFeature3: string
  deliveryPromiseKicker: string
  deliveryPromiseTitle: string
  deliveryPromiseText: string
  deliveryPromiseFoot: string
}

const splitContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.05 },
  },
}

const splitItem: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.96, rotateX: 10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { type: 'spring', stiffness: 280, damping: 26, mass: 0.85 },
  },
}

const promiseV: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 28 },
  },
}

const howTitleV: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
}

const howGrid: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.08 },
  },
}

const howCardV: Variants = {
  hidden: { opacity: 0, y: 32, scale: 0.94 },
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
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), spring)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), spring)

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
    <div ref={ref} className="delivery-tilt-shell" onMouseMove={onMove} onMouseLeave={onLeave}>
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
                scale: 1.015,
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
    descKey: 'stepWebDesc' as const,
    svg: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  },
  {
    labelKey: 'stepApp' as const,
    descKey: 'stepAppDesc' as const,
    svg: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </>
    ),
  },
  {
    labelKey: 'stepPhone' as const,
    descKey: 'stepPhoneDesc' as const,
    svg: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
]

const conditionRows: { Icon: typeof ShoppingBag; textKey: 'conditionsFeature1' | 'conditionsFeature2' | 'conditionsFeature3' }[] = [
  { Icon: ShoppingBag, textKey: 'conditionsFeature1' },
  { Icon: MapPin, textKey: 'conditionsFeature2' },
  { Icon: Navigation2, textKey: 'conditionsFeature3' },
]

export function DeliveryExperienceBlocks({
  d,
  kitchenAddressLine,
  conditionsCheckSummary,
}: {
  d: DeliveryExperienceLabels
  kitchenAddressLine: string
  /** Після успішної перевірки індексу — персоналізований рядок про мінімум */
  conditionsCheckSummary?: string | null
}) {
  const reduceMotion = useReducedMotion() ?? false

  return (
    <>
      <motion.section
        className="delivery-watta-split delivery-watta-split--experience delivery-watta-split--v2"
        variants={splitContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2, margin: '0px 0px -8% 0px' }}
      >
        <motion.div variants={splitItem} style={{ transformStyle: 'preserve-3d' }}>
          <TiltShell
            reduceMotion={reduceMotion}
            innerClassName="delivery-watta-conditions delivery-watta-conditions--experience delivery-watta-conditions--v2"
          >
            <span className="delivery-watta-card-kicker">{d.conditionsKicker}</span>
            <h2 className="delivery-watta-block-title delivery-watta-block-title--v2">{d.conditionsTitle}</h2>
            <ul className="delivery-watta-conditions-features" aria-label={d.conditionsTitle}>
              {conditionRows.map(({ Icon, textKey }) => (
                <li key={textKey} className="delivery-watta-conditions-feature-row">
                  <span className="delivery-watta-conditions-feature-ico" aria-hidden>
                    <Icon size={20} strokeWidth={2.25} />
                  </span>
                  <span className="delivery-watta-conditions-feature-text">{d[textKey]}</span>
                </li>
              ))}
            </ul>
            <div className="delivery-watta-conditions-divider" aria-hidden />
            <p className="delivery-watta-block-text delivery-watta-block-text--lead">{d.minOrder}</p>
            {conditionsCheckSummary ? (
              <p className="delivery-watta-conditions-check-summary" role="status">
                {conditionsCheckSummary}
              </p>
            ) : null}
            <p className="delivery-watta-block-text delivery-watta-block-text--muted">{d.remoteHint}</p>
          </TiltShell>
        </motion.div>
        <motion.div variants={splitItem} style={{ transformStyle: 'preserve-3d' }}>
          <TiltShell
            reduceMotion={reduceMotion}
            innerClassName="delivery-watta-hours delivery-watta-hours--experience delivery-watta-hours--v2"
          >
            <span className="delivery-watta-card-kicker">{d.hoursTitle}</span>
            <motion.p
              className="delivery-watta-hours-time delivery-watta-hours-time--glow delivery-watta-hours-time--v2"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      textShadow: [
                        '0 0 0px rgba(20,81,66,0)',
                        '0 0 28px rgba(20,81,66,0.35)',
                        '0 0 0px rgba(20,81,66,0)',
                      ],
                    }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {d.hoursRange}
            </motion.p>
            <p className="delivery-watta-hours-foot">{kitchenAddressLine}</p>
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

      <motion.section
        className="delivery-watta-promise"
        variants={promiseV}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        aria-labelledby="delivery-promise-heading"
      >
        <div className="delivery-watta-promise-inner">
          <div className="delivery-watta-promise-glow" aria-hidden />
          <div className="delivery-watta-promise-icons" aria-hidden>
            <motion.span
              className="delivery-watta-promise-ico-wrap"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, -5, 0], rotate: [0, -4, 4, 0] }
              }
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Clock size={28} strokeWidth={2.25} />
            </motion.span>
            <motion.span
              className="delivery-watta-promise-ico-wrap delivery-watta-promise-ico-wrap--2"
              animate={
                reduceMotion
                  ? undefined
                  : { y: [0, 6, 0], x: [0, 3, 0] }
              }
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <Truck size={26} strokeWidth={2.25} />
            </motion.span>
          </div>
          <p className="delivery-watta-promise-kicker" id="delivery-promise-heading">
            {d.deliveryPromiseKicker}
          </p>
          <h3 className="delivery-watta-promise-title">{d.deliveryPromiseTitle}</h3>
          <p className="delivery-watta-promise-text">{d.deliveryPromiseText}</p>
          <p className="delivery-watta-promise-foot">{d.deliveryPromiseFoot}</p>
        </div>
      </motion.section>

      <section className="delivery-watta-how delivery-watta-how--experience delivery-watta-how--v2" aria-labelledby="how-heading">
        <motion.h2
          id="how-heading"
          className="delivery-watta-how-title delivery-watta-how-title--v2"
          variants={howTitleV}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          {d.howTitle}
        </motion.h2>
        <motion.div
          className="delivery-watta-how-grid delivery-watta-how-grid--v2"
          variants={howGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {steps.map((step, i) => (
            <motion.div key={step.labelKey} variants={howCardV}>
              <TiltShell
                reduceMotion={reduceMotion}
                innerClassName="delivery-watta-how-card delivery-watta-how-card--experience delivery-watta-how-card--v2"
              >
                <motion.div
                  className="delivery-watta-how-ico delivery-watta-how-ico--experience delivery-watta-how-ico--v2"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, -5, 0],
                          rotateZ: [0, -2, 2, 0],
                        }
                  }
                  transition={{
                    duration: 2.6 + i * 0.12,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.2,
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {step.svg}
                  </svg>
                </motion.div>
                <p className="delivery-watta-how-label delivery-watta-how-label--v2">{d[step.labelKey]}</p>
                <p className="delivery-watta-how-desc">{d[step.descKey]}</p>
              </TiltShell>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </>
  )
}
