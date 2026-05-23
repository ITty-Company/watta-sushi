'use client'

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Truck } from 'lucide-react'

const ACCENT = '#FF5C00'

export type DeliveryPageLeadHeadingLabels = {
  headlineLead: string
  headlineMark: string
}

function DeliveryPageLeadHeading({ d }: { d: DeliveryPageLeadHeadingLabels }) {
  const reduce = useReducedMotion()
  const fade = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
      } as const)

  return (
    <section
      className="delivery-page-lead-heading-web relative z-[3] w-full bg-transparent px-0 pt-[clamp(0.65rem,2vh,1rem)] pb-[clamp(0.35rem,1vh,0.55rem)] sm:pt-[clamp(0.85rem,2.2vh,1.15rem)]"
      aria-labelledby="delivery-page-lead-heading"
    >
      <motion.div
        className="delivery-page-lead-heading__wrap flex max-w-full justify-start"
        {...fade}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
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
      </motion.div>
    </section>
  )
}

export default memo(DeliveryPageLeadHeading)
