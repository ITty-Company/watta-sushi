'use client'

import { memo, useMemo } from 'react'
import { m } from 'framer-motion'
import { BadgeCheck, MessageCircle } from 'lucide-react'
import { Clock, Star } from '@/lib/wattaInlineIcons'
import { cn } from '@/lib/utils'
import { useWattaDisableScrollReveal, wattaInViewFadeViewport } from './WattaInViewFade'

const ACCENT = '#FF5C00'
const BRAND_GREEN = '#145142'

export type ContactPageStatsLabels = {
  stat1Val: string
  stat1Label: string
  stat2Val: string
  stat2Label: string
  stat3Val: string
  stat3Label: string
  stat4Val: string
  stat4Label: string
}

function ContactPageStats({ labels }: { labels: ContactPageStatsLabels }) {
  const reduce = useWattaDisableScrollReveal()

  const stats = useMemo(
    () => [
      { icon: MessageCircle, value: labels.stat1Val, label: labels.stat1Label },
      { icon: Clock, value: labels.stat2Val, label: labels.stat2Label },
      { icon: BadgeCheck, value: labels.stat3Val, label: labels.stat3Label },
      { icon: Star, value: labels.stat4Val, label: labels.stat4Label },
    ],
    [labels],
  )

  const fade = reduce
    ? ({ initial: false as const, animate: { opacity: 1, y: 0 } })
    : ({
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  return (
    <section className="delivery-page-stats-band w-full" aria-label={labels.stat1Label}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {stats.map((s, i) => {
            const isOrange = i === 0 || i === 3
            return (
              <m.div
                key={`${s.label}-${i}`}
                className={cn(
                  'contact-watta-stat-pill delivery-stat-pill--blob flex flex-col items-center text-center',
                  isOrange ? 'delivery-stat-pill--orange' : 'delivery-stat-pill--green',
                )}
                {...fade}
                viewport={wattaInViewFadeViewport('-40px')}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={reduce ? undefined : { y: -3 }}
              >
                <div className="delivery-stat-pill__icon-wrap" aria-hidden>
                  <div className="delivery-stat-pill__icon-blob" />
                  <s.icon
                    className="delivery-stat-pill__icon"
                    size={18}
                    strokeWidth={1.35}
                    style={{ color: isOrange ? ACCENT : BRAND_GREEN }}
                  />
                </div>
                <div className="contact-watta-stat-pill__val delivery-stat-pill__val">{s.value}</div>
                <div className="contact-watta-stat-pill__label">{s.label}</div>
              </m.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default memo(ContactPageStats)
