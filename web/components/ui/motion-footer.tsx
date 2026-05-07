'use client'

import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import { getMenuScrollParent } from '@/lib/menuScroll'
import { useLanguage } from '@/app/context/LanguageContext'
import { WattaMenuProductCard } from '@/app/components/WattaMenuProductCard'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const STYLES = `
.cinematic-footer-wrapper {
  font-family: inherit;
  -webkit-font-smoothing: antialiased;
}

.cinematic-footer-wrapper.cinematic-footer--calm .footer-bg-mesh,
.cinematic-footer-wrapper.cinematic-footer--calm .footer-aurora,
.cinematic-footer-wrapper.cinematic-footer--calm .footer-bg-grid,
.cinematic-footer-wrapper.cinematic-footer--calm .footer-ring-accent,
.cinematic-footer-wrapper.cinematic-footer--calm .footer-orb {
  display: none !important;
}

.cinematic-footer-wrapper.cinematic-footer--calm {
  /* Один фон зі сторінкою — без «шва» до сусідніх секцій */
  background: var(--watta-page-gradient) !important;
}

/* Великий «WATTA» на фоні — саме брендовий #145142, помітно, але без «крику» */
.cinematic-footer-wrapper.cinematic-footer--calm .footer-giant-bg-text {
  opacity: 1 !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  -webkit-text-stroke: 1.25px rgba(20, 81, 66, 0.42);
  background: linear-gradient(
    168deg,
    rgba(20, 81, 66, 0.48) 0%,
    rgba(15, 61, 52, 0.38) 42%,
    rgba(20, 81, 66, 0.32) 100%
  ) !important;
  -webkit-background-clip: text !important;
  background-clip: text !important;
}

.footer-promo-card-badge--pct {
  background: linear-gradient(135deg, #ff6b35 0%, #e85a24 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35);
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
  .animate-footer-mesh-drift,
  .animate-footer-orb-a,
  .animate-footer-orb-b,
  .animate-footer-grid-pan,
  .footer-heading-flow,
  .footer-cta-solid::after,
  .footer-ready-grad {
    animation: none !important;
  }
}

/* Один ряд: бейдж + роздільник + градієнт — по центру, без «прилипання» вліво */
.footer-ready-block {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-inline: 0.5rem;
  box-sizing: border-box;
}

.footer-ready-heading {
  margin: 0;
  font: inherit;
  display: flex;
  width: 100%;
  justify-content: center;
}

.footer-ready-line {
  display: inline-flex;
  width: auto;
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.45rem 0.7rem;
}

@media (min-width: 480px) {
  .footer-ready-line {
    gap: 0.5rem 0.9rem;
  }
}

/* Бейдж — фірмовий зелений, білий текст */
.footer-ready-kicker {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: clamp(0.58rem, 1.1vw, 0.7rem);
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #fff;
  padding: 0.45em 0.95em 0.48em;
  border-radius: 9999px;
  line-height: 1;
  background: linear-gradient(165deg, #1a7a63 0%, #145142 46%, #0d3d32 100%);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.2) inset,
    0 6px 20px rgba(20, 81, 66, 0.28);
}

.footer-ready-divider {
  flex-shrink: 0;
  width: 1px;
  min-height: 0.9em;
  height: 1.15em;
  align-self: center;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(20, 81, 66, 0.2) 18%,
    rgba(20, 81, 66, 0.55) 50%,
    rgba(20, 81, 66, 0.2) 82%,
    transparent 100%
  );
  border-radius: 1px;
  opacity: 0.9;
}

.footer-ready-grad {
  flex: 0 1 auto;
  min-width: 0;
  font-family: var(--font-brand-playfair), 'Playfair Display', Georgia, serif;
  font-size: clamp(0.8rem, 2.1vw, 1.5rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.025em;
  text-align: center;
  text-wrap: balance;
  background: linear-gradient(118deg, #0c3229 0%, #145142 36%, #228f72 64%, #145142 100%);
  background-size: 180% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.4));
}

@supports not (background-clip: text) {
  .footer-ready-grad {
    color: #145142;
    background: none;
    -webkit-text-fill-color: #145142;
    filter: none;
  }
}

/* Дуже вузько — не ламати в один ряд, зменшуємо тільки шрифт */
@media (max-width: 400px) {
  .footer-ready-grad {
    font-size: clamp(0.68rem, 2.2vw, 0.9rem);
  }
  .footer-ready-kicker {
    font-size: 0.52rem;
    padding: 0.45em 0.75em 0.48em;
    letter-spacing: 0.1em;
  }
  .footer-ready-line {
    gap: 0.35rem 0.5rem;
  }
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
  padding: 0.65rem 0.75rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.footer-promo-carousel::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
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

@media (hover: hover) and (pointer: fine) {
  .footer-promo-card:hover {
    transform: translateY(-6px) scale(1.025) rotateX(2deg);
    border-color: rgba(20, 81, 66, 0.32);
    box-shadow:
      0 28px 60px -14px rgba(20, 81, 66, 0.35),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  }
}

.footer-promo-card:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
}

/* Обгортка для WattaMenuProductCard — без «клікабельної» рамки всієї картки */
.footer-promo-card.footer-promo-card--watta-grid {
  cursor: default;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}

.footer-promo-card.footer-promo-card--watta-grid:hover,
.footer-promo-card.footer-promo-card--watta-grid:focus-visible {
  transform: none;
  border-color: transparent;
  box-shadow: none;
}

.footer-promo-card.footer-promo-card--watta-grid .group {
  width: 100%;
  min-width: 0;
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

.footer-promo-nav:hover:not(.footer-promo-nav--rail) {
  background: linear-gradient(155deg, #176b57 0%, #145142 45%, #1a7a63 100%);
  border-color: rgba(20, 81, 66, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 10px 30px rgba(20, 81, 66, 0.42);
  transform: translateY(-50%) scale(1.06);
}

.footer-promo-nav--rail:hover {
  background: linear-gradient(155deg, #176b57 0%, #145142 45%, #1a7a63 100%);
  border-color: rgba(20, 81, 66, 0.75);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    0 10px 30px rgba(20, 81, 66, 0.42);
  transform: scale(1.07);
}

.footer-promo-rail {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  max-width: 100%;
}

.footer-promo-rail__track {
  flex: 1;
  min-width: 0;
}

.footer-promo-nav--rail {
  position: static;
  top: auto;
  flex-shrink: 0;
  transform: none;
}

.footer-promo-nav--rail.footer-promo-nav--prev,
.footer-promo-nav--rail.footer-promo-nav--next {
  left: auto;
  right: auto;
}

.footer-promo-nav--prev {
  left: 0;
}
.footer-promo-nav--next {
  right: 0;
}

/* Компактний блок на головній: менші картки (видно більше), стрілки не накладаються на контент */
.cinematic-footer-wrap--compact .footer-promo-card {
  flex: 0 0 min(11.25rem, 34vw);
  scroll-snap-align: start;
}

.cinematic-footer-wrap--compact .footer-promo-carousel {
  gap: 0.55rem;
  padding: 0.35rem 0;
  scroll-padding-inline: 0.15rem;
}

.cinematic-footer-wrap--compact .footer-promo-card-media {
  aspect-ratio: 4 / 3;
}

.cinematic-footer-wrap--compact .footer-promo-card-body {
  padding: 0.55rem 0.65rem 0.7rem;
}

.cinematic-footer-wrap--compact .footer-promo-card-title {
  font-size: 0.82rem;
  -webkit-line-clamp: 2;
}

.cinematic-footer-wrap--compact .footer-promo-card-cat {
  font-size: 0.58rem;
}

.cinematic-footer-wrap--compact .footer-promo-rail .footer-promo-nav--rail {
  width: 2.05rem;
  height: 2.05rem;
}

@media (min-width: 480px) {
  .cinematic-footer-wrap--compact .footer-promo-card {
    flex: 0 0 min(12rem, 30vw);
  }
}

@media (min-width: 768px) {
  .cinematic-footer-wrap--compact .footer-promo-card {
    flex: 0 0 min(13rem, 20vw);
  }

  .cinematic-footer-wrap--compact .footer-promo-rail .footer-promo-nav--rail {
    width: 2.35rem;
    height: 2.35rem;
  }
}

@media (max-width: 640px) {
  .footer-promo-carousel-wrap {
    padding-left: max(2.35rem, env(safe-area-inset-left, 0px));
    padding-right: max(2.35rem, env(safe-area-inset-right, 0px));
  }

  .footer-promo-nav {
    width: 2.15rem;
    height: 2.15rem;
  }

  .footer-promo-nav--prev {
    left: max(0.1rem, env(safe-area-inset-left, 0px));
  }

  .footer-promo-nav--next {
    right: max(0.1rem, env(safe-area-inset-right, 0px));
  }

  .footer-promo-card {
    flex: 0 0 min(272px, calc(100vw - 3.25rem));
    scroll-snap-align: center;
  }

  .footer-promo-carousel {
    gap: 0.75rem;
    scroll-padding-inline: max(0.5rem, env(safe-area-inset-left, 0px));
    padding: 0.45rem 0.15rem 0.55rem;
  }

  .footer-promo-card-media {
    aspect-ratio: 16 / 10;
  }

  .footer-promo-card-body {
    padding: 0.75rem 0.85rem 0.95rem;
  }

  .footer-promo-card-title {
    font-size: 0.875rem;
    -webkit-line-clamp: 3;
  }

  .footer-promo-section-fullbleed {
    padding-left: max(0.25rem, env(safe-area-inset-left, 0px));
    padding-right: max(0.25rem, env(safe-area-inset-right, 0px));
  }
}

@media (max-width: 380px) {
  .footer-promo-card {
    flex: 0 0 calc(100vw - 2.85rem);
  }

  .footer-promo-carousel-wrap {
    padding-left: max(2rem, env(safe-area-inset-left, 0px));
    padding-right: max(2rem, env(safe-area-inset-right, 0px));
  }
}

@media (min-width: 641px) and (max-width: 1023px) {
  .footer-promo-card {
    flex: 0 0 min(252px, 38vw);
    scroll-snap-align: start;
  }

  .footer-promo-carousel {
    gap: 1rem;
    scroll-padding-inline: clamp(0.75rem, 2.5vw, 1.5rem);
    padding: 0.55rem 0.5rem 0.65rem;
  }

  .footer-promo-carousel-wrap {
    padding-left: 2.75rem;
    padding-right: 2.75rem;
  }
}

@media (min-width: 1280px) {
  .footer-promo-card {
    flex: 0 0 min(292px, 24vw);
  }
}

.footer-promo-hint {
  font-size: clamp(0.9rem, 2.2vw, 1.08rem);
  font-weight: 500;
  line-height: 1.55;
  color: rgba(20, 81, 66, 0.82);
  text-align: center;
  margin: 0 auto;
  max-width: min(38rem, 100%);
  padding: 0 0.5rem;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  .footer-promo-hint {
    margin-left: 0;
    margin-right: 0;
    text-align: left;
    max-width: min(46rem, 100%);
    padding-left: 0;
    padding-right: 0;
    color: rgba(20, 81, 66, 0.78);
  }
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

.footer-giant-bg-text {
  font-size: min(26vw, 18rem);
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  /* Той самий «водяний знак», але в темно-зеленому (#145142), як кнопки — не світлий 0.12 */
  -webkit-text-stroke: 1.25px rgba(20, 81, 66, 0.52);
  background: linear-gradient(180deg, rgba(20, 81, 66, 0.36) 0%, rgba(20, 81, 66, 0.1) 48%, transparent 68%);
  -webkit-background-clip: text;
  background-clip: text;
}

@media (max-width: 480px) {
  .footer-giant-bg-text {
    font-size: min(32vw, 14rem);
  }
}

/* Компактний блок над баннерами: без «кінематографічних» орбіт і гігантського WATTA */
.cinematic-footer-wrap--compact .footer-ring-accent,
.cinematic-footer-wrap--compact .footer-orb {
  display: none !important;
}

.cinematic-footer-wrap--compact .cinematic-footer-wrapper.cinematic-footer--ribbon {
  background: var(--watta-page-gradient) !important;
  box-shadow: none;
}

.cinematic-footer-wrap--compact .footer-ready-block {
  padding-top: clamp(0.65rem, 2.2vw, 1.15rem);
}

.footer-catalog-carousel {
  display: flex;
  gap: 0.65rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 1rem;
  padding: 0.55rem 0.75rem;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.footer-catalog-carousel::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

.footer-catalog-chip {
  flex: 0 0 auto;
  scroll-snap-align: start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: 9999px;
  border: 1px solid rgba(20, 81, 66, 0.2);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 252, 251, 0.94));
  box-shadow: 0 10px 28px -12px rgba(20, 81, 66, 0.18);
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #145142;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    border-color 0.2s ease,
    box-shadow 0.22s ease;
}

@media (hover: hover) and (pointer: fine) {
  .footer-catalog-chip:hover {
    transform: translateY(-2px);
    border-color: rgba(20, 81, 66, 0.38);
    box-shadow: 0 14px 36px -12px rgba(20, 81, 66, 0.28);
  }
}

.footer-catalog-chip:focus-visible {
  outline: 2px solid hsl(var(--primary));
  outline-offset: 3px;
}

.footer-catalog-chip-emoji {
  font-size: 1.05rem;
  line-height: 1;
}

.footer-catalog-chip-name {
  white-space: nowrap;
  max-width: min(42vw, 200px);
  overflow: hidden;
  text-overflow: ellipsis;
}

.footer-promo-card-badge--popular {
  background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%);
  color: #fff;
}

/* Заголовок «Готові замовити?» → одразу стрічки акцій / рекомендацій */
.cinematic-footer-wrap--compact .footer-cinematic-strip-stack [role='region'] h3 {
  margin-bottom: 0.45rem;
}

.cinematic-footer-wrap--compact .footer-cinematic-strip-stack [role='region']:first-of-type .footer-promo-section-fullbleed {
  margin-top: 0;
}

/* ——— Рекомендовані: широка смуга, картки з виступом по краях ——— */
.footer-cinematic-rail--recommended {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: visible;
}

/* На всю ширину вікна, але з боковими «повітряними» полями — не впритик до краю */
.footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
  width: 100vw;
  max-width: 100vw;
  position: relative;
  left: auto;
  right: auto;
  transform: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding-left: max(0.85rem, env(safe-area-inset-left, 0px));
  padding-right: max(0.85rem, env(safe-area-inset-right, 0px));
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
    padding-left: max(1.1rem, env(safe-area-inset-left, 0px));
    padding-right: max(1.1rem, env(safe-area-inset-right, 0px));
  }
}

@media (min-width: 1024px) {
  .footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
    padding-left: max(1.35rem, env(safe-area-inset-left, 0px));
    padding-right: max(1.35rem, env(safe-area-inset-right, 0px));
  }
}

/* Трохи більше зазору між стрілками й каруселлю, ніж у звичайній стрічці */
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail {
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail {
    gap: 0.6rem;
  }
}

/* Картка в стрічці рекомендацій: товщіша рамка-градієнт, м'якша тінь */
.footer-cinematic-rail--recommended .footer-promo-card--watta-grid {
  position: relative;
  border-radius: 1.15rem;
}

.footer-cinematic-rail--recommended .footer-promo-card--watta-grid::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 1.2rem;
  background: linear-gradient(145deg, rgba(20, 81, 66, 0.5), rgba(40, 160, 130, 0.22), rgba(20, 81, 66, 0.32));
  z-index: -1;
  opacity: 0.9;
  pointer-events: none;
}

.footer-cinematic-rail--recommended .footer-promo-card--watta-grid .group {
  box-shadow: none;
  border-color: rgba(20, 81, 66, 0.12);
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .footer-cinematic-rail--recommended .footer-promo-card--watta-grid:hover .group {
    transform: translateY(-3px) scale(1.01);
    box-shadow: none;
  }
}

/* Рекомендовані: телефон — майже на всю ширину; sm+ — ширші картки, сильніший виступ по краях вікна */
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
  flex: 0 0 min(17.5rem, 92vw);
  max-width: none;
  scroll-snap-align: center;
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
  gap: 0.8rem;
  padding: 0.45rem 0 0.55rem;
  scroll-padding-inline: 0.35rem;
}

@media (min-width: 640px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 clamp(14.75rem, 32vw, 19rem);
    scroll-snap-align: start;
  }
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 0.95rem;
    scroll-padding-inline: 0.4rem;
  }
}

@media (min-width: 1024px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    scroll-padding-inline: 0.45rem;
  }
}

@media (min-width: 900px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 clamp(16rem, 26vw, 20.5rem);
  }
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 1.05rem;
  }
}

@media (min-width: 1200px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 clamp(17rem, 21vw, 22rem);
  }
}

@media (min-width: 1536px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 clamp(17.5rem, 18vw, 23.5rem);
  }
}

/* Трохи крупніше типографія й відступи в картці на планшеті+ */
@media (min-width: 640px) {
  .footer-cinematic-rail--recommended article.group.footer-rec-watta-card > div:last-child {
    padding: 1.05rem 1.2rem 1.25rem;
    gap: 0.4rem;
  }
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 1.05rem;
    line-height: 1.3;
  }
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    font-size: 0.8125rem;
    line-height: 1.45;
  }
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-price-web {
    font-size: 1.15rem;
  }
}

@media (min-width: 1024px) {
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 1.1rem;
  }
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-price-web {
    font-size: 1.2rem;
  }
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail {
  width: 2.2rem;
  height: 2.2rem;
  background: #ffffff;
  color: #145142;
  border: 1.5px solid rgba(20, 81, 66, 0.35);
  box-shadow: 0 4px 18px rgba(20, 81, 66, 0.18);
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail:hover {
  background: linear-gradient(160deg, #145142 0%, #1a6b58 100%);
  color: #fff;
  border-color: rgba(20, 81, 66, 0.55);
  box-shadow: 0 8px 24px rgba(20, 81, 66, 0.35);
}

/* Медіа-кут у стрічці рекомендацій: той самий паперовий тон, що й сторінка (без м’ятно-зеленого плейсхолдера) */
.footer-cinematic-rail--recommended .footer-rec-watta-card a[class*='group'] {
  background: var(--watta-page-fill) !important;
}

`


