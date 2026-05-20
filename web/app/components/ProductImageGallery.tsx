'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProductGalleryLabels = {
  prev: string
  next: string
  /** Шаблон «{n}» і «{m}» — поточне і всього фото */
  progress: string
}

type ProductImageGalleryProps = {
  images: string[]
  alt: string
  labels: ProductGalleryLabels
  className?: string
}

const MAX_DOTS = 9

function formatProgress(template: string, n: number, m: number) {
  return template.replace(/\{n\}/g, String(n)).replace(/\{m\}/g, String(m))
}

function GalleryNavButton({
  direction,
  label,
  onClick,
  className,
}: {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
  className?: string
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#145142]/12 bg-white text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-[#f6faf8] active:bg-[#e8f0ec] sm:h-8 sm:w-8',
        className,
      )}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
    </button>
  )
}

function GalleryDots({
  len,
  index,
  images,
  labels,
  onGoTo,
  className,
}: {
  len: number
  index: number
  images: string[]
  labels: ProductGalleryLabels
  onGoTo: (i: number) => void
  className?: string
}) {
  if (len <= 1) return null
  return (
    <div
      className={cn('flex items-center justify-center gap-1.5', className)}
      role="group"
      aria-label={formatProgress(labels.progress, index + 1, len)}
    >
      {len <= MAX_DOTS ? (
        images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGoTo(i)}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition sm:h-2 sm:w-2',
              i === index ? 'scale-110 bg-[#145142]' : 'bg-[#145142]/30 hover:bg-[#145142]/50',
            )}
            aria-label={formatProgress(labels.progress, i + 1, len)}
            aria-current={i === index}
          />
        ))
      ) : (
        <span
          className="text-[11px] font-bold tabular-nums text-[#145142]/70"
          aria-live="polite"
        >
          {formatProgress(labels.progress, index + 1, len)}
        </span>
      )}
    </div>
  )
}

/**
 * Горизонтальна карусель: свайп, крапки, стрілки збоку від фото (не поверх).
 */
export function ProductImageGallery({ images, alt, labels, className }: ProductImageGalleryProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const len = images.length

  const goTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current
      if (!el || len === 0) return
      const next = ((i % len) + len) % len
      const w = el.clientWidth
      if (w <= 0) return
      el.scrollTo({ left: next * w, behavior: 'smooth' })
      setIndex(next)
    },
    [len],
  )

  useEffect(() => {
    setIndex(0)
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: 0 })
  }, [images])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || len <= 1) return
    const onScroll = () => {
      const w = el.clientWidth
      if (w <= 0) return
      const i = Math.round(el.scrollLeft / w)
      setIndex(Math.min(len - 1, Math.max(0, i)))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [len])

  if (len === 0) {
    return (
      <div
        className={cn(
          'flex h-full w-full min-h-[12rem] flex-col items-center justify-center gap-3 rounded-2xl border border-[#145142]/12 bg-[#f2f7f4] p-8 sm:rounded-[30px]',
          className,
        )}
      >
        <span className="text-7xl sm:text-8xl">🍱</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#145142]/55">Watta</span>
      </div>
    )
  }

  const hasNav = len > 1

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex items-center', hasNav && 'gap-1 sm:gap-1.5')}>
        {hasNav && (
          <GalleryNavButton
            direction="prev"
            label={labels.prev}
            onClick={() => goTo(index - 1)}
            className="hidden sm:flex"
          />
        )}

        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-[#145142]/12 bg-white sm:rounded-[30px]">
          <div
            ref={scrollerRef}
            className={cn(
              'flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain',
              '[touch-action:pan-x_pan-y] [-webkit-overflow-scrolling:touch]',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {images.map((src, i) => (
              <div
                key={`${src.slice(0, 48)}-${i}`}
                className="w-full shrink-0 snap-center snap-always"
                aria-hidden={i !== index}
              >
                <div className="relative aspect-[5/4] w-full max-h-[min(52vw,14.5rem)] sm:aspect-square sm:max-h-none">
                  <img
                    src={src}
                    alt={i === 0 ? alt : `${alt} · ${i + 1}`}
                    className="h-full w-full object-cover object-center"
                    decoding="async"
                    loading={i === 0 ? 'eager' : undefined}
                    fetchPriority={i === 0 ? 'high' : undefined}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {hasNav && (
          <GalleryNavButton
            direction="next"
            label={labels.next}
            onClick={() => goTo(index + 1)}
            className="hidden sm:flex"
          />
        )}
      </div>

      {hasNav && (
        <>
          <div
            className="mt-2 flex items-center justify-between gap-2 px-0.5 sm:hidden"
            role="group"
            aria-label={formatProgress(labels.progress, index + 1, len)}
          >
            <GalleryNavButton
              direction="prev"
              label={labels.prev}
              onClick={() => goTo(index - 1)}
            />
            <GalleryDots
              len={len}
              index={index}
              images={images}
              labels={labels}
              onGoTo={goTo}
              className="min-w-0 flex-1"
            />
            <GalleryNavButton
              direction="next"
              label={labels.next}
              onClick={() => goTo(index + 1)}
            />
          </div>

          <GalleryDots
            len={len}
            index={index}
            images={images}
            labels={labels}
            onGoTo={goTo}
            className="mt-2.5 hidden sm:flex"
          />
        </>
      )}
    </div>
  )
}
