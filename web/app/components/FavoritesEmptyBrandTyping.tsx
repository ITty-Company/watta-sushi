'use client'

import Image from 'next/image'

const WORDMARK_SRC = '/favorites-empty/watta-wordmark.webp'

/** Текстовий логотип з /1.jpg — прозорий фон (watta-wordmark.webp). */
export default function FavoritesEmptyBrandTyping() {
  return (
    <div className="watta-favorites-empty__brand">
      <Image
        src={WORDMARK_SRC}
        alt="WATTA SUSHI"
        width={1166}
        height={222}
        className="watta-favorites-empty__brand-wordmark"
        sizes="(max-width: 767px) 58vw, (max-width: 1023px) 17rem, (max-width: 1279px) 20rem, (max-width: 1535px) 22rem, 24rem"
        priority
      />
    </div>
  )
}
