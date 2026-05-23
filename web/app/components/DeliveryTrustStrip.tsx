'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Clock, MapPin, ShieldCheck } from 'lucide-react'

export type DeliveryTrustStripLabels = {
  kitchenMapCaption: string
  openMaps: string
  deliveryPromiseKicker: string
  deliveryPromiseTitle: string
  deliveryPromiseText: string
  deliveryPromiseFoot: string
}

const viewport = { once: true, amount: 0.22, margin: '0px 0px -6% 0px' } as const

export function DeliveryTrustStrip({
  d,
  kitchenAddressLine,
  kitchenMapsHref,
  variant = 'full',
}: {
  d: DeliveryTrustStripLabels
  kitchenAddressLine?: string
  kitchenMapsHref?: string
  /** На /delivery кухня вже під картою — лишаємо лише обіцянку пунктуальності */
  variant?: 'full' | 'promise-only' | 'corporate'
}) {
  const reduceMotion = useReducedMotion() ?? false
  const promiseOnly = variant === 'promise-only'
  const corporate = variant === 'corporate'

  if (corporate) {
    return (
      <motion.div
        className="delivery-promise-flat"
        initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby="delivery-promise-heading"
      >
        <p className="delivery-promise-flat__kicker" id="delivery-promise-heading">
          {d.deliveryPromiseKicker}
        </p>
        <h2 className="contact-watta-section-title mb-2">{d.deliveryPromiseTitle}</h2>
        <p className="delivery-page-section-lead mb-0 max-w-2xl">{d.deliveryPromiseText}</p>
        <p className="delivery-promise-flat__note">
          <ShieldCheck size={18} strokeWidth={2.25} aria-hidden />
          <span>{d.deliveryPromiseFoot}</span>
        </p>
      </motion.div>
    )
  }

  return (
    <motion.section
      className={`delivery-watta-trust-strip${promiseOnly ? ' delivery-watta-trust-strip--promise-only' : ''}`}
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label={promiseOnly ? d.deliveryPromiseKicker : `${d.kitchenMapCaption}. ${d.deliveryPromiseKicker}`}
    >
      <div className="delivery-watta-trust-strip__grid">
        {!promiseOnly && kitchenAddressLine && kitchenMapsHref ? (
          <>
            <article className="delivery-watta-trust-strip__item delivery-watta-trust-strip__item--kitchen">
              <header className="delivery-watta-trust-strip__head">
                <span className="delivery-watta-trust-strip__mark" aria-hidden>
                  01
                </span>
                <MapPin className="delivery-watta-trust-strip__head-ico" strokeWidth={2.25} aria-hidden />
                <span className="delivery-watta-trust-strip__kicker">{d.kitchenMapCaption}</span>
              </header>
              <p className="delivery-watta-trust-strip__addr">{kitchenAddressLine}</p>
              <a
                href={kitchenMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="delivery-watta-trust-strip__link"
              >
                {d.openMaps}
                <ArrowUpRight className="delivery-watta-trust-strip__link-ico" strokeWidth={2.5} aria-hidden />
              </a>
            </article>

            <div className="delivery-watta-trust-strip__rule" aria-hidden />
          </>
        ) : null}

        <article
          className="delivery-watta-trust-strip__item delivery-watta-trust-strip__item--promise"
          aria-labelledby="delivery-promise-heading"
        >
          <header className="delivery-watta-trust-strip__head">
            {!promiseOnly ? (
              <span className="delivery-watta-trust-strip__mark" aria-hidden>
                02
              </span>
            ) : null}
            <Clock className="delivery-watta-trust-strip__head-ico" strokeWidth={2.25} aria-hidden />
            <span className="delivery-watta-trust-strip__kicker" id="delivery-promise-heading">
              {d.deliveryPromiseKicker}
            </span>
          </header>
          <h3 className="delivery-watta-trust-strip__title">{d.deliveryPromiseTitle}</h3>
          <p className="delivery-watta-trust-strip__text">{d.deliveryPromiseText}</p>
          <p className="delivery-watta-trust-strip__note">
            <ShieldCheck className="delivery-watta-trust-strip__note-ico" size={16} strokeWidth={2.25} aria-hidden />
            <span>{d.deliveryPromiseFoot}</span>
          </p>
        </article>
      </div>
    </motion.section>
  )
}
