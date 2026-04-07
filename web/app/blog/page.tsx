import Link from 'next/link'
import type { Metadata } from 'next'
import { serverApiBaseUrl } from '@/lib/serverApiBaseUrl'

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
  title: 'Блог и рецепты шефа',
  description: 'Полезные статьи о суши, рецепты от шефа и советы по выбору роллов.',
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
    <main className="watta-public-page-shell min-h-screen py-14 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#145142]">Блог и рецепты шефа</h1>
          <p className="text-gray-600 mt-3 max-w-2xl">
            SEO-статьи, секреты приготовления и авторские заметки от команды Watta Sushi.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center text-gray-500 border border-[#145142]/10">
            Пока нет опубликованных статей.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="rounded-3xl bg-white border border-[#145142]/10 overflow-hidden shadow-sm hover:shadow-xl transition">
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt={post.title} className="h-48 w-full object-cover" />
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-[#145142]/10 to-[#1a6b58]/20" />
                )}
                <div className="p-6">
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(post.createdAt).toLocaleDateString('ru-RU')} - {post.author}
                  </p>
                  <h2 className="text-xl font-bold text-[#194A38] line-clamp-2">{post.title}</h2>
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">{post.content}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-block mt-5 px-4 py-2 rounded-xl bg-[#145142] text-white font-semibold hover:bg-[#0f3d34] transition"
                  >
                    Читать рецепт
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
