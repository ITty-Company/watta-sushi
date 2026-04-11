import type { Metadata } from 'next'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'
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

export const metadata: Metadata = {
  title: 'Блог і рецепти шефа | Watta Sushi',
  description: 'Корисні статті про суші, рецепти та поради від команди Watta Sushi.',
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
      className="watta-public-page-shell flex min-h-screen flex-1 flex-col bg-[#f2f5f3] px-4 pb-12 pt-2 sm:px-6 sm:pb-16 sm:pt-3"
    >
      <BlogIndexClient posts={posts} />
    </main>
  )
}
