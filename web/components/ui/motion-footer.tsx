'use client'

import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/app/context/LanguageContext'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

function getMenuScrollParent(el: HTMLElement | null): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return (el?.closest('.content-web') as HTMLElement | null) ?? (document.querySelector('.content-web') as HTMLElement | null)
}

function scrollMenuToSelector(selector: string) {
  const scroller = getMenuScrollParent(null)
  const target = document.querySelector(selector)
  if (!scroller || !target) return
  const top =
    (target as HTMLElement).getBoundingClientRect().top + scroller.scrollTop - 20
  scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

function scrollMenuToTop() {
  const scroller = getMenuScrollParent(null)
  scroller?.scrollTo({ top: 0, behavior: 'smooth' })
}

const STYLES = `
.cinematic-footer-wrapper {
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}

/* Два «класичні» шрифти бренду: Inter з body + Playfair (заголовок) + Marck (один акцент) */
.footer-title-display {
  font-family: var(--font-brand-playfair), 'Playfair Display', Georgia, serif;
  font-feature-settings: 'liga' 1, 'kern' 1;
}

.footer-accent-script {
  font-family: var(--font-brand-marck), 'Marck Script', cursive;
  font-weight: 400;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.55; }
  100% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.9; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255, 107, 53, 0.45)); }
  15%, 45% { transform: scale(1.15); filter: drop-shadow(0 0 10px rgba(255, 107, 53, 0.75)); }
  30% { transform: scale(1); }
}

@keyframes footer-mesh-drift {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
  50% { transform: translate(2%, -3%) scale(1.05); opacity: 0.92; }
}

@keyframes footer-orb-float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(12px, -18px); }
}

@keyframes footer-orb-float-alt {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-16px, 10px); }
}

@keyframes footer-heading-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes footer-cta-shine {
  0% { transform: translateX(-120%) skewX(-12deg); }
  100% { transform: translateX(220%) skewX(-12deg); }
}

@keyframes footer-grid-pan {
  0% { background-position: 0 0; }
  100% { background-position: 60px 60px; }
}

.animate-footer-breathe {
  animation: footer-breathe 8s ease-in-out infinite alternate;
}

.animate-footer-scroll-marquee {
  animation: footer-scroll-marquee 40s linear infinite;
}

.animate-footer-heartbeat {
  animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite;
}

.animate-footer-mesh-drift {
  animation: footer-mesh-drift 18s ease-in-out infinite;
}

.animate-footer-orb-a {
  animation: footer-orb-float 14s ease-in-out infinite;
}

.animate-footer-orb-b {
  animation: footer-orb-float-alt 16s ease-in-out infinite;
}

.animate-footer-grid-pan {
  animation: footer-grid-pan 24s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .animate-footer-breathe,
  .animate-footer-scroll-marquee,
  .animate-footer-heartbeat,
  .animate-footer-mesh-drift,
  .animate-footer-orb-a,
  .animate-footer-orb-b,
  .animate-footer-grid-pan,
  .footer-heading-flow,
  .footer-cta-solid::after,
  .footer-heading-accent--hero {
    animation: none !important;
  }
}

@keyframes footer-hero-line-shimmer {
  0%,
  100% {
    opacity: 0.88;
    filter: brightness(1);
  }
  50% {
    opacity: 1;
    filter: brightness(1.12);
  }
}

.footer-hero-line-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.15rem;
}

.footer-heading-accent--hero {
  width: min(18rem, 78vw);
  height: 4px;
  border-radius: 9999px;
  animation: footer-hero-line-shimmer 4.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--primary) / 0.12) 10%,
    hsl(var(--primary) / 0.82) 48%,
    hsl(var(--primary) / 0.82) 52%,
    hsl(var(--primary) / 0.12) 90%,
    transparent 100%
  );
  box-shadow:
    0 0 32px hsl(var(--primary) / 0.38),
    0 0 1px hsl(var(--primary) / 0.45);
}

.footer-hero-line-cap {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: hsl(var(--primary));
  box-shadow: 0 0 14px hsl(var(--primary) / 0.55);
}

.footer-promo-carousel-wrap {
  position: relative;
  width: 100%;
  max-width: none;
  margin-left: auto;
  margin-right: auto;
}

.footer-promo-section-fullbleed {
  width: 100%;
  max-width: 100vw;
  position: relative;
  left: 50%;
  right: auto;
  transform: translateX(-50%);
  padding-left: clamp(0.75rem, 2vw, 1.5rem);
  padding-right: clamp(0.75rem, 2vw, 1.5rem);
  box-sizing: border-box;
}

.footer-promo-carousel {
  display: flex;
  gap: 1.15rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1rem;
  padding: 0.65rem 0.75rem 1.25rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.footer-promo-carousel::-webkit-scrollbar {
  height: 5px;
}
.footer-promo-carousel::-webkit-scrollbar-thumb {
  background: hsl(var(--primary) / 0.35);
  border-radius: 4px;
}

.footer-promo-card {
  flex: 0 0 min(280px, 76vw);
  scroll-snap-align: center;
  border-radius: 1.25rem;
  overflow: hidden;
  text-align: left;
  border: 1px solid rgba(20, 81, 66, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(250, 252, 251, 0.93));
  box-shadow: 0 16px 44px -14px rgba(20, 81, 66, 0.22);
  transform-style: preserve-3d;
  perspective: 900px;
  transition:
    transform 0.38s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.38s ease,
    border-color 0.25s ease;
  cursor: pointer;
}

.footer-promo-card:hover {
  transform: translateY(-6px) scale(1.025) rotateX(2deg);
  border-color: rgba(20, 81, 66, 0.32);
  box-shadow:
    0 28px 60px -14px rgba(20, 81, 66, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
}

.footer-promo-card:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
}

.footer-promo-card-media {
  aspect-ratio: 16 / 10;
  background: linear-gradient(135deg, rgba(20, 81, 66, 0.1), rgba(20, 81, 66, 0.02));
  background-size: cover;
  background-position: center;
  position: relative;
}

.footer-promo-card-badge {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 0.35rem 0.7rem;
  border-radius: 9999px;
  background: rgba(20, 81, 66, 0.94);
  color: #fff;
}

.footer-promo-card-body {
  padding: 0.85rem 1rem 1.05rem;
}

.footer-promo-card-cat {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #145142;
  opacity: 0.88;
  margin-bottom: 0.35rem;
  line-height: 1.2;
}

.footer-promo-card-title {
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.25;
  color: hsl(var(--foreground));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.footer-promo-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid rgba(10, 42, 34, 0.55);
  background: linear-gradient(155deg, #145142 0%, #176b57 48%, #1a6b58 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12),
    0 8px 26px rgba(20, 81, 66, 0.35);
  transition:
    transform 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.footer-promo-nav:hover {
  background: linear-gradient(155deg, #176b57 0%, #145142 45%, #1a7a63 100%);
  border-color: rgba(20, 81, 66, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 10px 30px rgba(20, 81, 66, 0.42);
  transform: translateY(-50%) scale(1.06);
}

.footer-promo-nav--prev {
  left: 0;
}
.footer-promo-nav--next {
  right: 0;
}

@media (max-width: 640px) {
  .footer-promo-nav--prev {
    left: 0.1rem;
  }
  .footer-promo-nav--next {
    right: 0.1rem;
  }
}

.footer-promo-hint {
  font-size: clamp(0.9rem, 2.1vw, 1.05rem);
  font-weight: 500;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
  text-align: center;
  margin: 0 0 0.5rem;
  max-width: min(40rem, 100%);
}

.footer-about-block {
  margin-top: 1.5rem;
  padding: 1.2rem 1.3rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(20, 81, 66, 0.12);
  background: linear-gradient(145deg, rgba(20, 81, 66, 0.06) 0%, rgba(255, 255, 255, 0.72) 100%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  text-align: left;
  width: 100%;
  max-width: 42rem;
}

.footer-about-title {
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: hsl(var(--primary));
  margin: 0 0 0.55rem;
}

.footer-about-lead {
  margin: 0 0 0.6rem;
  font-size: clamp(1rem, 2.8vw, 1.12rem);
  font-weight: 700;
  line-height: 1.38;
  color: hsl(var(--foreground));
}

.footer-about-body {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.62;
  color: hsl(var(--muted-foreground));
}

.footer-animation-slot {
  min-height: min(56vw, 300px);
  border-radius: 1.5rem;
  border: 2px dashed rgba(20, 81, 66, 0.22);
  background: linear-gradient(165deg, rgba(20, 81, 66, 0.05) 0%, rgba(255, 255, 255, 0.45) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55);
}

@media (min-width: 1024px) {
  .footer-animation-slot {
    min-height: 360px;
    align-self: stretch;
  }
}

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgba(20, 81, 66, 0.06) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(20, 81, 66, 0.06) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-bg-mesh {
  background:
    radial-gradient(ellipse 80% 50% at 20% 40%, rgba(20, 81, 66, 0.09) 0%, transparent 55%),
    radial-gradient(ellipse 70% 60% at 85% 65%, rgba(26, 107, 86, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse 50% 40% at 50% 90%, rgba(20, 81, 66, 0.05) 0%, transparent 45%);
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 78%, transparent 100%);
}

.footer-orb {
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
  will-change: transform;
}

.footer-heading-accent {
  height: 3px;
  width: min(12rem, 40vw);
  border-radius: 9999px;
  background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.55), transparent);
  box-shadow: 0 0 24px hsl(var(--primary) / 0.25);
}

.footer-heading-flow {
  background: linear-gradient(
    110deg,
    hsl(var(--foreground)) 0%,
    hsl(var(--primary)) 38%,
    hsl(var(--foreground)) 72%
  );
  background-size: 220% auto;
  animation: footer-heading-flow 7s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 20px rgba(20, 81, 66, 0.15));
}

.footer-cta-solid {
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(160 61% 16%) 100%);
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--primary) / 0.35);
  box-shadow:
    0 14px 36px -10px rgba(20, 81, 66, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.35s ease;
}

.footer-cta-solid:hover {
  box-shadow:
    0 20px 44px -10px rgba(20, 81, 66, 0.65),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  border-color: hsl(var(--primary) / 0.5);
}

.footer-cta-solid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 0%,
    rgba(255, 255, 255, 0.22) 45%,
    transparent 90%
  );
  animation: footer-cta-shine 4.5s ease-in-out infinite;
  pointer-events: none;
}

.footer-ring-accent {
  pointer-events: none;
  border: 1px solid rgba(20, 81, 66, 0.08);
  border-radius: 50%;
  box-shadow: 0 0 80px rgba(20, 81, 66, 0.06);
}

.footer-promo-scroll {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.footer-promo-scroll::-webkit-scrollbar {
  display: none;
}

.footer-promo-chip {
  flex: 0 0 auto;
  max-width: min(220px, 72vw);
  border-radius: 9999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: hsl(var(--foreground));
  background: linear-gradient(145deg, rgba(20, 81, 66, 0.1) 0%, rgba(20, 81, 66, 0.03) 100%);
  border: 1px solid rgba(20, 81, 66, 0.2);
  box-shadow:
    0 6px 18px -8px rgba(20, 81, 66, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-promo-chip:hover {
  border-color: rgba(20, 81, 66, 0.38);
  box-shadow:
    0 10px 24px -8px rgba(20, 81, 66, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  transform: translateY(-1px);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    rgba(20, 81, 66, 0.14) 0%,
    rgba(26, 107, 86, 0.1) 40%,
    transparent 70%
  );
}

.footer-marquee-bar {
  background: linear-gradient(
    105deg,
    #0c3229 0%,
    #145142 38%,
    #176b57 52%,
    #145142 65%,
    #0f3d32 100%
  );
  box-shadow:
    0 10px 36px -10px rgba(20, 81, 66, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.footer-glass-pill {
  background: linear-gradient(145deg, rgba(20, 81, 66, 0.07) 0%, rgba(20, 81, 66, 0.02) 100%);
  box-shadow:
    0 8px 24px -8px rgba(20, 81, 66, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 2px rgba(20, 81, 66, 0.04);
  border: 1px solid rgba(20, 81, 66, 0.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, rgba(20, 81, 66, 0.12) 0%, rgba(20, 81, 66, 0.04) 100%);
  border-color: rgba(20, 81, 66, 0.32);
  box-shadow:
    0 14px 32px -8px rgba(20, 81, 66, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(20, 81, 66, 0.12);
  background: linear-gradient(180deg, rgba(20, 81, 66, 0.12) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

`

export type MagneticButtonProps = Omit<React.HTMLAttributes<HTMLElement>, 'as'> & {
  as?: React.ElementType
  href?: string
  type?: 'button' | 'submit' | 'reset'
  children?: React.ReactNode
}

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = 'button', ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
      if (typeof window === 'undefined') return
      const element = localRef.current
      if (!element) return

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect()
          const hx = rect.width / 2
          const hy = rect.height / 2
          const x = e.clientX - rect.left - hx
          const y = e.clientY - rect.top - hy

          gsap.to(element, {
            x: x * 0.35,
            y: y * 0.35,
            scale: 1.04,
            ease: 'power2.out',
            duration: 0.35,
          })
        }

        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            scale: 1,
            ease: 'elastic.out(1, 0.35)',
            duration: 1,
          })
        }

        element.addEventListener('mousemove', handleMouseMove)
        element.addEventListener('mouseleave', handleMouseLeave)

        return () => {
          element.removeEventListener('mousemove', handleMouseMove)
          element.removeEventListener('mouseleave', handleMouseLeave)
        }
      }, element)

      return () => ctx.revert()
    }, [])

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          localRef.current = node
          if (typeof forwardedRef === 'function') forwardedRef(node)
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
        }}
        className={cn('cursor-pointer', className)}
        {...props}
      >
        {children}
      </Component>
    )
  },
)
MagneticButton.displayName = 'MagneticButton'

