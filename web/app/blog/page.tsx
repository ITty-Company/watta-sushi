import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'
import { getRequestLocale } from '@/lib/i18n/serverLocale'
import { buildSubpageMetadata } from '@/lib/i18n/seo'
import BlogIndexClient from './BlogIndexClient'

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  author: string
  createdAt: string
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getRequestLocale()
  return buildSubpageMetadata(lang, 'blog')
}

async function getPosts(lang: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${serverApiBaseUrl()}/api/blog?lang=${encodeURIComponent(lang)}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data: unknown = await res.json()
    return Array.isArray(data) ? (data as BlogPost[]) : []
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const lang = await getRequestLocale()
  const posts = await getPosts(lang)
  if (posts.length === 0) notFound()

  return (
    <div className="menu-page-web watta-blog-route relative flex w-full max-w-[100vw] min-w-0 flex-1 flex-col overflow-x-hidden watta-page-bg">
      <div className="menu-content-top-gap-web w-full shrink-0 bg-transparent" aria-hidden />
      <BlogIndexClient posts={posts} />
    </div>
  )
}
