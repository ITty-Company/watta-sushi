'use client'

import Image from 'next/image'
import { WATTA_MENU_HERO_LANDSCAPE } from '@/lib/wattaMenuHeroVideo'
import WattaStellarHeroFades from './WattaStellarHeroFades'

type WattaStellarHeroBackgroundProps = {
  backgroundSrc?: string
  /** 2× / wide src для srcSet (Retina). */
  backgroundSrcHiRes?: string
  /** Вертикальне фото для телефону (max-width: 767px). */
  backgroundSrcMobile?: string
  backgroundSrcMobileHiRes?: string
  /** cover — заповнити кадр; contain — показати фото цілком без обрізання */
  imageFit?: 'cover' | 'contain'
}

function buildSrcSet(src: string, hiRes?: string): string | undefined {
  if (hiRes != null && hiRes.length > 0) {
    return `${src} 1024w, ${hiRes} 2048w`
  }
  return undefined
}

/** Stellar-style фон — фото ландшафту + білі gradient overlays. */
export default function WattaStellarHeroBackground({
  backgroundSrc = WATTA_MENU_HERO_LANDSCAPE,
  backgroundSrcHiRes,
  backgroundSrcMobile,
  backgroundSrcMobileHiRes,
  imageFit = 'cover',
}: WattaStellarHeroBackgroundProps) {
  const contain = imageFit === 'contain'
  const mobileSrcSet =
    backgroundSrcMobile != null && backgroundSrcMobile.length > 0
      ? buildSrcSet(backgroundSrcMobile, backgroundSrcMobileHiRes)
      : undefined
  const hasMobileArt = mobileSrcSet != null

  const coverClassName =
    'watta-stellar-hero-bg__image menu-stellar-hero-bg__image absolute inset-x-0 bottom-0 w-full object-cover'
  const containClassName =
    'watta-stellar-hero-bg__photo watta-stellar-hero-bg__photo--contain menu-stellar-hero-bg__photo menu-stellar-hero-bg__photo--contain'

  const renderCoverImage = () => {
    if (hasMobileArt) {
      return (
        <picture className="watta-stellar-hero-bg__picture menu-stellar-hero-bg__picture absolute inset-x-0 bottom-0 block h-full w-full">
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
          <Image
            src={backgroundSrcHiRes ?? backgroundSrc}
            alt=""
            width={1920}
            height={1080}
            sizes="100vw"
            priority
            className={coverClassName}
          />
        </picture>
      )
    }

    return (
      <Image
        src={backgroundSrcHiRes ?? backgroundSrc}
        alt=""
        width={1920}
        height={1080}
        sizes="100vw"
        priority
        className={coverClassName}
      />
    )
  }

  const renderContainImage = () => {
    if (hasMobileArt) {
      return (
        <picture className="watta-stellar-hero-bg__picture menu-stellar-hero-bg__picture block h-full w-full">
          <source media="(max-width: 767px)" srcSet={mobileSrcSet} sizes="100vw" />
          <Image
            src={backgroundSrcHiRes ?? backgroundSrc}
            alt=""
            width={1920}
            height={1080}
            sizes="100vw"
            priority
            className={containClassName}
          />
        </picture>
      )
    }

    return (
      <Image
        src={backgroundSrcHiRes ?? backgroundSrc}
        alt=""
        width={1920}
        height={1080}
        sizes="100vw"
        priority
        className={containClassName}
      />
    )
  }

  return (
    <>
      <div
        className={`watta-stellar-hero-bg pointer-events-none absolute inset-0 z-0 overflow-hidden${contain ? ' watta-stellar-hero-bg--contain' : ''}${hasMobileArt ? ' watta-stellar-hero-bg--responsive' : ''}`}
        aria-hidden
      >
        {contain ? renderContainImage() : renderCoverImage()}
      </div>
      <WattaStellarHeroFades />
    </>
  )
}