function MarqueeStrip() {
  return (
    <div className="flex items-center space-x-10 px-6 whitespace-nowrap text-white">
      <span>Watta Sushi</span> <span className="text-white/70">✦</span>
      <span>Свіжі роли</span> <span className="text-white/70">✦</span>
      <span>Швидка доставка</span> <span className="text-white/70">✦</span>
      <span>Преміум інгредієнти</span> <span className="text-white/70">✦</span>
      <span>З любов’ю до смаку</span> <span className="text-white/70">✦</span>
    </div>
  )
}

export type CinematicFooterPromoTeaser = {
  id: number
  label: string
  imageUrl?: string
  /** Назва категорії меню (для акційних страв) */
  categoryLabel?: string
  /** product — акційна страва з адмінки; banner — елемент каруселі банерів */
  kind?: 'product' | 'banner'
}

export type CinematicFooterProps = {
  /** id секції після цього блоку (карусель банерів) */
  nextSectionId?: string
  /** id блоку меню */
  menuSectionId?: string
  className?: string
  /** Активні банери — короткі підписи внизу екрана */
  promoTeasers?: CinematicFooterPromoTeaser[]
  /** Клік по картці: id + тип джерела (страва або банер) */
  onPromoTeaserClick?: (payload: { id: number; kind: 'product' | 'banner' }) => void
  /** Текст кнопки, якщо банерів ще немає (веде до секції банерів) */
  promoFallbackCta?: string
  /** Підпис зони для скрінрідерів */
  promoRegionLabel?: string
}

