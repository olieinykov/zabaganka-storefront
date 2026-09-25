"use client"

import {
  FAVORITES_COOKIE_MAX_AGE,
  FAVORITES_COOKIE_NAME,
  FAVORITES_MAX_ITEMS,
  serializeFavoriteIds,
} from "@lib/util/favorites"
import { useToast } from "@modules/common/components/toast"
import { usePathname, useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

type FavoritesContextValue = {
  ids: string[]
  count: number
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string, productTitle?: string) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

const writeFavoritesCookie = (ids: string[]) => {
  const secure = window.location.protocol === "https:" ? "; secure" : ""

  document.cookie =
    `${FAVORITES_COOKIE_NAME}=${encodeURIComponent(serializeFavoriteIds(ids))}` +
    `; path=/; max-age=${FAVORITES_COOKIE_MAX_AGE}; samesite=lax${secure}`
}

export function FavoritesProvider({
  initialIds,
  children,
}: {
  initialIds: string[]
  children: React.ReactNode
}) {
  const [ids, setIds] = useState<string[]>(initialIds)
  const { showToast } = useToast()
  const pathname = usePathname()
  const router = useRouter()

  const isFavorite = useCallback(
    (productId: string) => ids.includes(productId),
    [ids]
  )

  const toggleFavorite = useCallback(
    (productId: string, productTitle?: string) => {
      const exists = ids.includes(productId)
      const next = exists
        ? ids.filter((id) => id !== productId)
        : [productId, ...ids].slice(0, FAVORITES_MAX_ITEMS)

      setIds(next)
      writeFavoritesCookie(next)

      if (!exists) {
        showToast("Товар додано до обраного", { description: productTitle })
      }

      if (pathname.startsWith("/favorites")) {
        router.refresh()
      }
    },
    [ids, pathname, router, showToast]
  )

  const value = useMemo(
    () => ({ ids, count: ids.length, isFavorite, toggleFavorite }),
    [ids, isFavorite, toggleFavorite]
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

const noopFavorites: FavoritesContextValue = {
  ids: [],
  count: 0,
  isFavorite: () => false,
  toggleFavorite: () => {},
}

export function useFavorites() {
  return useContext(FavoritesContext) ?? noopFavorites
}