/** Товар у стрічках «Акції» / «Рекомендовані» (дані з API / адмінки). */
export type CinematicFooterAdminProduct = {
  id: number
  label: string
  imageUrl?: string
  categoryLabel?: string
  /** Для акційної ціни — показуємо −N% */
  discountPercent?: number
  description?: string
  price?: number
  /** Топ / хіт на картці */
  isPopular?: boolean
  emoji?: string
  /** Під назвою (вага / мл) */
  subtitleLine?: string
}

export type CinematicFooterProps = {
  className?: string
  /** Товари з promoDiscountPercent > 0 з адмінки */
  adminPromoProducts?: CinematicFooterAdminProduct[]
  /** Товари з isHomeHit з адмінки (стрічка «хіти») */
  adminRecommendedProducts?: CinematicFooterAdminProduct[]
  /** Додати в кошик зі стрічки, без переходу на сторінку страви */
  onAdminProductAddToCart: (productId: number) => void
  onBeforeNavigateToProduct?: () => void
  /**
   * fullscreen — окремий повноекранний скрол-блок.
   * compact — компактна стрічка (заголовок і стрічки товарів) одразу над баннерами.
   */
  layout?: 'fullscreen' | 'compact'
}

function scrollFooterStrip(el: HTMLDivElement | null, dir: -1 | 1, itemSelector: string = '.footer-promo-card') {
  if (!el) return
  const card = el.querySelector(itemSelector) as HTMLElement | null
  const gap = 16
  const step = card ? card.offsetWidth + gap : Math.min(el.clientWidth * 0.82, 300)
  el.scrollBy({ left: dir * step, behavior: 'smooth' })
}

