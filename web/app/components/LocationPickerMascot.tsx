'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Маскот модалки локації — PNG з прозорим фоном (`/location-picker-mascot.png`). */
export function LocationPickerMascot({ className }: { className?: string }) {
  return (
    <div className={cn('location-picker-mascot', className)} aria-hidden>
      <Image
        src="/location-picker-mascot.png"
        alt=""
        fill
        className="location-picker-mascot__img"
        sizes="(max-width: 640px) 140px, 168px"
        draggable={false}
      />
    </div>
  )
}
