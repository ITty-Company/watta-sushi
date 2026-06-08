'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { preloadImageUrls } from '@/lib/preloadImages'

export type ProductGalleryLabels = {
  prev: string
  next: string
  /** Шаблон «{n}» і «{m}» — поточне і всього фото */
  progress: string
  open: string
  close: string
}

type ProductImageGalleryProps = {
  images: string[]
  alt: string
  labels: ProductGalleryLabels
  className?: string
  /** На телефоні — стрілка поверх фото (як на картці товару Ninja). */
  navVariant?: 'default' | 'overlay'
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
  variant = 'inline',
}: {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
  className?: string
  variant?: 'inline' | 'lightbox'
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        variant === 'inline' &&
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#145142]/12 bg-white text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-[#f6faf8] active:bg-[#e8f0ec] sm:h-8 sm:w-8',
        variant === 'lightbox' &&
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20 active:bg-white/25',
        className,
      )}
      aria-label={label}
    >
      <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', variant === 'lightbox' && 'h-5 w-5')} strokeWidth={2.4} />
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
  variant = 'inline',
}: {
  len: number
  index: number
  images: string[]
  labels: ProductGalleryLabels
  onGoTo: (i: number) => void
  className?: string
  variant?: 'inline' | 'lightbox'
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
              variant === 'inline' &&
                (i === index ? 'scale-110 bg-watta-action' : 'bg-watta-action/30 hover:bg-watta-action/50'),
              variant === 'lightbox' &&
                (i === index ? 'scale-110 bg-white' : 'bg-white/35 hover:bg-white/55'),
            )}
            aria-label={formatProgress(labels.progress, i + 1, len)}
            aria-current={i === index}
          />
        ))
      ) : (
        <span
          className={cn(
            'text-[11px] font-bold tabular-nums',
            variant === 'inline' ? 'text-[#145142]/70' : 'text-white/80',
          )}
          aria-live="polite"
        >
          {formatProgress(labels.progress, index + 1, len)}
        </span>
      )}
    </div>
  )
}

function useGalleryScroller(len: number, images: string[]) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

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

  const syncTo = useCallback(
    (i: number) => {
      const el = scrollerRef.current
      if (!el || len === 0) return
      const next = Math.min(len - 1, Math.max(0, i))
      const w = el.clientWidth
      if (w <= 0) {
        setIndex(next)
        return
      }
      el.scrollTo({ left: next * w, behavior: 'auto' })
      setIndex(next)
    },
    [len],
  )

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

  useEffect(() => {
    preloadImageUrls(images, { limit: 10, highPriorityCount: 2 })
  }, [images])

  return { scrollerRef, index, setIndex, goTo, syncTo }
}

