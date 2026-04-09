'use client'

import { useMemo } from 'react'
import type { Language } from '@/app/context/LanguageContext'
import { useLanguage } from '@/app/context/LanguageContext'
import { getFallbackBlogArticle, isFallbackBlogSlug } from '@/app/lib/blogFallbackContent'

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
  slug,
  post,
  videoEmbedUrl,
}: {
  slug: string
  post: BlogArticleInnerPost
  videoEmbedUrl?: string | null
}) {
  const { language } = useLanguage()
  const isFallback = isFallbackBlogSlug(slug)

  const resolved = useMemo(() => {
    if (!isFallback) {
      return {
        title: post.title,
        content: post.content,
        author: post.author,
        metaLine: `${formatMetaDate(post.createdAt, language)} · ${post.author}`,
      }
    }
    const fb = getFallbackBlogArticle(slug, language)
    if (fb) {
      return {
        title: fb.title,
        content: fb.content,
        author: fb.author,
        metaLine: `${fb.dateDisplay} · ${fb.author}`,
      }
    }
    return {
      title: post.title,
      content: post.content,
      author: post.author,
      metaLine: `${formatMetaDate(post.createdAt, language)} · ${post.author}`,
    }
  }, [isFallback, slug, language, post])

  return (
    <>
      <p className="mb-3 text-sm text-gray-500">{resolved.metaLine}</p>
      <h1 className="text-3xl font-black leading-tight text-gray-900 md:text-5xl">{resolved.title}</h1>
      {videoEmbedUrl ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200">
          <iframe
            src={videoEmbedUrl}
            className="aspect-video w-full"
            title={resolved.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      <div className="mt-8 whitespace-pre-wrap text-[17px] leading-8 text-gray-800">{resolved.content}</div>
    </>
  )
}
