import { Metadata } from "next"

import { COUNTRY_CODE } from "@lib/constants"
import { getFavoriteIds } from "@lib/data/cookies"
import { parseInStockOnly, parseOptionValueIds } from "@lib/util/product-option-filters"
import FavoritesTemplate from "@modules/favorites/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export const metadata: Metadata = {
  title: "Обране",
  description: "Товари, які ви додали до обраного.",
  robots: { index: false },
}

type FavoritesPageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  optionValueIds?: string | string[]
}

type Params = {
  searchParams: Promise<FavoritesPageSearchParams>
}

export default async function FavoritesPage(props: Params) {
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)
  const inStockOnly = parseInStockOnly(searchParams)
  const favoriteIds = await getFavoriteIds()

  return (
    <FavoritesTemplate
      favoriteIds={favoriteIds}
      sortBy={sortBy}
      page={page}
      countryCode={COUNTRY_CODE}
      optionValueIds={optionValueIds}
      inStockOnly={inStockOnly}
    />
  )
}
