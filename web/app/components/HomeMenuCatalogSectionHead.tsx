'use client'

import { useMemo, type ReactNode } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useWattaStaggerMotion } from '@/lib/wattaStaggerMotion'
import { WattaStaggerCopyBlock } from './WattaStaggerRevealText'

type Props = {
  titleId?: string
}

/** Заголовок каталогу на головній — «Меню» по центру, підпис нижче. */
export function HomeMenuCatalogSectionHead({ titleId }: Props) {
  const { t } = useLanguage()
  const mv = t.menuView
  const motion = useWattaStaggerMotion()

  return (
    <header
      className="home-full-menu-catalog-head-web mx-auto w-full max-w-7xl"
      aria-labelledby={titleId}
    >
      <WattaStaggerCopyBlock
        title={mv.homeCatalogTitle}
        body={mv.homeCatalogIntro}
        titleId={titleId}
        titleAs="h2"
        titleClassName="home-full-menu-catalog-title-web home-full-menu-catalog-title-web--home"
        bodyClassName="home-full-menu-catalog-intro-web"
        wrapperClassName="home-full-menu-catalog-head-inner-web"
        style="catalog"
        replay={motion.allowReplay}
      />
    </header>
  )
}
