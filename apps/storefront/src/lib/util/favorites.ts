export const FAVORITES_COOKIE_NAME = "_medusa_favorites"

export const FAVORITES_MAX_ITEMS = 100

export const FAVORITES_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const parseFavoriteIds = (value?: string | null): string[] => {
  if (!value) {
    return []
  }

  let decoded = value

  try {
    decoded = decodeURIComponent(value)
  } catch {
  }

  const ids = decoded
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.startsWith("prod_"))

  return Array.from(new Set(ids)).slice(0, FAVORITES_MAX_ITEMS)
}

export const serializeFavoriteIds = (ids: string[]): string => {
  return ids.slice(0, FAVORITES_MAX_ITEMS).join(",")
}
