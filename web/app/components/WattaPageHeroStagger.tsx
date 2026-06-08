'use client'

import { useMemo, type ReactNode } from 'react'
import { useWattaStaggerMotion } from '@/lib/wattaStaggerMotion'
import {
  WattaStaggerRevealGroup,
  estimateWattaStaggerEnterSec,
  renderStaggerBodyChars,
  renderStaggerTitleChars,
  type CharIndexRef,
  type WattaStaggerVariant,
} from './WattaStaggerRevealText'

type WattaPageHeroStaggerProps = {
  kicker?: ReactNode
  kickerPrefix?: ReactNode
  kickerText?: string
  kickerClassName?: string
  title: string
  titleAccent?: string
  titleAccentClassName?: string
  titleId?: string
  titleClassName?: string
  subtitle?: string
  subtitleClassName?: string
  children?: ReactNode
}

function WattaPageHeroStaggerInner({
  kicker,
  kickerPrefix,
  kickerText,
  kickerClassName,
  title,
  titleAccent,
  titleAccentClassName,
  titleId,
  titleClassName,
  subtitle,
  subtitleClassName,
  children,
  charDelay,
  bodyWordDelay,
}: WattaPageHeroStaggerProps & { charDelay: number; bodyWordDelay: number }) {
  const charIndex = useMemo<CharIndexRef>(() => ({ value: 0 }), [])

  return (
    <>
      {kicker ?? (kickerText ? (
        <p className={kickerClassName}>
          {kickerPrefix}
          {renderStaggerTitleChars(kickerText, charIndex, 'catalog', charDelay)}
        </p>
      ) : null)}

      <h1 id={titleId} className={titleClassName}>
        {renderStaggerTitleChars(title, charIndex, 'catalog', charDelay)}
        {titleAccent ? (
          <>
            {' '}
            <span className={titleAccentClassName}>
              {renderStaggerTitleChars(titleAccent, charIndex, 'catalog', charDelay)}
            </span>
          </>
        ) : null}
      </h1>

      {subtitle ? (
        <p className={subtitleClassName}>
          {renderStaggerBodyChars(subtitle, charIndex, 'catalog', false, bodyWordDelay)}
        </p>
      ) : null}

      {children}
    </>
  )
}

export default function WattaPageHeroStagger(props: WattaPageHeroStaggerProps) {
  const motion = useWattaStaggerMotion()

  const enterSec = useMemo(() => {
    if (!motion.enabled) return 0
    const texts: string[] = []
    const variants: WattaStaggerVariant[] = []
    if (props.kickerText?.trim()) {
      texts.push(props.kickerText.trim())
      variants.push('kicker')
    }
    texts.push(props.title)
    variants.push('title')
    if (props.titleAccent?.trim()) {
      texts.push(props.titleAccent.trim())
      variants.push('title')
    }
    if (props.subtitle?.trim()) {
      texts.push(props.subtitle.trim())
      variants.push('body')
    }
    return estimateWattaStaggerEnterSec(
      texts,
      variants,
      motion.charDelay,
      motion.bodyWordDelay,
    )
  }, [
    motion.bodyWordDelay,
    motion.charDelay,
    motion.enabled,
    props.kickerText,
    props.title,
    props.titleAccent,
    props.subtitle,
  ])

  if (!motion.enabled) {
    return (
      <>
        {props.kicker ?? (props.kickerText ? (
          <p className={props.kickerClassName}>
            {props.kickerPrefix}
            {props.kickerText}
          </p>
        ) : null)}
        <h1 id={props.titleId} className={props.titleClassName}>
          {props.title}
          {props.titleAccent ? (
            <>
              {' '}
              <span className={props.titleAccentClassName}>{props.titleAccent}</span>
            </>
          ) : null}
        </h1>
        {props.subtitle ? (
          <p className={props.subtitleClassName}>{props.subtitle}</p>
        ) : null}
        {props.children}
      </>
    )
  }

  return (
    <WattaStaggerRevealGroup enterSec={enterSec} replay={false}>
      <WattaPageHeroStaggerInner
        {...props}
        charDelay={motion.charDelay}
        bodyWordDelay={motion.bodyWordDelay}
      />
    </WattaStaggerRevealGroup>
  )
}
