import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  videoUrl?: string | null
  author: string
  createdAt: string
}

function normalizeVideoUrl(url?: string | null): string | null {
  if (!url) return null
  const value = url.trim()
  const ytMatch = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`
  return value
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${serverApiBaseUrl()}/api/blog/${slug}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) {
    return { title: 'Статья не найдена' }
  }
  return {
    title: post.title,
    description: post.content.slice(0, 160),
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const videoEmbedUrl = normalizeVideoUrl(post.videoUrl)

  return (
    <main className="watta-public-page-shell min-h-screen py-10 px-4">
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#145142] hover:text-[#0f3d32] transition"
        >
          ← Усі статті
        </Link>
      </div>
      <article className="max-w-4xl mx-auto bg-white rounded-3xl border border-[#145142]/10 shadow-lg shadow-[#145142]/5 overflow-hidden">
        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-[280px] md:h-[420px] object-cover" />}

        <div className="p-6 md:p-10">
          <p className="text-sm text-gray-500 mb-3">
            {new Date(post.createdAt).toLocaleDateString('ru-RU')} - {post.author}
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#145142] leading-tight">{post.title}</h1>

          {videoEmbedUrl && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-[#145142]/15">
              <iframe
                src={videoEmbedUrl}
                className="w-full aspect-video"
                title={post.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="mt-8 text-gray-800 leading-8 whitespace-pre-wrap text-[17px]">{post.content}</div>
        </div>
      </article>
    </main>
  )
}
