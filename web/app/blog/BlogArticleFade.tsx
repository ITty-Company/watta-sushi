'use client'

import type { ReactNode } from 'react'
import { WattaInViewFadeDiv } from '../components/WattaInViewFade'

export function BlogArticleHeroFade({ children }: { children: ReactNode }) {
  return <WattaInViewFadeDiv className="watta-blog-article__hero-media">{children}</WattaInViewFadeDiv>
}

export function BlogArticleBodyFade({ children }: { children: ReactNode }) {
  return <WattaInViewFadeDiv className="watta-blog-article__body">{children}</WattaInViewFadeDiv>
}
