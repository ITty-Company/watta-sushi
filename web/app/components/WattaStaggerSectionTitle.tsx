'use client'

import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { WattaStaggerCopyBlock, WattaStaggerRevealText } from './WattaStaggerRevealText'
import { useWattaStaggerMotion } from '@/lib/wattaStaggerMotion'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentPropsWithoutRef<'h2'>, 'children'> & {
  text: string
  body?: string
  bodyClassName?: string
  before?: ReactNode
  after?: ReactNode
}

export function WattaStaggerSectionTitle({
  text,
  body,
  bodyClassName,
  before,
  after,
  className,
  id,
  ...rest
}: Props) {
  const motion = useWattaStaggerMotion()

  if (!motion.allowSectionStagger) {
    return (
      <h2 id={id} className={cn(className)} {...rest}>
        {before}
        {text}
        {after}
      </h2>
    )
  }

  if (body && !before && !after) {
    return (
      <WattaStaggerCopyBlock
        title={text}
        body={body}
        titleId={id}
        titleAs="h2"
        titleClassName={cn(className)}
        bodyClassName={bodyClassName}
        style="catalog"
        inView
        replay={false}
      />
    )
  }

  return (
    <h2 id={id} className={cn(className)} {...rest}>
      {before}
      <WattaStaggerRevealText text={text} inView replay={false} staggerStyle="catalog" as="span" />
      {after}
    </h2>
  )
}
