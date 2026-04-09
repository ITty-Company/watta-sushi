import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'
import { getFallbackBlogArticle, isFallbackBlogSlug } from '@/app/lib/blogFallbackContent'
import BlogBackToIndex from '../BlogBackToIndex'
import BlogArticleInner from '../BlogArticleInner'

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
  const apiPost = await getPost(params.slug)
  if (apiPost) {
    return {
      title: apiPost.title,
      description: apiPost.content.slice(0, 160),
    }
  }
  const fb = getFallbackBlogArticle(params.slug, 'uk')
  if (fb) {
    return {
      title: fb.title,
      description: fb.excerpt.slice(0, 160),
    }
  }
  return { title: 'Статья не найдена' }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const apiPost = await getPost(params.slug)
  const fbUk = !apiPost ? getFallbackBlogArticle(params.slug, 'uk') : null
  const post =
    apiPost ??
    (fbUk
      ? {
          id: fbUk.id,
          title: fbUk.title,
          slug: fbUk.slug,
          content: fbUk.content,
          imageUrl: fbUk.imageUrl,
          videoUrl: null as string | null,
          author: fbUk.author,
          createdAt: fbUk.createdAt,
        }
      : null)

  if (!post) notFound()

  const videoEmbedUrl = apiPost ? normalizeVideoUrl(post.videoUrl) : null

  return (
    <main
      className="watta-public-page-shell flex min-h-screen flex-1 flex-col px-4 py-10"
      style={{ backgroundColor: '#f5f5f7' }}
    >
      <div className="mx-auto mb-6 max-w-4xl">
        <BlogBackToIndex />
      </div>
      <article className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border border-gray-200/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="h-[280px] w-full object-cover md:h-[420px]" />
        ) : null}

        <div className="p-6 md:p-10">
          <BlogArticleInner
            slug={params.slug}
            post={{
              title: post.title,
              content: post.content,
              author: post.author,
              createdAt: post.createdAt,
            }}
            videoEmbedUrl={videoEmbedUrl}
          />
        </div>
      </article>
    </main>
  )
}
