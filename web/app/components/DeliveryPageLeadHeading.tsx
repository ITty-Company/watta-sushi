'use client'

import { memo, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Truck } from 'lucide-react'
import {
  WattaStaggerRevealGroup,
  WattaStaggerRevealText,
  estimateWattaStaggerEnterSec,
  type CharIndexRef,
} from './WattaStaggerRevealText'

const ACCENT = '#FF5C00'

export type DeliveryPageLeadHeadingLabels = {
  headlineLead: string
  headlineMark: string
}

function DeliveryPageLeadHeadingAnimated({
  d,
}: {
  d: DeliveryPageLeadHeadingLabels
}) {
  const charIndex = useMemo<CharIndexRef>(() => ({ value: 0 }), [])

  return (
    <h1
      id="delivery-page-lead-heading"
      className="delivery-page-lead-heading__title inline-flex max-w-full flex-wrap items-center justify-start gap-2 text-left text-[clamp(1.65rem,7vw,3.25rem)] font-black leading-[1.08] tracking-tight text-gray-900 sm:gap-3"
    >
      <WattaStaggerRevealText text={d.headlineLead} variant="title" charIndexRef={charIndex} staggerStyle="catalog" />
      {' '}
      <span className="inline-flex items-center gap-2 whitespace-nowrap sm:gap-3">
        <WattaStaggerRevealText
          text={d.headlineMark}
          variant="title"
          charIndexRef={charIndex}
          staggerStyle="catalog"
          style={{ color: ACCENT }}
        />
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 sm:h-14 sm:w-14"
          aria-hidden
        >
          <Truck className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.5} />
        </span>
      </span>
    </h1>
  )
}

function DeliveryPageLeadHeading({ d }: { d: DeliveryPageLeadHeadingLabels }) {
  const reduce = useReducedMotion() ?? false

  const enterSec = useMemo(() => {
    if (reduce) return 0
    return estimateWattaStaggerEnterSec([d.headlineLead, d.headlineMark], ['title', 'title'])
  }, [reduce, d.headlineLead, d.headlineMark])

  return (
    <section
      className="delivery-page-lead-heading-web relative z-[3] w-full bg-transparent px-0 pt-[clamp(0.65rem,2vh,1rem)] pb-[clamp(0.35rem,1vh,0.55rem)] sm:pt-[clamp(0.85rem,2.2vh,1.15rem)]"
      aria-labelledby="delivery-page-lead-heading"
    >
      <div className="delivery-page-lead-heading__wrap flex max-w-full justify-start">
        {reduce ? (
          <h1
            id="delivery-page-lead-heading"
            className="delivery-page-lead-heading__title inline-flex max-w-full flex-wrap items-center justify-start gap-2 text-left text-[clamp(1.65rem,7vw,3.25rem)] font-black leading-[1.08] tracking-tight text-gray-900 sm:gap-3"
          >
            <span>{d.headlineLead}</span>{' '}
            <span className="inline-flex items-center gap-2 whitespace-nowrap sm:gap-3">
              <span style={{ color: ACCENT }}>{d.headlineMark}</span>
              <span
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#145142] to-[#1a6b58] text-white shadow-lg shadow-[#145142]/25 sm:h-14 sm:w-14"
                aria-hidden
              >
                <Truck className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={1.5} />
              </span>
            </span>
          </h1>
        ) : (
          <WattaStaggerRevealGroup enterSec={enterSec} replay={false}>
            <DeliveryPageLeadHeadingAnimated d={d} />
          </WattaStaggerRevealGroup>
        )}
      </div>
    </section>
  )
}

export default memo(DeliveryPageLeadHeading)
