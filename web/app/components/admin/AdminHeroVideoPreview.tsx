'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { resolveUploadMediaUrl } from '@/lib/resolveUploadMediaUrl'
import { appendHeroVideoStartSec, WATTA_HERO_VIDEO_START_SEC } from '@/lib/wattaHeroVideo'
import { useLanguage } from '../../context/LanguageContext'

function primeAdminHeroVideoPreview(video: HTMLVideoElement): void {
  try {
    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.preload = 'auto'
    video.loop = true
    video.autoplay = true
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
  } catch {
    /* ignore */
  }
  const kick = () => {
    try {
      if (video.currentTime < WATTA_HERO_VIDEO_START_SEC - 0.05) {
        video.currentTime = WATTA_HERO_VIDEO_START_SEC
      }
    } catch {
      /* ignore */
    }
    void video.play().catch(() => {})
  }
  kick()
  video.addEventListener('loadeddata', kick, { once: true })
}

type AdminHeroVideoPreviewProps = {
  previewSrc: string | null | undefined
  savedUrl?: string | null
  reduceMotion?: boolean
  aspectClassName?: string
}

/** Превʼю mp4 в адмінці: autoplay + seek на перший кадр (metadata-only давало чорний прямокутник). */
export default function AdminHeroVideoPreview({
  previewSrc,
  savedUrl,
  reduceMotion = false,
  aspectClassName = 'aspect-video w-full',
}: AdminHeroVideoPreviewProps) {
  const { t } = useLanguage()
  const banners = t.adminPanel.banners
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [broken, setBroken] = useState(false)

  useEffect(() => {
    setBroken(false)
  }, [previewSrc])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !previewSrc || broken) return
    primeAdminHeroVideoPreview(video)
  }, [previewSrc, broken])

  if (!previewSrc) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`flex ${aspectClassName} items-center justify-center bg-watta-action/5 text-xs text-[#145142]/45`}
      >
        —
      </motion.div>
    )
  }

  if (broken && !previewSrc.startsWith('blob:')) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`admin-hero-video-preview-missing ${aspectClassName}`}
      >
        <span className="font-semibold text-[#145142]/85">{banners.heroVideoUnavailableTitle}</span>
        <span>{banners.heroVideoUnavailableHint}</span>
        {savedUrl ? (
          <span className="max-w-full truncate font-mono opacity-80" title={savedUrl}>
            {savedUrl}
          </span>
        ) : null}
      </motion.div>
    )
  }

  const resolvedSrc = resolveUploadMediaUrl(previewSrc) ?? previewSrc
  const srcWithFrameHint = appendHeroVideoStartSec(resolvedSrc)

  return (
    <video
      key={srcWithFrameHint}
      ref={videoRef}
      src={srcWithFrameHint}
      className={`${aspectClassName} max-h-52 w-full bg-watta-action/8 object-contain`}
      controls
      muted
      playsInline
      preload="metadata"
      onLoadedMetadata={(e) => primeAdminHeroVideoPreview(e.currentTarget)}
      onError={() => setBroken(true)}
    />
  )
}
