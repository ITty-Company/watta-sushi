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

/**
 * Горизонтальна карусель: свайп, крапки або лічильник, стрілки.
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
          'flex h-full w-full min-h-[12rem] flex-col items-center justify-center gap-3 bg-[#f2f7f4] p-8',
          className,
        )}
      >
        <span className="text-7xl sm:text-8xl">🍱</span>
        <span className="text-xs font-semibold uppercase tracking-widest text-[#145142]/55">Watta</span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
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

      {len > 1 && (
        <>
          {/* Мобільні: компактні стрілки під фото, не поверх зображення */}
          <div
            className="mt-2 flex items-center justify-between gap-2 px-0.5 sm:hidden"
            role="group"
            aria-label={formatProgress(labels.progress, index + 1, len)}
          >
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#145142]/12 bg-[#f6faf8] text-[#145142] transition active:bg-[#e8f0ec]"
              aria-label={labels.prev}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>

            <div className="flex min-w-0 flex-1 justify-center gap-1.5">
              {len <= MAX_DOTS ? (
                images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition',
                      i === index ? 'scale-110 bg-[#145142]' : 'bg-[#145142]/30',
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

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#145142]/12 bg-[#f6faf8] text-[#145142] transition active:bg-[#e8f0ec]"
              aria-label={labels.next}
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>

          {/* Планшет і десктоп: стрілки по боках */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-10 items-center sm:flex sm:w-12">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="pointer-events-auto ml-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[#145142]/15 bg-white/95 text-[#145142] shadow-sm backdrop-blur-sm transition hover:bg-white sm:h-10 sm:w-10"
              aria-label={labels.prev}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-10 items-center justify-end sm:flex sm:w-12">
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="pointer-events-auto mr-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-[#145142]/15 bg-white/95 text-[#145142] shadow-sm backdrop-blur-sm transition hover:bg-white sm:h-10 sm:w-10"
              aria-label={labels.next}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          <div
            className="absolute bottom-3 left-0 right-0 z-[1] hidden justify-center gap-1.5 px-2 sm:flex"
            role="group"
          >
            {len <= MAX_DOTS ? (
              images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    'h-2 w-2 rounded-full transition',
                    i === index ? 'scale-110 bg-[#145142]' : 'bg-[#145142]/30 hover:bg-[#145142]/50',
                  )}
                  aria-label={formatProgress(labels.progress, i + 1, len)}
                  aria-current={i === index}
                />
              ))
            ) : (
              <span
                className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold text-white tabular-nums"
                aria-live="polite"
              >
                {formatProgress(labels.progress, index + 1, len)}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
