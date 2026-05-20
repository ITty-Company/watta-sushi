'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useMemo } from 'react'
import { useLanguage } from '@/app/context/LanguageContext'

const READ_LINK = '#27ae60'

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

function excerptFromContent(content: string, max = 150): string {
  const flat = content.replace(/\s+/g, ' ').trim()
  if (!flat) return ''
  if (flat.length <= max) return flat
  return `${flat.slice(0, max).trim()}…`
}

function BlogBackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="auth-watta-back-fab watta-blog-back watta-blog-back--inline"
    >
      <span className="auth-watta-back-fab__icon" aria-hidden>
        <ArrowLeft className="auth-watta-back-fab__arrow" strokeWidth={2.5} />
      </span>
      <span className="auth-watta-back-fab__text">{label}</span>
    </button>
  )
}

export default function BlogIndexClient({ posts }: { posts: BlogPostPreview[] }) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const b = t.blogPublic

  const rows = useMemo((): BlogCardRow[] => posts, [posts])

  return (
    <motion.div
      className="watta-blog-page watta-blog-page--route relative w-full min-w-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="watta-blog-page__toolbar">
        <BlogBackButton label={t.auth.back} onBack={() => router.push('/')} />
      </div>

      <motion.div
        className="watta-blog-page__inner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="watta-blog-page__header">
          <p className="watta-blog-page__kicker">
            <BookOpen className="watta-blog-page__kicker-ico" strokeWidth={2.25} aria-hidden />
            {b.heroKicker}
          </p>
          <h1 className="watta-blog-page__title home-after-hero-intro-title-web">{b.title}</h1>
          <p className="watta-blog-page__subtitle home-after-hero-intro-body-web">{b.subtitle}</p>
        </header>

        <div className="watta-blog-grid" role="list">
          {rows.map((post, i) => {
            const category = post.category ?? b.cardCategoryFallback
            const dateStr = post.dateDisplay ?? formatCardDate(post.createdAt, language)
            const excerpt = excerptFromContent(post.content)
            const featured = i === 0

            return (
              <motion.article
                key={`${post.id}-${post.slug}`}
                role="listitem"
                className={`watta-blog-card${featured ? ' watta-blog-card--featured' : ''}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', damping: 26 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="watta-blog-card__hit-area"
                  aria-label={`${b.readMore}: ${post.title}`}
                >
                  <div className="watta-blog-card__media">
                    {post.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.imageUrl}
                        alt=""
                        className="watta-blog-card__img"
                        loading={i < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    ) : (
                      <div className="watta-blog-card__no-photo" aria-hidden>
                        <span className="watta-blog-card__no-photo-mark">W</span>
                      </div>
                    )}
                    {featured ? <span className="watta-blog-card__featured">{b.featuredBadge}</span> : null}
                  </div>
                  <div className="watta-blog-card__body">
                    <div className="watta-blog-card__meta">
                      <span className="watta-blog-card__category">{category}</span>
                      {dateStr ? <time className="watta-blog-card__date">{dateStr}</time> : null}
                    </div>
                    <h2 className="watta-blog-card__title">{post.title}</h2>
                    {excerpt ? <p className="watta-blog-card__excerpt">{excerpt}</p> : null}
                    <span className="watta-blog-card__cta" style={{ color: READ_LINK }}>
                      {b.readMore}
                    </span>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}
