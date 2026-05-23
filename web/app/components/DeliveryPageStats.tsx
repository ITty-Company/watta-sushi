'use client'

import { memo, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { MapPinned, MessagesSquare, Snowflake, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCENT = '#FF5C00'
const BRAND_GREEN = '#145142'

export type WattaStatPillItem = {
  icon: LucideIcon
  value: string
  label: string
}

export type DeliveryPageStatsLabels = {
  statCardColdValue: string
  statCardColdLabel: string
  statCardOrderValue: string
  statCardOrderLabel: string
  statCardPriceValue: string
  statCardPriceLabel: string
  statCardChannelsValue: string
  statCardChannelsLabel: string
}

function isOrangePill(index: number, pattern: 'delivery' | 'alternate') {
  return pattern === 'delivery' ? index === 0 || index === 3 : index % 2 === 0
}

export function WattaStatPillsBand({
  items,
  ariaLabel,
  className,
  accentPattern = 'delivery',
}: {
  items: WattaStatPillItem[]
  ariaLabel?: string
  className?: string
  accentPattern?: 'delivery' | 'alternate'
}) {
  const reduce = useReducedMotion()

  const fade = reduce
    ? ({ initial: false as const } satisfies { initial: false })
    : ({
        initial: { opacity: 0, y: 22 },
        whileInView: { opacity: 1, y: 0 },
      } as const)

  return (
    <section
      className={cn('delivery-page-stats-band w-full', className)}
      aria-label={ariaLabel ?? items[0]?.label}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
          {items.map((s, i) => {
            const isOrange = isOrangePill(i, accentPattern)
            return (
              <motion.div
                key={`${s.value}-${s.label}-${i}`}
                className={cn(
                  'contact-watta-stat-pill delivery-stat-pill--blob flex flex-col items-center text-center',
                  isOrange ? 'delivery-stat-pill--orange' : 'delivery-stat-pill--green',
                )}
                {...fade}
                viewport={{ once: true, margin: '-40px' }}
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
                <div
                  className={cn(
                    'contact-watta-stat-pill__val delivery-stat-pill__val',
                    !s.label && 'delivery-stat-pill__val--phrase',
                  )}
                >
                  {s.value}
                </div>
                {s.label ? <div className="contact-watta-stat-pill__label">{s.label}</div> : null}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function DeliveryPageStats({ labels }: { labels: DeliveryPageStatsLabels }) {
  const items = useMemo(
    () => [
      { icon: Snowflake, value: labels.statCardColdValue, label: labels.statCardColdLabel },
      { icon: UtensilsCrossed, value: labels.statCardOrderValue, label: labels.statCardOrderLabel },
      { icon: MapPinned, value: labels.statCardPriceValue, label: labels.statCardPriceLabel },
      { icon: MessagesSquare, value: labels.statCardChannelsValue, label: labels.statCardChannelsLabel },
    ],
    [labels],
  )

  return <WattaStatPillsBand items={items} ariaLabel={labels.statCardColdLabel} accentPattern="delivery" />
}

export default memo(DeliveryPageStats)
