'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import FavoritesEmptyBrandTyping from './FavoritesEmptyBrandTyping'
import WattaPageHeroStagger from './WattaPageHeroStagger'
import { FAVORITES_EMPTY_IMAGE_URLS } from '@/lib/preloadFavoritesEmptyImages'

type Props = {
  title: string
  subtitle: string
  ctaLabel: string
}

const HEART_PATH =
  'M0 0c0-11 9-18 15-18 7 0 11 5 13 9 2-4 6-9 13-9 7 0 16 7 16 18 0 20-29 38-29 38S0 20 0 0z'

const FAV_EMPTY_ROLL_IMAGES: { src: string; className: string }[] = [
  { src: FAVORITES_EMPTY_IMAGE_URLS[1], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--nigiri' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[2], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--left' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[3], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--rear' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[4], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--back' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[5], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--front' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[6], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--bottom' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[7], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--mussel' },
]

const FAV_EMPTY_ROLL_IMAGES_AFTER_HEART: { src: string; className: string }[] = [
  { src: FAVORITES_EMPTY_IMAGE_URLS[8], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--accent' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[9], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--gunkan-ikura' },
  { src: FAVORITES_EMPTY_IMAGE_URLS[10], className: 'watta-favorites-empty__inside-roll watta-favorites-empty__inside-roll--gunkan-baked' },
]

const FAV_EMPTY_ROLL_SIZES =
  '(max-width: 767px) 40vw, (max-width: 1023px) 15rem, (max-width: 1279px) 18rem, (max-width: 1535px) 20rem, 22rem'

function FavEmptyRollImage({ src, className }: { src: string; className: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={256}
      height={256}
      className={className}
      sizes={FAV_EMPTY_ROLL_SIZES}
      priority
    />
  )
}

/** Порожній стан /favorites — овал, роли, ♥ завжди по центру сцени. */
export default function FavoritesEmptyState({ title, subtitle, ctaLabel }: Props) {
  return (
    <div className="watta-favorites-empty">
      <div className="watta-favorites-empty__art" aria-hidden>
        <div className="watta-favorites-empty__scene">
          <svg
            className="watta-favorites-empty__svg watta-favorites-empty__svg--bg"
            viewBox="-10 -14 248 228"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <ellipse cx="110" cy="134" rx="104" ry="58" className="watta-favorites-empty__blob" />
          </svg>

          <FavoritesEmptyBrandTyping />

          {FAV_EMPTY_ROLL_IMAGES.map((roll) => (
            <FavEmptyRollImage key={roll.src} src={roll.src} className={roll.className} />
          ))}

          <div className="watta-favorites-empty__heart-slot">
            <svg
              className="watta-favorites-empty__heart-svg"
              viewBox="0 0 29 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path d={HEART_PATH} className="watta-favorites-empty__heart" />
            </svg>
          </div>

          {FAV_EMPTY_ROLL_IMAGES_AFTER_HEART.map((roll) => (
            <FavEmptyRollImage key={roll.src} src={roll.src} className={roll.className} />
          ))}
        </div>
      </div>

      <div className="watta-favorites-empty__copy">
        <WattaPageHeroStagger
          title={title}
          titleClassName="watta-favorites-empty__title"
          subtitle={subtitle}
          subtitleClassName="watta-favorites-empty__subtitle"
        />

        <Link href="/menu" className="watta-favorites-empty__cta">
          <span>{ctaLabel}</span>
          <ArrowRight className="watta-favorites-empty__cta-arrow" size={18} strokeWidth={2.2} aria-hidden />
        </Link>
      </div>
    </div>
  )
}
