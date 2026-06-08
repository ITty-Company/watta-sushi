import type { ReactNode } from 'react'
import { resolveCatalogMediaUrl } from '@/lib/catalogMediaUrl'
const BUNDLED_CATEGORY_ICON_RE = /\/category-icons\//

type CategoryStripIconProps = {
  imageUrl?: string | null
  hoverImageUrl?: string | null
  fallback: ReactNode
}

export function CategoryStripIcon({
  imageUrl,
  hoverImageUrl,
  fallback,
}: CategoryStripIconProps) {
  const defaultSrc = resolveCatalogMediaUrl(imageUrl)
  const hoverSrc = resolveCatalogMediaUrl(hoverImageUrl) ?? defaultSrc

  if (!defaultSrc) {
    return <>{fallback}</>
  }

  const isBundledIcon = BUNDLED_CATEGORY_ICON_RE.test(defaultSrc)

  return (
    <span
      className={
        isBundledIcon
          ? 'category-strip-icon-stack category-strip-icon-stack--bundled'
          : 'category-strip-icon-stack'
      }
      aria-hidden
    >
      <img
        src={defaultSrc}
        alt=""
        width={20}
        height={20}
        className="category-strip-icon-img category-strip-icon-img--default"
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        draggable={false}
      />
      {hoverSrc && hoverSrc !== defaultSrc ? (
        <img
          src={hoverSrc}
          alt=""
          width={20}
          height={20}
          className="category-strip-icon-img category-strip-icon-img--hover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          draggable={false}
        />
      ) : null}
    </span>
  )
}
