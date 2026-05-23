'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function TeamMemberPhoto({
  src,
  alt,
  className,
  sizes = '(max-width: 640px) 50vw, 25vw',
}: {
  src: string
  alt: string
  className?: string
  sizes?: string
}) {
  if (src.startsWith('data:')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin may store base64 portraits
      <img src={src} alt={alt} className={cn('h-full w-full object-cover', className)} />
    )
  }

  return <Image src={src} alt={alt} fill className={cn('object-cover', className)} sizes={sizes} />
}
