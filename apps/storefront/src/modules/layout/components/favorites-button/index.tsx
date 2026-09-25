"use client"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Heart from "@modules/common/icons/heart"
import { useFavorites } from "@modules/favorites/context"

export default function FavoritesButton() {
  const { count } = useFavorites()

  return (
    <LocalizedClientLink
      href="/favorites"
      aria-label="Обране"
      className="relative interactive interactive-lift inline-flex items-center justify-center text-ink hover:text-navy"
      data-testid="nav-favorites-link"
    >
      <Heart size={19} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 rounded-full bg-navy text-white text-[10px] leading-4 text-center">
          {count}
        </span>
      )}
      <span className="sr-only">Обране ({count})</span>
    </LocalizedClientLink>
  )
}