function AdminProductStrip({
  title,
  ariaLabel,
  items,
  carouselRef,
  onScroll,
  onProductAddToCart,
  onBeforeNavigateToProduct,
  prevLabel,
  nextLabel,
  cinematicRail,
  stripKind = 'promo',
}: {
  title: string
  ariaLabel: string
  items: CinematicFooterAdminProduct[]
  carouselRef: React.RefObject<HTMLDivElement | null>
  onScroll: (dir: -1 | 1) => void
  onProductAddToCart: (id: number) => void
  onBeforeNavigateToProduct?: () => void
  prevLabel: string
  nextLabel: string
  /** Для відновлення горизонтального скролу після повернення з картки товару */
  cinematicRail?: 'recommended' | 'promo'
  /** Окремий вигляд для «Рекомендовані» */
  stripKind?: 'recommended' | 'promo'
}) {
  if (items.length === 0) return null
  const isRec = stripKind === 'recommended'

  const railInner = (
    <div className="footer-promo-section-fullbleed mt-1">
      <div className="footer-promo-rail">
        <button
          type="button"
          className="footer-promo-nav footer-promo-nav--rail footer-promo-nav--prev flex"
          onClick={() => onScroll(-1)}
          aria-label={prevLabel}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="footer-promo-rail__track">
          <div
            ref={carouselRef as React.Ref<HTMLDivElement>}
            className="footer-promo-carousel"
            data-cinematic-rail={cinematicRail}
          >
            {items.map((p) => {
              const promoPct =
                p.discountPercent && p.discountPercent > 0 ? Math.round(p.discountPercent) : undefined
              return (
                <div
                  key={p.id}
                  className="footer-promo-card footer-promo-card--watta-grid text-left"
                >
                  <WattaMenuProductCard
                    variant="grid"
                    className={cn('w-full min-w-0 flex-1', isRec && 'footer-rec-watta-card')}
                    product={{
                      id: p.id,
                      name: (p.label || '').trim() || '—',
                      description: p.description ?? '',
                      price: p.price ?? 0,
                      emoji: p.emoji ?? '🍣',
                      imageUrl: p.imageUrl,
                      isTop: p.isPopular === true,
                      isHomeHit: isRec,
                      promoDiscountPercent: promoPct,
                    }}
                    subtitleLine={p.subtitleLine}
                    onAddToCart={() => onProductAddToCart(p.id)}
                    onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <button
          type="button"
          className="footer-promo-nav footer-promo-nav--rail footer-promo-nav--next flex"
          onClick={() => onScroll(1)}
          aria-label={nextLabel}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )

  if (isRec) {
    return (
      <div className="w-full footer-cinematic-rail--recommended" role="region" aria-label={ariaLabel}>
        {railInner}
      </div>
    )
  }

  return (
    <div className="w-full" role="region" aria-label={ariaLabel}>
      <h3 className="mb-3 px-2 text-center font-sans text-base font-bold tracking-tight text-[#145142] sm:text-lg">
        {title}
      </h3>
      {railInner}
    </div>
  )
}

export function CinematicFooter({
  className,
  adminPromoProducts = [],
  adminRecommendedProducts = [],
  onAdminProductAddToCart,
  onBeforeNavigateToProduct,
  layout = 'fullscreen',
}: CinematicFooterProps) {
  const cf = useLanguage().t.cinematicFooter
  const isCompact = layout === 'compact'

  const wrapperRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const giantTextOuterRef = useRef<HTMLDivElement>(null)
  const giantTextRef = useRef<HTMLDivElement>(null)
  const leftColRef = useRef<HTMLDivElement>(null)
  const promoCarouselRef = useRef<HTMLDivElement>(null)
  const recCarouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || layout === 'compact') return
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
  }, [layout])

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

      if (layout === 'fullscreen' && giantTextOuterRef.current) {
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
  }, [layout])

  const scrollPromoStrip = useCallback((dir: -1 | 1) => {
    scrollFooterStrip(promoCarouselRef.current, dir)
  }, [])

  const scrollRecStrip = useCallback((dir: -1 | 1) => {
    scrollFooterStrip(recCarouselRef.current, dir)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div
        ref={wrapperRef}
        className={cn('relative w-full', isCompact ? 'cinematic-footer-wrap--compact' : 'min-h-[100svh]', className)}
        style={
          isCompact
            ? undefined
            : { clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }
        }
      >
        <footer
          ref={footerRef}
          className={cn(
            'cinematic-footer-wrapper cinematic-footer--calm flex w-full flex-col overflow-hidden text-foreground',
            isCompact
              ? 'cinematic-footer--ribbon relative min-h-0 bg-transparent'
              : 'absolute inset-0 min-h-0 justify-between bg-background',
          )}
        >
          <div className="footer-bg-mesh animate-footer-mesh-drift pointer-events-none absolute inset-0 z-0" />
          <div className="footer-aurora pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 animate-footer-breathe rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid animate-footer-grid-pan pointer-events-none absolute inset-0 z-0" />
          {!isCompact && (
            <>
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
            </>
          )}

          <div
            className={cn(
              'relative z-10 mx-auto flex w-full max-w-[100rem] flex-col items-center gap-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]',
              isCompact
                ? 'flex-none gap-6 py-3 pb-2 pt-1.5 sm:gap-8 sm:py-4 sm:pb-2 sm:pt-2 md:px-8 lg:gap-9 lg:px-10 lg:pb-3 xl:px-14'
                : 'flex-1 justify-center pb-[max(2rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] pt-1 sm:mt-12 sm:gap-10 sm:pb-[max(2.5rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] sm:pl-8 sm:pr-8 md:mt-16 md:pl-10 md:pr-10 lg:mt-[4.5rem] lg:gap-12 lg:px-12 lg:pb-[max(3rem,calc(1rem+env(safe-area-inset-bottom,0px)))] xl:gap-14 xl:px-16 2xl:px-24',
            )}
          >
            <div
              ref={leftColRef}
              className={cn(
                'flex w-full max-w-3xl flex-col items-center text-center',
                isCompact ? 'gap-5 sm:gap-6' : 'gap-8',
              )}
            >
              <div
                className={cn(
                  'flex w-full flex-col items-center',
                  isCompact ? 'gap-2.5 sm:gap-3' : 'gap-8',
                )}
              >
                <div className="footer-ready-block">
                  <h2 className="footer-ready-heading w-full min-w-0 text-center">
                    <span className="footer-ready-line">
                      <span className="footer-ready-kicker">{cf.readyTitleKicker}</span>
                      <span className="footer-ready-divider" aria-hidden="true" />
                      <span className="footer-ready-grad">{cf.readyTitleSub}</span>
                    </span>
                  </h2>
                </div>

                <div
                  className={cn(
                    'footer-cinematic-strip-stack flex w-full flex-col items-center',
                    isCompact ? 'gap-4 sm:gap-5' : 'gap-8',
                  )}
                >
                  <AdminProductStrip
                    title={cf.sectionRecommendedTitle}
                    ariaLabel={cf.recommendedStripAria}
                    items={adminRecommendedProducts}
                    carouselRef={recCarouselRef}
                    onScroll={scrollRecStrip}
                    onProductAddToCart={onAdminProductAddToCart}
                    onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                    prevLabel={cf.prevPromo}
                    nextLabel={cf.nextPromo}
                    cinematicRail="recommended"
                    stripKind="recommended"
                  />

                  <AdminProductStrip
                    title={cf.sectionPromoTitle}
                    ariaLabel={cf.promoStripAria}
                    items={adminPromoProducts}
                    carouselRef={promoCarouselRef}
                    onScroll={scrollPromoStrip}
                    onProductAddToCart={onAdminProductAddToCart}
                    onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                    prevLabel={cf.prevPromo}
                    nextLabel={cf.nextPromo}
                    cinematicRail="promo"
                  />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
