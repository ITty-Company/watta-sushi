'use client'

import { m } from 'framer-motion'
import { WATTA_IN_VIEW_FADE_VIEWPORT, useWattaDisableScrollReveal } from './WattaInViewFade'
import { WattaStaggerRevealText } from './WattaStaggerRevealText'
import { WattaStaggerSectionTitle } from './WattaStaggerSectionTitle'
import { ArrowUpRight, Clock, MapPin, ShieldCheck } from 'lucide-react'

export type DeliveryTrustStripLabels = {
  kitchenMapCaption: string
  openMaps: string
  deliveryPromiseKicker: string
  deliveryPromiseTitle: string
  deliveryPromiseText: string
  deliveryPromiseFoot: string
}

const viewport = { ...WATTA_IN_VIEW_FADE_VIEWPORT, amount: 0.22 } as const

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
  const reduceMotion = useWattaDisableScrollReveal()
  const promiseOnly = variant === 'promise-only'
  const corporate = variant === 'corporate'

  if (corporate) {
    return (
      <m.div
        className="delivery-promise-flat"
        initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
        animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={viewport}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby="delivery-promise-heading"
      >
        <p className="delivery-promise-flat__kicker" id="delivery-promise-heading">
          {d.deliveryPromiseKicker}
        </p>
        <WattaStaggerSectionTitle
          className="contact-watta-section-title mb-2"
          text={d.deliveryPromiseTitle}
        />
        <p className="delivery-page-section-lead mb-0 max-w-2xl">{d.deliveryPromiseText}</p>
        <p className="delivery-promise-flat__note">
          <ShieldCheck size={18} strokeWidth={2.25} aria-hidden />
          <span>{d.deliveryPromiseFoot}</span>
        </p>
      </m.div>
    )
  }

  return (
    <m.section
      className={`delivery-watta-trust-strip${promiseOnly ? ' delivery-watta-trust-strip--promise-only' : ''}`}
      initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={reduceMotion ? { opacity: 1, y: 0 } : undefined}
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
          <WattaStaggerRevealText
            as="h3"
            className="delivery-watta-trust-strip__title"
            text={d.deliveryPromiseTitle}
            variant="title"
            inView
            replay={false}
            staggerStyle="catalog"
          />
          <p className="delivery-watta-trust-strip__text">{d.deliveryPromiseText}</p>
          <p className="delivery-watta-trust-strip__note">
            <ShieldCheck className="delivery-watta-trust-strip__note-ico" size={16} strokeWidth={2.25} aria-hidden />
            <span>{d.deliveryPromiseFoot}</span>
          </p>
        </article>
      </div>
    </m.section>
  )
}
