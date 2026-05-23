'use client'

import { cn } from '@/lib/utils'
import { LOCATION_PICKER_MASCOT_SRC } from '@/lib/locationPickerMascot'

/** Маскот модалки локації — PNG з прозорим фоном (без Next/Image, щоб не чекати оптимізатор). */
export function LocationPickerMascot({ className }: { className?: string }) {
  return (
    <div className={cn('location-picker-mascot', className)} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOCATION_PICKER_MASCOT_SRC}
        alt=""
        width={400}
        height={400}
        className="location-picker-mascot__img"
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    </div>
  )
}
