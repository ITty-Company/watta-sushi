'use client'

import * as React from 'react'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '@/lib/utils'
import { getMenuScrollParent } from '@/lib/menuScroll'
import { useLanguage } from '@/app/context/LanguageContext'
import { WattaMenuProductCard } from '@/app/components/WattaMenuProductCard'
import { WattaInViewFadeDiv } from '@/app/components/WattaInViewFade'
import { FooterReadyAnimatedHead } from '@/app/components/FooterReadyAnimatedHead'

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

@keyframes footer-ready-glow {
  0%, 100% { opacity: 0.55; transform: scale(1) translateY(0); }
  50% { opacity: 0.9; transform: scale(1.06) translateY(-3%); }
}

@keyframes footer-ready-sparkle {
  0%, 100% { opacity: 0.35; transform: scale(0.85) rotate(0deg); }
  50% { opacity: 0.95; transform: scale(1.1) rotate(12deg); }
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
  .footer-ready-display,
  .footer-ready-quote::before,
  .footer-ready-reveal-char,
  .footer-ready-reveal-line,
  .footer-ready-reveal-line-block,
  .footer-ready-reveal-line-block--active,
  .footer-ready-reveal-line--active {
    animation: none !important;
    filter: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}

/* Заголовок «Наші хіти» над стрічками — без картки-панелі */
.footer-ready-block {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-inline: clamp(0.35rem, 2vw, 1rem);
  box-sizing: border-box;
}

.footer-ready-head {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(100%, 44rem);
  padding: clamp(0.15rem, 1.2vw, 0.5rem) 0 clamp(0.35rem, 1.5vw, 0.65rem);
  background: transparent;
  border: none;
  box-shadow: none;
}

.footer-ready-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.5rem, 2.2vw, 0.85rem);
  margin: clamp(0.45rem, 1.4vw, 0.65rem) 0 0;
  font-family: var(--font-brand-inter), Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: clamp(0.6rem, 1.2vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-wrap: balance;
}

.footer-ready-eyebrow-label {
  color: #e85a24;
}

.footer-ready-eyebrow-line {
  display: block;
  width: clamp(1.35rem, 6vw, 2.75rem);
  height: 1px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: linear-gradient(90deg, transparent 0%, rgba(20, 81, 66, 0.1) 38%, rgba(20, 81, 66, 0.38) 100%);
}

.footer-ready-eyebrow-line--end {
  background: linear-gradient(270deg, transparent 0%, rgba(20, 81, 66, 0.1) 38%, rgba(20, 81, 66, 0.38) 100%);
}

.footer-ready-heading {
  position: relative;
  z-index: 1;
  margin: 0;
  font: inherit;
  display: flex;
  width: 100%;
  justify-content: center;
}

.footer-ready-title-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.45rem, 1.6vw, 0.7rem);
  width: 100%;
  max-width: min(100%, 36rem);
}

.footer-ready-quote {
  margin: 0;
  padding: 0;
  border: none;
  display: inline-flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: center;
  gap: 0.12em;
  max-width: min(100%, 32rem);
  text-align: left;
}

.footer-ready-quote::before {
  content: '“';
  font-family: var(--font-brand-playfair), 'Playfair Display', Georgia, serif;
  font-size: clamp(1.5rem, 4.2vw, 2.1rem);
  font-weight: 600;
  line-height: 1;
  color: rgba(196, 90, 40, 0.55);
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 0.08em;
  pointer-events: none;
  user-select: none;
}

.footer-ready-display {
  font-family: var(--font-brand-playfair), 'Playfair Display', Georgia, serif;
  font-feature-settings: 'liga' 1, 'kern' 1;
  font-size: clamp(1.68rem, 4.8vw, 2.55rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.032em;
  text-wrap: balance;
  color: #111;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.footer-ready-lede {
  margin: 0;
  padding: 0;
  font-family: var(--font-brand-inter), Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: clamp(0.98rem, 2.1vw, 1.15rem);
  font-style: normal;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.01em;
  color: #0f3d32;
  text-wrap: balance;
  -webkit-font-smoothing: antialiased;
}

.footer-ready-reveal-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(0.45em);
  animation: footer-ready-char-in 0.55s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
}

.footer-ready-reveal-char--lede {
  transform: translateY(0.35em) scale(0.96);
  animation-name: footer-ready-lede-char-in;
  animation-duration: 0.62s;
}

