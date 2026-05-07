import type { Metadata } from 'next'
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

async function getPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${serverApiBaseUrl()}/api/blog`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main
      className="watta-public-page-shell flex min-h-screen flex-1 flex-col watta-page-bg px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-3"
    >
      <BlogIndexClient posts={posts} />
    </main>
  )
}
