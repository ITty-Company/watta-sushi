'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ShoppingBag, MapPin, Navigation2, Clock, Truck } from 'lucide-react'

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

const easeOut = [0.22, 1, 0.36, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
}

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
}

const steps = [
  { labelKey: 'stepWeb' as const, descKey: 'stepWebDesc' as const },
  { labelKey: 'stepApp' as const, descKey: 'stepAppDesc' as const },
  { labelKey: 'stepPhone' as const, descKey: 'stepPhoneDesc' as const },
]

const conditionRows: {
  Icon: typeof ShoppingBag
  textKey: 'conditionsFeature1' | 'conditionsFeature2' | 'conditionsFeature3'
}[] = [
  { Icon: ShoppingBag, textKey: 'conditionsFeature1' },
  { Icon: MapPin, textKey: 'conditionsFeature2' },
  { Icon: Navigation2, textKey: 'conditionsFeature3' },
]

const viewport = { once: true, amount: 0.22, margin: '0px 0px -6% 0px' } as const

export function DeliveryExperienceBlocks({
  d,
  kitchenAddressLine,
  conditionsCheckSummary,
}: {
  d: DeliveryExperienceLabels
  kitchenAddressLine: string
  conditionsCheckSummary?: string | null
}) {
  const reduceMotion = useReducedMotion() ?? false
  const motionProps = reduceMotion
    ? {}
    : {
        variants: stagger,
        initial: 'hidden' as const,
        whileInView: 'visible' as const,
        viewport,
      }

  return (
    <>
      <motion.section
        className="delivery-watta-split delivery-watta-split--home"
        {...motionProps}
        aria-label={d.conditionsTitle}
      >
        <motion.article
          variants={reduceMotion ? undefined : fadeUp}
          className="delivery-watta-panel delivery-watta-panel--conditions"
        >
          <span className="delivery-watta-panel-kicker">{d.conditionsKicker}</span>
          <h2 className="delivery-watta-panel-title">{d.conditionsTitle}</h2>
          <ul className="delivery-watta-panel-list" aria-label={d.conditionsTitle}>
            {conditionRows.map(({ Icon, textKey }) => (
              <li key={textKey} className="delivery-watta-panel-list-row">
                <span className="delivery-watta-panel-list-ico" aria-hidden>
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <span>{d[textKey]}</span>
              </li>
            ))}
          </ul>
          {conditionsCheckSummary ? (
            <p className="delivery-watta-panel-highlight" role="status">
              {conditionsCheckSummary}
            </p>
          ) : null}
          <p className="delivery-watta-panel-muted">{d.remoteHint}</p>
        </motion.article>

        <motion.article
          variants={reduceMotion ? undefined : fadeUp}
          className="delivery-watta-panel delivery-watta-panel--hours"
        >
          <span className="delivery-watta-panel-kicker">{d.hoursTitle}</span>
          <p className="delivery-watta-panel-hours">{d.hoursRange}</p>
          <p className="delivery-watta-panel-muted">{kitchenAddressLine}</p>
        </motion.article>
      </motion.section>

      <motion.section
        className="delivery-watta-promise delivery-watta-promise--home"
        variants={reduceMotion ? undefined : fadeUp}
        initial={reduceMotion ? undefined : 'hidden'}
        whileInView={reduceMotion ? undefined : 'visible'}
        viewport={viewport}
        aria-labelledby="delivery-promise-heading"
      >
        <div className="delivery-watta-promise-inner delivery-watta-promise-inner--home">
          <span className="delivery-watta-promise-ico-line" aria-hidden>
            <Clock size={22} strokeWidth={2.25} />
            <Truck size={22} strokeWidth={2.25} />
          </span>
          <p className="delivery-watta-promise-kicker" id="delivery-promise-heading">
            {d.deliveryPromiseKicker}
          </p>
          <h3 className="delivery-watta-promise-title">{d.deliveryPromiseTitle}</h3>
          <p className="delivery-watta-promise-text">{d.deliveryPromiseText}</p>
          <p className="delivery-watta-promise-foot">{d.deliveryPromiseFoot}</p>
        </div>
      </motion.section>

      <section className="delivery-watta-how delivery-watta-how--home" aria-labelledby="how-heading">
        <motion.h2
          id="how-heading"
          className="delivery-watta-how-title"
          variants={reduceMotion ? undefined : fadeUp}
          initial={reduceMotion ? undefined : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={viewport}
        >
          {d.howTitle}
        </motion.h2>
        <motion.ol
          className="delivery-watta-how-steps"
          variants={reduceMotion ? undefined : stagger}
          initial={reduceMotion ? undefined : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={viewport}
        >
          {steps.map((step, i) => (
            <motion.li
              key={step.labelKey}
              variants={reduceMotion ? undefined : fadeUp}
              className="delivery-watta-how-step"
            >
              <span className="delivery-watta-how-step-num" aria-hidden>
                {i + 1}
              </span>
              <div className="delivery-watta-how-step-body">
                <p className="delivery-watta-how-step-label">{d[step.labelKey]}</p>
                <p className="delivery-watta-how-step-desc">{d[step.descKey]}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </section>
    </>
  )
}
