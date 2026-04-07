'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowUpRight, BookOpen } from 'lucide-react'
import { useLanguage } from '@/app/context/LanguageContext'

export interface BlogPostPreview {
  id: number
  title: string
  slug: string
  content: string
  imageUrl?: string | null
  author: string
  createdAt: string
}

export default function BlogIndexClient({ posts }: { posts: BlogPostPreview[] }) {
  const { t } = useLanguage()

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 sm:mb-14 relative"
      >
        <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-[#145142] via-[#1a6b58] to-transparent hidden sm:block" />
        <div className="inline-flex items-center gap-2 text-[#145142] font-bold text-sm mb-3">
          <BookOpen className="w-5 h-5" />
          Watta
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#145142] leading-tight">
          {t.blogPublic.title}
        </h1>
        <p className="text-gray-600 mt-4 max-w-2xl text-lg leading-relaxed">{t.blogPublic.subtitle}</p>
      </motion.div>

      {posts.length === 0 ? (
        <div className="rounded-[2rem] border border-[#145142]/12 bg-white/90 backdrop-blur-sm p-12 text-center text-gray-600 shadow-xl">
          {t.blogPublic.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', damping: 22 }}
              style={{ perspective: '1200px' }}
              className="group relative rounded-[1.75rem] border border-[#145142]/10 bg-white overflow-hidden shadow-lg shadow-[#145142]/8 hover:shadow-2xl hover:shadow-[#145142]/15 transition-all duration-500 hover:-translate-y-1"
            >
              <div
                className="relative h-48 sm:h-52 overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {post.imageUrl ? (
                  <motion.img
                    src={post.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.06, rotateX: 2 }}
                    transition={{ duration: 0.45 }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#145142]/12 via-[#1a6b58]/10 to-[#f0f9f7]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />
                <span className="absolute bottom-3 left-4 text-xs font-bold text-white/90 drop-shadow">
                  {new Date(post.createdAt).toLocaleDateString()} · {post.author}
                </span>
              </div>
              <div className="p-6 sm:p-7">
                <h2 className="text-xl font-extrabold text-[#194A38] line-clamp-2 group-hover:text-[#145142] transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 mt-3 line-clamp-3 leading-relaxed">{post.content}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#145142] text-white text-sm font-bold hover:bg-[#0f3d32] transition shadow-md shadow-[#145142]/20 group/link"
                >
                  {t.blogPublic.readMore}
                  <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
