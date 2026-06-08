'use client'

import { useMemo } from 'react'
import type { Language } from '@/app/context/LanguageContext'
import { useLanguage } from '@/app/context/LanguageContext'
import WattaPageHeroStagger from '@/app/components/WattaPageHeroStagger'

export type BlogArticleInnerPost = {
  title: string
  content: string
  author: string
  createdAt: string
}

function formatMetaDate(iso: string, lang: Language): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  if (lang === 'nl') return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

export default function BlogArticleInner({
  post,
  videoEmbedUrl,
}: {
  post: BlogArticleInnerPost
  videoEmbedUrl?: string | null
}) {
  const { language } = useLanguage()

  const metaLine = useMemo(() => {
    const date = formatMetaDate(post.createdAt, language)
    return date ? `${date} · ${post.author}` : post.author
  }, [post.author, post.createdAt, language])

  return (
    <>
      <p className="watta-blog-article__meta">{metaLine}</p>
      <WattaPageHeroStagger
        title={post.title}
        titleClassName="watta-blog-article__title"
      />
      {videoEmbedUrl ? (
        <div className="watta-blog-article__video">
          <iframe
            src={videoEmbedUrl}
            className="watta-blog-article__video-frame"
            title={post.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      <div className="watta-blog-article__prose">{post.content}</div>
    </>
  )
}
