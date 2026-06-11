'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from '@/lib/wattaInlineIcons'
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
  disabled = false,
}: {
  direction: 'prev' | 'next'
  label: string
  onClick: () => void
  className?: string
  variant?: 'inline' | 'lightbox'
  disabled?: boolean
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className={cn(
        variant === 'inline' &&
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#145142]/12 bg-white text-[#145142] shadow-sm transition hover:border-[#145142]/25 hover:bg-[#f6faf8] active:bg-[#e8f0ec] sm:h-8 sm:w-8',
        variant === 'lightbox' &&
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20 active:bg-white/25',
        disabled && 'pointer-events-none opacity-40',
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
            onClick={(e) => {
              e.stopPropagation()
              onGoTo(i)
            }}
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

type ZoomTransform = { scale: number; x: number; y: number }

const ZOOM_MIN = 1
const ZOOM_MAX = 4
const ZOOM_DOUBLE = 2.5

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function clampZoomTransform(
  transform: ZoomTransform,
  container: HTMLDivElement | null,
  img: HTMLImageElement | null,
): ZoomTransform {
  if (!container || !img || transform.scale <= 1) {
    return { scale: 1, x: 0, y: 0 }
  }

  const { width: cw, height: ch } = container.getBoundingClientRect()
  const baseW = img.offsetWidth
  const baseH = img.offsetHeight
  if (baseW <= 0 || baseH <= 0) return transform

  const scaledW = baseW * transform.scale
  const scaledH = baseH * transform.scale
  const maxX = Math.max(0, (scaledW - cw) / 2)
  const maxY = Math.max(0, (scaledH - ch) / 2)

  return {
    scale: transform.scale,
    x: clamp(transform.x, -maxX, maxX),
    y: clamp(transform.y, -maxY, maxY),
  }
}

function pointerDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function ZoomableLightboxImage({
  src,
  alt,
  isActive,
  onZoomedChange,
}: {
  src: string
  alt: string
  isActive: boolean
  onZoomedChange: (zoomed: boolean) => void
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const transformRef = useRef<ZoomTransform>({ scale: 1, x: 0, y: 0 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const lastTapRef = useRef(0)
  const [transform, setTransform] = useState<ZoomTransform>({ scale: 1, x: 0, y: 0 })
  const [animating, setAnimating] = useState(false)

  const applyTransform = useCallback((next: ZoomTransform, animate = false) => {
    const clamped = clampZoomTransform(next, viewportRef.current, imgRef.current)
    transformRef.current = clamped
    setAnimating(animate)
    setTransform(clamped)
    onZoomedChange(clamped.scale > 1.02)
  }, [onZoomedChange])

  const zoomAtPoint = useCallback(
    (scale: number, clientX: number, clientY: number, animate = false) => {
      const viewport = viewportRef.current
      if (!viewport) return

      const rect = viewport.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const current = transformRef.current
      const ratio = scale / current.scale
      const x = current.x - (clientX - cx) * (ratio - 1)
      const y = current.y - (clientY - cy) * (ratio - 1)
      applyTransform({ scale, x, y }, animate)
    },
    [applyTransform],
  )

  useEffect(() => {
    if (!isActive) {
      transformRef.current = { scale: 1, x: 0, y: 0 }
      setAnimating(false)
      setTransform({ scale: 1, x: 0, y: 0 })
      onZoomedChange(false)
      pointersRef.current.clear()
      pinchRef.current = null
      panRef.current = null
    }
  }, [isActive, onZoomedChange])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!isActive) return
      e.preventDefault()
      e.stopPropagation()

      const current = transformRef.current
      const delta = -e.deltaY * 0.0025
      const nextScale = clamp(current.scale * (1 + delta), ZOOM_MIN, ZOOM_MAX)

      if (nextScale <= 1.02) {
        applyTransform({ scale: 1, x: 0, y: 0 })
        return
      }

      zoomAtPoint(nextScale, e.clientX, e.clientY)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyTransform, isActive, zoomAtPoint])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return

    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1) {
      const current = transformRef.current
      panRef.current = {
        x: e.clientX,
        y: e.clientY,
        tx: current.x,
        ty: current.y,
      }
    } else if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()]
      pinchRef.current = {
        dist: pointerDistance(pts[0], pts[1]),
        scale: transformRef.current.scale,
      }
      panRef.current = null
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2 && pinchRef.current) {
      const pts = [...pointersRef.current.values()]
      const dist = pointerDistance(pts[0], pts[1])
      const nextScale = clamp(
        pinchRef.current.scale * (dist / pinchRef.current.dist),
        ZOOM_MIN,
        ZOOM_MAX,
      )
      applyTransform({ ...transformRef.current, scale: nextScale })
      e.preventDefault()
      e.stopPropagation()
      return
    }

    if (pointersRef.current.size === 1 && panRef.current && transformRef.current.scale > 1) {
      const dx = e.clientX - panRef.current.x
      const dy = e.clientY - panRef.current.y
      applyTransform({
        scale: transformRef.current.scale,
        x: panRef.current.tx + dx,
        y: panRef.current.ty + dy,
      })
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }

    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) panRef.current = null

    if (transformRef.current.scale < 1.05) {
      applyTransform({ scale: 1, x: 0, y: 0 }, true)
    }
  }

  const toggleZoomAt = (clientX: number, clientY: number) => {
    if (transformRef.current.scale > 1.02) {
      applyTransform({ scale: 1, x: 0, y: 0 }, true)
    } else {
      zoomAtPoint(ZOOM_DOUBLE, clientX, clientY, true)
    }
  }

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    toggleZoomAt(e.clientX, e.clientY)
  }

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0 || pointersRef.current.size > 0) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      e.preventDefault()
      toggleZoomAt(touch.clientX, touch.clientY)
      lastTapRef.current = 0
    } else {
      lastTapRef.current = now
    }
  }

  const isZoomed = transform.scale > 1.02

  return (
    <div ref={viewportRef} className="flex h-full w-full items-center justify-center">
      <div
        className={cn(
          'inline-flex max-h-[min(78dvh,720px)] max-w-full items-center justify-center overflow-visible',
          isZoomed ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-zoom-in touch-manipulation',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onDoubleClick={onDoubleClick}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="max-h-[min(78dvh,720px)] max-w-full select-none object-contain"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: 'center center',
            transition: animating ? 'transform 0.22s ease-out' : 'none',
          }}
          decoding="async"
          draggable={false}
          onLoad={() => {
            if (transformRef.current.scale > 1) {
              applyTransform(transformRef.current)
            }
          }}
        />
      </div>
    </div>
  )
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
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    syncTo(startIndex)
  }, [startIndex, syncTo])

  useEffect(() => {
    setIsZoomed(false)
  }, [index])

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
      if (isZoomed) return
      if (e.key === 'ArrowLeft') goTo(index - 1)
      if (e.key === 'ArrowRight') goTo(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, goTo, index, isZoomed])

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

      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-2 sm:gap-4 sm:px-4">
        {hasNav && (
          <GalleryNavButton
            direction="prev"
            label={labels.prev}
            onClick={() => goTo(index - 1)}
            variant="lightbox"
            className="hidden sm:flex"
            disabled={isZoomed}
          />
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollerRef}
            className={cn(
              'flex h-full w-full snap-x snap-mandatory scroll-smooth overscroll-x-contain',
              isZoomed
                ? 'overflow-x-hidden touch-none'
                : 'overflow-x-auto [touch-action:pan-x] [-webkit-overflow-scrolling:touch]',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {images.map((src, i) => (
              <div
                key={`lb-${src.slice(0, 48)}-${i}`}
                className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center px-1"
                aria-hidden={i !== index}
              >
                <ZoomableLightboxImage
                  src={src}
                  alt={i === 0 ? alt : `${alt} · ${i + 1}`}
                  isActive={i === index}
                  onZoomedChange={i === index ? setIsZoomed : () => {}}
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
            disabled={isZoomed}
          />
        )}
      </div>

      {hasNav && (
        <div className="flex shrink-0 flex-col items-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <div className="flex w-full max-w-xs items-center justify-between gap-3 sm:hidden">
            <GalleryNavButton direction="prev" label={labels.prev} onClick={() => goTo(index - 1)} variant="lightbox" disabled={isZoomed} />
            <GalleryNavButton direction="next" label={labels.next} onClick={() => goTo(index + 1)} variant="lightbox" disabled={isZoomed} />
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