export function CinematicFooter({
  nextSectionId = 'hero-banners',
  menuSectionId = 'menu-catalog',
  className,
  promoTeasers,
  onPromoTeaserClick,
  promoFallbackCta,
  promoRegionLabel,
}: CinematicFooterProps) {
  const { t } = useLanguage()
  const cf = t.cinematicFooter

  const wrapperRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const giantTextOuterRef = useRef<HTMLDivElement>(null)
  const giantTextRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const footerEl = footerRef.current
    const giant = giantTextRef.current
    if (!footerEl || !giant) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let quickX: ((v: number) => void) | null = null

    if (!reduceMotion) {
      quickX = gsap.quickTo(giant, 'x', { duration: 1.1, ease: 'power3.out' })
      const onMove = (e: MouseEvent) => {
        const r = footerEl.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        quickX?.(nx * 40)
      }
      const onLeave = () => {
        quickX?.(0)
      }
      footerEl.addEventListener('mousemove', onMove)
      footerEl.addEventListener('mouseleave', onLeave)
      return () => {
        footerEl.removeEventListener('mousemove', onMove)
        footerEl.removeEventListener('mouseleave', onLeave)
      }
    }

    return undefined
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const wrap = wrapperRef.current
    if (!wrap) return

    const scroller = getMenuScrollParent(wrap)
    if (!scroller) return

    const ctx = gsap.context(() => {
      const stCommon = {
        scroller,
        start: 'top 85%',
        end: 'bottom bottom',
        scrub: 1,
      }

      if (giantTextOuterRef.current) {
        gsap.fromTo(
          giantTextOuterRef.current,
          { y: '8vh', scale: 0.88, opacity: 0 },
          {
            y: '0vh',
            scale: 1,
            opacity: 1,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: wrap,
              ...stCommon,
            },
          },
        )
      }

      if (leftColRef.current) {
        const children = Array.from(leftColRef.current.children)
        if (children.length > 0) {
          gsap.fromTo(
            children,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.09,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: wrap,
                scroller,
                start: 'top 55%',
                end: 'bottom bottom',
                scrub: 1,
              },
            },
          )
        }
      }
    }, wrap)

    const onRefresh = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onRefresh)
    const t = window.setTimeout(onRefresh, 300)

    return () => {
      window.clearTimeout(t)
      window.removeEventListener('resize', onRefresh)
      ctx.revert()
    }
  }, [])

  const goNext = () => scrollMenuToSelector(`#${nextSectionId}`)
  const goMenu = () => scrollMenuToSelector(`#${menuSectionId}`)

  const scrollCarousel = useCallback((dir: -1 | 1) => {
    const el = carouselRef.current
    if (!el) return
    const card = el.querySelector('.footer-promo-card') as HTMLElement | null
    const gap = 16
    const step = card ? card.offsetWidth + gap : Math.min(el.clientWidth * 0.82, 300)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  const onPromoCardActivate = (p: CinematicFooterPromoTeaser) => {
    onPromoTeaserClick?.({ id: p.id, kind: p.kind ?? 'banner' })
    goMenu()
  }

  const teasers = promoTeasers?.filter((p) => p.label.trim() || p.categoryLabel?.trim()) ?? []
  const fallbackCta = promoFallbackCta?.trim() || t.menuView.footerPromoSeeOffers
  const showPromoFallback = teasers.length === 0 && Boolean(fallbackCta)
  const promoAria = promoRegionLabel?.trim() || cf.promoCarouselAria

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className={cn('relative min-h-[100svh] w-full', className)}
        style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
      >
        <footer
          ref={footerRef}
          className="cinematic-footer-wrapper absolute inset-0 flex w-full flex-col justify-between overflow-hidden bg-background text-foreground"
        >
          <div className="footer-bg-mesh animate-footer-mesh-drift pointer-events-none absolute inset-0 z-0" />
          <div className="footer-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid animate-footer-grid-pan pointer-events-none absolute inset-0 z-0" />
          <div
            className="footer-ring-accent pointer-events-none absolute left-1/2 top-[42%] z-0 h-[min(88vw,720px)] w-[min(88vw,720px)] -translate-x-1/2 -translate-y-1/2 md:top-[44%]"
            aria-hidden
          />
          <div
            className="footer-orb animate-footer-orb-a pointer-events-none absolute -left-[8%] top-[18%] z-0 h-48 w-48 bg-[rgba(20,81,66,0.22)] md:h-72 md:w-72"
            aria-hidden
          />
          <div
            className="footer-orb animate-footer-orb-b pointer-events-none absolute -right-[5%] bottom-[28%] z-0 h-40 w-40 bg-[rgba(26,107,86,0.2)] md:h-64 md:w-64"
            aria-hidden
          />

          <div
            ref={giantTextOuterRef}
            className="pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2"
          >
            <div
              ref={giantTextRef}
              className="footer-giant-bg-text select-none whitespace-nowrap will-change-transform"
            >
              WATTA
            </div>
          </div>

          <div className="footer-marquee-bar absolute left-0 top-10 z-10 w-full -rotate-2 scale-[1.08] overflow-hidden border-y border-white/20 py-3 shadow-[0_12px_40px_-12px_rgba(20,81,66,0.55)] md:top-12 md:py-4">
            <div className="flex w-max animate-footer-scroll-marquee text-[10px] font-bold uppercase tracking-[0.28em] md:text-xs">
              <MarqueeStrip />
              <MarqueeStrip />
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-16 flex w-full max-w-[100rem] flex-1 flex-col justify-center gap-10 px-5 pb-8 sm:px-8 sm:pb-10 md:mt-20 md:gap-12 lg:mt-[4.5rem] lg:gap-14 lg:px-12 lg:pb-12 xl:gap-16 xl:px-16 2xl:px-24">
            <div
              ref={leftColRef}
              className="flex w-full flex-col items-center lg:max-w-[min(100%,40rem)] lg:items-start xl:max-w-[min(100%,44rem)]"
            >
              <div className="footer-hero-line-wrap w-full lg:items-start">
                <div className="footer-heading-accent footer-heading-accent--hero mx-auto lg:mx-0 lg:ml-0" aria-hidden />
                <div className="footer-hero-line-cap mx-auto lg:mx-0 lg:ml-0" aria-hidden />
              </div>

              <h2 className="footer-heading-flow footer-title-display mt-3 text-center text-4xl font-bold tracking-tight md:mt-4 md:text-6xl lg:text-left lg:text-7xl xl:text-8xl xl:leading-[0.98]">
                {cf.readyTitle}
              </h2>
            </div>

            {(teasers.length > 0 || showPromoFallback) && (
              <div className="w-full">
                <p className="footer-promo-hint footer-accent-script mx-auto w-full max-w-[100rem] text-center md:mt-2 lg:text-left">
                  {cf.promoPickHint}
                </p>
                <div className="footer-promo-section-fullbleed mt-3" role="region" aria-label={promoAria}>
                  <div className="footer-promo-carousel-wrap">
                    <button
                      type="button"
                      className="footer-promo-nav footer-promo-nav--prev hidden sm:flex"
                      onClick={() => scrollCarousel(-1)}
                      aria-label={cf.prevPromo}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="footer-promo-nav footer-promo-nav--next hidden sm:flex"
                      onClick={() => scrollCarousel(1)}
                      aria-label={cf.nextPromo}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div ref={carouselRef} className="footer-promo-carousel">
                      {teasers.length > 0 ? (
                        teasers.map((p) => (
                          <button
                            key={`${p.kind ?? 'banner'}-${p.id}`}
                            type="button"
                            className="footer-promo-card text-left"
                            onClick={() => onPromoCardActivate(p)}
                          >
                            <div
                              className="footer-promo-card-media"
                              style={
                                p.imageUrl
                                  ? { backgroundImage: `url(${p.imageUrl})` }
                                  : undefined
                              }
                            >
                              <span className="footer-promo-card-badge">{cf.promoBadge}</span>
                            </div>
                            <div className="footer-promo-card-body">
                              {p.categoryLabel?.trim() ? (
                                <div className="footer-promo-card-cat">{p.categoryLabel.trim()}</div>
                              ) : null}
                              <div className="footer-promo-card-title">
                                {p.label.trim() || p.categoryLabel?.trim() || '—'}
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          className="footer-promo-card"
                          onClick={() => goNext()}
                        >
                          <div className="footer-promo-card-media flex items-center justify-center">
                            <span className="footer-promo-card-badge">{cf.promoBadge}</span>
                          </div>
                          <div className="footer-promo-card-body">
                            <div className="footer-promo-card-title">{fallbackCta}</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex w-full flex-col items-center gap-6 lg:max-w-[min(100%,40rem)] lg:items-start xl:max-w-[min(100%,44rem)]">
                <div className="flex w-full flex-wrap justify-center gap-3 md:gap-4 lg:justify-start">
                  <MagneticButton
                    type="button"
                    as="button"
                    onClick={goNext}
                    className="footer-glass-pill flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-tight text-foreground md:px-11 md:py-5 md:text-base"
                  >
                    {cf.ctaBanners}
                  </MagneticButton>
                  <MagneticButton
                    type="button"
                    as="button"
                    onClick={goMenu}
                    className="footer-cta-solid flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold tracking-tight md:px-11 md:py-5 md:text-base"
                  >
                    {cf.ctaMenu}
                  </MagneticButton>
                </div>

                <div className="flex w-full flex-wrap justify-center gap-2 md:gap-4 lg:justify-start">
                  <MagneticButton
                    type="button"
                    as="button"
                    onClick={goMenu}
                    className="footer-glass-pill rounded-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground md:px-6 md:py-3 md:text-sm"
                  >
                    {cf.ctaCatalog}
                  </MagneticButton>
                  <MagneticButton
                    type="button"
                    as="button"
                    onClick={goNext}
                    className="footer-glass-pill rounded-full px-5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground md:px-6 md:py-3 md:text-sm"
                  >
                    {cf.ctaOffers}
                  </MagneticButton>
                </div>

              <aside className="footer-about-block mt-2">
                <h3 className="footer-about-title">{cf.aboutTitle}</h3>
                <p className="footer-about-lead">{cf.aboutLead}</p>
                <p className="footer-about-body">{cf.aboutBody}</p>
              </aside>
            </div>
          </div>

          <div className="relative z-20 px-5 pb-6 md:px-10 md:pb-8">
            <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-5">
              <div className="order-1 shrink-0 text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground md:w-[11rem] md:text-left md:text-[11px]">
                © {new Date().getFullYear()} Watta Sushi
              </div>

              <div className="order-2 flex flex-1 items-center justify-center gap-3 md:order-2 md:justify-end">
                <div className="footer-glass-pill flex cursor-default items-center gap-2 rounded-full border-border/40 px-5 py-2.5">
                  <span className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest md:text-[11px]">
                    З любов’ю
                  </span>
                  <span className="animate-footer-heartbeat text-sm text-destructive md:text-base">❤</span>
                  <span className="text-foreground text-xs font-black md:text-sm">Watta</span>
                </div>

                <MagneticButton
                  type="button"
                  as="button"
                  onClick={scrollMenuToTop}
                  className="footer-glass-pill group flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground md:h-12 md:w-12"
                  aria-label="Нагору"
                >
                  <svg
                    className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </MagneticButton>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
