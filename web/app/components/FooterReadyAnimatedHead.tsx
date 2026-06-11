'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { WATTA_PHONE_VIEWPORT_MQ } from '@/lib/wattaTouchViewport'

type FooterReadyAnimatedHeadProps = {
  kicker: string
  sub: string
  eyebrow: string
}

function usePhoneViewport(): boolean {
  const [phone, setPhone] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia(WATTA_PHONE_VIEWPORT_MQ)
    const apply = () => setPhone(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return phone
}

function useFooterReadyRevealActive(waitForInView: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(!waitForInView)

  useEffect(() => {
    if (!waitForInView) return
    const node = ref.current
    if (!node) {
      setActive(true)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(true)
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      setActive(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.12 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [waitForInView])

  return { ref, active }
}

function revealLineClass(active: boolean) {
  return active
    ? 'footer-ready-reveal-line-block footer-ready-reveal-line-block--active'
    : 'footer-ready-reveal-line-block'
}

export function FooterReadyAnimatedHead({ kicker, sub, eyebrow }: FooterReadyAnimatedHeadProps) {
  const isPhone = usePhoneViewport()
  const { ref, active } = useFooterReadyRevealActive(!isPhone)

  const headClass = isPhone
    ? 'footer-ready-head footer-ready-head--mobile'
    : 'footer-ready-head footer-ready-head--wide'

  return (
    <div ref={ref} className={headClass}>
      <div className="footer-ready-title-stack">
        <h2 className="footer-ready-heading w-full min-w-0 text-center">
          <span
            className={`footer-ready-display ${revealLineClass(active)}`}
            style={active ? { animationDelay: '0s' } : undefined}
          >
            {kicker}
          </span>
        </h2>
        <blockquote className="footer-ready-quote">
          <p
            className={`footer-ready-lede ${revealLineClass(active)}`}
            style={active ? { animationDelay: '0.1s' } : undefined}
          >
            {sub}
          </p>
        </blockquote>
      </div>
      <p
        className={`footer-ready-eyebrow ${revealLineClass(active)}`}
        style={active ? { animationDelay: '0.2s' } : undefined}
      >
        <span
          className={`footer-ready-eyebrow-line footer-ready-reveal-line${active ? ' footer-ready-reveal-line--active' : ''}`}
          aria-hidden
          style={active ? { animationDelay: '0.22s' } : undefined}
        />
        <span className="footer-ready-eyebrow-label">{eyebrow}</span>
        <span
          className={`footer-ready-eyebrow-line footer-ready-eyebrow-line--end footer-ready-reveal-line${active ? ' footer-ready-reveal-line--active' : ''}`}
          aria-hidden
          style={active ? { animationDelay: '0.22s' } : undefined}
        />
      </p>
    </div>
  )
}
