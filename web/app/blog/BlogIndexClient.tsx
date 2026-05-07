'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'
const READ_LINK = '#27AE60'

export interface BlogPostPreview {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  author: string
  createdAt: string
}

type BlogCardRow = BlogPostPreview & { category?: string; dateDisplay?: string }

function formatCardDate(iso: string, lang: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  if (lang === 'en') {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  if (lang === 'nl') {
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${d.getFullYear()}`
}

export default function BlogIndexClient({ posts }: { posts: BlogPostPreview[] }) {
  const { t, language } = useLanguage()

  const rows = useMemo((): BlogCardRow[] => {
    if (posts.length > 0) return posts
    return []
  }, [posts])

  return (
    <div className="w-full max-w-[1440px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 sm:mb-12"
      >
        <h1
          className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {t.blogPublic.title}
        </h1>
        {rows.length > 0 ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">{t.blogPublic.subtitle}</p>
        ) : null}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map((post, i) => {
          const category = post.category ?? t.blogPublic.cardCategoryFallback
          const dateStr = post.dateDisplay ?? formatCardDate(post.createdAt, language)

          return (
            <motion.article
              key={`${post.id}-${post.slug}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', damping: 24 }}
              className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="flex min-h-0 flex-1 cursor-pointer flex-col rounded-[22px] text-inherit no-underline outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-[#27AE60]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                  {post.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-sm text-gray-400">
                      {t.common.brandShort}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="max-w-[65%] truncate rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                      {category}
                    </span>
                    <time className="shrink-0 font-medium text-gray-400">{dateStr}</time>
                  </div>
                  <h2 className="line-clamp-3 text-lg font-black leading-snug text-gray-900 sm:text-xl">{post.title}</h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-500">{post.content}</p>
                  <span className="mt-4 self-start text-sm font-bold" style={{ color: READ_LINK }}>
                    {t.blogPublic.readMore}
                  </span>
                </div>
              </Link>
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