function ProductGalleryLightbox({
  images,
  alt,
  labels,
  startIndex,
  onClose,
}: {
  images: string[]
  alt: string
  labels: ProductGalleryLabels
  startIndex: number
  onClose: (finalIndex: number) => void
}) {
  const len = images.length
  const { scrollerRef, index, goTo, syncTo } = useGalleryScroller(len, images)
  const hasNav = len > 1

  useEffect(() => {
    syncTo(startIndex)
  }, [startIndex, syncTo])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose(index)
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goTo, index])

  return (
    <div
      className="fixed inset-0 z-[11070] flex flex-col bg-[rgba(8,22,18,0.92)] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={formatProgress(labels.progress, index + 1, len)}
      onClick={() => onClose(index)}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {hasNav ? (
          <span className="text-sm font-bold tabular-nums text-white/85">
            {formatProgress(labels.progress, index + 1, len)}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation()
            onClose(index)
          }}
          aria-label={labels.close}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 sm:gap-4 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {hasNav && (
          <GalleryNavButton
            direction="prev"
            label={labels.prev}
            onClick={() => goTo(index - 1)}
            variant="lightbox"
            className="hidden sm:flex"
          />
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollerRef}
            className={cn(
              'flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain',
              '[touch-action:pan-x] [-webkit-overflow-scrolling:touch]',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {images.map((src, i) => (
              <div
                key={`lb-${src.slice(0, 48)}-${i}`}
                className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center px-1"
                aria-hidden={i !== index}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={i === 0 ? alt : `${alt} · ${i + 1}`}
                  className="max-h-[min(78dvh,720px)] max-w-full object-contain"
                  decoding="async"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {hasNav && (
          <GalleryNavButton
            direction="next"
            label={labels.next}
            onClick={() => goTo(index + 1)}
            variant="lightbox"
            className="hidden sm:flex"
          />
        )}
      </div>

      {hasNav && (
        <div
          className="flex shrink-0 flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-full max-w-xs items-center justify-between gap-3 sm:hidden">
            <GalleryNavButton direction="prev" label={labels.prev} onClick={() => goTo(index - 1)} variant="lightbox" />
            <GalleryNavButton direction="next" label={labels.next} onClick={() => goTo(index + 1)} variant="lightbox" />
          </div>
          <GalleryDots
            len={len}
            index={index}
            images={images}
            labels={labels}
            onGoTo={goTo}
            variant="lightbox"
          />
        </div>
      )}
    </div>
  )
}

/**
 * Горизонтальна карусель: свайп, крапки, стрілки; тап — повноекранний перегляд.
 */
export function ProductImageGallery({
  images,
  alt,
  labels,
  className,
  navVariant = 'default',
}: ProductImageGalleryProps) {
  const len = images.length
  const { scrollerRef, index, setIndex, goTo, syncTo } = useGalleryScroller(len, images)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  useEffect(() => {
    setIndex(0)
    const el = scrollerRef.current
    if (el) el.scrollTo({ left: 0 })
  }, [images, scrollerRef, setIndex])

  const openLightbox = useCallback(() => {
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(
    (finalIndex: number) => {
      setLightboxOpen(false)
      syncTo(finalIndex)
    },
    [syncTo],
  )

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
  const overlayNav = navVariant === 'overlay'

  return (
    <div className={cn('w-full', overlayNav && 'watta-product-gallery--overlay', className)}>
      <div className={cn('flex items-center', hasNav && !overlayNav && 'gap-1 sm:gap-1.5')}>
        {hasNav && !overlayNav && (
          <GalleryNavButton
            direction="prev"
            label={labels.prev}
            onClick={() => goTo(index - 1)}
            className="hidden sm:flex"
          />
        )}

        <div
          className={cn(
            'min-w-0 flex-1 overflow-hidden',
            overlayNav
              ? 'relative border-0 bg-transparent rounded-none'
              : 'rounded-2xl border border-[#145142]/12 bg-white sm:rounded-[30px]',
          )}
        >
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
                <button
                  type="button"
                  className={cn(
                    'watta-product-gallery__frame relative block w-full cursor-zoom-in overflow-hidden',
                    overlayNav
                      ? 'aspect-[5/6] max-h-none sm:aspect-[5/6]'
                      : 'aspect-[5/6] max-h-[min(78vw,22rem)] sm:aspect-[5/6] sm:max-h-none',
                  )}
                  onClick={openLightbox}
                  aria-label={labels.open}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={i === 0 ? alt : `${alt} · ${i + 1}`}
                    className="h-full w-full object-contain object-center"
                    decoding="async"
                    loading="eager"
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    draggable={false}
                  />
                </button>
              </div>
            ))}
          </div>
          {hasNav && overlayNav && index < len - 1 ? (
            <GalleryNavButton
              direction="next"
              label={labels.next}
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 border-white/80 bg-white/95 shadow-md sm:right-3 sm:h-10 sm:w-10"
            />
          ) : null}
          {hasNav && overlayNav && index > 0 ? (
            <GalleryNavButton
              direction="prev"
              label={labels.prev}
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 border-white/80 bg-white/95 shadow-md sm:left-3 sm:h-10 sm:w-10"
            />
          ) : null}
        </div>

        {hasNav && !overlayNav && (
          <GalleryNavButton
            direction="next"
            label={labels.next}
            onClick={() => goTo(index + 1)}
            className="hidden sm:flex"
          />
        )}
      </div>

      {hasNav && !overlayNav && (
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

      {hasNav && overlayNav ? (
        <GalleryDots
          len={len}
          index={index}
          images={images}
          labels={labels}
          onGoTo={goTo}
          className="mt-2 flex"
        />
      ) : null}

      {lightboxOpen && portalReady
        ? createPortal(
            <ProductGalleryLightbox
              images={images}
              alt={alt}
              labels={labels}
              startIndex={index}
              onClose={closeLightbox}
            />,
            document.body,
          )
        : null}
    </div>
  )
}
