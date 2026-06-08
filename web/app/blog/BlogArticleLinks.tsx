'use client'

import Link from 'next/link'
import { useLanguage } from '@/app/context/LanguageContext'
import type { BlogPostLinks } from '@/lib/blogLinks'
import { WattaStaggerSectionTitle } from '@/app/components/WattaStaggerSectionTitle'

type Props = {
  links: BlogPostLinks
}

function localizedName(
  row: { name_ru: string; name_ua?: string | null; name_en?: string | null; name_nl?: string | null },
  getLocalized: (obj: object, field: string) => string,
) {
  return getLocalized(row, 'name') || row.name_ru
}

export default function BlogArticleLinks({ links }: Props) {
  const { t, getLocalized } = useLanguage()
  const b = t.blogPublic

  const { products, categories, ingredients } = links
  if (products.length === 0 && categories.length === 0 && ingredients.length === 0) {
    return null
  }

  return (
    <section className="watta-blog-links" aria-labelledby="watta-blog-links-title">
      <WattaStaggerSectionTitle
        id="watta-blog-links-title"
        className="watta-blog-links__title"
        text={b.linksTitle}
      />

      {products.length > 0 ? (
        <div className="watta-blog-links__group">
          <p className="watta-blog-links__label">{b.linksProducts}</p>
          <ul className="watta-blog-links__grid" role="list">
            {products.map((p) => (
              <li key={`p-${p.id}`}>
                <Link href={`/product/${p.id}`} className="watta-blog-links__card">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="watta-blog-links__img" loading="lazy" />
                  ) : (
                    <span className="watta-blog-links__img watta-blog-links__img--placeholder" aria-hidden>
                      W
                    </span>
                  )}
                  <span className="watta-blog-links__name">{localizedName(p, getLocalized)}</span>
                  <span className="watta-blog-links__cta">{b.linksOrder}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {categories.length > 0 ? (
        <div className="watta-blog-links__group">
          <p className="watta-blog-links__label">{b.linksCategories}</p>
          <ul className="watta-blog-links__chips" role="list">
            {categories.map((c) => (
              <li key={`c-${c.id}`}>
                <Link href={`/menu?cat=${encodeURIComponent(c.slug)}`} className="watta-blog-links__chip">
                  {c.emoji ? <span aria-hidden>{c.emoji}</span> : null}
                  {localizedName(c, getLocalized)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ingredients.length > 0 ? (
        <div className="watta-blog-links__group">
          <p className="watta-blog-links__label">{b.linksIngredients}</p>
          <ul className="watta-blog-links__grid watta-blog-links__grid--ingredients" role="list">
            {ingredients.map((ing) => (
              <li key={`i-${ing.id}`}>
                <Link href="/menu" className="watta-blog-links__card watta-blog-links__card--ingredient">
                  {ing.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ing.imageUrl} alt="" className="watta-blog-links__img" loading="lazy" />
                  ) : null}
                  <span className="watta-blog-links__name">{localizedName(ing, getLocalized)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
