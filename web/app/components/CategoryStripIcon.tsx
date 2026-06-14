import type { ReactNode } from 'react'
import Image from 'next/image'
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
      <Image
        src={defaultSrc}
        alt=""
        width={20}
        height={20}
        className="category-strip-icon-img category-strip-icon-img--default"
        draggable={false}
      />
      {hoverSrc && hoverSrc !== defaultSrc ? (
        <Image
          src={hoverSrc}
          alt=""
          width={20}
          height={20}
          className="category-strip-icon-img category-strip-icon-img--hover"
          draggable={false}
        />
      ) : null}
    </span>
  )
}
