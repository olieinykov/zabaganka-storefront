import { HttpTypes } from "@medusajs/types"

const normalize = (value: string) =>
  value
    .toLocaleLowerCase("uk")
    .replace(/[’ʼ`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()

export const tokenizeSearchQuery = (query?: string | null): string[] => {
  if (!query) {
    return []
  }

  return normalize(query).split(" ").filter(Boolean)
}

export const productMatchesSearch = (
  product: Pick<HttpTypes.StoreProduct, "title">,
  tokens: string[]
): boolean => {
  if (!tokens.length) {
    return true
  }

  const haystack = normalize(product.title || "")

  return tokens.every((token) => haystack.includes(token))
}
