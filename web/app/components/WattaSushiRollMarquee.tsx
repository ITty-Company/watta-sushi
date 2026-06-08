'use client'

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react'
import WattaSushiRoll from './WattaSushiRoll'
import {
  isHeroRollExcluded,
  WATTA_HERO_ROLL_TOP_ROW_COUNT,
  type WattaSushiRollData,
} from '@/lib/wattaSushiRolls'

type WattaSushiRollMarqueeProps = {
  rolls: WattaSushiRollData[]
  speed?: number
  tilt?: number
  /** Текст над 1-м рядом товарів (головна hero: текст → 1-й ряд → 2-й ряд) */
  middleSlot?: ReactNode
}

const WAVE_Y = [0, -18, 12, -10, 14, -14, 6, -5, 12, -10, 8, -14, 4, -6, 16, -12, 5, -8, 12, -7, 10, -12, 8, -6]
const WAVE_ROT = [-2, 3, -4, 2, -3, 4, -1, 3, -2, 1, -3, 2, -4, 3, -1, 2, -3, 1, -2, 3, -4, 2, -1, 3]
const WAVE_SCALE = [1, 0.96, 1.04, 0.98, 1.05, 0.94, 1.03, 0.97, 1.04, 0.95, 1.02, 0.96, 1.05, 0.94, 1.03, 0.98, 1.04, 0.95, 1.02, 0.97, 1.03, 0.96, 1.04, 0.98]

/** Менший gap, коли ролл візуально «товстіший» (scale > 1). */
function gapForIndex(index: number): string {
  const scale = WAVE_SCALE[index % WAVE_SCALE.length] ?? 1
  if (scale >= 1.04) return 'var(--watta-roll-gap-tight)'
  if (scale <= 0.95) return 'var(--watta-roll-gap-loose)'
  return 'var(--watta-roll-gap)'
}

function waveStyle(index: number): CSSProperties {
  const i = index % WAVE_Y.length
  return {
    '--watta-roll-wave-y': `${WAVE_Y[i]}px`,
    '--watta-roll-wave-rot': `${WAVE_ROT[i]}deg`,
    '--watta-roll-wave-scale': WAVE_SCALE[i],
    marginRight: gapForIndex(i),
  } as CSSProperties
}

function useRollMarqueeKeepAlive(containerRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const kickAll = () => {
      const root = containerRef.current
      if (!root || document.visibilityState !== 'visible') return
      root.querySelectorAll<HTMLElement>('.watta-roll-marquee-track').forEach((track) => {
        track.style.animationPlayState = 'running'
        const name = getComputedStyle(track).animationName
        if (!name || name === 'none') {
          track.style.animation = 'none'
          void track.offsetWidth
          track.style.removeProperty('animation')
        }
      })
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') kickAll()
    }

    const scrollObserver = new MutationObserver(() => {
      if (!document.documentElement.dataset.wattaScrolling) kickAll()
    })
    scrollObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-watta-scrolling'],
    })

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', kickAll)
    window.addEventListener('pageshow', kickAll)
    kickAll()

    return () => {
      scrollObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', kickAll)
      window.removeEventListener('pageshow', kickAll)
    }
  }, [containerRef])
}

type MarqueeRowProps = {
  rolls: WattaSushiRollData[]
  rowClass: string
  scrollSpeed: number
  reverse?: boolean
}

function MarqueeRow({ rolls, rowClass, scrollSpeed, reverse }: MarqueeRowProps) {
  const repeated = useMemo(() => [...rolls, ...rolls], [rolls])

  return (
    <div className={`watta-roll-marquee-row ${rowClass}`}>
      <div className="watta-roll-marquee-fade">
        <div
          className={`watta-roll-marquee-track${reverse ? ' watta-roll-marquee-track--reverse' : ''}`}
          style={{ '--watta-roll-marquee-speed': `${scrollSpeed}s` } as CSSProperties}
        >
          {repeated.map((roll, i) => {
            const slot = i % rolls.length
            const isFirstPass = i < rolls.length
            return (
              <div
                key={`${rowClass}-${roll.imageUrl}-${i}`}
                className="watta-roll-wrap"
                style={{
                  zIndex: 100 + slot,
                  ...waveStyle(slot),
                }}
              >
                <WattaSushiRoll
                  roll={roll}
                  eager={isFirstPass && slot < 6}
                  priority={isFirstPass && slot < 2}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function WattaSushiRollMarquee({
  rolls,
  speed = 70,
  tilt = -4,
  middleSlot,
}: WattaSushiRollMarqueeProps) {
  const stackRef = useRef<HTMLDivElement>(null)

  const { topRolls, bottomRolls } = useMemo(() => {
    const visibleRolls = rolls.filter((roll) => !isHeroRollExcluded(roll.imageUrl))
    const split = Math.min(WATTA_HERO_ROLL_TOP_ROW_COUNT, visibleRolls.length)
    return {
      topRolls: visibleRolls.slice(0, split),
      bottomRolls: visibleRolls.slice(split),
    }
  }, [rolls])

  const backSpeed = speed + Math.min(topRolls.length * 0.55, 30)
  const frontSpeed = speed + Math.min(bottomRolls.length * 0.65, 34)

  useRollMarqueeKeepAlive(stackRef)

  const tiltStyle = { '--watta-roll-marquee-tilt': `${tilt}deg` } as CSSProperties

  if (middleSlot) {
    return (
      <div
        ref={stackRef}
        className="watta-roll-marquee-mask watta-roll-marquee-mask--split"
        style={tiltStyle}
      >
        {middleSlot}
        <MarqueeRow
          rolls={topRolls}
          rowClass="watta-roll-marquee-row--back"
          scrollSpeed={backSpeed * 1.12}
          reverse
        />
        <MarqueeRow
          rolls={bottomRolls}
          rowClass="watta-roll-marquee-row--front"
          scrollSpeed={frontSpeed}
        />
      </div>
    )
  }

  return (
    <div ref={stackRef} className="watta-roll-marquee-mask" style={tiltStyle}>
      <div className="watta-roll-marquee-stack">
        <MarqueeRow
          rolls={topRolls}
          rowClass="watta-roll-marquee-row--back"
          scrollSpeed={backSpeed * 1.12}
          reverse
        />
        <MarqueeRow
          rolls={bottomRolls}
          rowClass="watta-roll-marquee-row--front"
          scrollSpeed={frontSpeed}
        />
      </div>
    </div>
  )
}