.footer-ready-reveal-char--eyebrow {
  transform: translateY(0.4em);
  animation-duration: 0.5s;
}

.footer-ready-reveal-line {
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: center;
  animation: footer-ready-line-in 0.55s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
}

@keyframes footer-ready-char-in {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes footer-ready-lede-char-in {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes footer-ready-line-in {
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}

@media (max-width: 400px) {
  .footer-ready-head {
    padding-bottom: 0.25rem;
  }
  .footer-ready-display {
    font-size: clamp(1.32rem, 5.4vw, 1.78rem);
    letter-spacing: -0.025em;
  }
  .footer-ready-lede {
    font-size: clamp(0.95rem, 3.8vw, 1.08rem);
    line-height: 1.4;
  }
  .footer-ready-title-stack {
    gap: 0.35rem;
  }
  .footer-ready-quote::before {
    font-size: clamp(1.45rem, 5.5vw, 1.85rem);
  }
  .footer-ready-eyebrow {
    letter-spacing: 0.16em;
    font-size: 0.56rem;
  }
}

/* «Наші хіти»: построчна анімація (без посимвольного stagger). */
.footer-ready-reveal-line-block {
  opacity: 0;
  transform: translateY(0.42em);
  will-change: opacity, transform;
}

.footer-ready-reveal-line-block--active {
  animation: footer-ready-char-in 0.52s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
}

.footer-ready-reveal-line--active {
  animation: footer-ready-line-in 0.48s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
}

@media (max-width: 767px) {
  .footer-ready-head--mobile {
    padding: 0 0 clamp(0.35rem, 1.1vh, 0.55rem);
  }

  .footer-ready-head--mobile .footer-ready-title-stack {
    gap: clamp(0.35rem, 1.4vh, 0.55rem);
    width: 100%;
    max-width: min(100%, 22rem);
    margin-inline: auto;
  }

  .footer-ready-head--mobile .footer-ready-quote {
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    text-align: left;
    max-width: min(100%, 20rem);
    margin-inline: auto;
  }

  .footer-ready-head--mobile .footer-ready-quote::before {
    align-self: flex-start;
    margin-top: 0.08em;
    margin-bottom: 0;
  }

  .footer-ready-head--mobile .footer-ready-display {
    display: block;
    width: 100%;
    text-align: center;
    text-wrap: balance;
  }

  .footer-ready-head--mobile .footer-ready-lede {
    display: block;
    width: auto;
    max-width: 100%;
    text-align: left;
    text-wrap: balance;
  }

  .footer-ready-head--mobile .footer-ready-eyebrow {
    margin-top: clamp(0.25rem, 0.8vh, 0.4rem);
    flex-wrap: wrap;
    justify-content: center;
    row-gap: 0.25rem;
  }

  .footer-ready-head--mobile .footer-ready-reveal-line-block {
    animation: footer-ready-char-in 0.52s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
  }

  .footer-ready-head--mobile .footer-ready-reveal-line {
    animation: footer-ready-line-in 0.48s cubic-bezier(0.22, 0.82, 0.22, 1) forwards;
    animation-delay: 0.22s;
  }
}

@media (min-width: 768px) {
  .footer-ready-head--wide {
    padding: 0 0 clamp(0.1rem, 0.4vw, 0.2rem);
  }

  .footer-ready-head--wide .footer-ready-title-stack {
    gap: clamp(0.35rem, 1.1vw, 0.55rem);
  }

  .footer-ready-head--wide .footer-ready-eyebrow {
    margin-top: clamp(0.2rem, 0.55vw, 0.35rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .footer-ready-reveal-line-block,
  .footer-ready-reveal-line-block--active,
  .footer-ready-reveal-line--active {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
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
  flex: 1 1 auto;
  align-self: stretch;
  height: 100%;
  min-height: 100%;
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
  transform: scale(1.03);
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
  width: 1.72rem;
  height: 1.72rem;
  min-width: 1.72rem;
  min-height: 1.72rem;
}

.cinematic-footer-wrap--compact .footer-promo-nav--rail svg {
  width: 0.85rem;
  height: 0.85rem;
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
    width: 1.88rem;
    height: 1.88rem;
    min-width: 1.88rem;
    min-height: 1.88rem;
  }

  .cinematic-footer-wrap--compact .footer-promo-nav--rail svg {
    width: 0.92rem;
    height: 0.92rem;
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

  /* «Наші хіти» на головній — не 0.25rem, відступ задає #menu-cinematic-block */
  #menu-cinematic-block .footer-promo-section-fullbleed {
    padding-left: 0 !important;
    padding-right: 0 !important;
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
  background: transparent !important;
  box-shadow: none;
}

/* Головна «хіти»: без білої «подложки» під каруселлю — лише картки */
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended,
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-section-fullbleed,
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail,
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
  background: transparent;
  box-shadow: none;
}

/* Компактний cinematic: стрілки каруселі збоку — без overflow:hidden на footer (інакше обрізаються) */
.cinematic-footer-wrap--compact .cinematic-footer-wrapper {
  overflow-x: visible !important;
  overflow-y: visible !important;
}

.cinematic-footer-wrap--compact .footer-ready-block {
  padding-top: 0;
  padding-bottom: 0;
}

.cinematic-footer-wrap--compact .footer-ready-head {
  width: min(100%, 36rem);
  padding: 0 0 clamp(0.2rem, 1vw, 0.35rem);
}

@media (min-width: 768px) {
  .cinematic-footer-wrap--compact .footer-ready-block {
    margin-bottom: clamp(-0.15rem, -0.35vw, 0);
  }

  .cinematic-footer-wrap--compact .footer-ready-head {
    padding-bottom: clamp(0.05rem, 0.25vw, 0.15rem);
  }

  .cinematic-footer-wrap--compact .footer-cinematic-strip-stack {
    gap: clamp(0.45rem, 1.1vw, 0.65rem) !important;
  }

  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
    margin-top: 0 !important;
  }
}

.cinematic-footer-wrap--compact .footer-ready-display {
  font-size: clamp(1.42rem, 3.9vw, 2rem);
}

.cinematic-footer-wrap--compact .footer-ready-lede {
  font-size: clamp(0.9rem, 1.75vw, 1.02rem);
  color: #0f3d32;
}

.cinematic-footer-wrap--compact .footer-ready-quote::before {
  font-size: clamp(1.28rem, 3.4vw, 1.6rem);
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
  margin-bottom: 0.3rem !important;
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

/* На всю ширину вікна; бокові поля як у каталозі на головній */
.footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
  width: 100vw;
  max-width: 100vw;
  position: relative;
  left: auto;
  right: auto;
  transform: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding-left: max(clamp(1rem, 4.2vw, 1.35rem), env(safe-area-inset-left, 0px));
  padding-right: max(clamp(1rem, 4.2vw, 1.35rem), env(safe-area-inset-right, 0px));
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
    padding-left: max(clamp(1rem, 4.2vw, 1.35rem), env(safe-area-inset-left, 0px));
    padding-right: max(clamp(1rem, 4.2vw, 1.35rem), env(safe-area-inset-right, 0px));
  }
}

@media (min-width: 1024px) {
  .footer-cinematic-rail--recommended .footer-promo-section-fullbleed {
    padding-left: max(0.65rem, env(safe-area-inset-left, 0px));
    padding-right: max(0.65rem, env(safe-area-inset-right, 0px));
  }
}

/* Вертикальний stack «хіти» на головній: fullbleed інакше дає ~0.35rem до краю екрана */
.footer-cinematic-rail--recommended .footer-promo-section-fullbleed.footer-promo-section-fullbleed--hits-stack {
  padding-left: max(1.375rem, env(safe-area-inset-left, 0px));
  padding-right: max(1.375rem, env(safe-area-inset-right, 0px));
}

@media (min-width: 480px) {
  .footer-cinematic-rail--recommended .footer-promo-section-fullbleed.footer-promo-section-fullbleed--hits-stack {
    padding-left: max(1.625rem, env(safe-area-inset-left, 0px));
    padding-right: max(1.625rem, env(safe-area-inset-right, 0px));
  }
}

/* Менший зазор стрілки — карусель: картки ближче до країв поруч із кнопками */
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail {
  gap: 0.35rem;
}

@media (min-width: 640px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail {
    gap: 0.42rem;
  }
}

/* Картка в стрічці рекомендацій — ті самі білі картки, що в меню (без зеленої «подложки»). */
.footer-cinematic-rail--recommended .footer-promo-card--watta-grid {
  position: relative;
  border-radius: 1.25rem;
  align-self: stretch;
  display: flex;
  flex-direction: column;
}

/* «Вибір гостей»: однакова висота карток у каруселі (як у home-menu-category-rail). */
.footer-cinematic-rail--recommended .footer-promo-carousel {
  align-items: stretch;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card.home-menu-product-card--grid-web {
  flex: 1 1 auto;
  align-self: stretch !important;
  height: 100%;
  min-height: 100%;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-inner-web {
  flex: 1 1 auto;
  min-height: 100%;
  height: 100%;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-body-web,
.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-head-web {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-footer-web {
  margin-top: auto !important;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-media-frame-web {
  aspect-ratio: var(--watta-product-card-photo-aspect, 5 / 6);
  height: auto;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  background: #ffffff;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-media-web--grid-natural {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #ffffff;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-img-web--grid-natural,
.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-img-web {
  width: 100% !important;
  height: 100% !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center center;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-placeholder-web {
  position: absolute;
  inset: 0;
  aspect-ratio: unset;
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-title-web {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  min-height: calc(2 * 1.28em);
}

.footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-desc-web {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  min-height: calc(2 * 1.35em);
}

.footer-cinematic-rail--recommended .footer-promo-card--watta-grid .group {
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1);
}

@media (hover: hover) and (pointer: fine) {
  .footer-cinematic-rail--recommended .footer-promo-card--watta-grid:hover .group {
    transform: translateY(-1px);
  }
}

/* «Хіти» на планшеті+: фіксований aspect; на телефоні — ті самі правила, що в .home-menu-product-card--grid-web */
@media (min-width: 768px) {
  .footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-media-frame-web {
    aspect-ratio: var(--watta-product-card-photo-aspect, 5 / 6);
    max-height: none;
  }

  .footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-img-web {
    display: block;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    max-height: none !important;
    object-fit: contain !important;
    object-position: center center;
  }
}


/* Рекомендовані / хіти: телефон — 1 картка + половина наступної, решта — свайп */
.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
  flex: 0 0 calc((100% - 0.8rem) / 1.5);
  max-width: none;
  scroll-snap-align: start;
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
  gap: 0.8rem;
  padding: 0.45rem 0 0.55rem;
  scroll-padding-inline: max(0.2rem, env(safe-area-inset-left, 0px));
}

@media (min-width: 640px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 calc((100% - 0.95rem) / 1.5);
    max-width: none;
    scroll-snap-align: start;
  }
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 0.95rem;
    scroll-padding-inline: max(0.28rem, env(safe-area-inset-left, 0px));
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  /* Планшет: 2 повні + половина третьої — ширші картки, текст вміщається */
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 calc((100% - 2rem) / 2.5);
    max-width: calc((100% - 2rem) / 2.5);
    scroll-snap-align: start;
  }

  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 1rem;
    scroll-padding-inline: max(0.28rem, env(safe-area-inset-left, 0px));
    padding-bottom: 0.5rem;
  }

  .footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-media-frame-web {
    aspect-ratio: var(--watta-product-card-photo-aspect, 5 / 6);
    max-height: none;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 1.35;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-footer-web {
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.45rem;
    padding-top: 0.45rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-add-web--icon,
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-favorite-btn-web {
    width: 2.25rem;
    height: 2.25rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 0.98rem;
    line-height: 1.26;
    -webkit-line-clamp: 2;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-price-web {
    font-size: 1.02rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 0.72rem 0.82rem 0.82rem;
    gap: 0.5rem;
  }
}

@media (min-width: 1024px) and (max-width: 1279px) {
  /* iPad landscape / вузький ноут: 3 картки + peek — не 4 вузьких */
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 0.95rem;
    padding-bottom: 0.55rem;
    scroll-padding-inline: max(0.32rem, env(safe-area-inset-left, 0px));
  }

  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 calc((100% - (0.95rem * 2)) / 3);
    max-width: calc((100% - (0.95rem * 2)) / 3);
    scroll-snap-align: start;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 1.35;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 1rem;
    line-height: 1.28;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 0.72rem 0.82rem 0.82rem;
    gap: 0.48rem;
  }
}

@media (min-width: 1280px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    gap: 0.75rem;
    padding-bottom: 0.65rem;
    scroll-padding-inline: max(0.32rem, env(safe-area-inset-left, 0px));
  }

  /* Широкий десктоп: 4 повні + половина п’ятої */
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: 0 0 calc((100% - (0.75rem * 4)) / 4.5);
    max-width: calc((100% - (0.75rem * 4)) / 4.5);
  }

  .footer-cinematic-rail--recommended .footer-rec-watta-card .home-menu-product-card-media-frame-web {
    aspect-ratio: var(--watta-product-card-photo-aspect, 5 / 6);
    max-height: none;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    -webkit-line-clamp: 2;
    line-clamp: 2;
    line-height: 1.35;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-footer-web {
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.45rem;
    padding-top: 0.5rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-add-web--icon,
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-favorite-btn-web {
    width: 2.35rem;
    height: 2.35rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 1.05rem;
    line-height: 1.28;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-price-web {
    font-size: 1.12rem;
  }

  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 0.75rem 0.85rem 0.85rem;
    gap: 0.5rem;
  }
}

/* Трохи крупніше типографія й відступи в картці — лише вузький планшет 640–767 (на 768–1023 «хіти» компактніші) */
@media (min-width: 640px) and (max-width: 767px) {
  .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 1.05rem 1.2rem 1.25rem;
    gap: 0.55rem;
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

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail {
  width: 1.78rem;
  height: 1.78rem;
  min-width: 1.78rem;
  min-height: 1.78rem;
  background: #ffffff;
  color: #145142;
  border: 1px solid rgba(20, 81, 66, 0.32);
  box-shadow: 0 3px 14px rgba(20, 81, 66, 0.14);
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail svg {
  width: 0.82rem;
  height: 0.82rem;
}

.cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail:hover {
  background: linear-gradient(160deg, #145142 0%, #1a6b58 100%);
  color: #fff;
  border-color: rgba(20, 81, 66, 0.55);
  box-shadow: 0 8px 24px rgba(20, 81, 66, 0.35);
}

@media (min-width: 1280px) {
  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail {
    width: 1.82rem;
    height: 1.82rem;
    min-width: 1.82rem;
    min-height: 1.82rem;
  }

  .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail svg {
    width: 0.85rem;
    height: 0.85rem;
  }
}

/* Медіа-кут у стрічці рекомендацій: той самий паперовий тон, що й сторінка (без м’ятно-зеленого плейсхолдера) */
.footer-cinematic-rail--recommended .footer-rec-watta-card a[class*='group'] {
  background: var(--watta-page-fill) !important;
}

.cinematic-footer-wrap--compact .footer-promo-carousel--stack {
  display: flex !important;
  flex-direction: column !important;
  flex-wrap: nowrap !important;
  grid-template-columns: unset !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
  scroll-snap-type: none !important;
  gap: 0.75rem !important;
  padding-bottom: 0.35rem;
}

@media (min-width: 480px) {
  .cinematic-footer-wrap--compact .footer-promo-carousel--stack {
    gap: 0.85rem !important;
  }
}

.cinematic-footer-wrap--compact .footer-promo-carousel--stack .footer-promo-card {
  flex: unset !important;
  max-width: none !important;
  width: 100% !important;
  min-width: 0 !important;
}

/* Головна «Наші хіти»: телефон — один товар у ряд, картки як у #home-menu-catalog */
@media (max-width: 767.98px) {
  .menu-page-web:not(.watta-full-menu-page) {
    --watta-home-hits-side-gutter: clamp(1.25rem, 5.5vw, 1.65rem);
  }

  html.watta-html-home-hero
    .menu-page-web.watta-site-hero-page-web:not(.watta-full-menu-page)
    .delivery-page-home-flow:has(.watta-home-photo-first-screen)
    > #menu-cinematic-block {
    margin-top: 0 !important;
    padding-top: clamp(1.25rem, 4.5vh, 2rem) !important;
  }

  .menu-page-web:not(.watta-full-menu-page) #menu-cinematic-block {
    padding-left: max(
      var(--watta-home-hits-side-gutter, var(--watta-home-product-side-gutter, clamp(1.125rem, 5vw, 1.5rem))),
      env(safe-area-inset-left, 0px)
    ) !important;
    padding-right: max(
      var(--watta-home-hits-side-gutter, var(--watta-home-product-side-gutter, clamp(1.125rem, 5vw, 1.5rem))),
      env(safe-area-inset-right, 0px)
    ) !important;
    box-sizing: border-box;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-ready-block {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-nav--rail {
    display: none !important;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-rail__track {
    width: 100%;
    min-width: 0;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-section-fullbleed,
  #menu-cinematic-block .footer-cinematic-rail--recommended .footer-promo-section-fullbleed.footer-promo-section-fullbleed--hits-stack {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    left: auto !important;
    right: auto !important;
    transform: none !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-carousel {
    display: flex !important;
    flex-direction: column !important;
    flex-wrap: nowrap !important;
    overflow-x: visible !important;
    overflow-y: visible !important;
    scroll-snap-type: none !important;
    gap: 0.75rem !important;
    padding: 0 !important;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .home-menu-cat-view-all-wrap-web {
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card {
    flex: unset !important;
    max-width: none !important;
    width: 100% !important;
    min-width: 0 !important;
    scroll-snap-align: none !important;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card--watta-grid::before {
    display: none;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-promo-card--watta-grid {
    border-radius: 1rem;
    overflow: hidden;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended .footer-rec-watta-card.home-menu-product-card--grid-web {
    width: 100%;
    max-width: none;
    box-shadow: none;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 0 clamp(0.75rem, 2.5vw, 1rem) clamp(0.75rem, 2.5vw, 1rem);
    gap: 0.35rem;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: clamp(1rem, 2.4vw, 1.125rem);
    line-height: 1.22;
    min-height: calc(2 * 1.22em);
    max-height: calc(2 * 1.22em);
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-footer-web {
    margin-top: auto;
    padding-top: 0.35rem;
    gap: 0.5rem;
  }
}

@media (max-width: 639.98px) {
  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-inner-web {
    padding: 0 0.72rem 0.72rem;
    gap: 0.35rem;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-title-web {
    font-size: 0.9rem;
    line-height: 1.2;
    min-height: calc(2 * 1.2em);
    max-height: calc(2 * 1.2em);
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-desc-web {
    font-size: 0.74rem;
    line-height: 1.38;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-card-footer-web {
    margin-top: auto !important;
    padding-top: 0.38rem;
    gap: 0.4rem;
  }

  #menu-cinematic-block .cinematic-footer-wrap--compact .footer-cinematic-rail--recommended article.footer-rec-watta-card .home-menu-product-add-web {
    min-height: 1.85rem;
    padding: 0.2rem 0.45rem 0.2rem 0.38rem;
    font-size: 0.58rem;
  }
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
  /** «Новинка» на /menu */
  isMenuNew?: boolean
  /** Показувати бейдж «хіт на головній» лише якщо true (стрічка рекомендацій) */
  isHomeHit?: boolean
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
  onAdminProductAddToCart: (product: {
    id: number
    name: string
    description?: string
    price: number
    emoji?: string
    imageUrl?: string
    promoDiscountPercent?: number
  }) => void
  onBeforeNavigateToProduct?: () => void
  /**
   * fullscreen — окремий повноекранний скрол-блок.
   * compact — компактна стрічка (заголовок і стрічки товарів) одразу над баннерами.
   */
  layout?: 'fullscreen' | 'compact'
  /** Головна (compact): прев’ю хітів вертикально + кнопка «усе меню» */
  homeRecommendedStack?: {
    maxItems: number
    seeAllHref: string
    seeAllLabel: string
  }
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
  layoutMode = 'rail',
  seeAllLink,
}: {
  title: string
  ariaLabel: string
  items: CinematicFooterAdminProduct[]
  carouselRef: React.RefObject<HTMLDivElement | null>
  onScroll: (dir: -1 | 1) => void
  onProductAddToCart: (product: {
    id: number
    name: string
    description?: string
    price: number
    emoji?: string
    imageUrl?: string
    promoDiscountPercent?: number
  }) => void
  onBeforeNavigateToProduct?: () => void
  prevLabel: string
  nextLabel: string
  cinematicRail?: 'recommended' | 'promo'
  stripKind?: 'recommended' | 'promo'
  layoutMode?: 'rail' | 'stack'
  seeAllLink?: { href: string; label: string }
}) {
  if (items.length === 0) return null
  const isRec = stripKind === 'recommended'

  const stripHeading =
    title.trim().length > 0 ? (
      <h3 className="mb-3 px-2 text-center font-sans text-base font-bold tracking-tight text-[#145142] sm:text-lg">
        {title}
      </h3>
    ) : null

  const cardShellClass =
    layoutMode === 'stack'
      ? 'footer-promo-card footer-promo-card--watta-grid w-full max-w-lg text-left'
      : 'footer-promo-card footer-promo-card--watta-grid text-left'

  const productCards = items.map((p, index) => {
    const promoPct = p.discountPercent && p.discountPercent > 0 ? Math.round(p.discountPercent) : undefined
    return (
      <div key={p.id} className={cardShellClass}>
        <WattaMenuProductCard
          variant="grid"
          className={cn('min-w-0 w-full shadow-sm', isRec && 'footer-rec-watta-card')}
          product={{
            id: p.id,
            name: (p.label || '').trim() || '—',
            description: p.description ?? '',
            price: p.price ?? 0,
            emoji: p.emoji ?? '🍣',
            imageUrl: p.imageUrl,
            isTop: p.isPopular === true,
            isMenuNew: p.isMenuNew === true,
            promoDiscountPercent: promoPct,
          }}
          subtitleLine={p.subtitleLine}
          onAddToCart={(cardProduct) =>
            onProductAddToCart({
              id: cardProduct.id,
              name: cardProduct.name,
              description: cardProduct.description,
              price: cardProduct.price,
              emoji: cardProduct.emoji,
              imageUrl: cardProduct.imageUrl,
              promoDiscountPercent: cardProduct.promoDiscountPercent,
            })
          }
          onBeforeNavigateToProduct={onBeforeNavigateToProduct}
        />
      </div>
    )
  })

  if (layoutMode === 'stack' && isRec) {
    return (
      <div className="footer-cinematic-rail--recommended w-full" role="region" aria-label={ariaLabel}>
        {stripHeading}
        <div className="footer-promo-section-fullbleed footer-promo-section-fullbleed--hits-stack mt-1 w-full">
          <div
            ref={carouselRef as React.Ref<HTMLDivElement>}
            className="footer-promo-carousel footer-promo-carousel--stack mx-auto w-full max-w-lg px-0"
            data-cinematic-rail={cinematicRail}
          >
            {productCards}
          </div>
          {seeAllLink ? (
            <div className="home-menu-cat-view-all-wrap-web">
              <Link href={seeAllLink.href} className="home-menu-cat-view-all-btn-web">
                {seeAllLink.label}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  const railInner = (
    <div
      className={cn(
        'footer-promo-section-fullbleed mt-1',
        isRec && seeAllLink && 'footer-promo-section-fullbleed--hits-stack',
      )}
    >
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
            {productCards}
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
    const seeAllCta =
      seeAllLink && layoutMode === 'rail' ? (
        <div className="home-menu-cat-view-all-wrap-web">
          <Link href={seeAllLink.href} className="home-menu-cat-view-all-btn-web">
            {seeAllLink.label}
          </Link>
        </div>
      ) : null

    return (
      <div className="footer-cinematic-rail--recommended w-full" role="region" aria-label={ariaLabel}>
        {stripHeading}
        {railInner}
        {seeAllCta}
      </div>
    )
  }

  return (
    <div className="w-full" role="region" aria-label={ariaLabel}>
      {stripHeading}
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
  homeRecommendedStack,
}: CinematicFooterProps) {
  const { t } = useLanguage()
  const cf = t.cinematicFooter
  const isCompact = layout === 'compact'

  const compactRecItems = useMemo(() => {
    if (!isCompact || !homeRecommendedStack) return adminRecommendedProducts
    return adminRecommendedProducts.slice(0, homeRecommendedStack.maxItems)
  }, [adminRecommendedProducts, homeRecommendedStack, isCompact])

  /** Головна compact: вертикальний стовпчик на телефоні — лише CSS (max-width 767px), без hydration flip. */
  const recLayoutMode: 'rail' | 'stack' = 'rail'
  const recSeeAll = useMemo(() => {
    if (isCompact && homeRecommendedStack) {
      return { href: homeRecommendedStack.seeAllHref, label: homeRecommendedStack.seeAllLabel }
    }
    if (recLayoutMode === 'rail' && compactRecItems.length > 0) {
      return { href: '/menu', label: cf.seeFullMenu }
    }
    return undefined
  }, [isCompact, homeRecommendedStack, recLayoutMode, compactRecItems.length, cf.seeFullMenu])

  /** Заголовок і підзаголовок лише в h2 зверху — без дубля в стрічці (і на вузькому екрані зі stack). */
  const recommendedStripTitle = ''

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

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    /* Compact (головна): поява секцій — WattaInViewFade у JSX, без GSAP. */
    if (layout === 'compact') {
      return undefined
    }

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

    let refreshTimer = 0
    const onRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(() => {
        refreshTimer = 0
        ScrollTrigger.refresh()
      }, 480)
    }
    window.addEventListener('resize', onRefresh, { passive: true })
    const t = window.setTimeout(onRefresh, 300)

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer)
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
              'relative z-10 mx-auto flex w-full max-w-[100rem] flex-col items-center gap-8',
              isCompact
                ? 'pl-[max(1.125rem,env(safe-area-inset-left,0px))] pr-[max(1.125rem,env(safe-area-inset-right,0px))] flex-none gap-2 py-0 pb-1 pt-0 sm:gap-4 sm:py-1 sm:pb-1.5 sm:pt-0 sm:pl-[max(1.375rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.375rem,env(safe-area-inset-right,0px))] md:px-3 lg:gap-5 lg:px-4 lg:pb-1.5 xl:px-5'
                : 'pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] flex-1 justify-center pb-[max(2rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] pt-1 sm:mt-12 sm:gap-10 sm:pb-[max(2.5rem,calc(0.5rem+env(safe-area-inset-bottom,0px)))] sm:pl-8 sm:pr-8 md:mt-16 md:pl-10 md:pr-10 lg:mt-[4.5rem] lg:gap-12 lg:px-12 lg:pb-[max(3rem,calc(1rem+env(safe-area-inset-bottom,0px)))] xl:gap-14 xl:px-16 2xl:px-24',
            )}
          >
            <div
              ref={leftColRef}
              className={cn(
                'flex w-full max-w-3xl flex-col items-center text-center',
                isCompact ? 'gap-2 sm:gap-3' : 'gap-8',
              )}
            >
              <div
                className={cn(
                  'flex w-full flex-col items-center',
                  isCompact ? 'gap-2 sm:gap-3' : 'gap-8',
                )}
              >
                {isCompact ? (
                  <WattaInViewFadeDiv className="footer-ready-block w-full">
                    <FooterReadyAnimatedHead
                      kicker={cf.readyTitleKicker}
                      sub={cf.readyTitleSub}
                      eyebrow={cf.readyTitleEyebrow}
                    />
                  </WattaInViewFadeDiv>
                ) : (
                  <div className="footer-ready-block">
                    <FooterReadyAnimatedHead
                      kicker={cf.readyTitleKicker}
                      sub={cf.readyTitleSub}
                      eyebrow={cf.readyTitleEyebrow}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    'footer-cinematic-strip-stack flex w-full flex-col items-center',
                    isCompact ? 'gap-3 sm:gap-4' : 'gap-8',
                  )}
                >
                  {isCompact && compactRecItems.length > 0 ? (
                    <WattaInViewFadeDiv className="w-full">
                      <AdminProductStrip
                        title={recommendedStripTitle}
                        ariaLabel={cf.recommendedStripAria}
                        items={compactRecItems}
                        carouselRef={recCarouselRef}
                        onScroll={scrollRecStrip}
                        onProductAddToCart={onAdminProductAddToCart}
                        onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                        prevLabel={cf.prevPromo}
                        nextLabel={cf.nextPromo}
                        cinematicRail="recommended"
                        stripKind="recommended"
                        layoutMode={recLayoutMode}
                        seeAllLink={recSeeAll}
                      />
                    </WattaInViewFadeDiv>
                  ) : (
                    <AdminProductStrip
                      title={recommendedStripTitle}
                      ariaLabel={cf.recommendedStripAria}
                      items={compactRecItems}
                      carouselRef={recCarouselRef}
                      onScroll={scrollRecStrip}
                      onProductAddToCart={onAdminProductAddToCart}
                      onBeforeNavigateToProduct={onBeforeNavigateToProduct}
                      prevLabel={cf.prevPromo}
                      nextLabel={cf.nextPromo}
                      cinematicRail="recommended"
                      stripKind="recommended"
                      layoutMode={recLayoutMode}
                      seeAllLink={recSeeAll}
                    />
                  )}

                  {!isCompact ? (
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
                  ) : adminPromoProducts.length > 0 ? (
                    <WattaInViewFadeDiv className="w-full">
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
                    </WattaInViewFadeDiv>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
