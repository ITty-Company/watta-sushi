import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { getBlogNotFoundTitle } from '@/lib/i18n/seo'
import BlogBackToIndex from '../BlogBackToIndex'
import { BlogArticleBodyFade, BlogArticleHeroFade } from '../BlogArticleFade'
import BlogArticleInner from '../BlogArticleInner'
import BlogArticleLinks from '../BlogArticleLinks'
import type { BlogPostLinks } from '@/lib/blogLinks'

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  videoUrl?: string | null
  author: string
  createdAt: string
  links?: BlogPostLinks
}

function normalizeVideoUrl(url?: string | null): string | null {
  if (!url) return null
  const value = url.trim()
  const ytMatch = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return value
}

export const revalidate = 120

async function getPost(slug: string, lang: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(
      `${serverApiBaseUrl()}/api/blog/${slug}?lang=${encodeURIComponent(lang)}`,
      { next: { revalidate: 120 } },
    )
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const lang = await getRequestLocale()
  const post = await getPost(params.slug, lang)
  if (!post) {
    return { title: getBlogNotFoundTitle(lang) }
  }
  return {
    title: post.title,
    description: post.content.replace(/\s+/g, ' ').trim().slice(0, 160),
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const lang = await getRequestLocale()
  const post = await getPost(params.slug, lang)
  if (!post) notFound()

  const videoEmbedUrl = normalizeVideoUrl(post.videoUrl)

  return (
    <div className="menu-page-web watta-blog-route watta-blog-route--article relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden watta-page-bg">
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />
      <div className="watta-blog-article-page">
        <div className="watta-blog-article-page__toolbar">
          <BlogBackToIndex />
        </div>
        <article className="watta-blog-article">
          {post.imageUrl ? (
            <BlogArticleHeroFade>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="" className="watta-blog-article__hero-img" />
            </BlogArticleHeroFade>
          ) : null}
          <BlogArticleBodyFade>
            <BlogArticleInner
              post={{
                title: post.title,
                content: post.content,
                author: post.author,
                createdAt: post.createdAt,
              }}
              videoEmbedUrl={videoEmbedUrl}
            />
            {post.links ? <BlogArticleLinks links={post.links} /> : null}
          </BlogArticleBodyFade>
        </article>
      </div>
    </div>
  )
}
